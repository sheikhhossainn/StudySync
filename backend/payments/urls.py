from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'payments', views.PaymentViewSet)
router.register(r'subscriptions', views.SubscriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # bKash endpoints
    path('bkash/create-payment/', views.BkashCreatePaymentView.as_view(), name='bkash-create-payment'),
    path('bkash/execute-payment/', views.BkashExecutePaymentView.as_view(), name='bkash-execute-payment'),
    path('bkash/query-payment/<str:payment_id>/', views.BkashQueryPaymentView.as_view(), name='bkash-query-payment'),
    
    # Nagad endpoints
    path('nagad/init-payment/', views.NagadInitPaymentView.as_view(), name='nagad-init-payment'),
    path('nagad/complete-payment/', views.NagadCompletePaymentView.as_view(), name='nagad-complete-payment'),
    path('nagad/verify-payment/<str:payment_ref_id>/', views.NagadVerifyPaymentView.as_view(), name='nagad-verify-payment'),
    
    # Rocket endpoints
    path('rocket/initiate-payment/', views.RocketInitiatePaymentView.as_view(), name='rocket-initiate-payment'),
    path('rocket/confirm-payment/', views.RocketConfirmPaymentView.as_view(), name='rocket-confirm-payment'),
    path('rocket/check-status/<str:transaction_id>/', views.RocketCheckStatusView.as_view(), name='rocket-check-status'),
    
    # General endpoints
    path('verify-manual-payment/', views.VerifyManualPaymentView.as_view(), name='verify-manual-payment'),
    path('payment-success/', views.PaymentSuccessView.as_view(), name='payment-success'),
    path('payment-failed/', views.PaymentFailedView.as_view(), name='payment-failed'),
]
