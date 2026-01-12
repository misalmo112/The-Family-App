from django.urls import path
from apps.feed import views

app_name = 'feed'

urlpatterns = [
    path('', views.PostListView.as_view(), name='post-list'),
    path('posts/', views.PostCreateView.as_view(), name='post-create'),
]
