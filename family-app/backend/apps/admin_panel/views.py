from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.db import connection
from django.db.models import Q
from django.db.utils import OperationalError
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404

from apps.admin_panel.permissions import IsSuperAdmin
from apps.admin_panel.serializers import (
    UserListSerializer,
    UserActionSerializer,
    FamilyListSerializer,
    FamilyActionSerializer,
    ErrorLogSerializer,
    SystemErrorLogSerializer,
    AuditLogSerializer,
    FeedbackSerializer,
    FeedbackStatusSerializer,
    StatsSerializer
)
from apps.admin_panel.models import (
    AdminFamilyFlag,
    AuditLog,
    ErrorLog,
    Feedback,
    SystemErrorLog
)
from django.contrib.auth import get_user_model
from apps.families.models import Family, JoinRequest

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for admin panel"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class HealthCheckView(APIView):
    """Health check endpoint for admin panel"""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        """Check system health"""
        db_status = "ok"
        try:
            connection.ensure_connection()
        except OperationalError:
            db_status = "down"
        
        return Response({
            "status": "ok",
            "time": timezone.now().isoformat(),
            "db": db_status
        })


class StatsView(APIView):
    """Statistics endpoint for admin panel"""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        """Get system statistics"""
        days = int(request.query_params.get('days', 30))
        cutoff_date = timezone.now() - timedelta(days=days)
        last_24h = timezone.now() - timedelta(hours=24)
        last_7d = timezone.now() - timedelta(days=7)
        
        # User statistics
        users_total = User.objects.count()
        users_active_24h = User.objects.filter(last_login__gte=last_24h).count()
        users_active_7d = User.objects.filter(last_login__gte=last_7d).count()
        
        # Family statistics
        families_total = Family.objects.count()
        families_created_last_7d = Family.objects.filter(created_at__gte=last_7d).count()
        
        # Post statistics (optional app)
        posts_last_7d = 0
        try:
            from apps.feed.models import Post
            posts_last_7d = Post.objects.filter(created_at__gte=last_7d).count()
        except ImportError:
            pass
        
        # Join request statistics (optional app)
        join_requests_pending = 0
        try:
            join_requests_pending = JoinRequest.objects.filter(status=JoinRequest.Status.PENDING).count()
        except (ImportError, AttributeError):
            pass
        
        data = {
            'users_total': users_total,
            'users_active_24h': users_active_24h,
            'users_active_7d': users_active_7d,
            'families_total': families_total,
            'families_created_last_7d': families_created_last_7d,
            'posts_last_7d': posts_last_7d,
            'join_requests_pending': join_requests_pending
        }
        
        serializer = StatsSerializer(data)
        return Response(serializer.data)


class UserListView(ListAPIView):
    """List users with pagination and search"""
    permission_classes = [IsSuperAdmin]
    serializer_class = UserListSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # Search by query parameter
        query = self.request.query_params.get('q', '')
        if query:
            queryset = queryset.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query)
            )
        
        return queryset


class UserDisableView(APIView):
    """Disable a user"""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserActionSerializer(data=request.data)
        
        if serializer.is_valid():
            reason = serializer.validated_data.get('reason', '')
            user.is_active = False
            user.save()
            
            # Create audit log
            from apps.admin_panel.services.audit import log_action
            log_action(
                actor_user=request.user,
                action_type='USER_DISABLE',
                entity_type='User',
                entity_id=str(user.id),
                before={'is_active': True},
                after={'is_active': False},
                meta={'reason': reason} if reason else None
            )
            
            return Response({
                'message': 'User disabled successfully',
                'user_id': user.id
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserMakeSuperadminView(APIView):
    """Grant superadmin status to a user"""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        if user.is_superadmin:
            return Response({
                'message': 'User is already a superadmin'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_superadmin = True
        user.save()
        
        # Create audit log
        from apps.admin_panel.services.audit import log_action
        log_action(
            actor_user=request.user,
            action_type='USER_MAKE_SUPERADMIN',
            entity_type='User',
            entity_id=str(user.id),
            before={'is_superadmin': False},
            after={'is_superadmin': True}
        )
        
        return Response({
            'message': 'Superadmin status granted successfully',
            'user_id': user.id
        }, status=status.HTTP_200_OK)


class UserRevokeSuperadminView(APIView):
    """Revoke superadmin status from a user"""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        if not user.is_superadmin:
            return Response({
                'message': 'User is not a superadmin'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_superadmin = False
        user.save()
        
        # Create audit log
        from apps.admin_panel.services.audit import log_action
        log_action(
            actor_user=request.user,
            action_type='USER_REVOKE_SUPERADMIN',
            entity_type='User',
            entity_id=str(user.id),
            before={'is_superadmin': True},
            after={'is_superadmin': False}
        )
        
        return Response({
            'message': 'Superadmin status revoked successfully',
            'user_id': user.id
        }, status=status.HTTP_200_OK)


class UserSuperadminToggleView(APIView):
    """Toggle superadmin status for a user"""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        old_status = user.is_superadmin
        user.is_superadmin = not user.is_superadmin
        user.save()
        
        # Create audit log
        from apps.admin_panel.services.audit import log_action
        action_type = 'USER_MAKE_SUPERADMIN' if user.is_superadmin else 'USER_REVOKE_SUPERADMIN'
        log_action(
            actor_user=request.user,
            action_type=action_type,
            entity_type='User',
            entity_id=str(user.id),
            before={'is_superadmin': old_status},
            after={'is_superadmin': user.is_superadmin}
        )
        
        return Response({
            'message': f'Superadmin status {"granted" if user.is_superadmin else "revoked"} successfully',
            'user_id': user.id,
            'is_superadmin': user.is_superadmin
        }, status=status.HTTP_200_OK)


class FamilyListView(ListAPIView):
    """List families with pagination and search"""
    permission_classes = [IsSuperAdmin]
    serializer_class = FamilyListSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Family.objects.select_related('created_by').order_by('-created_at')
        
        # Search by query parameter
        query = self.request.query_params.get('q', '')
        if query:
            queryset = queryset.filter(name__icontains=query)
        
        return queryset


class FamilySuspendView(APIView):
    """Suspend a family"""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        family = get_object_or_404(Family, pk=pk)
        serializer = FamilyActionSerializer(data=request.data)
        
        if serializer.is_valid():
            reason = serializer.validated_data.get('reason', '')
            
            # Create or update AdminFamilyFlag
            flag, created = AdminFamilyFlag.objects.get_or_create(
                family=family,
                defaults={'suspended': True, 'reason': reason}
            )
            
            if not created:
                flag.suspended = True
                flag.reason = reason
                flag.save()
            
            # Create audit log
            from apps.admin_panel.services.audit import log_action
            log_action(
                actor_user=request.user,
                action_type='FAMILY_SUSPEND',
                entity_type='Family',
                entity_id=str(family.id),
                family_id=family.id,
                before={'suspended': False},
                after={'suspended': True},
                meta={'reason': reason} if reason else None
            )
            
            return Response({
                'message': 'Family suspended successfully',
                'family_id': family.id
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FamilyUnsuspendView(APIView):
    """Unsuspend a family"""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        family = get_object_or_404(Family, pk=pk)
        
        # Get or create AdminFamilyFlag
        flag, created = AdminFamilyFlag.objects.get_or_create(
            family=family,
            defaults={'suspended': False}
        )
        
        if not created and flag.suspended:
            flag.suspended = False
            flag.reason = ''
            flag.save()
        elif created:
            # Already not suspended, nothing to do
            pass
        
        # Create audit log
        from apps.admin_panel.services.audit import log_action
        log_action(
            actor_user=request.user,
            action_type='FAMILY_UNSUSPEND',
            entity_type='Family',
            entity_id=str(family.id),
            family_id=family.id,
            before={'suspended': True},
            after={'suspended': False}
        )
        
        return Response({
            'message': 'Family unsuspended successfully',
            'family_id': family.id
        }, status=status.HTTP_200_OK)


class ErrorLogsListView(ListAPIView):
    """List system error logs with pagination"""
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemErrorLogSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = SystemErrorLog.objects.all().order_by('-created_at')
        
        # Filter by query parameter (search in message)
        query = self.request.query_params.get('q', '')
        if query:
            queryset = queryset.filter(message__icontains=query)
        
        return queryset


class ErrorLogListView(ListAPIView):
    """List error logs with pagination and filtering"""
    permission_classes = [IsSuperAdmin]
    serializer_class = ErrorLogSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = ErrorLog.objects.select_related('user', 'family').order_by('-created_at')
        
        # Filter by query parameter (search in message)
        query = self.request.query_params.get('q', '')
        if query:
            queryset = queryset.filter(message__icontains=query)
        
        # Filter by since_hours
        since_hours = self.request.query_params.get('since_hours')
        if since_hours:
            try:
                hours = int(since_hours)
                cutoff = timezone.now() - timedelta(hours=hours)
                queryset = queryset.filter(created_at__gte=cutoff)
            except (ValueError, TypeError):
                pass
        
        return queryset


class ErrorLogDetailView(RetrieveAPIView):
    """Get single error log detail"""
    permission_classes = [IsSuperAdmin]
    serializer_class = ErrorLogSerializer
    queryset = ErrorLog.objects.all()


class AuditLogListView(ListAPIView):
    """List audit logs with pagination and filtering"""
    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = AuditLog.objects.all().order_by('-created_at')
        
        # Filter by action_type
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter by entity_type
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        # Filter by family_id
        family_id = self.request.query_params.get('family_id')
        if family_id:
            try:
                family_id = int(family_id)
                queryset = queryset.filter(family_id=family_id)
            except (ValueError, TypeError):
                pass
        
        return queryset


class FeedbackListView(ListAPIView):
    """List feedback with pagination and filtering"""
    permission_classes = [IsSuperAdmin]
    serializer_class = FeedbackSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Feedback.objects.all().order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        return queryset


class FeedbackStatusUpdateView(APIView):
    """Update feedback status"""
    permission_classes = [IsSuperAdmin]
    
    def patch(self, request, pk):
        feedback = get_object_or_404(Feedback, pk=pk)
        serializer = FeedbackStatusSerializer(data=request.data)
        
        if serializer.is_valid():
            feedback.status = serializer.validated_data['status']
            feedback.save()
            
            return Response({
                'message': 'Feedback status updated successfully',
                'feedback_id': feedback.id,
                'status': feedback.status
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
