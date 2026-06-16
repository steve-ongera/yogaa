from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import User, Boost, Notification
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_notification_email(subject, message, recipient_list):
    """Send email notification"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False
        )
        logger.info(f"Email sent to {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

@shared_task
def update_user_boost(user_id):
    """Deactivate user boost after expiry"""
    try:
        user = User.objects.get(id=user_id)
        boosts = Boost.objects.filter(user=user, is_active=True)
        for boost in boosts:
            boost.is_active = False
            boost.save()
            
        Notification.objects.create(
            user=user,
            notification_type='SUBSCRIPTION',
            message='Your profile boost has expired. Upgrade again to boost your profile!'
        )
        
        logger.info(f"Boost deactivated for user {user.username}")
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")

@shared_task
def reset_daily_swipes():
    """Reset daily swipe count for all users"""
    try:
        User.objects.all().update(swipes_today=0)
        logger.info("Daily swipes reset for all users")
    except Exception as e:
        logger.error(f"Failed to reset daily swipes: {str(e)}")

@shared_task
def check_subscription_expiry():
    """Check and update expired subscriptions"""
    try:
        expired_users = User.objects.filter(
            subscription_expiry__lt=timezone.now(),
            subscription_tier__in=['premium', 'gold']
        )
        
        for user in expired_users:
            user.subscription_tier = 'free'
            user.subscription_expiry = None
            user.verification_badge = False
            user.save()
            
            Notification.objects.create(
                user=user,
                notification_type='SUBSCRIPTION',
                message='Your premium subscription has expired. Renew to continue enjoying premium features!'
            )
            
            logger.info(f"Subscription expired for user {user.username}")
            
    except Exception as e:
        logger.error(f"Failed to check subscription expiry: {str(e)}")

@shared_task
def send_daily_match_emails():
    """Send daily match recommendations to users"""
    try:
        # Get users who haven't logged in for 2 days
        inactive_users = User.objects.filter(
            last_active__lt=timezone.now() - timezone.timedelta(days=2),
            is_active_profile=True
        )
        
        for user in inactive_users:
            # Get potential matches
            # This would be customized based on your matching algorithm
            send_notification_email.delay(
                subject='New Matches Waiting!',
                message=f'Hey {user.username}, new matches are waiting for you!',
                recipient_list=[user.email]
            )
            
    except Exception as e:
        logger.error(f"Failed to send daily match emails: {str(e)}")