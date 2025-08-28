# StudySync Django Backend

A comprehensive Django backend for StudySync - a study collaboration platform with integrated mobile banking payment system supporting bKash, Nagad, and Rocket.

## Features

- 🚀 **Django 4.2** with REST Framework
- 🐘 **PostgreSQL** database
- 💳 **Mobile Banking Integration** (bKash, Nagad, Rocket)
- 🔐 **User Authentication & Authorization**
- 📱 **Study Session Management**
- 👨‍🏫 **Mentorship System**
- 💰 **Payment Processing**
- 🔧 **Admin Dashboard**

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

### Installation

#### Windows
```bash
# Run the setup script
setup.bat
```

#### Linux/Mac
```bash
# Make setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

### Manual Setup

1. **Clone and Navigate**
```bash
cd backend
```

2. **Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
```

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Database Setup**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database and user
CREATE DATABASE studysync_db;
CREATE USER studysync_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE studysync_db TO studysync_user;
\q
```

6. **Django Setup**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Project Structure

```
backend/
├── studysync/              # Django project settings
│   ├── __init__.py
│   ├── settings.py         # Main settings
│   ├── urls.py            # Root URL configuration
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
├── accounts/              # User management app
│   ├── models.py          # User and Profile models
│   ├── views.py           # Authentication views
│   └── urls.py            # Auth URLs
├── payments/              # Payment processing app
│   ├── models.py          # Payment models
│   ├── views.py           # Payment API views
│   ├── urls.py            # Payment URLs
│   └── services/          # Payment service integrations
│       ├── bkash_service.py
│       ├── nagad_service.py
│       └── rocket_service.py
├── study_sessions/        # Study session management
├── mentorship/           # Mentorship system
├── core/                 # Core functionality
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── setup.sh             # Linux/Mac setup script
├── setup.bat            # Windows setup script
└── manage.py            # Django management script
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - User profile

### Payments
- `POST /api/payments/bkash/create-payment/` - Create bKash payment
- `POST /api/payments/bkash/execute-payment/` - Execute bKash payment
- `GET /api/payments/bkash/query-payment/{id}/` - Query bKash payment
- `POST /api/payments/nagad/init-payment/` - Initialize Nagad payment
- `POST /api/payments/nagad/complete-payment/` - Complete Nagad payment
- `POST /api/payments/rocket/initiate-payment/` - Initiate Rocket payment
- `POST /api/payments/rocket/confirm-payment/` - Confirm Rocket payment

### Study Sessions
- `GET /api/sessions/` - List study sessions
- `POST /api/sessions/` - Create study session
- `GET /api/sessions/{id}/` - Get session details
- `PUT /api/sessions/{id}/` - Update session
- `DELETE /api/sessions/{id}/` - Delete session

## Payment Integration

### bKash
1. Get merchant credentials from bKash
2. Update `.env` file with bKash credentials
3. Use sandbox URLs for testing

### Nagad
1. Get merchant account from Nagad
2. Generate PGP key pairs
3. Update `.env` file with Nagad credentials

### Rocket
1. Get merchant credentials from DBBL
2. Update `.env` file with Rocket credentials
3. Test with sandbox environment

## Environment Variables

```env
# Database
DB_NAME=studysync_db
DB_USER=studysync_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# bKash
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret

# Nagad
NAGAD_BASE_URL=https://sandbox.mynagad.com/api/dfs/check-out/v1
NAGAD_MERCHANT_ID=your_nagad_merchant_id
NAGAD_PUBLIC_KEY=your_nagad_public_key
NAGAD_PRIVATE_KEY=your_nagad_private_key

# Rocket
ROCKET_BASE_URL=https://sandbox.rocket.com.bd/api
ROCKET_MERCHANT_ID=your_rocket_merchant_id
ROCKET_API_KEY=your_rocket_api_key
ROCKET_SECRET_KEY=your_rocket_secret_key
```

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Admin Interface
Access the admin interface at `http://localhost:8000/admin/`

### API Documentation
- Django REST Framework browsable API: `http://localhost:8000/api/`
- Admin panel: `http://localhost:8000/admin/`

## Production Deployment

### Security Checklist
- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use HTTPS
- [ ] Set up proper logging
- [ ] Configure static files serving
- [ ] Set up database backups

### Recommended Stack
- **Server**: Ubuntu 20.04 LTS
- **Web Server**: Nginx
- **WSGI Server**: Gunicorn
- **Database**: PostgreSQL 12+
- **Cache**: Redis
- **SSL**: Let's Encrypt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Support

For issues and questions:
- Check the documentation
- Review environment variables
- Test with sandbox credentials first
- Contact mobile banking providers for API issues

## License

This project is licensed under the MIT License.
