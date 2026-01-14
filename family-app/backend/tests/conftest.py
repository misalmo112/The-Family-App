"""
Pytest configuration and fixtures for Django tests.
"""
import pytest
import django
from django.conf import settings
from django.test.utils import get_runner
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

if not settings.configured:
    django.setup()


@pytest.fixture(scope='session')
def django_db_setup():
    """Configure test database."""
    pass


@pytest.fixture
def api_client():
    """Return an APIClient instance for making API requests."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create and return a test user."""
    User = get_user_model()
    return User.objects.create_user(
        username='testuser',
        email='testuser@example.com',
        password='testpass123'
    )

