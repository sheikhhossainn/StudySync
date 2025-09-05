# Quick Fix for Vercel Deployment

## ✅ Fixed Issues:
- Simplified `vercel.json` 
- Updated Python runtime to 3.11
- Removed complex routing

## 🚀 Deploy Steps:

### 1. Push Changes to GitHub
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 2. Deploy Backend to Vercel
1. Go to Vercel dashboard
2. Import your GitHub repository 
3. Deploy the **backend folder** as a separate project
4. Set these environment variables in Vercel:

```
DATABASE_URL=postgresql://studysync_27y8_user:nsAtTPT0sChW8AhMszbuZwl15bwN4yiT@dpg-d2rabs7diees73e3i5c0-a.singapore-postgres.render.com/studysync_27y8
SECRET_KEY=t*o%t0x6)frkl7f4*8f3@fp3)v5bjj4=eh0*jz!1*m@8^6kj!f
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.vercel.app,study-sync-teal.vercel.app
CORS_ALLOWED_ORIGINS=https://study-sync-teal.vercel.app
```

### 3. Update Frontend Config
After backend deployment, get your backend URL and run:
```bash
node update-production-config.js https://your-backend-domain.vercel.app
```

### 4. Deploy Frontend
Deploy frontend folder to Vercel

## 🧪 Test:
Visit your backend URL: `https://your-backend.vercel.app`
Should show: `{"message": "StudySync API is running!"}`
