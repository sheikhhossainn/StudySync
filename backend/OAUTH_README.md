# StudySync - OAuth 2.0 Authentication Setup

## Overview

StudySync now features a complete OAuth 2.0 authentication system supporting multiple social providers:

- **Google Sign-In** - OAuth 2.0 with Google Identity Services
- **Facebook Login** - Facebook SDK integration
- **GitHub OAuth** - GitHub OAuth Apps
- **Traditional Login** - Email/password authentication
- **Phone Verification** - SMS-based verification
- **Document Verification** - Student/Mentor verification system

## Architecture

### Backend (Django)
- **Django OAuth Toolkit** - OAuth 2.0 provider
- **Django Allauth** - Social authentication
- **Social Auth App Django** - Social provider integration
- **Custom User Model** - Extended user profiles
- **JWT Tokens** - Secure token-based authentication

### Frontend (JavaScript)
- **OAuth2Service** - Centralized authentication service
- **AuthManager** - Complete authentication flow management
- **Social Login Buttons** - Pre-built UI components
- **Token Management** - Automatic token refresh

## Setup Instructions

### 1. Backend Setup

#### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- pip package manager

#### Quick Setup (Windows)
```powershell
cd backend
.\setup.ps1
```

#### Quick Setup (Linux/macOS)
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

#### Manual Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate
# Or (Linux/macOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up database
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### 2. OAuth Provider Configuration

#### Google OAuth 2.0
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:8000/auth/callback`
6. Copy Client ID to frontend JavaScript

#### Facebook Login
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:8000/auth/callback`
5. Copy App ID to frontend JavaScript

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/auth/callback`
4. Copy Client ID to frontend JavaScript

### 3. Frontend Configuration

#### Update OAuth Client IDs
Edit `frontend/assets/js/oauth2-service.js`:

```javascript
// Initialize OAuth providers with your client IDs
oauth2Service.initializeProvider('google', 'YOUR_GOOGLE_CLIENT_ID');
oauth2Service.initializeProvider('facebook', 'YOUR_FACEBOOK_CLIENT_ID'); 
oauth2Service.initializeProvider('github', 'YOUR_GITHUB_CLIENT_ID');
```

#### Environment Variables
Create `backend/.env` file:

```env
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True

# Database
DB_NAME=studysync
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# OAuth Settings
GOOGLE_OAUTH2_KEY=your-google-client-id
GOOGLE_OAUTH2_SECRET=your-google-client-secret

FACEBOOK_KEY=your-facebook-app-id
FACEBOOK_SECRET=your-facebook-app-secret

GITHUB_KEY=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# SMS Settings (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Email Settings
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
```

## Authentication Flow

### Social Login Flow
1. User clicks social login button (Google/Facebook/GitHub)
2. Frontend redirects to OAuth provider
3. User authorizes application
4. Provider redirects back with authorization code
5. Frontend exchanges code for access token
6. Backend validates token and creates/updates user
7. Backend returns JWT tokens
8. Frontend stores tokens and updates UI

### Traditional Login Flow
1. User submits email/password
2. Backend validates credentials
3. Backend returns JWT tokens
4. Frontend stores tokens and updates UI

### Token Management
- **Access Token**: Short-lived (1 hour), used for API requests
- **Refresh Token**: Long-lived (30 days), used to refresh access tokens
- **Automatic Refresh**: Frontend automatically refreshes expired tokens

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Traditional login
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/logout/` - Logout user
- `POST /api/auth/refresh/` - Refresh access token

### Social Authentication
- `POST /api/auth/social/google/` - Google OAuth login
- `POST /api/auth/social/facebook/` - Facebook OAuth login
- `POST /api/auth/social/github/` - GitHub OAuth login

### User Management
- `GET /api/auth/user/` - Get current user
- `PUT /api/auth/user/` - Update user profile
- `POST /api/auth/verify-phone/` - Verify phone number
- `POST /api/auth/verify-documents/` - Submit verification documents

### OAuth 2.0
- `POST /api/oauth/token/` - OAuth 2.0 token endpoint
- `POST /api/oauth/revoke-token/` - Revoke OAuth token
- `POST /api/oauth/introspect/` - Token introspection

## Security Features

### Token Security
- JWT tokens with RS256 signing
- Short-lived access tokens
- Secure refresh token rotation
- Token blacklisting on logout

### API Security
- CORS configuration
- Rate limiting
- CSRF protection
- SQL injection prevention
- XSS protection

### Password Security
- Bcrypt hashing
- Password strength validation
- Account lockout after failed attempts

## User Types and Verification

### Student Verification
- Student ID card upload
- Institution verification
- Phone number verification

### Mentor Verification  
- National ID verification
- Company ID verification
- Professional background check
- Phone number verification

## Frontend Integration

### Basic Usage
```javascript
// Check if user is authenticated
if (oauth2Service.isAuthenticated()) {
    // User is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('Current user:', user);
}

// Sign in with Google
document.getElementById('googleBtn').addEventListener('click', async () => {
    try {
        await oauth2Service.signInWithGoogle();
    } catch (error) {
        console.error('Google sign-in failed:', error);
    }
});

// Make authenticated API request
const response = await oauth2Service.apiRequest('/api/posts/', {
    method: 'GET'
});
```

### Event Handling
```javascript
// Listen for authentication events
window.addEventListener('userLoggedIn', (event) => {
    const { user } = event.detail;
    console.log('User logged in:', user);
    updateUIForLoggedInUser(user);
});

window.addEventListener('userLoggedOut', () => {
    console.log('User logged out');
    updateUIForLoggedOutUser();
});
```

## Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific test file
python manage.py test accounts.tests

# Run with coverage
pip install coverage
coverage run manage.py test
coverage report
```

### Frontend Testing
```javascript
// Test OAuth service
console.log('Testing OAuth service...');
console.log('Is authenticated:', oauth2Service.isAuthenticated());
console.log('Access token:', oauth2Service.getAccessToken());
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors
Ensure `django-cors-headers` is installed and configured:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

#### 2. OAuth Redirect Mismatch
Check that redirect URIs in OAuth provider settings match:
- Frontend: `http://localhost:3000/auth/callback`
- Backend: `http://localhost:8000/auth/callback`

#### 3. Token Errors
Clear browser storage and try again:
```javascript
localStorage.clear();
sessionStorage.clear();
```

#### 4. Database Connection Issues
Verify PostgreSQL is running and credentials are correct in `.env` file.

#### 5. Social Provider Errors
Check that OAuth credentials are correctly set in both frontend JavaScript and backend environment variables.

### Debug Mode
Enable debug logging in Django:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'oauth2_provider': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'social_core': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Production Deployment

### Environment Variables
Set production environment variables:
- `DEBUG=False`
- `ALLOWED_HOSTS=yourdomain.com`
- Production database credentials
- Production OAuth redirect URIs
- HTTPS-only cookies

### Security Checklist
- [ ] HTTPS enabled
- [ ] Production database
- [ ] Environment variables secured
- [ ] Debug mode disabled
- [ ] Static files served properly
- [ ] CORS configured for production domains
- [ ] OAuth redirect URIs updated
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Support

For issues and questions:
1. Check this documentation
2. Review Django OAuth Toolkit documentation
3. Check social-auth-app-django documentation
4. Create an issue in the project repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.
