"""
Admin Panel tests - Superadmin endpoints and permissions.
These tests verify that admin panel endpoints are properly protected.
"""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.admin_panel.models import AuditLog, AdminFamilyFlag
from apps.families.models import Family, FamilyMembership
from apps.graph.models import Person

User = get_user_model()


class TestAdminHealthEndpoint(TestCase):
    """Test the admin health check endpoint."""
    
    def setUp(self):
        self.client = APIClient()
        self.health_url = '/api/admin/health/'
    
    def test_health_endpoint_requires_authentication(self):
        """Test that unauthenticated users cannot access health endpoint."""
        response = self.client.get(self.health_url)
        assert response.status_code == 401  # Unauthorized
    
    def test_health_endpoint_requires_superadmin(self):
        """Test that regular users cannot access health endpoint."""
        # Create a regular user (not superadmin)
        user = User.objects.create_user(
            username='regularuser',
            password='testpass123',
            is_superadmin=False
        )
        
        # Authenticate as regular user
        self.client.force_authenticate(user=user)
        
        # Try to access health endpoint
        response = self.client.get(self.health_url)
        assert response.status_code == 403  # Forbidden
    
    def test_health_endpoint_allows_superadmin(self):
        """Test that superadmin users can access health endpoint."""
        # Create a superadmin user
        superadmin = User.objects.create_user(
            username='superadmin',
            password='testpass123',
            is_superadmin=True
        )
        
        # Authenticate as superadmin
        self.client.force_authenticate(user=superadmin)
        
        # Access health endpoint
        response = self.client.get(self.health_url)
        assert response.status_code == 200  # OK
        
        # Verify response structure
        data = response.json()
        assert 'status' in data
        assert 'time' in data
        assert 'db' in data
        assert data['status'] == 'ok'
        assert data['db'] in ['ok', 'down']
    
    def test_health_endpoint_db_check(self):
        """Test that health endpoint checks database connection."""
        # Create a superadmin user
        superadmin = User.objects.create_user(
            username='superadmin2',
            password='testpass123',
            is_superadmin=True
        )
        
        # Authenticate as superadmin
        self.client.force_authenticate(user=superadmin)
        
        # Access health endpoint
        response = self.client.get(self.health_url)
        assert response.status_code == 200
        
        # Database should be ok in normal test conditions
        data = response.json()
        assert data['db'] == 'ok'


class TestAdminPanelPermissions(TestCase):
    """Test that all admin panel endpoints require superadmin."""
    
    def setUp(self):
        self.client = APIClient()
        self.regular_user = User.objects.create_user(
            username='regularuser',
            password='testpass123',
            is_superadmin=False
        )
        self.superadmin = User.objects.create_user(
            username='superadmin',
            password='testpass123',
            is_superadmin=True
        )
    
    def test_stats_endpoint_requires_superadmin(self):
        """Test that stats endpoint requires superadmin."""
        # Regular user should be blocked
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/admin/stats/')
        assert response.status_code == 403
        
        # Superadmin should have access
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get('/api/admin/stats/')
        assert response.status_code == 200
    
    def test_users_list_requires_superadmin(self):
        """Test that users list endpoint requires superadmin."""
        # Regular user should be blocked
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/admin/users/')
        assert response.status_code == 403
        
        # Superadmin should have access
        self.client.force_authenticate(user=self.superadmin)
        response = self.client.get('/api/admin/users/')
        assert response.status_code == 200


class TestAdminHealthRequiresSuperadmin(TestCase):
    """Test admin health endpoint requires superadmin."""
    
    def setUp(self):
        self.client = APIClient()
        self.health_url = '/api/admin/health/'
    
    def test_admin_health_requires_superadmin(self):
        """Test that normal user gets 403 and superadmin gets 200."""
        # Create a normal user (not superadmin)
        normal_user = User.objects.create_user(
            username='normaluser',
            password='testpass123',
            is_superadmin=False
        )
        
        # Normal user should get 403
        self.client.force_authenticate(user=normal_user)
        response = self.client.get(self.health_url)
        assert response.status_code == 403
        
        # Create a superadmin user
        superadmin = User.objects.create_user(
            username='superadmin',
            password='testpass123',
            is_superadmin=True
        )
        
        # Superadmin should get 200
        self.client.force_authenticate(user=superadmin)
        response = self.client.get(self.health_url)
        assert response.status_code == 200
        data = response.json()
        assert 'status' in data
        assert data['status'] == 'ok'


class TestUserDisableAuditLog(TestCase):
    """Test that user disable creates audit log."""
    
    def setUp(self):
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            username='superadmin',
            password='testpass123',
            is_superadmin=True
        )
        self.target_user = User.objects.create_user(
            username='targetuser',
            password='testpass123',
            is_superadmin=False,
            is_active=True
        )
    
    def test_user_disable_writes_audit_log(self):
        """Test that superadmin disabling a user creates AuditLog with action_type USER_DISABLE."""
        # Authenticate as superadmin
        self.client.force_authenticate(user=self.superadmin)
        
        # Verify user is active before
        assert self.target_user.is_active is True
        
        # Count audit logs before
        audit_logs_before = AuditLog.objects.filter(
            action_type='USER_DISABLE',
            entity_id=str(self.target_user.id)
        ).count()
        
        # Disable the user
        response = self.client.post(
            f'/api/admin/users/{self.target_user.id}/disable/',
            {'reason': 'Test suspension'},
            format='json'
        )
        assert response.status_code == 200
        
        # Verify user is now inactive
        self.target_user.refresh_from_db()
        assert self.target_user.is_active is False
        
        # Verify audit log was created
        audit_logs_after = AuditLog.objects.filter(
            action_type='USER_DISABLE',
            entity_id=str(self.target_user.id)
        )
        assert audit_logs_after.count() == audit_logs_before + 1
        
        # Verify audit log details
        audit_log = audit_logs_after.first()
        assert audit_log.action_type == 'USER_DISABLE'
        assert audit_log.entity_type == 'User'
        assert audit_log.entity_id == str(self.target_user.id)
        assert audit_log.actor_user_id == self.superadmin.id
        assert audit_log.actor_is_superadmin is True
        assert audit_log.before == {'is_active': True}
        assert audit_log.after == {'is_active': False}
        assert audit_log.meta == {'reason': 'Test suspension'}


class TestFamilySuspendBlocksMemberAccess(TestCase):
    """Test that suspended families block member access to feed."""
    
    def setUp(self):
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            username='superadmin',
            password='testpass123',
            is_superadmin=True
        )
        self.member_user = User.objects.create_user(
            username='memberuser',
            password='testpass123',
            is_superadmin=False
        )
        # Create family
        self.family = Family.objects.create(
            name='Test Family',
            created_by=self.member_user
        )
        # Create person for member
        self.person = Person.objects.create(
            family=self.family,
            first_name='Member',
            last_name='User',
            gender='MALE'
        )
        # Create membership
        self.membership = FamilyMembership.objects.create(
            user=self.member_user,
            family=self.family,
            person=self.person,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        )
    
    def test_family_suspend_blocks_member_access(self):
        """Test that when superadmin suspends a family, member cannot access feed.
        
        This test verifies SA2E implementation: when a family is suspended,
        members should be blocked from accessing the feed (403).
        If SA2E is not implemented, this test will fail until the feed endpoint
        checks for suspended families.
        """
        # First, verify member can access feed before suspension
        self.client.force_authenticate(user=self.member_user)
        response = self.client.get(f'/api/feed/?family_id={self.family.id}')
        # Should succeed (200) before suspension
        assert response.status_code == 200, "Member should be able to access feed before suspension"
        
        # Now suspend the family as superadmin
        self.client.force_authenticate(user=self.superadmin)
        suspend_response = self.client.post(
            f'/api/admin/families/{self.family.id}/suspend/',
            {'reason': 'Test suspension'},
            format='json'
        )
        assert suspend_response.status_code == 200
        
        # Verify AdminFamilyFlag was created/updated
        flag = AdminFamilyFlag.objects.get(family=self.family)
        assert flag.suspended is True
        
        # Now try to access feed as member - should get 403 if SA2E is implemented
        self.client.force_authenticate(user=self.member_user)
        feed_response = self.client.get(f'/api/feed/?family_id={self.family.id}')
        
        # SA2E requirement: feed should return 403 for suspended families
        # This test will fail until SA2E is implemented in the feed endpoint
        assert feed_response.status_code == 403, \
            "SA2E not implemented: Feed endpoint should return 403 for suspended families. " \
            "The feed endpoint needs to check AdminFamilyFlag.suspended before allowing access."
