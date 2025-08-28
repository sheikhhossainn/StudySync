# Mobile Banking Payment Integration Guide

This guide explains how to set up bKash, Nagad, and Rocket payment APIs for StudySync.

## Overview

StudySync now supports three major Bangladeshi mobile banking services:
- **bKash** - Most popular mobile financial service
- **Nagad** - Government-backed digital financial service  
- **Rocket** - DBBL's mobile banking service

## Setup Requirements

### 1. bKash Integration

#### Prerequisites:
- bKash merchant account
- API credentials from bKash

#### Configuration:
1. Replace the following placeholders in `assets/js/payment.js`:
   ```javascript
   bkash: {
       baseUrl: 'https://tokenized.pay.bka.sh/v1.2.0-beta',
       username: 'YOUR_BKASH_USERNAME',
       password: 'YOUR_BKASH_PASSWORD', 
       appKey: 'YOUR_BKASH_APP_KEY',
       appSecret: 'YOUR_BKASH_APP_SECRET'
   }
   ```

2. Implement server-side endpoints:
   - `POST /api/bkash/create-payment` - Create payment
   - `POST /api/bkash/execute-payment` - Execute payment
   - `GET /api/bkash/query-payment` - Query payment status

### 2. Nagad Integration

#### Prerequisites:
- Nagad merchant account
- PGP key pair for encryption
- API credentials from Nagad

#### Configuration:
1. Replace the following placeholders in `assets/js/payment.js`:
   ```javascript
   nagad: {
       baseUrl: 'https://api.mynagad.com/api/dfs/check-out/v1',
       merchantId: 'YOUR_NAGAD_MERCHANT_ID',
       publicKey: 'YOUR_NAGAD_PUBLIC_KEY',
       privateKey: 'YOUR_NAGAD_PRIVATE_KEY'
   }
   ```

2. Implement server-side endpoints:
   - `POST /api/nagad/init-payment` - Initialize payment
   - `POST /api/nagad/complete-payment` - Complete payment
   - `GET /api/nagad/verify-payment` - Verify payment status

### 3. Rocket Integration

#### Prerequisites:
- Rocket merchant account
- API credentials from DBBL
- SSL certificate for secure communication

#### Configuration:
1. Replace the following placeholders in `assets/js/payment.js`:
   ```javascript
   rocket: {
       baseUrl: 'https://rocket.com.bd/api',
       merchantId: 'YOUR_ROCKET_MERCHANT_ID',
       apiKey: 'YOUR_ROCKET_API_KEY', 
       secretKey: 'YOUR_ROCKET_SECRET_KEY'
   }
   ```

2. Implement server-side endpoints:
   - `POST /api/rocket/initiate-payment` - Initiate payment
   - `POST /api/rocket/confirm-payment` - Confirm payment
   - `GET /api/rocket/check-status` - Check payment status

## Security Considerations

1. **Never expose API secrets in frontend code** - All sensitive credentials should be on your backend
2. **Use HTTPS** - Always use SSL/TLS encryption for API calls
3. **Validate payments server-side** - Always verify payments on your backend
4. **Implement proper error handling** - Handle network failures gracefully
5. **Log transactions** - Keep detailed logs for debugging and compliance

## Testing

### Sandbox URLs:
- **bKash Sandbox**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta`
- **Nagad Sandbox**: `https://sandbox.mynagad.com/api/dfs/check-out/v1`
- **Rocket Sandbox**: Contact DBBL for sandbox credentials

### Test Cards:
Each provider offers test credentials for development. Contact them for:
- Test merchant accounts
- Test mobile numbers
- Test transaction scenarios

## Backend Implementation

You'll need to implement the following backend endpoints for each payment method:

### bKash Backend Example (Node.js/Express):
```javascript
app.post('/api/bkash/create-payment', async (req, res) => {
    try {
        // 1. Get access token
        // 2. Create payment with bKash API
        // 3. Return payment ID and bKash URL
        res.json({ success: true, paymentID: '...', bkashURL: '...' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
```

### Important Notes:
- Currency conversion is handled automatically (USD to BDT at ~85 rate)
- All payments are processed in Bangladeshi Taka (BDT)
- Fallback to manual payment entry if APIs are unavailable
- Transaction IDs are validated server-side

## Support

For API-specific issues:
- **bKash**: developer@bkash.com
- **Nagad**: developer@nagad.com.bd
- **Rocket**: Contact DBBL support

## Additional Resources

- [bKash Developer Documentation](https://developer.bka.sh/)
- [Nagad Developer Portal](https://developer.mynagad.com/)
- [DBBL Rocket API Documentation](https://rocket.com.bd/developers)
