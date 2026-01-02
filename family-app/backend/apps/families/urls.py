from django.urls import path
from apps.families import views

app_name = 'families'

urlpatterns = [
    path('', views.FamilyView.as_view(), name='family-list-create'),
    path('join/', views.JoinRequestCreateView.as_view(), name='join-request-create'),
    path('join-requests/', views.JoinRequestListView.as_view(), name='join-request-list'),
    path('join-requests/<int:pk>/approve/', views.JoinRequestApproveView.as_view(), name='join-request-approve'),
    path('join-requests/<int:pk>/reject/', views.JoinRequestRejectView.as_view(), name='join-request-reject'),
]
