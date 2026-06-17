from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count
from .models import (
    User, ProfileImage, VerificationDocument, Like, Match,
    ChatMessage, PaymentTransaction, Boost, Report, Notification
)



# ── Inlines ────────────────────────────────────────────────────────────────────
class ProfileImageInline(admin.TabularInline):
    model = ProfileImage
    extra = 0
    readonly_fields = ('preview', 'created_at')
    fields = ('preview', 'image', 'is_primary', 'order', 'created_at')

    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;" />',
                obj.image.url
            )
        return '—'
    preview.short_description = 'Preview'


class VerificationDocumentInline(admin.StackedInline):
    model = VerificationDocument
    extra = 0
    readonly_fields = ('submitted_at', 'reviewed_at', 'doc_front_preview', 'selfie_preview')
    fields = (
        'document_type', 'doc_front_preview', 'document_front',
        'document_back', 'selfie_preview', 'selfie',
        'status', 'admin_notes', 'submitted_at', 'reviewed_at',
    )

    def doc_front_preview(self, obj):
        if obj.document_front:
            return format_html(
                '<img src="{}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;" />',
                obj.document_front.url
            )
        return '—'
    doc_front_preview.short_description = 'Front Preview'

    def selfie_preview(self, obj):
        if obj.selfie:
            return format_html(
                '<img src="{}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;" />',
                obj.selfie.url
            )
        return '—'
    selfie_preview.short_description = 'Selfie Preview'


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ('sender', 'message', 'is_read', 'created_at')
    fields = ('sender', 'message', 'is_read', 'created_at')
    ordering = ('created_at',)
    max_num = 20


# ── User ───────────────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [ProfileImageInline, VerificationDocumentInline]

    list_display = (
        'avatar_thumb', 'username', 'full_name', 'gender', 'age',
        'location', 'tier_badge', 'verified_badge', 'is_active_profile',
        'swipes_today', 'last_active', 'date_joined',
    )
    list_display_links = ('avatar_thumb', 'username')
    list_filter = (
        'gender', 'subscription_tier', 'is_verified',
        'verification_badge', 'is_active_profile', 'is_staff',
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'location')
    ordering = ('-date_joined',)
    readonly_fields = (
        'avatar_thumb', 'age', 'last_active', 'date_joined',
        'last_login', 'swipes_today', 'last_swipe_reset',
    )

    fieldsets = (
        ('Account', {
            'fields': ('username', 'email', 'password')
        }),
        ('Personal Info', {
            'fields': (
                'first_name', 'last_name', 'avatar_thumb',
                'gender', 'date_of_birth', 'age', 'bio', 'interests',
            )
        }),
        ('Location', {
            'fields': ('location', 'latitude', 'longitude')
        }),
        ('Dating Preferences', {
            'fields': ('looking_for',)
        }),
        ('Verification', {
            'fields': ('is_verified', 'verification_badge')
        }),
        ('Subscription', {
            'fields': ('subscription_tier', 'subscription_expiry')
        }),
        ('Activity', {
            'fields': (
                'is_active_profile', 'swipes_today',
                'last_swipe_reset', 'last_active',
            )
        }),
        ('Permissions', {
            'classes': ('collapse',),
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions',
            )
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('date_joined', 'last_login')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'gender', 'subscription_tier'),
        }),
    )

    def avatar_thumb(self, obj):
        primary = obj.profile_images.filter(is_primary=True).first()
        if primary and primary.image:
            return format_html(
                '<img src="{}" style="width:40px;height:40px;object-fit:cover;border-radius:50%;" />',
                primary.image.url
            )
        initials = (obj.first_name[:1] + obj.last_name[:1]).upper() or obj.username[:2].upper()
        return format_html(
            '<div style="width:40px;height:40px;border-radius:50%;background:#0066b3;'
            'color:white;display:flex;align-items:center;justify-content:center;'
            'font-weight:700;font-size:14px;">{}</div>',
            initials
        )
    avatar_thumb.short_description = ''

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or '—'
    full_name.short_description = 'Name'

    def tier_badge(self, obj):
        colors = {'free': '#6b7a8f', 'premium': '#0066b3', 'gold': '#d4a017'}
        color = colors.get(obj.subscription_tier, '#6b7a8f')
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;'
            'border-radius:20px;font-size:11px;font-weight:600;">{}</span>',
            color, obj.get_subscription_tier_display()
        )
    tier_badge.short_description = 'Tier'

    def verified_badge(self, obj):
        if obj.verification_badge:
            return format_html('<span style="color:#00a86b;font-size:16px;">✔</span>')
        return format_html('<span style="color:#ccc;">—</span>')
    verified_badge.short_description = '✔ Verified'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('profile_images')


# ── Profile Image ──────────────────────────────────────────────────────────────
@admin.register(ProfileImage)
class ProfileImageAdmin(admin.ModelAdmin):
    list_display = ('preview', 'user', 'is_primary', 'order', 'created_at')
    list_filter = ('is_primary',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('preview', 'created_at')

    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;" />',
                obj.image.url
            )
        return '—'
    preview.short_description = 'Preview'


# ── Verification Document ──────────────────────────────────────────────────────
@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'document_type', 'status_badge',
        'submitted_at', 'reviewed_at',
    )
    list_filter = ('status', 'document_type')
    search_fields = ('user__username', 'user__email')
    readonly_fields = (
        'submitted_at', 'reviewed_at',
        'front_preview', 'selfie_preview',
    )
    actions = ['approve_documents', 'reject_documents']

    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Documents', {
            'fields': (
                'document_type',
                'front_preview', 'document_front', 'document_back',
                'selfie_preview', 'selfie',
            )
        }),
        ('Review', {
            'fields': ('status', 'admin_notes', 'submitted_at', 'reviewed_at')
        }),
    )

    def status_badge(self, obj):
        colors = {'PENDING': '#ffc107', 'APPROVED': '#00a86b', 'REJECTED': '#dc3545'}
        color = colors.get(obj.status, '#ccc')
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;'
            'border-radius:20px;font-size:11px;font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def front_preview(self, obj):
        if obj.document_front:
            return format_html(
                '<img src="{}" style="max-width:200px;border-radius:8px;" />',
                obj.document_front.url
            )
        return '—'
    front_preview.short_description = 'Front'

    def selfie_preview(self, obj):
        if obj.selfie:
            return format_html(
                '<img src="{}" style="max-width:200px;border-radius:8px;" />',
                obj.selfie.url
            )
        return '—'
    selfie_preview.short_description = 'Selfie'

    @admin.action(description='✅ Approve selected documents')
    def approve_documents(self, request, queryset):
        updated = queryset.update(
            status='APPROVED',
            reviewed_at=timezone.now(),
        )
        queryset.filter(status='APPROVED').values_list(
            'user_id', flat=True
        )
        User.objects.filter(
            id__in=queryset.values_list('user_id', flat=True)
        ).update(is_verified=True, verification_badge=True)
        self.message_user(request, f'{updated} document(s) approved and users verified.')

    @admin.action(description='❌ Reject selected documents')
    def reject_documents(self, request, queryset):
        updated = queryset.update(status='REJECTED', reviewed_at=timezone.now())
        self.message_user(request, f'{updated} document(s) rejected.')


# ── Like ───────────────────────────────────────────────────────────────────────
@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'is_match', 'created_at')
    list_filter = ('is_match',)
    search_fields = ('from_user__username', 'to_user__username')
    readonly_fields = ('created_at',)


# ── Match ──────────────────────────────────────────────────────────────────────
@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    inlines = [ChatMessageInline]
    list_display = (
        'user1', 'user2', 'chat_unlocked',
        'message_count', 'matched_at', 'chat_unlocked_at',
    )
    list_filter = ('chat_unlocked',)
    search_fields = ('user1__username', 'user2__username')
    readonly_fields = ('matched_at', 'chat_unlocked_at', 'message_count')

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _msg_count=Count('messages')
        )


# ── Chat Message ───────────────────────────────────────────────────────────────
@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('match', 'sender', 'short_message', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('sender__username', 'message')
    readonly_fields = ('created_at', 'read_at')

    def short_message(self, obj):
        return obj.message[:60] + ('…' if len(obj.message) > 60 else '')
    short_message.short_description = 'Message'


# ── Payment Transaction ────────────────────────────────────────────────────────
@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'transaction_type', 'amount_display',
        'status_badge', 'mpesa_receipt_number', 'created_at', 'completed_at',
    )
    list_filter = ('status', 'transaction_type', 'subscription_tier')
    search_fields = ('user__username', 'mpesa_receipt_number', 'mpesa_request_id')
    readonly_fields = ('created_at', 'completed_at')

    def amount_display(self, obj):
        return f"KES {obj.amount:,.2f}"
    amount_display.short_description = 'Amount'

    def status_badge(self, obj):
        colors = {
            'PENDING': '#ffc107', 'COMPLETED': '#00a86b',
            'FAILED': '#dc3545', 'CANCELLED': '#6b7a8f',
        }
        color = colors.get(obj.status, '#ccc')
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;'
            'border-radius:20px;font-size:11px;font-weight:600;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


# ── Boost ──────────────────────────────────────────────────────────────────────
@admin.register(Boost)
class BoostAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_active', 'started_at', 'expires_at', 'time_left')
    list_filter = ('is_active',)
    search_fields = ('user__username',)
    readonly_fields = ('started_at', 'created_at')

    def time_left(self, obj):
        if obj.is_active and obj.expires_at > timezone.now():
            delta = obj.expires_at - timezone.now()
            mins = int(delta.total_seconds() // 60)
            return f"{mins} min(s)"
        return format_html('<span style="color:#dc3545;">Expired</span>')
    time_left.short_description = 'Time Left'


# ── Report ─────────────────────────────────────────────────────────────────────
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'reporter', 'reported_user', 'reason',
        'resolved_badge', 'created_at', 'resolved_at', 'resolved_by',
    )
    list_filter = ('reason', 'resolved')
    search_fields = ('reporter__username', 'reported_user__username')
    readonly_fields = ('created_at', 'resolved_at')
    actions = ['mark_resolved']

    def resolved_badge(self, obj):
        if obj.resolved:
            return format_html('<span style="color:#00a86b;font-weight:600;">Resolved</span>')
        return format_html('<span style="color:#dc3545;font-weight:600;">Open</span>')
    resolved_badge.short_description = 'Status'

    @admin.action(description='✅ Mark selected reports as resolved')
    def mark_resolved(self, request, queryset):
        updated = queryset.update(resolved=True, resolved_at=timezone.now(), resolved_by=request.user)
        self.message_user(request, f'{updated} report(s) marked as resolved.')


# ── Notification ───────────────────────────────────────────────────────────────
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'notification_type', 'short_message',
        'is_read', 'created_at',
    )
    list_filter = ('notification_type', 'is_read')
    search_fields = ('user__username', 'message')
    readonly_fields = ('created_at', 'read_at')
    actions = ['mark_all_read']

    def short_message(self, obj):
        return obj.message[:70] + ('…' if len(obj.message) > 70 else '')
    short_message.short_description = 'Message'

    @admin.action(description='✅ Mark selected notifications as read')
    def mark_all_read(self, request, queryset):
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notification(s) marked as read.')