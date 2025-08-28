from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid


class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('card', 'Credit/Debit Card'),
        ('stripe', 'Stripe'),
    ]
    
    PAYMENT_TYPE_CHOICES = [
        ('remove_ads', 'Remove Advertisements'),
        ('mentor_payment', 'Mentor Payment'),
        ('subscription', 'Subscription'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    converted_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Amount in BDT
    conversion_rate = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    # Status and tracking
    status = models.CharField(max_length=15, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    external_payment_id = models.CharField(max_length=100, blank=True, null=True)  # Provider's payment ID
    
    # Generic relation for payment target (mentor, subscription, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Mobile banking specific fields
    mobile_number = models.CharField(max_length=15, blank=True, null=True)
    reference_note = models.TextField(blank=True, null=True)
    
    # Billing information
    billing_email = models.EmailField()
    billing_name = models.CharField(max_length=100)
    billing_address = models.TextField()
    billing_city = models.CharField(max_length=50)
    billing_state = models.CharField(max_length=50)
    billing_zip = models.CharField(max_length=10)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['payment_method', 'status']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"Payment {self.id} - {self.user.email} - {self.get_payment_method_display()}"


class MobileBankingTransaction(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mobile_transaction')
    provider_transaction_id = models.CharField(max_length=100)
    provider_reference = models.CharField(max_length=100, blank=True)
    provider_fee = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending Verification'),
            ('verified', 'Verified'),
            ('failed', 'Verification Failed'),
        ],
        default='pending'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Mobile Transaction {self.provider_transaction_id}"


class PaymentLog(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='logs')
    status = models.CharField(max_length=15)
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Log for {self.payment.id} - {self.status}"


class Subscription(models.Model):
    SUBSCRIPTION_TYPES = [
        ('remove_ads', 'Remove Advertisements'),
        ('premium', 'Premium Features'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    subscription_type = models.CharField(max_length=20, choices=SUBSCRIPTION_TYPES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.get_subscription_type_display()}"
    
    @property
    def is_active(self):
        from django.utils import timezone
        return self.status == 'active' and self.end_date > timezone.now()
