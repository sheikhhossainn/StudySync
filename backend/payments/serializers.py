from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, Payment, UserPaymentMethod, Advertisement


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_days_remaining(self, obj):
        from django.utils import timezone
        if obj.expires_at > timezone.now():
            return (obj.expires_at - timezone.now()).days
        return 0


class PaymentSerializer(serializers.ModelSerializer):
    subscription = UserSubscriptionSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'user', 'transaction_id', 'payment_gateway_response', 'paid_at', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['amount', 'currency', 'payment_method', 'subscription']


class UserPaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPaymentMethod
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class AdvertisementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advertisement
        fields = ['id', 'title', 'content', 'image_url', 'click_url', 'priority']


class SubscriptionUpgradeSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD_CHOICES)
    months = serializers.IntegerField(min_value=1, max_value=12, default=1)
    
    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
            if plan.name == 'Free Plan':
                raise serializers.ValidationError("Cannot upgrade to free plan")
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid subscription plan")
        return value


class UserSubscriptionStatusSerializer(serializers.Serializer):
    subscription_type = serializers.CharField()
    is_premium = serializers.BooleanField()
    has_ads = serializers.BooleanField()
    can_use_mentorship = serializers.BooleanField()
    post_limit = serializers.IntegerField()
    current_month_posts = serializers.IntegerField()
    can_create_post = serializers.BooleanField()
    premium_expires_at = serializers.DateTimeField(allow_null=True)
    days_remaining = serializers.IntegerField(allow_null=True)
