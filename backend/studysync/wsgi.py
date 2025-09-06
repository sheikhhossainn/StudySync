"""
WSGI config for studysync project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Use simple settings for Vercel deployment to avoid complex dependencies
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync.settings_simple')

application = get_wsgi_application()

# Vercel expects 'app' variable name
app = application
