from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField
from django_countries.fields import CountryField
import uuid
import os
from django.conf import settings  # Add this import


def profile_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('profiles', str(instance.user.id), filename)

def verification_document_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('verifications', str(instance.user.id), filename)

class User(AbstractUser):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    phone_number = PhoneNumberField(unique=True, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    looking_for = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    is_verified = models.BooleanField(default=False)
    verification_badge = models.BooleanField(default=False)
    is_active_profile = models.BooleanField(default=True)
    last_active = models.DateTimeField(auto_now=True)
    
    interests = models.JSONField(default=list, blank=True)
    
    # Subscription - Using settings.SUBSCRIPTION_TIERS
    subscription_tier = models.CharField(
        max_length=20,
        choices=[(tier, data['name']) for tier, data in settings.SUBSCRIPTION_TIERS.items()],
        default='free'
    )
    subscription_expiry = models.DateTimeField(null=True, blank=True)
    
    # Usage tracking
    swipes_today = models.IntegerField(default=0)
    last_swipe_reset = models.DateTimeField(auto_now_add=True)
    
    # Meta data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['gender', 'looking_for']),
            models.Index(fields=['subscription_tier']),
        ]
    
    def __str__(self):
        return self.username
    
    @property
    def age(self):
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None
    
    @property
    def is_premium(self):
        return self.subscription_tier in ['premium', 'gold']
    
    @property
    def can_chat(self):
        return self.is_premium
    
    @property
    def can_upload_images(self):
        return self.is_premium
    
    @property
    def max_images_allowed(self):
        return settings.SUBSCRIPTION_TIERS.get(self.subscription_tier, {}).get('max_images', 1)
    
    def reset_swipes_if_needed(self):
        today = timezone.now().date()
        if self.last_swipe_reset.date() < today:
            self.swipes_today = 0
            self.last_swipe_reset = timezone.now()
            self.save()
    
    def has_swipes_remaining(self):
        self.reset_swipes_if_needed()
        max_swipes = settings.SUBSCRIPTION_TIERS.get(self.subscription_tier, {}).get('swipes_per_day', 10)
        return self.swipes_today < max_swipes

class ProfileImage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='profile_images')
    image = models.ImageField(upload_to=profile_image_path)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def save(self, *args, **kwargs):
        if self.is_primary:
            ProfileImage.objects.filter(user=self.user, is_primary=True).exclude(id=self.id).update(is_primary=False)
        super().save(*args, **kwargs)

class VerificationDocument(models.Model):
    DOCUMENT_TYPES = [
        ('ID', 'National ID'),
        ('PASSPORT', 'Passport'),
        ('DRIVER', "Driver's License"),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_document')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_front = models.ImageField(upload_to=verification_document_path)
    document_back = models.ImageField(upload_to=verification_document_path, null=True, blank=True)
    selfie = models.ImageField(upload_to=verification_document_path)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"

class Like(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes_sent')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes_received')
    is_match = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['from_user', 'to_user']
        indexes = [
            models.Index(fields=['from_user', 'to_user']),
            models.Index(fields=['is_match']),
        ]
    
    def __str__(self):
        return f"{self.from_user.username} likes {self.to_user.username}"

class Match(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matches_user2')
    matched_at = models.DateTimeField(auto_now_add=True)
    chat_unlocked = models.BooleanField(default=False)
    chat_unlocked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user1', 'user2']
    
    def __str__(self):
        return f"Match: {self.user1.username} & {self.user2.username}"

class ChatMessage(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['match', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.username}: {self.message[:30]}"

class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    TRANSACTION_TYPES = [
        ('SUBSCRIPTION', 'Subscription'),
        ('BOOST', 'Boost'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mpesa_receipt_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    mpesa_request_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    subscription_tier = models.CharField(max_length=20, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} - {self.amount} KES"

class Boost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='boosts')
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Boost for {self.user.username} - {'Active' if self.is_active else 'Inactive'}"

class Report(models.Model):
    REASON_CHOICES = [
        ('SPAM', 'Spam'),
        ('FAKE', 'Fake Profile'),
        ('HARASSMENT', 'Harassment'),
        ('INAPPROPRIATE', 'Inappropriate Content'),
        ('OTHER', 'Other'),
    ]
    
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_resolved')
    
    def __str__(self):
        return f"{self.reporter.username} reported {self.reported_user.username}"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('MATCH', 'New Match'),
        ('LIKE', 'New Like'),
        ('MESSAGE', 'New Message'),
        ('SUBSCRIPTION', 'Subscription Update'),
        ('VERIFICATION', 'Verification Status'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_id = models.PositiveIntegerField(null=True, blank=True)  # ID of related object
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_notification_type_display()}"