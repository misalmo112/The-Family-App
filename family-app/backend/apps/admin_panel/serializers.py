from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.families.models import Family, FamilyMembership
from apps.admin_panel.models import (
    AdminFamilyFlag,
    AuditLog,
    ErrorLog,
    Feedback,
    FeedbackStatusChoices,
    SystemErrorLog
)

User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list in admin panel"""
    families_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'is_active', 'is_superadmin',
            'date_joined', 'last_login', 'families_count'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'families_count']
    
    def get_families_count(self, obj):
        """Count families the user belongs to"""
        return FamilyMembership.objects.filter(user=obj).count()


class UserActionSerializer(serializers.Serializer):
    """Serializer for user actions (disable, etc.)"""
    reason = serializers.CharField(required=False, allow_blank=True)


class FamilyListSerializer(serializers.ModelSerializer):
    """Serializer for family list in admin panel"""
    created_by_user_id = serializers.IntegerField(source='created_by.id', read_only=True)
    member_count = serializers.SerializerMethodField()
    suspended = serializers.SerializerMethodField()
    
    class Meta:
        model = Family
        fields = [
            'id', 'name', 'created_at', 'created_by_user_id',
            'member_count', 'suspended'
        ]
        read_only_fields = ['id', 'created_at', 'created_by_user_id', 'member_count', 'suspended']
    
    def get_member_count(self, obj):
        """Count active members in the family"""
        return FamilyMembership.objects.filter(family=obj, status=FamilyMembership.Status.ACTIVE).count()
    
    def get_suspended(self, obj):
        """Check if family is suspended"""
        try:
            flag = AdminFamilyFlag.objects.get(family=obj)
            return flag.suspended
        except AdminFamilyFlag.DoesNotExist:
            return False


class FamilyActionSerializer(serializers.Serializer):
    """Serializer for family actions (suspend, unsuspend)"""
    reason = serializers.CharField(required=False, allow_blank=True)


class ErrorLogSerializer(serializers.ModelSerializer):
    """Serializer for error logs"""
    user_id = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    family_id = serializers.IntegerField(source='family.id', read_only=True, allow_null=True)
    
    class Meta:
        model = ErrorLog
        fields = [
            'id', 'error_type', 'message', 'traceback', 'path', 'method',
            'user_id', 'family_id', 'request_data', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SystemErrorLogSerializer(serializers.ModelSerializer):
    """Serializer for system error logs"""
    
    class Meta:
        model = SystemErrorLog
        fields = [
            'id', 'created_at', 'level', 'message', 'endpoint',
            'status_code', 'traceback', 'payload_sanitized'
        ]
        read_only_fields = ['id', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    user_id = serializers.IntegerField(source='actor_user_id', read_only=True, allow_null=True)
    entity_id = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    changes = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_id', 'action_type', 'entity_type', 'entity_id',
            'family_id', 'changes', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_entity_id(self, obj):
        """Convert entity_id string to integer if possible"""
        try:
            return int(obj.entity_id)
        except (ValueError, TypeError):
            return obj.entity_id
    
    def get_changes(self, obj):
        """Combine before and after into changes dict"""
        changes = {}
        if obj.before:
            changes['before'] = obj.before
        if obj.after:
            changes['after'] = obj.after
        if obj.meta:
            changes['meta'] = obj.meta
        return changes


class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for feedback"""
    user_id = serializers.IntegerField(read_only=True, allow_null=True)
    subject = serializers.CharField(source='title', read_only=True)
    message = serializers.CharField(source='description', read_only=True)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'user_id', 'type', 'subject', 'message', 'status',
            'created_at', 'page'
        ]
        read_only_fields = ['id', 'created_at']


class FeedbackStatusSerializer(serializers.Serializer):
    """Serializer for feedback status updates"""
    status = serializers.ChoiceField(choices=FeedbackStatusChoices.choices)


class StatsSerializer(serializers.Serializer):
    """Serializer for statistics response"""
    users_total = serializers.IntegerField()
    users_active_24h = serializers.IntegerField()
    users_active_7d = serializers.IntegerField()
    families_total = serializers.IntegerField()
    families_created_last_7d = serializers.IntegerField()
    posts_last_7d = serializers.IntegerField()
    join_requests_pending = serializers.IntegerField()
