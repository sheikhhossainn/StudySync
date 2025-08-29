from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Subscription plans
    path('plans/', views.SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('features/', views.subscription_features, name='subscription-features'),
    
    # User subscription management
    path('subscription/status/', views.UserSubscriptionStatusView.as_view(), name='subscription-status'),
    path('subscription/upgrade/', views.upgrade_to_premium, name='upgrade-premium'),
    path('subscription/cancel/', views.cancel_subscription, name='cancel-subscription'),
    
    # Payment history
    path('history/', views.PaymentHistoryView.as_view(), name='payment-history'),
    
    # Payment methods
    path('methods/', views.UserPaymentMethodListCreateView.as_view(), name='payment-methods'),
    
    # Advertisements
    path('ads/', views.AdvertisementListView.as_view(), name='advertisements'),
    path('ads/<uuid:ad_id>/impression/', views.track_ad_impression, name='track-ad-impression'),
    path('ads/<uuid:ad_id>/click/', views.track_ad_click, name='track-ad-click'),
    
    # bKash Payment Gateway
    path('bkash/initiate-payment/', views.BKashInitiatePaymentView.as_view(), name='bkash-initiate-payment'),
    path('bkash/confirm-payment/', views.BKashConfirmPaymentView.as_view(), name='bkash-confirm-payment'),
    path('bkash/check-status/<str:transaction_id>/', views.BKashCheckStatusView.as_view(), name='bkash-check-status'),
    
    # Nagad Payment Gateway
    path('nagad/initiate-payment/', views.NagadInitiatePaymentView.as_view(), name='nagad-initiate-payment'),
    path('nagad/confirm-payment/', views.NagadConfirmPaymentView.as_view(), name='nagad-confirm-payment'),
    path('nagad/check-status/<str:transaction_id>/', views.NagadCheckStatusView.as_view(), name='nagad-check-status'),
    
    # Rocket Payment Gateway
    path('rocket/initiate-payment/', views.RocketInitiatePaymentView.as_view(), name='rocket-initiate-payment'),
    path('rocket/confirm-payment/', views.RocketConfirmPaymentView.as_view(), name='rocket-confirm-payment'),
    path('rocket/check-status/<str:transaction_id>/', views.RocketCheckStatusView.as_view(), name='rocket-check-status'),
    
    # General endpoints
    path('verify-manual-payment/', views.VerifyManualPaymentView.as_view(), name='verify-manual-payment'),
    path('payment-success/', views.PaymentSuccessView.as_view(), name='payment-success'),
    path('payment-failed/', views.PaymentFailedView.as_view(), name='payment-failed'),
    
    # Premium features endpoints
    path('premium-features/', views.PremiumFeaturesView.as_view(), name='premium-features'),
]
