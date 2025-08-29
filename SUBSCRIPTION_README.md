# StudySync Subscription System

## Overview
StudySync implements a comprehensive subscription system with two tiers: Free and Premium. The system includes payment processing, advertisement management, and feature access control.

## Subscription Tiers

### Free Subscription
- **Cost**: Free
- **Features**:
  - Limited to 5 posts per month
  - Access to group study features
  - Advertisement display
  - No access to mentorship program
- **Revenue Model**: Advertisements

### Premium Subscription
- **Cost**: 300 BDT per month
- **Features**:
  - Unlimited post creation
  - Full access to mentorship program
  - No advertisements
  - Access to all group study features
  - Priority support
- **Revenue Model**: Monthly subscription fee

## Technical Implementation

### Database Schema
The subscription system uses the following main tables:

1. **subscription_plans**: Defines available subscription plans
2. **user_subscriptions**: Tracks user subscription status
3. **payments**: Records payment transactions
4. **advertisements**: Manages ad content and targeting

### Backend Components

#### Models (`accounts/models.py`)
```python
class User(AbstractUser):
    subscription_type = models.CharField(max_length=20, choices=SUBSCRIPTION_CHOICES, default='free')
    premium_expires_at = models.DateTimeField(null=True, blank=True)
    
    def is_premium(self):
        # Returns True if user has active premium subscription
    
    def can_create_post(self):
        # Checks if user can create more posts based on subscription
```

#### Payment Models (`payments/models.py`)
- `SubscriptionPlan`: Plan definitions and pricing
- `UserSubscription`: User subscription tracking
- `Payment`: Payment transaction records
- `Advertisement`: Ad content management

#### API Views (`payments/views.py`)
- Subscription management endpoints
- Payment processing
- Advertisement serving
- Subscription status checks

### Frontend Components

#### JavaScript (`assets/js/subscription.js`)
- `SubscriptionManager` class for client-side management
- Payment method selection
- Upgrade modal handling
- Advertisement display logic

#### CSS (`assets/css/subscription.css`)
- Subscription badge styling
- Advertisement container styles
- Upgrade modal design
- Responsive design for mobile devices

## Payment Integration

### Supported Payment Methods
1. **bKash**: Bangladesh's leading mobile financial service
2. **Nagad**: Government-backed mobile banking
3. **Rocket**: Dutch-Bangla Bank's mobile banking service

### Payment Flow
1. User selects premium upgrade
2. Payment method selection modal appears
3. User chooses preferred payment method
4. Redirect to payment gateway
5. Payment confirmation and subscription activation
6. Email confirmation sent

## Advertisement System

### Ad Types
1. **Content Ads**: Displayed between posts
2. **Sidebar Ads**: Shown in sidebar areas
3. **Banner Ads**: Header/footer placement

### Ad Targeting
- User demographics
- Study interests
- Location-based targeting
- Time-based campaigns

### Revenue Tracking
- Impression tracking
- Click-through rates
- Revenue per user calculations

## Usage Examples

### Frontend Integration
```html
<!-- Include subscription CSS and JS -->
<link rel="stylesheet" href="assets/css/subscription.css">
<script src="assets/js/subscription.js"></script>

<!-- Display subscription badge -->
<span class="subscription-badge premium">Premium User</span>

<!-- Show upgrade button for free users -->
<button class="upgrade-to-premium-btn" onclick="subscriptionManager.showUpgradeModal()">
    Upgrade to Premium
</button>
```

### Backend API Usage
```javascript
// Check subscription status
fetch('/api/subscription/status/')
    .then(response => response.json())
    .then(data => {
        if (data.is_premium) {
            // Show premium features
        } else {
            // Show ads and limit features
        }
    });

// Process upgrade
fetch('/api/subscription/upgrade/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({
        plan_id: 'premium_monthly',
        payment_method: 'bkash'
    })
});
```

## Testing

### Test File
Use `subscription-test.html` to test the subscription system:

1. **User Status Testing**: Toggle between free and premium
2. **Advertisement Display**: Verify ads show only for free users
3. **Feature Access**: Test mentorship and post creation limits
4. **Payment Flow**: Simulate upgrade process

### Test Scenarios
1. Free user accessing premium features
2. Post limit enforcement
3. Advertisement display and interaction
4. Subscription upgrade flow
5. Payment method selection

## Configuration

### Environment Variables
```env
# Payment Gateway Settings
BKASH_API_KEY=your_bkash_api_key
NAGAD_API_KEY=your_nagad_api_key
ROCKET_API_KEY=your_rocket_api_key

# Subscription Settings
PREMIUM_PRICE_BDT=300
FREE_POST_LIMIT=5
AD_REFRESH_INTERVAL=30

# Database Settings
DATABASE_URL=postgresql://user:pass@localhost/studysync
```

### Django Settings
```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'payments',
    'accounts',
]

# Subscription settings
SUBSCRIPTION_SETTINGS = {
    'PREMIUM_PRICE': 300,  # BDT
    'FREE_POST_LIMIT': 5,
    'CURRENCY': 'BDT',
}
```

## Deployment Checklist

### Database Migration
```bash
python manage.py makemigrations accounts payments
python manage.py migrate
python manage.py loaddata subscription_plans.json
```

### Static Files
```bash
python manage.py collectstatic
```

### Payment Gateway Setup
1. Register with bKash, Nagad, and Rocket
2. Obtain API keys and configure endpoints
3. Set up webhook URLs for payment confirmations
4. Test payment flows in sandbox environment

### Monitoring
1. Set up payment transaction logging
2. Monitor subscription renewal rates
3. Track advertisement performance
4. User engagement metrics

## Security Considerations

### Payment Security
- All payment data encrypted in transit
- PCI DSS compliance for card payments
- Secure webhook validation
- Payment method tokenization

### Subscription Security
- JWT token validation for API access
- Rate limiting on subscription endpoints
- Audit logging for subscription changes
- Secure session management

## Troubleshooting

### Common Issues
1. **Payment Gateway Timeouts**: Increase timeout settings
2. **Subscription Not Activating**: Check webhook configuration
3. **Ads Not Displaying**: Verify ad content and targeting rules
4. **Feature Access Denied**: Check subscription status cache

### Debug Commands
```bash
# Check user subscription status
python manage.py shell -c "from accounts.models import User; print(User.objects.get(email='user@example.com').is_premium())"

# Refresh subscription cache
python manage.py refresh_subscriptions

# Test payment gateway
python manage.py test_payment_gateway bkash
```

## Performance Optimization

### Caching Strategy
- Cache subscription status for 5 minutes
- Cache advertisement content
- Use Redis for session storage
- Implement CDN for static assets

### Database Optimization
- Index on subscription status fields
- Partition payment tables by date
- Archive old payment records
- Optimize ad targeting queries

## Future Enhancements

### Planned Features
1. **Annual Subscription Discount**: 20% off for yearly payments
2. **Student Verification**: Special pricing for verified students
3. **Referral Program**: Free premium months for successful referrals
4. **Corporate Plans**: Bulk subscriptions for educational institutions
5. **Mobile App Integration**: Native payment flows
6. **Advanced Analytics**: Detailed usage and revenue analytics

### API Versioning
- Current version: v1
- Backward compatibility maintained
- Deprecation notices for old endpoints

## Support

### Documentation
- API documentation: `/api/docs/`
- Payment integration guide: `/docs/payments/`
- Subscription management: `/docs/subscriptions/`

### Contact
- Technical support: tech@studysync.com
- Payment issues: payments@studysync.com
- General inquiries: info@studysync.com
