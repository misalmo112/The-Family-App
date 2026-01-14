"""
Tests for account module - registration, profile management, and password change.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.graph.models import GenderChoices

User = get_user_model()


# ==================== Registration Tests ====================

@pytest.mark.django_db
def test_register_success(api_client):
    """Test successful user registration with all fields"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'dob': '1990-01-15',
            'gender': 'MALE'
        },
        format='json'
    )
    assert response.status_code == 201
    data = response.json()
    assert 'user' in data
    assert 'tokens' in data
    assert data['user']['username'] == 'newuser'
    assert data['user']['email'] == 'newuser@example.com'
    assert data['user']['first_name'] == 'John'
    assert data['user']['last_name'] == 'Doe'
    assert data['user']['dob'] == '1990-01-15'
    assert data['user']['gender'] == 'MALE'
    assert 'access' in data['tokens']
    assert 'refresh' in data['tokens']
    
    # Verify user was created in database
    user = User.objects.get(username='newuser')
    assert user.email == 'newuser@example.com'
    assert user.first_name == 'John'
    assert user.check_password('SecurePass123!')


@pytest.mark.django_db
def test_register_minimal_fields(api_client):
    """Test registration with only required fields"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'minimaluser',
            'email': 'minimal@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 201
    data = response.json()
    assert data['user']['username'] == 'minimaluser'
    assert data['user']['email'] == 'minimal@example.com'
    assert data['user']['gender'] == GenderChoices.UNKNOWN  # Default value


@pytest.mark.django_db
def test_register_password_mismatch(api_client):
    """Test registration with mismatched passwords"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'mismatchuser',
            'email': 'mismatch@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass123!'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'password_confirm' in response.json()


@pytest.mark.django_db
def test_register_duplicate_email(api_client):
    """Test registration with duplicate email"""
    # Create first user
    User.objects.create_user(
        username='existing',
        email='duplicate@example.com',
        password='pass123'
    )
    
    # Try to register with same email
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'newuser',
            'email': 'duplicate@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'email' in response.json()


@pytest.mark.django_db
def test_register_duplicate_username(api_client):
    """Test registration with duplicate username"""
    # Create first user
    User.objects.create_user(
        username='existing',
        email='existing@example.com',
        password='pass123'
    )
    
    # Try to register with same username
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'existing',
            'email': 'newemail@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 400
    # Django's default behavior may return different error format
    assert 'username' in response.json() or 'non_field_errors' in response.json()


@pytest.mark.django_db
def test_register_weak_password(api_client):
    """Test registration with weak password"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'weakpass',
            'email': 'weak@example.com',
            'password': '123',  # Too short
            'password_confirm': '123'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'password' in response.json()


@pytest.mark.django_db
def test_register_returns_tokens(api_client):
    """Test that registration returns JWT tokens"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'tokenuser',
            'email': 'token@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 201
    data = response.json()
    assert 'tokens' in data
    assert 'access' in data['tokens']
    assert 'refresh' in data['tokens']
    assert len(data['tokens']['access']) > 0
    assert len(data['tokens']['refresh']) > 0


@pytest.mark.django_db
def test_register_optional_fields(api_client):
    """Test registration with optional fields"""
    response = api_client.post(
        '/api/auth/register/',
        {
            'username': 'optionaluser',
            'email': 'optional@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'dob': '1992-05-20',
            'gender': 'FEMALE'
        },
        format='json'
    )
    assert response.status_code == 201
    data = response.json()
    assert data['user']['first_name'] == 'Jane'
    assert data['user']['last_name'] == 'Smith'
    assert data['user']['dob'] == '1992-05-20'
    assert data['user']['gender'] == 'FEMALE'


# ==================== Profile Read Tests ====================

@pytest.mark.django_db
def test_profile_get_success(api_client, user):
    """Test GET /api/auth/me/ returns user profile"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Get profile
    response = api_client.get('/api/auth/me/')
    assert response.status_code == 200
    data = response.json()
    assert data['username'] == 'testuser'
    assert 'id' in data
    assert 'email' in data
    assert 'date_joined' in data


@pytest.mark.django_db
def test_profile_get_requires_auth(api_client):
    """Test that GET /api/auth/me/ requires authentication"""
    response = api_client.get('/api/auth/me/')
    assert response.status_code == 401


@pytest.mark.django_db
def test_profile_get_returns_all_fields(api_client):
    """Test that GET /api/auth/me/ returns all expected fields"""
    # Create user with all fields
    user = User.objects.create_user(
        username='fulluser',
        email='full@example.com',
        password='pass123',
        first_name='Full',
        last_name='User',
        dob='1985-03-15',
        gender=GenderChoices.MALE
    )
    
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'fulluser', 'password': 'pass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Get profile
    response = api_client.get('/api/auth/me/')
    assert response.status_code == 200
    data = response.json()
    expected_fields = ['id', 'username', 'email', 'first_name', 'last_name', 'dob', 'gender', 'date_joined']
    for field in expected_fields:
        assert field in data, f'Field {field} missing from response'
    assert data['first_name'] == 'Full'
    assert data['last_name'] == 'User'
    assert data['dob'] == '1985-03-15'
    assert data['gender'] == 'MALE'


# ==================== Profile Update Tests ====================

@pytest.mark.django_db
def test_profile_update_success(api_client, user):
    """Test PATCH /api/auth/me/ updates profile"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Update profile
    response = api_client.patch(
        '/api/auth/me/',
        {
            'first_name': 'Updated',
            'last_name': 'Name',
            'email': 'updated@example.com',
            'dob': '1990-01-01',
            'gender': 'FEMALE'
        },
        format='json'
    )
    assert response.status_code == 200
    data = response.json()
    assert data['first_name'] == 'Updated'
    assert data['last_name'] == 'Name'
    assert data['email'] == 'updated@example.com'
    assert data['dob'] == '1990-01-01'
    assert data['gender'] == 'FEMALE'
    
    # Verify in database
    user.refresh_from_db()
    assert user.first_name == 'Updated'
    assert user.email == 'updated@example.com'


@pytest.mark.django_db
def test_profile_update_partial(api_client, user):
    """Test partial profile update (only some fields)"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Update only first_name
    response = api_client.patch(
        '/api/auth/me/',
        {'first_name': 'Partial'},
        format='json'
    )
    assert response.status_code == 200
    data = response.json()
    assert data['first_name'] == 'Partial'
    # Other fields should remain unchanged
    assert 'email' in data


@pytest.mark.django_db
def test_profile_update_email_duplicate(api_client):
    """Test profile update with email already taken by another user"""
    # Create two users
    user1 = User.objects.create_user(
        username='user1',
        email='user1@example.com',
        password='pass123'
    )
    user2 = User.objects.create_user(
        username='user2',
        email='user2@example.com',
        password='pass123'
    )
    
    # Get token for user1
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'user1', 'password': 'pass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to update user1's email to user2's email
    response = api_client.patch(
        '/api/auth/me/',
        {'email': 'user2@example.com'},
        format='json'
    )
    assert response.status_code == 400
    assert 'email' in response.json()


@pytest.mark.django_db
def test_profile_update_readonly_fields(api_client, user):
    """Test that username and date_joined cannot be updated"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    original_username = user.username
    original_date_joined = user.date_joined
    
    # Try to update readonly fields
    response = api_client.patch(
        '/api/auth/me/',
        {
            'username': 'newusername',
            'date_joined': '2020-01-01T00:00:00Z'
        },
        format='json'
    )
    # Should succeed but ignore readonly fields
    assert response.status_code == 200
    
    # Verify fields weren't changed
    user.refresh_from_db()
    assert user.username == original_username
    assert user.date_joined == original_date_joined


@pytest.mark.django_db
def test_profile_update_requires_auth(api_client):
    """Test that PATCH /api/auth/me/ requires authentication"""
    response = api_client.patch(
        '/api/auth/me/',
        {'first_name': 'Test'},
        format='json'
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_profile_update_invalid_gender(api_client, user):
    """Test profile update with invalid gender value"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to update with invalid gender
    response = api_client.patch(
        '/api/auth/me/',
        {'gender': 'INVALID_GENDER'},
        format='json'
    )
    assert response.status_code == 400
    assert 'gender' in response.json()


@pytest.mark.django_db
def test_profile_update_invalid_date(api_client, user):
    """Test profile update with invalid date format"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to update with invalid date format
    response = api_client.patch(
        '/api/auth/me/',
        {'dob': 'not-a-date'},
        format='json'
    )
    assert response.status_code == 400
    assert 'dob' in response.json()


# ==================== Password Change Tests ====================

@pytest.mark.django_db
def test_password_change_success(api_client, user):
    """Test successful password change"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Change password
    response = api_client.post(
        '/api/auth/change-password/',
        {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass123!',
            'new_password_confirm': 'NewSecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 200
    assert 'message' in response.json()
    
    # Verify new password works
    user.refresh_from_db()
    assert user.check_password('NewSecurePass123!')
    assert not user.check_password('testpass123')


@pytest.mark.django_db
def test_password_change_wrong_old_password(api_client, user):
    """Test password change with incorrect old password"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to change password with wrong old password
    response = api_client.post(
        '/api/auth/change-password/',
        {
            'old_password': 'wrongpassword',
            'new_password': 'NewSecurePass123!',
            'new_password_confirm': 'NewSecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'old_password' in response.json()


@pytest.mark.django_db
def test_password_change_password_mismatch(api_client, user):
    """Test password change with mismatched new passwords"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to change password with mismatched confirm
    response = api_client.post(
        '/api/auth/change-password/',
        {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass123!',
            'new_password_confirm': 'DifferentPass123!'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'new_password_confirm' in response.json()


@pytest.mark.django_db
def test_password_change_weak_password(api_client, user):
    """Test password change with weak new password"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to change password with weak password
    response = api_client.post(
        '/api/auth/change-password/',
        {
            'old_password': 'testpass123',
            'new_password': '123',  # Too short
            'new_password_confirm': '123'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'new_password' in response.json()


@pytest.mark.django_db
def test_password_change_requires_auth(api_client):
    """Test that POST /api/auth/change-password/ requires authentication"""
    response = api_client.post(
        '/api/auth/change-password/',
        {
            'old_password': 'old',
            'new_password': 'new',
            'new_password_confirm': 'new'
        },
        format='json'
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_password_change_old_password_required(api_client, user):
    """Test that old password is required"""
    # Get token
    token_response = api_client.post(
        '/api/auth/token/',
        {'username': 'testuser', 'password': 'testpass123'},
        format='json'
    )
    token = token_response.json()['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Try to change password without old password
    response = api_client.post(
        '/api/auth/change-password/',
        {
            'new_password': 'NewSecurePass123!',
            'new_password_confirm': 'NewSecurePass123!'
        },
        format='json'
    )
    assert response.status_code == 400
    assert 'old_password' in response.json()
