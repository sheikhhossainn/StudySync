# Deployment Fix Instructions

## 🚨 **Current Issue:** 
Backend keeps crashing on Vercel due to complex Django configuration.

## ✅ **Quick Fix Applied:**

1. **Simplified vercel.json** - Removed complex configuration
2. **Created minimal settings** - `settings_simple.py` with basic Django setup  
3. **Simple URLs** - `urls_simple.py` with basic API endpoint
4. **Updated WSGI** - Uses simplified settings

## 🚀 **Deploy Steps:**

### Step 1: Test Locally First
```bash
cd backend
python manage.py runserver --settings=studysync.settings_simple
```
Visit `http://localhost:8000` - should show `{"message": "StudySync API is working!"}`

### Step 2: Deploy to Vercel
1. **Push changes** to GitHub
2. **Redeploy** on Vercel  
3. **Set environment variable** in Vercel:
   ```
   DATABASE_URL=postgresql://studysync_27y8_user:nsAtTPT0sChW8AhMszbuZwl15bwN4yiT@dpg-d2rabs7diees73e3i5c0-a.singapore-postgres.render.com/studysync_27y8
   ```

### Step 3: Test Deployment
Visit your Vercel backend URL - should show the JSON response.

## 🔄 **If Still Fails:**
The issue might be with the complex Django apps. We can switch back to full settings once basic deployment works.

**Current Focus:** Get ANY Django response working on Vercel first, then add complexity.
