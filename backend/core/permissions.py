from rest_framework import permissions
from django.conf import settings

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class CanUploadImages(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.can_upload_images

class CanChat(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.can_chat

class CanSeeWhoLiked(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user:
            return False
        tier_data = settings.SUBSCRIPTION_TIERS.get(user.subscription_tier, {})
        return tier_data.get('can_see_who_liked', False)

class CanBoost(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user:
            return False
        tier_data = settings.SUBSCRIPTION_TIERS.get(user.subscription_tier, {})
        return tier_data.get('can_boost', False)

class IsVerified(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_verified

class HasVerificationBadge(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.verification_badge