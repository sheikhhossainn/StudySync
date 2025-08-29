# StudySync Django Installation & Setup Guide

## ✅ Django Installation Status

**Good News!** Django is already installed in your virtual environment:
- **Django Version**: 4.2.7
- **Python Version**: 3.12.7
- **Virtual Environment**: Located at `C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/`

## 🚀 Quick Start Commands

Open PowerShell and navigate to the backend directory:

```powershell
cd "c:\Users\Usha_Personal_Laptop\Desktop\Vs all Code\StudySync\backend"
```

### 1. Test Django Installation
```powershell
& "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" -c "import django; print('Django version:', django.get_version())"
```

### 2. Check Project Configuration
```powershell
& "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py check
```

### 3. Create Database Migrations
```powershell
& "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py makemigrations
```

### 4. Apply Migrations
```powershell
& "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py migrate
```

### 5. Create Superuser (Optional)
```powershell
& "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py createsuperuser
```

### 6. Start Development Server
```powershell
& "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" manage.py runserver
```

## 🔧 Project Configuration

### Database Configuration
- **Current**: SQLite (for development)
- **Production**: PostgreSQL (configured in settings)

### Environment Variables
- Configuration file: `.env`
- Example file: `.env.example`

### Key Features Configured
- ✅ User authentication and accounts
- ✅ Subscription and payment system
- ✅ Study session management
- ✅ Mentorship platform
- ✅ REST API endpoints
- ✅ CORS headers for frontend integration

## 🌐 URLs and Endpoints

Once the server is running, you can access:

- **Main Application**: http://127.0.0.1:8000/
- **Admin Panel**: http://127.0.0.1:8000/admin/
- **API Root**: http://127.0.0.1:8000/api/
- **Payment API**: http://127.0.0.1:8000/payments/
- **Accounts API**: http://127.0.0.1:8000/accounts/

## 📱 Frontend Integration

Your frontend files are located at:
```
../frontend/
├── my-posts.html
├── premium-features-demo.html
├── subscription-test.html
└── assets/
    ├── css/
    │   ├── subscription.css
    │   └── my-posts.css
    └── js/
        └── subscription.js
```

## 🔍 Troubleshooting

### If Django commands don't work:

1. **Check Python Path**:
   ```powershell
   & "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" --version
   ```

2. **Check Django Import**:
   ```powershell
   & "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/.venv/Scripts/python.exe" -c "import django; print('OK')"
   ```

3. **Check Current Directory**:
   ```powershell
   Get-Location
   # Should be: C:\Users\Usha_Personal_Laptop\Desktop\Vs all Code\StudySync\backend
   ```

### Common Issues:

- **PowerShell Execution Policy**: Use `powershell -ExecutionPolicy Bypass` if needed
- **Path Issues**: Always use full path to Python executable
- **Database Issues**: Currently using SQLite, no PostgreSQL required for development

## 🎯 Next Steps

1. **Start the server** using the commands above
2. **Test the subscription system** by opening `frontend/premium-features-demo.html`
3. **Access the admin panel** to manage data
4. **Test API endpoints** using the URLs provided

## 📞 If You Need Help

If you encounter any issues:
1. Check that you're in the correct directory
2. Verify Python and Django are working with the test commands
3. Check the console output for specific error messages

**Django is ready to use!** 🎉
