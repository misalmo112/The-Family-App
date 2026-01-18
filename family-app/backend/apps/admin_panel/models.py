from django.conf import settings
from django.db import models


class ErrorLevelChoices(models.TextChoices):
    ERROR = 'ERROR', 'Error'
    WARN = 'WARN', 'Warning'


class FeedbackTypeChoices(models.TextChoices):
    BUG = 'BUG', 'Bug'
    FEATURE = 'FEATURE', 'Feature'
    ABUSE = 'ABUSE', 'Abuse'
    GENERAL = 'GENERAL', 'General'


class FeedbackStatusChoices(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    REVIEWED = 'REVIEWED', 'Reviewed'
    RESOLVED = 'RESOLVED', 'Resolved'
    CLOSED = 'CLOSED', 'Closed'


class SystemErrorLog(models.Model):
    """System error and warning logs"""
    created_at = models.DateTimeField(auto_now_add=True)
    level = models.CharField(
        max_length=10,
        choices=ErrorLevelChoices.choices
    )
    message = models.CharField(max_length=255)
    traceback = models.TextField(null=True, blank=True)
    endpoint = models.CharField(max_length=255, null=True, blank=True)
    method = models.CharField(max_length=10, null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    user_id = models.IntegerField(null=True, blank=True)
    family_id = models.IntegerField(null=True, blank=True)
    request_id = models.CharField(max_length=64, null=True, blank=True)
    payload_sanitized = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'admin_panel_systemerrorlog'

    def __str__(self):
        return f"{self.level}: {self.message[:50]}"


class AuditLog(models.Model):
    """Audit trail for system actions"""
    created_at = models.DateTimeField(auto_now_add=True)
    actor_user_id = models.IntegerField(null=True, blank=True)
    actor_is_superadmin = models.BooleanField(default=False)
    action_type = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    family_id = models.IntegerField(null=True, blank=True)
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    meta = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'admin_panel_auditlog'

    def __str__(self):
        return f"{self.action_type} on {self.entity_type}:{self.entity_id}"


class Feedback(models.Model):
    """User feedback submissions"""
    created_at = models.DateTimeField(auto_now_add=True)
    user_id = models.IntegerField(null=True, blank=True)
    family_id = models.IntegerField(null=True, blank=True)
    type = models.CharField(
        max_length=20,
        choices=FeedbackTypeChoices.choices
    )
    title = models.CharField(max_length=120)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=FeedbackStatusChoices.choices,
        default=FeedbackStatusChoices.PENDING
    )
    page = models.CharField(max_length=120, null=True, blank=True)
    meta = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'admin_panel_feedback'

    def __str__(self):
        return f"{self.type}: {self.title}"


class AdminFamilyFlag(models.Model):
    """Admin flags for families (e.g., suspension)"""
    family = models.OneToOneField(
        'families.Family',
        on_delete=models.CASCADE,
        related_name='admin_flags'
    )
    suspended = models.BooleanField(default=False)
    reason = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_panel_adminfamilyflag'
        ordering = ['-updated_at']

    def __str__(self):
        return f"Family {self.family_id}: {'Suspended' if self.suspended else 'Active'}"


class ErrorLog(models.Model):
    """Error logs for admin panel"""
    error_type = models.CharField(max_length=100)
    message = models.TextField()
    traceback = models.TextField(blank=True)
    path = models.CharField(max_length=500, blank=True)
    method = models.CharField(max_length=10, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='error_logs'
    )
    family = models.ForeignKey(
        'families.Family',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='error_logs'
    )
    request_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_panel_errorlog'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.error_type}: {self.message[:50]}"
