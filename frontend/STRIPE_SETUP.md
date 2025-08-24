# Stripe Integration Backend Setup

This file provides guidance for setting up the backend to handle Stripe payments.

## Environment Variables

Create a `.env` file with your Stripe keys:
```
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Backend Endpoints Needed

### 1. Create Payment Intent
**POST /api/create-payment-intent**

```javascript
// Example Node.js/Express endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, payment_type, mentor_info } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency || 'usd',
      metadata: {
        payment_type: payment_type,
        mentor_id: mentor_info?.id || null,
        mentor_name: mentor_info?.name || null
      }
    });

    res.send({
      client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).send({
      error: error.message
    });
  }
});
```

### 2. Confirm Payment
**POST /api/confirm-payment**

```javascript
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id, customer_details, payment_type, mentor_info } = req.body;
    
    // Save payment details to your database
    const payment = await savePaymentToDatabase({
      payment_intent_id,
      customer_details,
      payment_type,
      mentor_info,
      status: 'completed',
      created_at: new Date()
    });
    
    // Send confirmation email
    await sendConfirmationEmail(customer_details.email, payment);
    
    // If mentor payment, notify mentor
    if (payment_type === 'mentor-payment' && mentor_info) {
      await notifyMentor(mentor_info.id, payment);
    }
    
    res.send({ success: true, payment_id: payment.id });
  } catch (error) {
    res.status(400).send({
      error: error.message
    });
  }
});
```

### 3. Webhook Handler
**POST /api/webhook**

```javascript
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!');
      // Update payment status in database
      updatePaymentStatus(paymentIntent.id, 'succeeded');
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed!');
      // Update payment status in database
      updatePaymentStatus(failedPayment.id, 'failed');
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});
```

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'remove-ads' or 'mentor-payment'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed'
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  billing_address JSONB,
  mentor_id VARCHAR(255), -- Only for mentor payments
  mentor_name VARCHAR(255), -- Only for mentor payments
  session_description TEXT, -- Only for mentor payments
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Subscriptions Table (for ad removal)
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  subscription_type VARCHAR(50) NOT NULL, -- 'ad-free'
  status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Frontend Integration

Update the JavaScript file with your actual Stripe publishable key:

```javascript
// Replace this line in payment.js
const stripe = Stripe('pk_test_your_actual_publishable_key_here');
```

## Testing

Use Stripe's test card numbers:
- **Successful payment**: 4242424242424242
- **Payment requires authentication**: 4000002500003155
- **Payment is declined**: 4000000000000002

## Security Notes

1. Never expose your secret key in frontend code
2. Always validate payments on the server side
3. Use webhooks to handle payment status updates
4. Implement proper error handling and logging
5. Use HTTPS in production
6. Validate all input data on the server

## Next Steps

1. Set up your Stripe account and get your API keys
2. Create the backend endpoints as shown above
3. Update the frontend JavaScript with your publishable key
4. Test with Stripe's test cards
5. Set up webhooks in your Stripe dashboard
6. Deploy to production with proper security measures
