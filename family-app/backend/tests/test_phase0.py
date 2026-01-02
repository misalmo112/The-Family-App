"""
Phase 0 tests - Basic setup verification tests.
These tests verify that the Django project is properly configured.
"""
import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class TestHealthEndpoint(TestCase):
    """Test the health check endpoint."""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_health_endpoint_returns_ok(self):
        """Test that GET /health/ returns {"status": "ok"}."""
        response = self.client.get('/health/')
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestDatabaseConnection(TestCase):
    """Test that database connection works."""
    
    def test_database_is_accessible(self):
        """Test that we can query the database."""
        # Try to get user count (should work even if table is empty)
        user_count = User.objects.count()
        assert isinstance(user_count, int)


class TestJWTEndpoints(TestCase):
    """Test JWT authentication endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        # Create a test user
        self.username = 'testuser'
        self.password = 'testpass123'
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password
        )
    
    def test_token_obtain_endpoint_exists(self):
        """Test that token obtain endpoint exists and accepts requests."""
        response = self.client.post(
            '/api/auth/token/',
            {'username': self.username, 'password': self.password},
            format='json'
        )
        assert response.status_code == 200
        assert 'access' in response.json()
        assert 'refresh' in response.json()
    
    def test_token_refresh_endpoint_exists(self):
        """Test that token refresh endpoint exists."""
        # First get a token
        token_response = self.client.post(
            '/api/auth/token/',
            {'username': self.username, 'password': self.password},
            format='json'
        )
        refresh_token = token_response.json()['refresh']
        
        # Then refresh it
        response = self.client.post(
            '/api/auth/token/refresh/',
            {'refresh': refresh_token},
            format='json'
        )
        assert response.status_code == 200
        assert 'access' in response.json()

