"""
Admin Panel URL Configuration

All endpoints require IsSuperAdmin permission.
All list endpoints support pagination via ?page= parameter.

Routes for Integrator:
======================

1. Health Check
   GET /api/admin/health/
   Returns: {"status": "ok", "time": "ISO", "db": "ok"|"down"}

2. Statistics
   GET /api/admin/stats/?days=30
   Returns: Statistics object with user, family, post, and join request counts

3. User Management
   GET /api/admin/users/?q=&page=
     - List users with search (q) and pagination
     - Returns: Paginated list of users (id, username, is_active, is_superadmin, date_joined, last_login, families_count)
   
   POST /api/admin/users/<id>/disable/
     - Body: {"reason": "..."}
     - Disables user (sets is_active=False)
     - Creates audit log with action_type USER_DISABLE
   
   POST /api/admin/users/<id>/make-superadmin/
     - Grants superadmin status to user
     - Creates audit log with action_type USER_MAKE_SUPERADMIN
   
   POST /api/admin/users/<id>/revoke-superadmin/
     - Revokes superadmin status from user
     - Creates audit log with action_type USER_REVOKE_SUPERADMIN

4. Family Management
   GET /api/admin/families/?q=&page=
     - List families with search (q) and pagination
     - Returns: Paginated list of families (id, name, created_at, created_by_user_id, member_count, suspended)
   
   POST /api/admin/families/<id>/suspend/
     - Body: {"reason": "..."}
     - Suspends family (creates/updates AdminFamilyFlag)
     - Creates audit log with action_type FAMILY_SUSPEND
   
   POST /api/admin/families/<id>/unsuspend/
     - Unsuspends family (updates AdminFamilyFlag)
     - Creates audit log with action_type FAMILY_UNSUSPEND

5. Error Logs
   GET /api/admin/logs/errors/?q=&page=&since_hours=
     - List error logs with search (q), pagination, and time filter (since_hours)
     - Returns: Paginated list of error logs
   
   GET /api/admin/logs/errors/<id>/
     - Get single error log detail
     - Returns: Error log object

6. Audit Logs
   GET /api/admin/logs/audit/?page=&action_type=&entity_type=&family_id=
     - List audit logs with filtering and pagination
     - Filters: action_type, entity_type, family_id
     - Returns: Paginated list of audit logs

7. Feedback Management
   GET /api/admin/feedback/?page=&status=&type=
     - List feedback with filtering and pagination
     - Filters: status, type
     - Returns: Paginated list of feedback
   
   POST /api/admin/feedback/<id>/status/
     - Body: {"status": "PENDING"|"REVIEWED"|"RESOLVED"|"CLOSED"}
     - Updates feedback status
     - Returns: Success message with updated status
"""
from django.urls import path
from apps.admin_panel import views

app_name = 'admin_panel'

urlpatterns = [
    # Health and Statistics
    path('health/', views.HealthCheckView.as_view(), name='health'),
    path('stats/', views.StatsView.as_view(), name='stats'),
    
    # User Management
    path('users/', views.UserListView.as_view(), name='users-list'),
    path('users/<int:pk>/disable/', views.UserDisableView.as_view(), name='users-disable'),
    path('users/<int:pk>/toggle-superadmin/', views.UserSuperadminToggleView.as_view(), name='users-toggle-superadmin'),
    path('users/<int:pk>/make-superadmin/', views.UserMakeSuperadminView.as_view(), name='users-make-superadmin'),
    path('users/<int:pk>/revoke-superadmin/', views.UserRevokeSuperadminView.as_view(), name='users-revoke-superadmin'),
    
    # Family Management
    path('families/', views.FamilyListView.as_view(), name='families-list'),
    path('families/<int:pk>/suspend/', views.FamilySuspendView.as_view(), name='families-suspend'),
    path('families/<int:pk>/unsuspend/', views.FamilyUnsuspendView.as_view(), name='families-unsuspend'),
    
    # Error Logs (SystemErrorLog)
    path('error-logs/', views.ErrorLogsListView.as_view(), name='error-logs-list'),
    
    # Legacy Error Logs (ErrorLog model)
    path('logs/errors/', views.ErrorLogListView.as_view(), name='logs-errors-list'),
    path('logs/errors/<int:pk>/', views.ErrorLogDetailView.as_view(), name='logs-errors-detail'),
    
    # Audit Logs
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-logs-list'),
    path('logs/audit/', views.AuditLogListView.as_view(), name='logs-audit-list'),
    
    # Feedback Management
    path('feedback/', views.FeedbackListView.as_view(), name='feedback-list'),
    path('feedback/<int:pk>/status/', views.FeedbackStatusUpdateView.as_view(), name='feedback-status-update'),
]
