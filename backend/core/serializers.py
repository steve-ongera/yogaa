from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    User, ProfileImage, VerificationDocument, Like, Match, 
    ChatMessage, PaymentTransaction, Boost, Report, Notification
)
from django.conf import settings

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'password', 'confirm_password', 
                  'gender', 'looking_for', 'date_of_birth', 'bio', 'location']
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    subscription_tier_display = serializers.SerializerMethodField()
    profile_images = serializers.SerializerMethodField()
    is_premium = serializers.BooleanField(read_only=True)
    can_chat = serializers.BooleanField(read_only=True)
    can_upload_images = serializers.BooleanField(read_only=True)
    max_images_allowed = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number', 'gender', 'looking_for',
            'date_of_birth', 'age', 'bio', 'location', 'latitude', 'longitude',
            'interests', 'is_verified', 'verification_badge', 'is_active_profile',
            'last_active', 'subscription_tier', 'subscription_tier_display',
            'subscription_expiry', 'is_premium', 'can_chat', 'can_upload_images',
            'max_images_allowed', 'profile_images', 'created_at'
        ]
        read_only_fields = ['is_verified', 'verification_badge', 'last_active']
    
    def get_age(self, obj):
        return obj.age
    
    def get_subscription_tier_display(self, obj):
        return settings.SUBSCRIPTION_TIERS.get(obj.subscription_tier, {}).get('name', 'Free')
    
    def get_profile_images(self, obj):
        images = obj.profile_images.all()
        return ProfileImageSerializer(images, many=True).data

class ProfileImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileImage
        fields = ['id', 'image', 'is_primary', 'order']
        read_only_fields = ['id']

class ProfileImageUploadSerializer(serializers.Serializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        max_length=10,
        allow_empty=False
    )
    primary_index = serializers.IntegerField(default=0, min_value=0)

class VerificationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationDocument
        fields = ['id', 'document_type', 'document_front', 'document_back', 
                  'selfie', 'status', 'admin_notes', 'submitted_at', 'reviewed_at']
        read_only_fields = ['status', 'admin_notes', 'submitted_at', 'reviewed_at']

class LikeSerializer(serializers.ModelSerializer):
    from_user = UserProfileSerializer(read_only=True)
    to_user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'from_user', 'to_user', 'is_match', 'created_at']

class LikeCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

class MatchSerializer(serializers.ModelSerializer):
    user1 = UserProfileSerializer(read_only=True)
    user2 = UserProfileSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = ['id', 'user1', 'user2', 'matched_at', 'chat_unlocked', 
                  'chat_unlocked_at', 'last_message', 'unread_count']
    
    def get_last_message(self, obj):
        message = obj.messages.last()
        if message:
            return ChatMessageSerializer(message).data
        return None
    
    def get_unread_count(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user:
            return obj.messages.filter(is_read=False).exclude(sender=user).count()
        return 0

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)
    is_own = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'message', 'is_read', 'read_at', 'created_at', 'is_own']
        read_only_fields = ['is_read', 'read_at', 'created_at']
    
    def get_is_own(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        return user == obj.sender if user else False

class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['message']
    
    def validate(self, data):
        match_id = self.context.get('match_id')
        match = Match.objects.get(id=match_id)
        user = self.context.get('request').user
        
        if not match.chat_unlocked:
            raise serializers.ValidationError("Chat is not unlocked. Please subscribe to chat.")
        
        if user not in [match.user1, match.user2]:
            raise serializers.ValidationError("You are not part of this match.")
        
        return data

class PaymentTransactionSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'user', 'transaction_type', 'amount', 'mpesa_receipt_number',
                  'mpesa_request_id', 'status', 'subscription_tier', 'metadata',
                  'created_at', 'completed_at']
        read_only_fields = ['status', 'mpesa_receipt_number', 'mpesa_request_id', 
                           'completed_at']

class PaymentInitiateSerializer(serializers.Serializer):
    transaction_type = serializers.ChoiceField(choices=['SUBSCRIPTION', 'BOOST'])
    subscription_tier = serializers.ChoiceField(
        choices=['premium', 'gold'], 
        required=False,
        allow_null=True
    )
    phone_number = serializers.CharField()

class BoostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Boost
        fields = ['id', 'is_active', 'started_at', 'expires_at']

class ReportSerializer(serializers.ModelSerializer):
    reporter = UserProfileSerializer(read_only=True)
    reported_user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Report
        fields = ['id', 'reporter', 'reported_user', 'reason', 'description', 
                  'resolved', 'created_at', 'resolved_at']
        read_only_fields = ['reporter', 'resolved', 'created_at', 'resolved_at']

class ReportCreateSerializer(serializers.Serializer):
    reported_user_id = serializers.IntegerField()
    reason = serializers.ChoiceField(choices=Report.REASON_CHOICES)
    description = serializers.CharField()

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'message', 'is_read', 
                  'related_id', 'created_at', 'read_at']
        read_only_fields = ['created_at']

class UserSearchFilterSerializer(serializers.Serializer):
    gender = serializers.ChoiceField(choices=['M', 'F', 'O'], required=False)
    looking_for = serializers.ChoiceField(choices=['M', 'F', 'O'], required=False)
    age_min = serializers.IntegerField(min_value=18, required=False)
    age_max = serializers.IntegerField(min_value=18, required=False)
    location = serializers.CharField(required=False)
    interests = serializers.ListField(child=serializers.CharField(), required=False)
    distance = serializers.IntegerField(min_value=1, max_value=100, required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    verified_only = serializers.BooleanField(default=False, required=False)
    has_verification_badge = serializers.BooleanField(default=False, required=False)