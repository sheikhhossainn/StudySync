from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import SubscriptionPlan, UserSubscription, Payment, UserPaymentMethod, Advertisement
from .serializers import (
    SubscriptionPlanSerializer, UserSubscriptionSerializer, PaymentSerializer,
    PaymentCreateSerializer, UserPaymentMethodSerializer, AdvertisementSerializer,
    SubscriptionUpgradeSerializer, UserSubscriptionStatusSerializer
)


class SubscriptionPlanListView(generics.ListAPIView):
    """List all active subscription plans"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserSubscriptionStatusView(generics.RetrieveAPIView):
    """Get current user's subscription status"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Calculate days remaining for premium users
        days_remaining = None
        if user.is_premium and user.premium_expires_at:
            days_remaining = (user.premium_expires_at - timezone.now()).days
            if days_remaining < 0:
                days_remaining = 0
        
        data = {
            'subscription_type': user.subscription_type,
            'is_premium': user.is_premium,
            'has_ads': user.has_ads,
            'can_use_mentorship': user.can_use_mentorship(),
            'post_limit': user.get_post_limit(),
            'current_month_posts': user.get_current_month_posts(),
            'can_create_post': user.can_create_post(),
            'premium_expires_at': user.premium_expires_at,
            'days_remaining': days_remaining,
        }
        
        serializer = UserSubscriptionStatusSerializer(data)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upgrade_to_premium(request):
    """Upgrade user to premium subscription"""
    serializer = SubscriptionUpgradeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    plan_id = serializer.validated_data['plan_id']
    payment_method = serializer.validated_data['payment_method']
    months = serializer.validated_data['months']
    
    # Get the subscription plan
    plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
    
    # Calculate total amount and expiry date
    total_amount = plan.price * months
    current_time = timezone.now()
    
    # If user already has premium, extend from current expiry
    if user.is_premium and user.premium_expires_at and user.premium_expires_at > current_time:
        new_expiry = user.premium_expires_at + timedelta(days=plan.duration_days * months)
    else:
        new_expiry = current_time + timedelta(days=plan.duration_days * months)
    
    # Create or update user subscription
    subscription, created = UserSubscription.objects.get_or_create(
        user=user,
        defaults={
            'plan': plan,
            'expires_at': new_expiry,
            'status': 'active'
        }
    )
    
    if not created:
        subscription.plan = plan
        subscription.expires_at = new_expiry
        subscription.status = 'active'
        subscription.save()
    
    # Create payment record
    payment = Payment.objects.create(
        user=user,
        subscription=subscription,
        amount=total_amount,
        payment_method=payment_method,
        payment_status='pending'
    )
    
    # For demo purposes, we'll mark the payment as completed
    # In a real system, you would integrate with actual payment gateways
    payment.payment_status = 'completed'
    payment.paid_at = timezone.now()
    payment.transaction_id = f"TXN_{payment.id}"
    payment.save()
    
    # Update user's subscription status
    user.subscription_type = 'premium'
    user.premium_expires_at = new_expiry
    user.save()
    
    return Response({
        'message': 'Successfully upgraded to premium!',
        'subscription': UserSubscriptionSerializer(subscription).data,
        'payment': PaymentSerializer(payment).data
    })


class PaymentHistoryView(generics.ListAPIView):
    """List user's payment history"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')


class AdvertisementListView(generics.ListAPIView):
    """Get ads for free users"""
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only show ads to free users
        if self.request.user.has_ads:
            return Advertisement.objects.filter(
                is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now()
            ).order_by('-priority', '?')[:3]  # Show max 3 random ads
        return Advertisement.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def track_ad_impression(request, ad_id):
    """Track when user views an ad"""
    try:
        ad = Advertisement.objects.get(id=ad_id, is_active=True)
        
        # Only track for free users
        if request.user.has_ads:
            from .models import AdImpression
            
            # Create impression record
            AdImpression.objects.create(
                ad=ad,
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Update ad impression count
            ad.impressions_count += 1
            ad.save(update_fields=['impressions_count'])
            
            return Response({'status': 'success'})
        
        return Response({'error': 'Premium users do not see ads'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    except Advertisement.DoesNotExist:
        return Response({'error': 'Ad not found'}, 
                       status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def track_ad_click(request, ad_id):
    """Track when user clicks an ad"""
    try:
        ad = Advertisement.objects.get(id=ad_id, is_active=True)
        
        # Only track for free users
        if request.user.has_ads:
            from .models import AdImpression
            
            # Find the most recent impression for this user and ad
            impression = AdImpression.objects.filter(
                ad=ad,
                user=request.user,
                clicked=False
            ).first()
            
            if impression:
                impression.clicked = True
                impression.save()
            
            # Update ad click count
            ad.clicks_count += 1
            ad.save(update_fields=['clicks_count'])
            
            return Response({
                'status': 'success',
                'redirect_url': ad.click_url
            })
        
        return Response({'error': 'Premium users do not see ads'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    except Advertisement.DoesNotExist:
        return Response({'error': 'Ad not found'}, 
                       status=status.HTTP_404_NOT_FOUND)


class UserPaymentMethodListCreateView(generics.ListCreateAPIView):
    """List and create user payment methods"""
    serializer_class = UserPaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserPaymentMethod.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        # If this is set as default, remove default from other methods
        if serializer.validated_data.get('is_default', False):
            UserPaymentMethod.objects.filter(
                user=self.request.user,
                is_default=True
            ).update(is_default=False)
        
        serializer.save(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def subscription_features(request):
    """Get detailed comparison of subscription features"""
    plans = SubscriptionPlan.objects.filter(is_active=True).order_by('price')
    
    features_comparison = []
    for plan in plans:
        features_comparison.append({
            'id': plan.id,
            'name': plan.name,
            'price': plan.price,
            'currency': plan.currency,
            'duration_days': plan.duration_days,
            'features': {
                'max_posts_per_month': plan.max_posts_per_month if plan.max_posts_per_month != -1 else 'Unlimited',
                'can_use_mentorship': plan.can_use_mentorship,
                'has_ads': plan.has_ads,
                'group_study': True,  # Available for all plans
                'messaging': True,   # Available for all plans
                'priority_support': plan.features.get('priority_support', False),
                'advanced_search': plan.features.get('advanced_search', False),
                'custom_features': plan.features
            }
        })
    
    return Response({
        'plans': features_comparison,
        'user_current_plan': request.user.subscription_type
    })
