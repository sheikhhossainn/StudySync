from django.urls import path
from . import views

urlpatterns = [
    path('', views.StudySessionListView.as_view(), name='session-list'),
]
