# Google OAuth Setup Guide for StudySync

## ✅ Backend Status: Working
Your Django backend is properly configured and running on `http://localhost:8000`

## ⚙️ To Enable Google OAuth:

### 1. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Library** → Enable "Google+ API"
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client IDs**
6. Configure:
   ```
   Application type: Web application
   Name: StudySync
   
   Authorized JavaScript origins:
   - http://localhost:8000
   - http://127.0.0.1:5500 (for Live Server)
   - https://study-sync-teal.vercel.app
   
   Authorized redirect URIs:
   - http://localhost:8000/api/auth/auth/google/login/
   - https://study-sync-teal.vercel.app/api/auth/auth/google/login/
   ```

### 2. Update Your Files
Replace these placeholders with your REAL Google credentials:

**Backend (.env file):**
```env
GOOGLE_OAUTH2_CLIENT_ID=your_actual_client_id_here
GOOGLE_OAUTH2_CLIENT_SECRET=your_actual_client_secret_here
```

**Frontend (auth.html):**
- Line 54: Change `YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE` to your real Client ID
- Line 18 in google-auth.js: Change `YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE` to your real Client ID

### 3. OAuth Consent Screen
Configure in Google Cloud Console:
- App name: StudySync
- Privacy Policy: https://study-sync-teal.vercel.app/privacy-policy.html
- Terms of Service: https://study-sync-teal.vercel.app/terms-of-service.html

### 4. Test Your Setup
1. Start Django: `python manage.py runserver`
2. Open: `http://127.0.0.1:5500/StudySync/frontend/auth.html`
3. Click "Continue with Google"
4. Should redirect to Google OAuth consent screen

## 🚀 Current Working Features:
- ✅ Django backend running
- ✅ Google OAuth endpoints configured
- ✅ JWT token generation
- ✅ User registration/login flow
- ✅ Frontend OAuth buttons ready
- ⏳ Waiting for real Google credentials

## 📝 API Endpoints Available:
- `POST /api/auth/auth/google/login/` - Google OAuth login
- `POST /api/auth/auth/login/` - Regular email login
- `POST /api/auth/auth/register/` - User registration
- `GET /api/auth/users/` - User management

Once you add real Google credentials, the OAuth will work perfectly!
