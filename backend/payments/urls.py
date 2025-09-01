from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Subscription plans
    path('plans/', views.SubscriptionPlanListView.as_view(), name='subscription-plans'),
    
    # User subscription management
    path('subscription/status/', views.UserSubscriptionStatusView.as_view(), name='subscription-status'),
    path('subscription/upgrade/', views.upgrade_to_premium, name='upgrade-premium'),
    path('subscription/features/', views.subscription_features, name='subscription-features'),
    
    # Payment processing
    path('initiate/', views.initiate_payment, name='initiate-payment'),
    path('verify/', views.verify_payment, name='verify-payment'),
    path('manual-submit/', views.submit_manual_payment, name='submit-manual-payment'),
    path('methods/', views.payment_methods, name='payment-methods'),
    path('user-methods/', views.UserPaymentMethodListCreateView.as_view(), name='user-payment-methods'),
    
    # Payment history
    path('history/', views.PaymentHistoryView.as_view(), name='payment-history'),
    
    # Advertisements
    path('ads/', views.AdvertisementListView.as_view(), name='advertisements'),
    path('ads/<uuid:ad_id>/impression/', views.track_ad_impression, name='track-ad-impression'),
    path('ads/<uuid:ad_id>/click/', views.track_ad_click, name='track-ad-click'),
]
