# StudySync Deployment Checklist

## ✅ Issues Fixed

- [x] Fixed hardcoded API URLs in frontend JavaScript files
- [x] Updated API service to use dynamic configuration
- [x] Created separate development and production configurations
- [x] Enhanced environment detection for local development
- [x] Added development helper tools and debugging
- [x] Improved CORS configuration for both environments
- [x] Enhanced build script for better deployment
- [x] Updated Vercel configuration

## 🏠 Local Development Setup

### Quick Start for Local Testing

1. **Switch to development environment:**
   ```bash
   # Windows
   .\env-switch.bat dev
   
   # Linux/Mac  
   ./env-switch.sh dev
   ```

2. **Start Django backend:**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Open frontend with Live Server** (VS Code extension)

4. **Test configuration:** Open `frontend/test-environment.html`

### Local Development Features

- Automatic environment detection (localhost/127.0.0.1)
- Debug tools in browser console (`StudySyncDev.*`)
- Force development mode: `?dev=true` or `StudySyncDev.enableDevMode()`
- Separate `.env.local` for development settings

## 🔄 Steps to Deploy

### 1. Database Setup (REQUIRED)
Choose one of these free PostgreSQL services:

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create account and new project  
3. Get connection string from Settings > Database
4. Format: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

**Option B: ElephantSQL**
1. Go to https://www.elephantsql.com/
2. Create free "Tiny Turtle" instance
3. Copy the URL from instance details

### 2. Backend Deployment
1. Deploy backend to Vercel as separate project
2. Note the domain (e.g., `studysync-backend-xyz.vercel.app`)
3. Set these environment variables in Vercel:

```
DATABASE_URL=your_postgresql_url_here
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=studysync-backend-xyz.vercel.app,study-sync-teal.vercel.app
CORS_ALLOWED_ORIGINS=https://study-sync-teal.vercel.app
GOOGLE_OAUTH2_CLIENT_ID=1061988044539-0vq3h3fk08tjs9ncg63oetudgvt0onu8.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=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
```

### 3. Update Frontend Configuration
Run this command with your backend URL:
```bash
node update-production-config.js https://your-backend-domain.vercel.app
```

### 4. Google OAuth Update
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Edit OAuth 2.0 client
4. Add production domains:
   - JavaScript origins: `https://study-sync-teal.vercel.app`
   - Redirect URIs: `https://study-sync-teal.vercel.app/auth.html`

### 5. Frontend Deployment
1. Commit and push changes
2. Deploy frontend to Vercel
3. Ensure it uses the correct backend URL

## 🧪 Testing Checklist

After deployment, verify these work:

- [ ] Homepage loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Study sessions load and display
- [ ] Creating new posts works
- [ ] User profiles load correctly
- [ ] Google OAuth authentication works
- [ ] API calls return data (not 404/CORS errors)

## 🚨 Troubleshooting

### Common Issues:

**CORS Errors**
- Check CORS_ALLOWED_ORIGINS includes frontend domain
- Verify backend is deployed and running

**Database Connection Errors**  
- Verify DATABASE_URL is set in Vercel environment variables
- Check database service is active and accessible

**404 API Errors**
- Verify frontend config.js has correct backend URL
- Check backend deployment logs in Vercel

**Google OAuth Not Working**
- Update redirect URIs in Google Cloud Console
- Check client ID/secret are correct

### Debug Commands:
```bash
# Check Vercel logs
vercel logs your-backend-project

# Test database connection
vercel exec -- python -c "from django.db import connection; print('DB OK')"

# Check environment variables
vercel env ls
```

## 🎯 Quick Test Script

Run this to verify your setup before deployment:
```bash
python test_deployment.py
```

## 📝 Files Modified

The following files have been updated to fix deployment issues:

1. `frontend/assets/js/config.js` - Dynamic API URL configuration
2. `frontend/assets/js/api-service.js` - Fixed hardcoded URLs
3. `frontend/assets/js/auth-oauth.js` - Dynamic API URLs  
4. `frontend/assets/js/auth.js` - Dynamic API URLs
5. `frontend/assets/js/oauth2-service.js` - Dynamic API URLs
6. `frontend/assets/js/premium.js` - Dynamic API URLs
7. `backend/studysync/settings.py` - Production configuration
8. `backend/.env` - Updated for production
9. `backend/vercel.json` - Enhanced deployment config
10. `backend/build_files.sh` - Improved build script

## 🎉 Success Indicators

Your deployment is successful when:
- Frontend loads without console errors
- API calls return data (check Network tab)
- Users can register/login
- Study sessions display correctly
- Database operations work

The main issue was hardcoded localhost URLs in your JavaScript files. This has been fixed to use dynamic configuration that works in both development and production.
