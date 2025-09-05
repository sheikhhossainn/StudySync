# StudySync Local Development Guide

## 🏠 Setting Up Local Development

### Quick Start

1. **Switch to Development Environment**
   ```bash
   # Windows
   .\env-switch.bat dev
   
   # Linux/Mac
   ./env-switch.sh dev
   ```

2. **Start Django Backend**
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Open Frontend**
   - Use VS Code Live Server on `frontend/index.html`
   - Or open `http://localhost:5500` (or your Live Server port)

## 🔧 Configuration Details

### Environment Detection

The frontend automatically detects your environment:

- **Local Development**: `localhost`, `127.0.0.1`, or Live Server ports (`5500`, `55982`, etc.)
- **Production**: Any other domain (like Vercel)

### Development Tools

Open browser console and use these helper functions:

```javascript
// Show current configuration
StudySyncDev.showConfig()

// Test API connection
StudySyncDev.testAPI()

// Force development mode (if detection fails)
StudySyncDev.enableDevMode()

// Force production mode (for testing)
StudySyncDev.enableProdMode()
```

### Force Development Mode

If automatic detection fails, you can force development mode:

1. **URL Parameter**: Add `?dev=true` to any page URL
2. **Console Command**: Run `StudySyncDev.enableDevMode()`
3. **Manual**: `localStorage.setItem('forceDevMode', 'true')` then refresh

## 📁 Environment Files

- `.env.local` - Development configuration (local database, DEBUG=True)
- `.env.production` - Production configuration (cloud database, DEBUG=False)  
- `.env` - Current active configuration (copied from above)

## 🚀 Starting Development

### 1. Database Setup
Make sure PostgreSQL is running with these settings:
```
Database: studysync
User: postgres  
Password: 11787898
Host: localhost
Port: 5432
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Optional
python manage.py runserver
```

### 3. Frontend Setup
- Open `frontend/index.html` with Live Server
- Or serve from any local web server
- Frontend will automatically use `http://localhost:8000` for API calls

## 🧪 Testing Local Development

### Verify Configuration
1. Open browser console on your frontend
2. Look for: "🔧 StudySync Development Mode"
3. Check that API URL shows: `http://localhost:8000`

### Test API Connection
```javascript
StudySyncDev.testAPI()
```
Should show "✅ API connection successful"

### Test Features
- User registration
- User login  
- Creating study sessions
- Loading study sessions
- Google OAuth (if configured)

## 🔄 Switching Environments

### To Development
```bash
.\env-switch.bat dev    # Windows
./env-switch.sh dev     # Linux/Mac
```

### To Production
```bash
.\env-switch.bat prod   # Windows  
./env-switch.sh prod    # Linux/Mac
```

### Manual Switch
Copy the desired environment file:
```bash
cp backend/.env.local backend/.env      # Development
cp backend/.env.production backend/.env # Production
```

## 🐛 Troubleshooting

### Frontend Not Connecting to Backend

1. **Check console for errors**
2. **Verify API URL**: `StudySyncDev.showConfig()`
3. **Force dev mode**: `StudySyncDev.enableDevMode()`
4. **Check backend is running**: Visit `http://localhost:8000/api/`

### Backend Issues

1. **Check environment**: `python manage.py check`
2. **Verify database**: `python manage.py dbshell`
3. **Check migrations**: `python manage.py showmigrations`
4. **View logs**: Check Django console output

### CORS Errors in Development

The development environment includes these CORS origins:
- `http://localhost:5500`
- `http://127.0.0.1:5500` 
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:8080`

If you use a different port, add it to `CORS_ALLOWED_ORIGINS` in `.env.local`

## 📝 Development Workflow

1. **Start backend**: `python manage.py runserver`
2. **Start frontend**: Use Live Server in VS Code
3. **Make changes**: Edit files as needed
4. **Test locally**: Use browser dev tools and console helpers
5. **Deploy**: Switch to prod config and deploy

## 🔍 Debug Information

When in development mode, the console will show:
```
🔧 StudySync Development Mode
API URL: http://localhost:8000
Use StudySyncDev.showConfig() for detailed info
Use StudySyncDev.testAPI() to test connection
```

This ensures you know you're in the right mode and can easily debug issues.

## ✅ Success Checklist

Local development is working when:
- [ ] Backend runs on `http://localhost:8000`
- [ ] Frontend detects development mode in console
- [ ] `StudySyncDev.testAPI()` returns success
- [ ] User registration/login works
- [ ] Study sessions load and display
- [ ] No CORS errors in network tab
