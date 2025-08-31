# StudySync Google OAuth 2.0 Setup Guide for Vercel Deployment

## 📋 Overview
This guide will help you set up Google OAuth 2.0 authentication with JWT tokens for your StudySync application deployed on Vercel.

## 🔧 Prerequisites
- Google Cloud Platform account
- Vercel account
- StudySync backend and frontend code

## 🚀 Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Configure OAuth 2.0
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Set up authorized domains:

**For Development:**
```
Authorized JavaScript origins:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:8000

Authorized redirect URIs:
- http://localhost:3000/auth
- http://127.0.0.1:3000/auth
```

**For Production (Vercel):**
```
Authorized JavaScript origins:
- https://your-app.vercel.app
- https://studysync.vercel.app

Authorized redirect URIs:
- https://your-app.vercel.app/auth
- https://studysync.vercel.app/auth
```

5. Save and copy the **Client ID** and **Client Secret**

## 🔧 Step 2: Backend Configuration

### 2.1 Update Environment Variables
Update your `.env` file:

```env
# Google OAuth 2.0 Configuration
GOOGLE_OAUTH2_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=your_actual_client_secret

# Vercel Configuration
VERCEL_DOMAIN=your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app

# For Production
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,.vercel.app
```

### 2.2 Vercel Environment Variables
In your Vercel dashboard, add these environment variables:

```env
GOOGLE_OAUTH2_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=your_actual_client_secret
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=.vercel.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
VERCEL_DOMAIN=your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

## 🎨 Step 3: Frontend Configuration

### 3.1 Update JavaScript Configuration
In `frontend/assets/js/google-auth.js`, update:

```javascript
const API_BASE_URL = 'https://your-backend.vercel.app'; // Your Vercel backend URL
const GOOGLE_CLIENT_ID = 'your_actual_client_id.apps.googleusercontent.com';
```

### 3.2 Update HTML
In `frontend/auth.html`, update the Google client ID:

```html
<div id="g_id_onload"
     data-client_id="your_actual_client_id.apps.googleusercontent.com"
     data-context="signin"
     data-ux_mode="popup"
     data-callback="handleGoogleSignIn"
     data-auto_prompt="false">
</div>
```

## 🚀 Step 4: Deployment

### 4.1 Deploy Backend to Vercel
1. Push your backend code to GitHub
2. Connect your repository to Vercel
3. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Output Directory**: Leave empty
   - **Install Command**: `pip install -r requirements.txt`

### 4.2 Deploy Frontend to Vercel
1. Create a separate Vercel project for frontend
2. Connect your frontend repository
3. Configure build settings:
   - **Framework Preset**: Other or Static Site
   - **Build Command**: Leave empty (static files)
   - **Output Directory**: `./` or `frontend/`

## 🔐 Step 5: API Endpoints

Your authentication endpoints will be available at:

```
POST https://your-backend.vercel.app/api/accounts/auth/google/login/
POST https://your-backend.vercel.app/api/accounts/auth/login/
POST https://your-backend.vercel.app/api/accounts/auth/register/
POST https://your-backend.vercel.app/api/accounts/auth/refresh/
POST https://your-backend.vercel.app/api/accounts/auth/logout/
```

## 🧪 Step 6: Testing

### 6.1 Test Google OAuth Flow
1. Visit your deployed frontend
2. Click the Google Sign-In button
3. Complete the Google authentication
4. Verify JWT tokens are stored in localStorage
5. Check that user data is returned correctly

### 6.2 Test JWT Authentication
```javascript
// Example API call with JWT
const response = await fetch('/api/protected-endpoint/', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
    }
});
```

## 🔒 Step 7: Security Considerations

### 7.1 Production Settings
- Set `DEBUG=False` in production
- Use HTTPS only (`SECURE_SSL_REDIRECT=True`)
- Secure cookies (`SESSION_COOKIE_SECURE=True`)
- Enable CSRF protection

### 7.2 Token Management
- Access tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Implement automatic token refresh
- Handle token expiration gracefully

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain
   - Check that credentials are being sent with requests

2. **Google OAuth Errors**
   - Verify Client ID matches exactly
   - Check authorized domains in Google Cloud Console
   - Ensure redirect URIs are configured correctly

3. **JWT Token Issues**
   - Check token expiration
   - Verify token is being sent in Authorization header
   - Implement token refresh logic

4. **Vercel Deployment Issues**
   - Check environment variables are set correctly
   - Verify build logs for errors
   - Ensure all dependencies are in requirements.txt

## 📚 Next Steps

1. Implement user roles and permissions
2. Add profile management endpoints
3. Set up email verification (optional)
4. Configure social login for Facebook/GitHub (optional)
5. Add logout functionality across all devices

## 🔗 Useful Links

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Django REST Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Vercel Documentation](https://vercel.com/docs)
- [Django CORS Documentation](https://github.com/adamchainz/django-cors-headers)

---

**Note**: Replace `your-app.vercel.app` and `your_actual_client_id` with your actual Vercel domain and Google Client ID throughout this setup.
