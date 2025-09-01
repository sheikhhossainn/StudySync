from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import logging

from .models import SubscriptionPlan, UserSubscription, Payment, UserPaymentMethod, Advertisement
from .serializers import (
    SubscriptionPlanSerializer, UserSubscriptionSerializer, PaymentSerializer,
    PaymentCreateSerializer, UserPaymentMethodSerializer, AdvertisementSerializer,
    SubscriptionUpgradeSerializer, UserSubscriptionStatusSerializer
)
from .payment_gateways import PaymentGatewayFactory, ManualPaymentVerifier, PaymentGatewayError

logger = logging.getLogger(__name__)


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
    
    # Get user's current plan
    current_plan = None
    if request.user.is_premium:
        try:
            current_subscription = UserSubscription.objects.filter(
                user=request.user, 
                status='active'
            ).first()
            if current_subscription:
                current_plan = current_subscription.plan.name
        except UserSubscription.DoesNotExist:
            pass
    
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
        'current_plan': current_plan,
        'user_current_plan': request.user.subscription_type
    })


# ========================
# PAYMENT GATEWAY VIEWS
# ========================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def initiate_payment(request):
    """Initiate payment with selected gateway"""
    try:
        payment_method = request.data.get('payment_method')
        plan_id = request.data.get('plan_id')
        months = int(request.data.get('months', 1))
        user_phone = request.data.get('phone_number', '')
        
        # Validate inputs
        if not all([payment_method, plan_id]):
            return Response({
                'error': 'payment_method and plan_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get subscription plan
        plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)
        total_amount = plan.price * months
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            amount=total_amount,
            currency=plan.currency,
            payment_method=payment_method,
            payment_status='pending'
        )
        
        # Handle different payment methods
        if payment_method in ['bkash', 'nagad']:
            try:
                gateway = PaymentGatewayFactory.get_gateway(payment_method)
                user_data = {
                    'phone': user_phone,
                    'email': request.user.email,
                    'name': f"{request.user.first_name} {request.user.last_name}"
                }
                
                result = gateway.initiate_payment(total_amount, plan.currency, user_data)
                
                if result['success']:
                    payment.transaction_id = result['transaction_id']
                    payment.payment_gateway_response = result['gateway_response']
                    payment.save()
                    
                    return Response({
                        'success': True,
                        'payment_id': payment.id,
                        'transaction_id': result['transaction_id'],
                        'checkout_url': result['checkout_url'],
                        'message': f'Payment initiated successfully via {payment_method.title()}'
                    })
                else:
                    payment.payment_status = 'failed'
                    payment.failure_reason = result['error']
                    payment.save()
                    
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except PaymentGatewayError as e:
                payment.payment_status = 'failed'
                payment.failure_reason = str(e)
                payment.save()
                
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        elif payment_method in ['bank_transfer', 'card']:
            # For manual payment methods
            return Response({
                'success': True,
                'payment_id': payment.id,
                'message': f'Please complete the payment using {payment_method.replace("_", " ").title()}',
                'manual_payment': True,
                'payment_instructions': get_payment_instructions(payment_method, total_amount, plan.currency)
            })
        
        else:
            payment.delete()
            return Response({
                'error': f'Unsupported payment method: {payment_method}'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Payment initiation error: {str(e)}")
        return Response({
            'error': 'Payment initiation failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_payment_instructions(payment_method, amount, currency):
    """Get payment instructions for manual payment methods"""
    instructions = {
        'bank_transfer': {
            'method': 'Bank Transfer',
            'amount': f'{amount} {currency}',
            'account_details': {
                'bank_name': 'Your Bank Name',
                'account_number': '1234567890',
                'account_name': 'StudySync Limited',
                'routing_number': '123456789'
            },
            'instructions': [
                f'Transfer exactly {amount} {currency} to the above account',
                'Use your email address as the transfer reference',
                'Take a screenshot of the successful transfer',
                'Submit the transaction reference number in the verification form'
            ]
        }
    }
    
    return instructions.get(payment_method, {})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    """Verify payment status"""
    try:
        payment_id = request.data.get('payment_id')
        transaction_id = request.data.get('transaction_id')
        
        if not payment_id:
            return Response({
                'error': 'payment_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        payment = get_object_or_404(Payment, id=payment_id, user=request.user)
        
        # If payment already completed, return success
        if payment.payment_status == 'completed':
            return Response({
                'success': True,
                'status': 'completed',
                'message': 'Payment already verified and completed'
            })
        
        # Verify with payment gateway
        if payment.payment_method in ['bkash', 'nagad']:
            try:
                gateway = PaymentGatewayFactory.get_gateway(payment.payment_method)
                result = gateway.verify_payment(transaction_id or payment.transaction_id)
                
                if result['success']:
                    if result['status'] in ['completed', 'success', 'paid']:
                        # Payment successful - activate subscription
                        activate_subscription(payment, result)
                        
                        return Response({
                            'success': True,
                            'status': 'completed',
                            'message': 'Payment verified and subscription activated successfully!'
                        })
                    else:
                        payment.payment_status = result['status']
                        payment.save()
                        
                        return Response({
                            'success': False,
                            'status': result['status'],
                            'message': f'Payment status: {result["status"]}'
                        })
                else:
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except PaymentGatewayError as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response({
                'error': 'Payment verification not supported for this payment method'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        return Response({
            'error': 'Payment verification failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_manual_payment(request):
    """Submit manual payment for verification"""
    try:
        payment_id = request.data.get('payment_id')
        transaction_ref = request.data.get('transaction_reference')
        payment_date = request.data.get('payment_date')
        payment_method = request.data.get('payment_method')
        amount = request.data.get('amount')
        
        # Validate inputs
        required_fields = ['payment_id', 'transaction_reference', 'payment_date', 'payment_method', 'amount']
        for field in required_fields:
            if not request.data.get(field):
                return Response({
                    'error': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        payment = get_object_or_404(Payment, id=payment_id, user=request.user)
        
        # Update payment with manual details
        payment.transaction_id = transaction_ref
        payment.payment_gateway_response = {
            'payment_date': payment_date,
            'submitted_amount': amount,
            'submission_time': timezone.now().isoformat(),
            'status': 'pending_verification'
        }
        payment.payment_status = 'pending'
        payment.save()
        
        # Use manual payment verifier
        verification_result = ManualPaymentVerifier.verify_manual_payment({
            'transaction_ref': transaction_ref,
            'amount': amount,
            'payment_method': payment_method,
            'payment_date': payment_date
        })
        
        return Response({
            'success': True,
            'message': verification_result['message'],
            'verification_id': verification_result['verification_id'],
            'status': 'pending_verification'
        })
        
    except Exception as e:
        logger.error(f"Manual payment submission error: {str(e)}")
        return Response({
            'error': 'Manual payment submission failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_methods(request):
    """Get available payment methods"""
    return Response({
        'mobile_payments': [
            {
                'id': 'bkash',
                'name': 'bKash',
                'icon': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0UyMTMzNiIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Ykthc2g8L3RleHQ+Cjwvc3ZnPg==',
                'description': 'Pay with your bKash account',
                'enabled': True
            },
            {
                'id': 'nagad',
                'name': 'Nagad', 
                'icon': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0ZGNDQ0NCIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TmFnYWQ8L3RleHQ+Cjwvc3ZnPg==',
                'description': 'Pay with your Nagad account',
                'enabled': True
            }
        ],
        'other_methods': [
            {
                'id': 'bank_transfer',
                'name': 'Bank Transfer',
                'icon': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM0NjZCOCIvPgo8cGF0aCBkPSJNMTAgMTJIMzBWMTZIMTBWMTJaTTEwIDIwSDMwVjI0SDEwVjIwWk0xMCAyOEgzMFYzMkgxMFYyOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
                'description': 'Transfer to our bank account',
                'enabled': True
            },
            {
                'id': 'card',
                'name': 'Credit/Debit Card',
                'icon': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwNTFBNSIvPgo8cmVjdCB4PSI4IiB5PSIxMiIgd2lkdGg9IjI0IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iOCIgeT0iMTYiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzIiBmaWxsPSIjRkZBNzAwIi8+Cjx0ZXh0IHg9IjIwIiB5PSIzNCIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iOCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhcmQ8L3RleHQ+Cjwvc3ZnPg==',
                'description': 'Pay with your credit or debit card',
                'enabled': True
            }
        ]
    })


def activate_subscription(payment, verification_result):
    """Activate user subscription after successful payment"""
    try:
        user = payment.user
        
        # Update payment status
        payment.payment_status = 'completed'
        payment.paid_at = timezone.now()
        payment.payment_gateway_response.update(verification_result.get('gateway_response', {}))
        payment.save()
        
        # Get or create subscription plan (default premium if no subscription)
        if payment.subscription:
            plan = payment.subscription.plan
        else:
            # Get default premium plan
            plan = SubscriptionPlan.objects.filter(name__icontains='premium', is_active=True).first()
            if not plan:
                # Create default premium plan if none exists
                plan = SubscriptionPlan.objects.create(
                    name='Premium Monthly',
                    description='Premium subscription with all features',
                    price=Decimal('299.00'),
                    currency='BDT',
                    duration_days=30,
                    max_posts_per_month=-1,
                    can_use_mentorship=True,
                    has_ads=False
                )
        
        # Calculate expiry date
        current_time = timezone.now()
        if user.is_premium and user.premium_expires_at and user.premium_expires_at > current_time:
            new_expiry = user.premium_expires_at + timedelta(days=plan.duration_days)
        else:
            new_expiry = current_time + timedelta(days=plan.duration_days)
        
        # Update user subscription
        user.subscription_type = 'premium'
        user.premium_expires_at = new_expiry
        user.save()
        
        # Create or update UserSubscription record
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
        
        # Link payment to subscription
        if not payment.subscription:
            payment.subscription = subscription
            payment.save()
        
        logger.info(f"Subscription activated for user {user.email} until {new_expiry}")
        
    except Exception as e:
        logger.error(f"Subscription activation error: {str(e)}")
        raise
