from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/images/', views.ProfileImageView.as_view(), name='profile-images'),
    path('profile/images/<int:image_id>/', views.ProfileImageView.as_view(), name='profile-image-delete'),
    
    # Verification
    path('verification/', views.VerificationView.as_view(), name='verification'),
    
    # Discovery
    path('discover/', views.DiscoverView.as_view(), name='discover'),
    
    # Likes
    path('likes/', views.LikeView.as_view(), name='likes'),
    path('likes/<int:user_id>/', views.LikeView.as_view(), name='like-delete'),
    
    # Matches
    path('matches/', views.MatchView.as_view(), name='matches'),
    
    # Chat
    path('chat/<int:match_id>/', views.ChatView.as_view(), name='chat'),
    
    # Payments
    path('payments/', views.PaymentView.as_view(), name='payments'),
    path('mpesa-callback/', views.MpesaCallbackView.as_view(), name='mpesa-callback'),
    
    # Subscriptions
    path('subscriptions/', views.SubscriptionView.as_view(), name='subscriptions'),
    path('boost-status/', views.BoostStatusView.as_view(), name='boost-status'),
    
    # Reports
    path('reports/', views.ReportView.as_view(), name='reports'),
    
    # Notifications
    path('notifications/', views.NotificationView.as_view(), name='notifications'),
    path('notifications/<int:notification_id>/', views.NotificationView.as_view(), name='notification-detail'),
    
    # Admin
    path('admin/verifications/', views.AdminVerificationView.as_view(), name='admin-verifications'),
    path('admin/verifications/<int:verification_id>/', views.AdminVerificationView.as_view(), name='admin-verification-action'),
]