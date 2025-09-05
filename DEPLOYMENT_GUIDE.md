# StudySync Production Deployment Guide

This guide will help you deploy StudySync to production and ensure data fetching works correctly after deployment.

## Current Issues Identified & Fixed

1. **Hardcoded API URLs** - ✅ Fixed
2. **Debug mode in production** - ✅ Fixed  
3. **CORS configuration** - ✅ Fixed
4. **Database configuration** - ⚠️ Needs setup
5. **Environment variables** - ⚠️ Needs setup

## 🗄️ Database Setup (CRITICAL)

### Option 1: Supabase (Recommended - Free PostgreSQL)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. In Project Settings > Database, copy your connection string
4. It will look like: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

### Option 2: ElephantSQL (Free PostgreSQL)

1. Go to [elephantsql.com](https://www.elephantsql.com/) and create account
2. Create a free "Tiny Turtle" instance
3. Copy the URL from the instance details

### Option 3: Neon (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create account
2. Create a new database
3. Copy the connection string

## 🚀 Vercel Deployment Setup

### Step 1: Set Environment Variables in Vercel

In your Vercel dashboard, go to your project settings and add these environment variables:

```bash
# Database (REQUIRED - use your database URL from above)
DATABASE_URL=postgresql://user:password@host:port/database

# Django Settings
SECRET_KEY=your-super-secret-production-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.vercel.app,study-sync-teal.vercel.app

# CORS
CORS_ALLOWED_ORIGINS=https://study-sync-teal.vercel.app

# Google OAuth (Your existing values)
GOOGLE_OAUTH2_CLIENT_ID=1061988044539-0vq3h3fk08tjs9ncg63oetudgvt0onu8.apps.googleusercontent.com
GOOGLE_OAUTH2_CLIENT_SECRET=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

# Frontend URL
FRONTEND_URL=https://study-sync-teal.vercel.app
VERCEL_DOMAIN=your-backend-domain.vercel.app
```

### Step 2: Update Backend Domain

1. Deploy your backend to Vercel (separate from frontend)
2. Note the domain Vercel gives you (e.g., `studysync-backend-abc123.vercel.app`)
3. Update `frontend/assets/js/config.js` with the correct backend URL

### Step 3: Google OAuth Update

Update your Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 client
4. Add your production domains to:
   - Authorized JavaScript origins: `https://study-sync-teal.vercel.app`
   - Authorized redirect URIs: `https://study-sync-teal.vercel.app/auth.html`

## 🔧 Migration and Setup Commands

After deployment, you need to run database migrations:

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run migrations
vercel exec -- python manage.py migrate

# Create superuser (optional)
vercel exec -- python manage.py createsuperuser
```

### Option 2: Using Django Management Command

Add this to your `manage.py` for automatic migrations:

```python
# Add to the end of manage.py
if __name__ == '__main__':
    # Run migrations automatically in production
    import os
    if os.environ.get('VERCEL'):
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'migrate'])
    
    main()
```

## 🛠️ Troubleshooting Common Issues

### Issue 1: "CORS Error" 
**Solution**: Check CORS_ALLOWED_ORIGINS includes your frontend domain

### Issue 2: "Database connection error"
**Solution**: Verify DATABASE_URL is set correctly in Vercel environment variables

### Issue 3: "Static files not loading"
**Solution**: Run `python manage.py collectstatic` during build

### Issue 4: "API calls returning 404"
**Solution**: Check that API_BASE_URL in config.js points to correct backend domain

## 📝 Verification Checklist

After deployment, verify these work:

- [ ] Frontend loads without console errors
- [ ] User registration works
- [ ] User login works  
- [ ] Study sessions load and display
- [ ] Creating new posts works
- [ ] User profiles load
- [ ] Google OAuth works
- [ ] Payment integration works

## 🔍 Debug Commands

If something isn't working:

```bash
# Check logs
vercel logs your-project-name

# Check environment variables
vercel env ls

# Test database connection
vercel exec -- python -c "from django.db import connection; cursor = connection.cursor(); print('DB connected successfully')"
```

## 📞 Support

If you encounter issues:

1. Check browser console for JavaScript errors
2. Check Vercel function logs for backend errors  
3. Verify all environment variables are set
4. Ensure database is accessible and has correct schema

The main issue was that your frontend was hardcoded to use localhost:8000 for API calls, which obviously doesn't work in production. The fixes above should resolve this.
