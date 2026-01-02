import uuid
from django.conf import settings
from django.db import models


class Family(models.Model):
    """Family group model"""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=8, unique=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_families'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Families'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._generate_unique_code()
        super().save(*args, **kwargs)

    def _generate_unique_code(self):
        """Generate a unique 8-character hex code"""
        while True:
            code = uuid.uuid4().hex[:8].upper()
            if not Family.objects.filter(code=code).exists():
                return code

    def __str__(self):
        return f"{self.name} ({self.code})"


class FamilyMembership(models.Model):
    """Membership relationship between user and family"""
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MEMBER = 'MEMBER', 'Member'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='family_memberships'
    )
    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    person = models.ForeignKey(
        'graph.Person',
        on_delete=models.CASCADE,
        related_name='family_memberships'
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'family')]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.family.name} ({self.role})"


class JoinRequest(models.Model):
    """Request to join a family"""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='join_requests'
    )
    chosen_person = models.ForeignKey(
        'graph.Person',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='join_requests'
    )
    new_person_payload = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_join_requests',
        related_query_name='reviewed_join_request'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Join request by {self.requested_by.username} for {self.family.name} ({self.status})"
