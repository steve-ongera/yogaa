from rest_framework import generics, status, views, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Subquery, OuterRef
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from .serializers import *
from .permissions import *
from .mpesa import MpesaService
from .tasks import send_notification_email, update_user_boost
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)
User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects.filter(username=username).first()
        
        if not user or not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class ProfileImageView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanUploadImages]
    
    def post(self, request):
        user = request.user
        
        # Check if user can upload more images
        current_images = user.profile_images.count()
        max_allowed = user.max_images_allowed
        
        if current_images >= max_allowed:
            return Response(
                {'error': f'Maximum {max_allowed} images allowed. Upgrade to upload more.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ProfileImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        images = serializer.validated_data['images']
        primary_index = serializer.validated_data['primary_index']
        
        if len(images) > max_allowed - current_images:
            return Response(
                {'error': f'You can only upload {max_allowed - current_images} more images'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded = []
        for i, image in enumerate(images):
            profile_image = ProfileImage.objects.create(
                user=user,
                image=image,
                is_primary=(i == primary_index),
                order=current_images + i
            )
            uploaded.append(profile_image)
        
        return Response(
            ProfileImageSerializer(uploaded, many=True).data,
            status=status.HTTP_201_CREATED
        )
    
    def delete(self, request, image_id):
        user = request.user
        image = get_object_or_404(ProfileImage, id=image_id, user=user)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class VerificationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if hasattr(user, 'verification_document'):
            return Response(
                {'error': 'Verification already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = VerificationDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        verification = VerificationDocument.objects.create(
            user=user,
            **serializer.validated_data
        )
        
        # Send notification to admin
        send_notification_email.delay(
            subject='New Verification Request',
            message=f'User {user.username} has submitted verification documents.',
            recipient_list=['admin@dating-saas.com']
        )
        
        return Response(
            VerificationDocumentSerializer(verification).data,
            status=status.HTTP_201_CREATED
        )
    
    def get(self, request):
        user = request.user
        if hasattr(user, 'verification_document'):
            return Response(
                VerificationDocumentSerializer(user.verification_document).data
            )
        return Response({'status': 'No verification submitted'})

class LikeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Check if user has swipes remaining
        if not user.has_swipes_remaining():
            return Response(
                {'error': 'Daily swipe limit reached. Upgrade to Premium for more swipes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        serializer = LikeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        target_user_id = serializer.validated_data['user_id']
        target_user = get_object_or_404(User, id=target_user_id)
        
        if target_user == user:
            return Response(
                {'error': 'Cannot like yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already liked
        existing_like = Like.objects.filter(from_user=user, to_user=target_user).first()
        if existing_like:
            return Response(
                {'error': 'You already liked this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create like and increment swipe count
        like = Like.objects.create(from_user=user, to_user=target_user)
        user.swipes_today += 1
        user.save()
        
        # Check if mutual like (match)
        mutual_like = Like.objects.filter(from_user=target_user, to_user=user).first()
        
        if mutual_like:
            # Create match
            match = Match.objects.create(user1=user, user2=target_user)
            like.is_match = True
            like.save()
            mutual_like.is_match = True
            mutual_like.save()
            
            # Create notifications
            Notification.objects.create(
                user=user,
                notification_type='MATCH',
                message=f"You matched with {target_user.username}!",
                related_id=match.id
            )
            Notification.objects.create(
                user=target_user,
                notification_type='MATCH',
                message=f"You matched with {user.username}!",
                related_id=match.id
            )
            
            # Send email notification
            send_notification_email.delay(
                subject='New Match!',
                message=f'You matched with {target_user.username}. Start chatting now!',
                recipient_list=[user.email, target_user.email]
            )
            
            return Response({
                'like': LikeSerializer(like).data,
                'is_match': True,
                'match': MatchSerializer(match, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(LikeSerializer(like).data, status=status.HTTP_201_CREATED)
    
    def delete(self, request, user_id):
        user = request.user
        target_user = get_object_or_404(User, id=user_id)
        
        like = Like.objects.filter(from_user=user, to_user=target_user).first()
        if like:
            like.delete()
            
            # Check if this was a match
            match = Match.objects.filter(
                Q(user1=user, user2=target_user) | Q(user1=target_user, user2=user)
            ).first()
            if match:
                match.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response(
            {'error': 'Like not found'},
            status=status.HTTP_404_NOT_FOUND
        )

class DiscoverView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['gender', 'looking_for']
    ordering_fields = ['last_active', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.filter(is_active_profile=True).exclude(id=user.id)
        
        # Exclude users already liked
        liked_users = Like.objects.filter(from_user=user).values_list('to_user_id', flat=True)
        queryset = queryset.exclude(id__in=liked_users)
        
        # Exclude users who have liked and been matched
        matched_users = Match.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).values_list('user1_id', 'user2_id')
        
        matched_ids = []
        for match in matched_users:
            if match[0] == user.id:
                matched_ids.append(match[1])
            else:
                matched_ids.append(match[0])
        
        queryset = queryset.exclude(id__in=matched_ids)
        
        # Apply filters from query parameters
        serializer = UserSearchFilterSerializer(data=self.request.query_params)
        if serializer.is_valid():
            filters = serializer.validated_data
            
            # Gender filter
            if 'gender' in filters:
                queryset = queryset.filter(gender=filters['gender'])
            
            # Looking for filter
            if 'looking_for' in filters:
                queryset = queryset.filter(looking_for=filters['looking_for'])
            
            # Age range filter
            if 'age_min' in filters and filters['age_min']:
                min_date = timezone.now().date() - timedelta(days=filters['age_min']*365)
                queryset = queryset.filter(date_of_birth__lte=min_date)
            
            if 'age_max' in filters and filters['age_max']:
                max_date = timezone.now().date() - timedelta(days=filters['age_max']*365)
                queryset = queryset.filter(date_of_birth__gte=max_date)
            
            # Location filter
            if 'location' in filters and filters['location']:
                queryset = queryset.filter(location__icontains=filters['location'])
            
            # Interests filter
            if 'interests' in filters and filters['interests']:
                for interest in filters['interests']:
                    queryset = queryset.filter(interests__contains=[interest])
            
            # Verification filters
            if filters.get('verified_only', False):
                queryset = queryset.filter(is_verified=True)
            
            if filters.get('has_verification_badge', False):
                queryset = queryset.filter(verification_badge=True)
            
            # Distance filter
            if ('distance' in filters and 'latitude' in filters and 'longitude' in filters):
                # Simple distance calculation using latitude/longitude
                lat = filters['latitude']
                lng = filters['longitude']
                distance = filters['distance']
                
                # Approximate 1 degree latitude = 111 km
                lat_range = distance / 111.0
                lng_range = distance / (111.0 * 0.5)  # Approximate at equator
                
                queryset = queryset.filter(
                    latitude__gte=lat - lat_range,
                    latitude__lte=lat + lat_range,
                    longitude__gte=lng - lng_range,
                    longitude__lte=lng + lng_range
                )
        
        # Order by premium first, then verified, then distance
        queryset = queryset.annotate(
            premium_rank=Count('id', filter=Q(subscription_tier__in=['premium', 'gold'])),
            verified_rank=Count('id', filter=Q(is_verified=True))
        ).order_by('-premium_rank', '-verified_rank', '-last_active')
        
        return queryset

class MatchView(generics.ListAPIView):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Match.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).order_by('-matched_at')

class ChatView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, CanChat]
    
    def get(self, request, match_id):
        user = request.user
        match = get_object_or_404(Match, id=match_id)
        
        if user not in [match.user1, match.user2]:
            return Response(
                {'error': 'You are not part of this match'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark messages as read
        match.messages.filter(is_read=False).exclude(sender=user).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        messages = match.messages.all()
        serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
        
        return Response({
            'match': MatchSerializer(match, context={'request': request}).data,
            'messages': serializer.data
        })
    
    def post(self, request, match_id):
        user = request.user
        match = get_object_or_404(Match, id=match_id)
        
        if user not in [match.user1, match.user2]:
            return Response(
                {'error': 'You are not part of this match'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not match.chat_unlocked:
            return Response(
                {'error': 'Chat is not unlocked. Please subscribe to chat.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChatMessageCreateSerializer(
            data=request.data,
            context={'request': request, 'match_id': match_id}
        )
        serializer.is_valid(raise_exception=True)
        
        message = ChatMessage.objects.create(
            match=match,
            sender=user,
            message=serializer.validated_data['message']
        )
        
        # Send notification to recipient
        recipient = match.user2 if user == match.user1 else match.user1
        Notification.objects.create(
            user=recipient,
            notification_type='MESSAGE',
            message=f'New message from {user.username}',
            related_id=match.id
        )
        
        return Response(
            ChatMessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

class PaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction_type = serializer.validated_data['transaction_type']
        phone_number = serializer.validated_data['phone_number']
        
        # Clean phone number
        phone_number = phone_number.replace('+', '').strip()
        
        if transaction_type == 'SUBSCRIPTION':
            tier = serializer.validated_data.get('subscription_tier')
            if not tier:
                return Response(
                    {'error': 'Subscription tier is required for subscription transactions'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            amount = settings.SUBSCRIPTION_TIERS[tier]['price']
            
            # Create transaction record
            transaction = PaymentTransaction.objects.create(
                user=user,
                transaction_type='SUBSCRIPTION',
                amount=amount,
                subscription_tier=tier,
                status='PENDING'
            )
            
            # Initiate M-Pesa payment
            mpesa = MpesaService()
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=amount,
                transaction_id=f"TXN{transaction.id}",
                description=f"Subscription to {tier} tier"
            )
            
            if response.get('success'):
                transaction.mpesa_request_id = response.get('request_id')
                transaction.save()
                
                return Response({
                    'transaction_id': transaction.id,
                    'mpesa_request_id': response.get('request_id'),
                    'message': 'M-Pesa payment initiated. Please check your phone to complete payment.'
                }, status=status.HTTP_200_OK)
            else:
                transaction.status = 'FAILED'
                transaction.save()
                return Response(
                    {'error': response.get('message', 'Failed to initiate payment')},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        elif transaction_type == 'BOOST':
            # Check if user already has active boost
            if Boost.objects.filter(user=user, is_active=True).exists():
                return Response(
                    {'error': 'You already have an active boost'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            amount = 200  # KES for boost
            
            # Create transaction record
            transaction = PaymentTransaction.objects.create(
                user=user,
                transaction_type='BOOST',
                amount=amount,
                status='PENDING'
            )
            
            # Initiate M-Pesa payment
            mpesa = MpesaService()
            response = mpesa.stk_push(
                phone_number=phone_number,
                amount=amount,
                transaction_id=f"TXN{transaction.id}",
                description="Profile Boost for 24 hours"
            )
            
            if response.get('success'):
                transaction.mpesa_request_id = response.get('request_id')
                transaction.save()
                
                return Response({
                    'transaction_id': transaction.id,
                    'mpesa_request_id': response.get('request_id'),
                    'message': 'M-Pesa payment initiated. Please check your phone to complete payment.'
                }, status=status.HTTP_200_OK)
            else:
                transaction.status = 'FAILED'
                transaction.save()
                return Response(
                    {'error': response.get('message', 'Failed to initiate payment')},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {'error': 'Invalid transaction type'},
            status=status.HTTP_400_BAD_REQUEST
        )

class MpesaCallbackView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        logger.info(f"M-Pesa callback received: {request.data}")
        
        mpesa = MpesaService()
        result = mpesa.process_callback(request.data)
        
        if result.get('success'):
            transaction_id = result.get('transaction_id')
            receipt_number = result.get('receipt_number')
            
            try:
                transaction = PaymentTransaction.objects.get(id=transaction_id)
                transaction.mpesa_receipt_number = receipt_number
                transaction.status = 'COMPLETED'
                transaction.completed_at = timezone.now()
                transaction.save()
                
                # Update user subscription or create boost
                if transaction.transaction_type == 'SUBSCRIPTION':
                    user = transaction.user
                    tier = transaction.subscription_tier
                    
                    user.subscription_tier = tier
                    user.subscription_expiry = timezone.now() + timedelta(days=30)
                    user.save()
                    
                    # Send notification
                    Notification.objects.create(
                        user=user,
                        notification_type='SUBSCRIPTION',
                        message=f'Your {tier} subscription has been activated!',
                        related_id=transaction.id
                    )
                    
                    # Send email
                    send_notification_email.delay(
                        subject='Subscription Activated',
                        message=f'Your {tier} subscription has been successfully activated.',
                        recipient_list=[user.email]
                    )
                
                elif transaction.transaction_type == 'BOOST':
                    user = transaction.user
                    
                    # Create boost
                    Boost.objects.create(
                        user=user,
                        is_active=True,
                        expires_at=timezone.now() + timedelta(hours=24)
                    )
                    
                    # Schedule deactivation
                    update_user_boost.apply_async(
                        args=[user.id],
                        eta=timezone.now() + timedelta(hours=24)
                    )
                    
                    # Send notification
                    Notification.objects.create(
                        user=user,
                        notification_type='SUBSCRIPTION',
                        message='Your profile boost has been activated for 24 hours!',
                        related_id=transaction.id
                    )
                
                logger.info(f"Transaction {transaction.id} processed successfully")
                
            except PaymentTransaction.DoesNotExist:
                logger.error(f"Transaction not found: {transaction_id}")
        
        return Response({'ResultCode': 0, 'ResultDesc': 'Success'})

class SubscriptionView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tiers = []
        for key, data in settings.SUBSCRIPTION_TIERS.items():
            tiers.append({
                'id': key,
                'name': data['name'],
                'price': data['price'],
                'swipes_per_day': data['swipes_per_day'],
                'can_upload_images': data['can_upload_images'],
                'can_chat': data['can_chat'],
                'can_see_who_liked': data['can_see_who_liked'],
                'can_boost': data['can_boost'],
                'max_images': data['max_images'],
                'verification_badge': data['verification_badge'],
                'is_current': request.user.subscription_tier == key
            })
        
        return Response(tiers)

class BoostStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        active_boost = Boost.objects.filter(user=user, is_active=True).first()
        
        if active_boost:
            return Response(BoostSerializer(active_boost).data)
        
        return Response({'is_active': False})

class ReportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reported_user = get_object_or_404(
            User, 
            id=serializer.validated_data['reported_user_id']
        )
        
        if reported_user == user:
            return Response(
                {'error': 'Cannot report yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report = Report.objects.create(
            reporter=user,
            reported_user=reported_user,
            reason=serializer.validated_data['reason'],
            description=serializer.validated_data['description']
        )
        
        return Response(
            ReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )

class NotificationView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.request.user.notifications.all()
    
    def put(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id, user=request.user)
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    def put(self, request):
        self.request.user.notifications.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'message': 'All notifications marked as read'})

class AdminVerificationView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        pending = VerificationDocument.objects.filter(status='PENDING')
        return Response(VerificationDocumentSerializer(pending, many=True).data)
    
    def post(self, request, verification_id):
        verification = get_object_or_404(VerificationDocument, id=verification_id)
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        
        if action == 'approve':
            verification.status = 'APPROVED'
            verification.reviewed_at = timezone.now()
            verification.save()
            
            verification.user.is_verified = True
            if verification.user.subscription_tier == 'gold':
                verification.user.verification_badge = True
            verification.user.save()
            
            Notification.objects.create(
                user=verification.user,
                notification_type='VERIFICATION',
                message='Your profile has been verified!',
                related_id=verification.id
            )
            
            send_notification_email.delay(
                subject='Profile Verified',
                message='Congratulations! Your profile has been verified.',
                recipient_list=[verification.user.email]
            )
            
        elif action == 'reject':
            verification.status = 'REJECTED'
            verification.admin_notes = notes
            verification.reviewed_at = timezone.now()
            verification.save()
            
            Notification.objects.create(
                user=verification.user,
                notification_type='VERIFICATION',
                message='Your verification was rejected. Please submit new documents.',
                related_id=verification.id
            )
            
            send_notification_email.delay(
                subject='Verification Rejected',
                message=f'Your verification was rejected. Reason: {notes}',
                recipient_list=[verification.user.email]
            )
        
        return Response(VerificationDocumentSerializer(verification).data)