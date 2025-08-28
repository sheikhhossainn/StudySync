from django.urls import path
from . import views

urlpatterns = [
    path('', views.MentorshipListView.as_view(), name='mentorship-list'),
]
