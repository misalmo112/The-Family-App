---
name: Multi-Tenant System Implementation
overview: Implement a complete multi-tenant system using Organization as tenant boundary, with tenant context enforcement, RBAC integration, audit logging, and superadmin console. Organization serves as tenant (no separate Tenant model), users have direct organization_id + optional branch_id with validation.
todos:
  - id: db_user_org
    content: Add organization_id to UserRole model with validation (branch.organization_id == user.organization_id)
    status: completed
  - id: db_idbase_org
    content: Add organization_id to IDBaseModel (tenant isolation for business entities)
    status: completed
  - id: db_audit_model
    content: Create AuditLog model with action types (CRUD, auth, roles, approvals, documents, impersonation)
    status: completed
  - id: db_migrations
    content: Create and run migrations for schema changes
    status: completed
  - id: phase1_tests
    content: Create Phase 1 tests (test_phase1_models.py) and ensure 100% pass
    status: completed
  - id: tenant_context_util
    content: Create TenantContext utility class for tenant filtering and validation
    status: completed
  - id: tenant_queryset_mixin
    content: Create TenantFilteredQuerySet mixin for automatic tenant filtering
    status: cancelled
  - id: update_views_tenant_filter
    content: Update all views to enforce tenant filtering in get_queryset()
    status: completed
  - id: phase2_tests
    content: Create Phase 2 tests (test_phase2_tenant_filtering.py) and ensure 100% pass
    status: completed
  - id: rbac_wire_branch
    content: Wire RBAC permission checks to Branch CRUD endpoints
    status: completed
  - id: rbac_wire_users
    content: Wire RBAC permission checks to User CRUD endpoints
    status: completed
  - id: rbac_wire_org
    content: Wire RBAC permission checks to Organization endpoints
    status: completed
  - id: phase3_tests
    content: Create Phase 3 tests (test_phase3_rbac.py) and ensure 100% pass
    status: completed
  - id: user_invite_model
    content: Create UserInvite model for invitation system
    status: completed
  - id: user_invite_apis
    content: Create user invite APIs (create, accept, list)
    status: completed
  - id: user_creation_branch_role
    content: Update user creation to support branch+role assignment
    status: completed
  - id: phase4_tests
    content: Create Phase 4 tests (test_phase4_user_invite.py) and ensure 100% pass
    status: completed
  - id: audit_service
    content: Create AuditService for logging actions
    status: completed
  - id: audit_signals
    content: Add Django signals for automatic CRUD audit logging
    status: completed
  - id: audit_auth_events
    content: Add audit logging to auth views (login, logout, token refresh)
    status: completed
  - id: audit_role_changes
    content: Add audit logging to role assignment/removal
    status: completed
  - id: audit_api
    content: Create audit log API endpoint with filtering
    status: completed
  - id: phase5_tests
    content: Create Phase 5 tests (test_phase5_audit_logging.py) and ensure 100% pass
    status: completed
  - id: superadmin_tenant_list
    content: Create superadmin tenant list API
    status: completed
  - id: impersonation_model
    content: Create ImpersonationSession model
    status: completed
  - id: impersonation_apis
    content: Create impersonation start/stop APIs
    status: completed
  - id: jwt_impersonation
    content: Update JWT token to include impersonation context
    status: completed
  - id: phase6_tests
    content: Create Phase 6 tests (test_phase6_superadmin.py) and ensure 100% pass
    status: completed
  - id: frontend_tenant_ui
    content: Create tenant management UI pages
    status: completed
  - id: frontend_branch_ui
    content: Create branch management UI pages
    status: completed
  - id: frontend_user_invite_ui
    content: Create user invite/creation UI
    status: completed
  - id: frontend_superadmin_ui
    content: Create superadmin console UI (tenant list + impersonate)
    status: completed
  - id: frontend_audit_ui
    content: Create audit log viewer UI
    status: completed
  - id: frontend_auth_context
    content: Update AuthContext to include organization and impersonation state
    status: completed
  - id: phase7_tests
    content: Complete Phase 7 manual testing checklist and ensure 100% pass
    status: completed
  - id: phase8_tests
    content: Create Phase 8 integration tests and ensure 100% pass
    status: completed
---

# Multi-Tenant System Implementation Plan

## Architecture Overview

**Tenant Model**: Organization IS the tenant (no separate Tenant model)

- `User.organization_id` (required) - primary tenant boundary
- `User.branch_id` (optional) - secondary scope
- `Branch.organization_id` (required) - must match user's organization
- All business records: `organization_id` for tenant isolation
- Platform-level tables: global (no organization_id)

**Validation Rule**: `user.branch.organization_id == user.organization_id` (enforced in model clean/serializer)

## Phase 1: Database Schema & Models

### 1.1 Update User Model

**File**: `InteriorDesign/user_accounts/models.py`

- Add `organization = models.ForeignKey(Organization, ...)` (required, non-null)
- Keep `branch = models.ForeignKey(Branch, ...)` (optional)
- Add `clean()` method to validate: `if self.branch and self.branch.organization_id != self.organization_id: raise ValidationError`
- Add helper method: `get_tenant_organization()` returns `self.organization`

### 1.2 Add Organization ID to IDBaseModel

**File**: `InteriorDesign/model_base_class/IDBaseModel.py`

- Add `organization = models.ForeignKey('company_management.Organization', ...)` (nullable for platform-level models)
- Add class variable `TENANT_ISOLATED = True` (default True, can override per model)
- Models that should NOT have organization_id: Role, Permission (platform-level)

### 1.3 Create Audit Log Model

**File**: `InteriorDesign/user_accounts/models.py` (or new `audit/models.py`)

```python
class AuditLog(models.Model):
    ACTION_TYPES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('TOKEN_REFRESH', 'Token Refresh'),
        ('ROLE_ASSIGN', 'Role Assigned'),
        ('ROLE_REMOVE', 'Role Removed'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('SUBMIT', 'Submit'),
        ('DELEGATE', 'Delegate'),
        ('DOC_UPLOAD', 'Document Upload'),
        ('DOC_DOWNLOAD', 'Document Download'),
        ('DOC_DELETE', 'Document Delete'),
        ('DOC_VERSION', 'Document Version'),
        ('IMPERSONATE_START', 'Impersonation Start'),
        ('IMPERSONATE_STOP', 'Impersonation Stop'),
    ]
    user = ForeignKey(UserRole)
    organization = ForeignKey(Organization)  # tenant context
    action_type = CharField(choices=ACTION_TYPES)
    model_name = CharField()  # e.g., 'UserRole', 'Branch'
    object_id = BigIntegerField(null=True)
    object_repr = CharField()  # str(obj)
    changes = JSONField()  # before/after for updates
    ip_address = GenericIPAddressField()
    user_agent = TextField()
    timestamp = DateTimeField(auto_now_add=True)
```

### 1.4 Create Migrations

- Migration: Add `organization_id` to UserRole
- Migration: Add `organization_id` to IDBaseModel (affects all child models)
- Migration: Create AuditLog table
- Data migration: Assign existing users to organizations (or require manual assignment)

### 1.5 Phase 1 Testing

**File**: `InteriorDesign/Test/Phase1_Test/test_phase1_models.py` (NEW)

**Test Requirements** (100% pass required before Phase 2):

```python
@pytest.mark.django_db
class TestPhase1Models:
    """Test Phase 1: Database Schema & Models"""
    
    def test_user_has_organization_field(self):
        """Test UserRole model has organization field"""
        assert hasattr(UserRole, 'organization')
        # Test field is required
        user = UserRole(email='test@example.com')
        with pytest.raises(Exception):  # Should fail validation
            user.full_clean()
    
    def test_user_organization_validation(self):
        """Test branch.organization_id == user.organization_id validation"""
        org1 = Organization.objects.create(...)
        org2 = Organization.objects.create(...)
        branch = Branch.objects.create(organization=org1, ...)
        user = UserRole(email='test@example.com', organization=org2, branch=branch)
        with pytest.raises(ValidationError):
            user.clean()
    
    def test_idbase_model_has_organization(self):
        """Test IDBaseModel has organization field"""
        # Test on a child model (e.g., Branch)
        assert hasattr(Branch, 'organization')
    
    def test_audit_log_model_created(self):
        """Test AuditLog model exists and has required fields"""
        from user_accounts.models import AuditLog
        assert hasattr(AuditLog, 'user')
        assert hasattr(AuditLog, 'organization')
        assert hasattr(AuditLog, 'action_type')
        assert hasattr(AuditLog, 'model_name')
        assert hasattr(AuditLog, 'timestamp')
    
    def test_migrations_applied(self):
        """Test all migrations have been applied"""
        from django.db import connection
        tables = connection.introspection.table_names()
        assert 'user_profile' in tables
        assert 'audit_log' in tables
        # Check organization_id column exists
        columns = [col.name for col in connection.introspection.get_table_description(connection.cursor(), 'user_profile')]
        assert 'organization_id' in columns
```

**Run Tests**:

```bash
pytest InteriorDesign/Test/Phase1_Test/test_phase1_models.py -v
# Must pass 100% before proceeding to Phase 2
```

**Test Coverage Requirements**:

- ✅ UserRole.organization field exists and is required
- ✅ UserRole.branch validation (branch.organization_id == user.organization_id)
- ✅ IDBaseModel.organization field exists
- ✅ AuditLog model created with all required fields
- ✅ Migrations applied successfully
- ✅ Database schema matches expected structure

## Phase 2: Tenant Context & Filtering

### 2.1 Create Tenant Context Utility

**File**: `InteriorDesign/utils/tenant_context.py`

Follow existing utility pattern (like `utils/utils.py`):

```python
from django.core.exceptions import ValidationError

def get_user_organization(user):
    """Get user's organization (tenant boundary)"""
    return user.organization

def filter_by_tenant(queryset, user, organization_id=None):
    """Filter queryset by tenant organization"""
    org_id = organization_id or user.organization_id
    if hasattr(queryset.model, 'organization'):
        return queryset.filter(organization_id=org_id)
    return queryset  # platform-level model

def validate_branch_organization(user, branch):
    """Validate branch belongs to user's organization"""
    if branch and branch.organization_id != user.organization_id:
        raise ValidationError("Branch must belong to user's organization")
```

### 2.2 Create Service Classes for Organization & Branch

**File**: `InteriorDesign/company_management/organization_service.py` (NEW)

Follow existing service pattern (like `CountryService`, `RoleService`):

```python
class OrganizationService:
    @staticmethod
    def get_queryset():
        return Organization.objects.all().order_by(ColumnName.NAME)
    
    @staticmethod
    def list_organizations(...) -> QuerySet[Organization]:
        # List with optional filters
        pass
    
    @staticmethod
    def get_organization_id(id: int) -> Organization:
        return Organization.objects.get(pk=id)
    
    @staticmethod
    def create_organization(validated_data: dict) -> Organization:
        return Organization.objects.create(**validated_data)
    
    @staticmethod
    def update_organization(id: int, validated_data: dict, user=None) -> Organization:
        # Update logic
        pass
```

**File**: `InteriorDesign/company_management/branch_service.py` (NEW)

Same pattern with tenant filtering:

```python
class BranchService:
    @staticmethod
    def get_queryset():
        return Branch.objects.select_related('organization').order_by(ColumnName.NAME)
    
    @staticmethod
    def list_branches(organization_id: int = None, ...) -> QuerySet[Branch]:
        qs = Branch.objects.select_related('organization')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        return qs.order_by(ColumnName.NAME)
    
    @staticmethod
    def get_branch_id(id: int) -> Branch:
        return Branch.objects.get(pk=id)
    
    @staticmethod
    def create_branch(validated_data: dict, user=None) -> Branch:
        # Auto-set organization_id from user if not provided
        if user and 'organization' not in validated_data:
            validated_data['organization_id'] = user.organization_id
        return Branch.objects.create(**validated_data)
    
    @staticmethod
    def update_branch(id: int, validated_data: dict, user=None) -> Branch:
        # Update logic with tenant validation
        pass
```

**File**: `InteriorDesign/user_accounts/user_service.py` (NEW)

```python
class UserService:
    @staticmethod
    def get_queryset():
        return UserRole.objects.select_related('organization', 'branch').order_by(ColumnName.EMAIL)
    
    @staticmethod
    def list_users(organization_id: int = None, ...) -> QuerySet[UserRole]:
        qs = UserRole.objects.select_related('organization', 'branch')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        return qs.order_by(ColumnName.EMAIL)
    
    @staticmethod
    def get_user_id(id: int) -> UserRole:
        return UserRole.objects.get(pk=id)
    
    @staticmethod
    def create_user(validated_data: dict, user=None) -> UserRole:
        # Auto-set organization_id from creating user
        if user and 'organization' not in validated_data:
            validated_data['organization_id'] = user.organization_id
        return UserRole.objects.create(**validated_data)
    
    @staticmethod
    def update_user(id: int, validated_data: dict, user=None) -> UserRole:
        # Update logic with tenant validation
        pass
```

### 2.3 Create Views Following Existing Pattern

**File**: `InteriorDesign/company_management/organization_views.py` (NEW)

Follow pattern from `country_views.py`:

```python
class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrganizationSerializer
    
    def get_queryset(self):
        try:
            # Use service layer
            return OrganizationService.get_queryset()
        except Exception as e:
            return Organization.objects.none()
    
    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        try:
            queryset = self.get_queryset().filter(is_active=True)
            serializer = self.get_serializer(queryset, many=True)
            return build_response(serializer.data)
        except Exception as e:
            return proccess_exception(e, "Failed to fetch active organizations")

class OrganizationCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.ORG_CREATE)]
    serializer_class = OrganizationSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            organization = serializer.save()
            return build_serialized_response(
                organization, 
                OrganizationSerializer, 
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to create organization")

class OrganizationUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.ORG_UPDATE)]
    serializer_class = OrganizationSerializer
    lookup_url_kwarg = ColumnName.ID
    
    def get_queryset(self):
        return OrganizationService.get_queryset()
    
    def update(self, request, *args, **kwargs):
        try:
            organization = OrganizationService.get_organization_id(kwargs[ColumnName.ID])
            serializer = self.get_serializer(instance=organization, data=request.data)
            serializer.is_valid(raise_exception=True)
            organization = OrganizationService.update_organization(
                kwargs[ColumnName.ID], serializer.validated_data, user=request.user
            )
            return build_serialized_response(
                organization, 
                OrganizationSerializer,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to update organization")
```

**File**: `InteriorDesign/company_management/branch_views.py` (NEW)

Same pattern with tenant filtering in `get_queryset()`:

```python
class BranchViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BranchSerializer
    
    def get_queryset(self):
        try:
            # Filter by user's organization
            qs = BranchService.list_branches(organization_id=self.request.user.organization_id)
            return qs
        except Exception as e:
            return Branch.objects.none()
    
    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        try:
            queryset = self.get_queryset().filter(is_active=True)
            serializer = self.get_serializer(queryset, many=True)
            return build_response(serializer.data)
        except Exception as e:
            return proccess_exception(e, "Failed to fetch active branches")

class BranchCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.BRANCH_CREATE)]
    serializer_class = BranchSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            # Service will auto-set organization_id from user
            branch = BranchService.create_branch(serializer.validated_data, user=request.user)
            return build_serialized_response(
                branch, 
                BranchSerializer, 
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to create branch")
```

**File**: `InteriorDesign/user_accounts/user_views.py` (NEW)

Same pattern for user management:

```python
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.USER_VIEW)]
    serializer_class = UserRoleSerializer
    
    def get_queryset(self):
        try:
            # Filter by user's organization
            qs = UserService.list_users(organization_id=self.request.user.organization_id)
            return qs
        except Exception as e:
            return UserRole.objects.none()

class UserCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.USER_CREATE)]
    serializer_class = UserRoleSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            # Service will auto-set organization_id from creating user
            user = UserService.create_user(serializer.validated_data, user=request.user)
            return build_serialized_response(
                user, 
                UserRoleSerializer, 
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to create user")
```

### 2.4 Update Existing Views for Tenant Filtering

**Files**: All existing `*_views.py` files

- `common/country_views.py` - Countries are global (no org_id, no changes needed)
- `common/state_views.py` - States are global (no org_id, no changes needed)
- `common/currency_views.py` - Currencies are global (no org_id, no changes needed)
- `user_accounts/role_views.py` - Roles are global (no org_id, no changes needed)
- `user_accounts/views.py` - Update RegisterUserView to require organization_id

### 2.5 Phase 2 Testing

**File**: `InteriorDesign/Test/Phase2_Test/test_phase2_tenant_filtering.py` (NEW)

**Test Requirements** (100% pass required before Phase 3):

```python
@pytest.mark.django_db
class TestPhase2TenantFiltering:
    """Test Phase 2: Tenant Context & Filtering"""
    
    @pytest.fixture
    def org1(self, db):
        """Create organization 1"""
        return Organization.objects.create(name="Org1", code="ORG1", ...)
    
    @pytest.fixture
    def org2(self, db):
        """Create organization 2"""
        return Organization.objects.create(name="Org2", code="ORG2", ...)
    
    @pytest.fixture
    def user1(self, org1, branch):
        """Create user in org1"""
        return UserRole.objects.create_user(
            email='user1@org1.com',
            organization=org1,
            branch=branch,
            password='testpass123'
        )
    
    @pytest.fixture
    def user2(self, org2):
        """Create user in org2"""
        return UserRole.objects.create_user(
            email='user2@org2.com',
            organization=org2,
            password='testpass123'
        )
    
    def test_tenant_context_utility_exists(self):
        """Test tenant_context utility functions exist"""
        from utils.tenant_context import get_user_organization, filter_by_tenant
        assert callable(get_user_organization)
        assert callable(filter_by_tenant)
    
    def test_organization_service_exists(self):
        """Test OrganizationService exists and has required methods"""
        from company_management.organization_service import OrganizationService
        assert hasattr(OrganizationService, 'get_queryset')
        assert hasattr(OrganizationService, 'list_organizations')
        assert hasattr(OrganizationService, 'create_organization')
    
    def test_branch_service_tenant_filtering(self, org1, org2, user1):
        """Test BranchService filters by organization"""
        from company_management.branch_service import BranchService
        branch1 = Branch.objects.create(organization=org1, ...)
        branch2 = Branch.objects.create(organization=org2, ...)
        
        branches = BranchService.list_branches(organization_id=org1.id)
        assert branch1 in branches
        assert branch2 not in branches
    
    def test_user_service_tenant_filtering(self, org1, org2, user1, user2):
        """Test UserService filters by organization"""
        from user_accounts.user_service import UserService
        users = UserService.list_users(organization_id=org1.id)
        assert user1 in users
        assert user2 not in users
    
    def test_branch_viewset_tenant_filtering(self, org1, org2, user1, api_client):
        """Test BranchViewSet only returns branches from user's organization"""
        branch1 = Branch.objects.create(organization=org1, ...)
        branch2 = Branch.objects.create(organization=org2, ...)
        
        # Login as user1
        token = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        response = api_client.get('/api/admin/branches/')
        assert response.status_code == 200
        branch_ids = [b['id'] for b in response.data['data']]
        assert branch1.id in branch_ids
        assert branch2.id not in branch_ids
    
    def test_user_viewset_tenant_filtering(self, org1, org2, user1, user2, api_client):
        """Test UserViewSet only returns users from user's organization"""
        token = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        response = api_client.get('/api/admin/users/')
        assert response.status_code == 200
        user_ids = [u['id'] for u in response.data['data']]
        assert user1.id in user_ids
        assert user2.id not in user_ids
    
    def test_branch_create_auto_sets_organization(self, org1, user1, api_client):
        """Test creating branch auto-sets organization from user"""
        token = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        response = api_client.post('/api/admin/branches/create', {
            'name': 'New Branch',
            'code': 'NB',
            # organization_id should be auto-set
        })
        assert response.status_code == 201
        branch = Branch.objects.get(code='NB')
        assert branch.organization_id == org1.id
```

**Run Tests**:

```bash
pytest InteriorDesign/Test/Phase2_Test/test_phase2_tenant_filtering.py -v
# Must pass 100% before proceeding to Phase 3
```

**Test Coverage Requirements**:

- ✅ Tenant context utility functions exist and work
- ✅ OrganizationService, BranchService, UserService exist with required methods
- ✅ Services filter by organization_id correctly
- ✅ ViewSets filter by tenant (user can only see their org's data)
- ✅ Create operations auto-set organization_id from user
- ✅ Cross-tenant access is prevented

## Phase 3: RBAC Integration

### 3.1 Update Permission Codes

**File**: `InteriorDesign/utils/permissions.py`

- Ensure all permission codes exist for Branch and User operations
- Add tenant-scoped permission checks

### 3.2 Wire RBAC to All Endpoints

**Files**: All view files

- Replace `IsAuthenticated` with `IsAdminOrHasPermission(PermissionCode.XXX_VIEW)` for list/retrieve
- Replace `IsSuperAdmin` with `IsAdminOrHasPermission(PermissionCode.XXX_CREATE)` for create
- Add permission checks for update/delete operations

**Priority Endpoints**:

1. Branch endpoints (CRUD with BRANCH_* permissions)
2. User endpoints (CRUD with USER_* permissions)
3. Organization endpoints (ORG_* permissions)
4. Other business entities

### 3.4 Phase 3 Testing

**File**: `InteriorDesign/Test/Phase3_Test/test_phase3_rbac.py` (NEW)

**Test Requirements** (100% pass required before Phase 4):

```python
@pytest.mark.django_db
class TestPhase3RBAC:
    """Test Phase 3: RBAC Integration"""
    
    @pytest.fixture
    def org_admin_role(self, db):
        """Create org_admin role with BRANCH and USER permissions"""
        permissions = {
            PermissionCode.BRANCH_VIEW.value: True,
            PermissionCode.BRANCH_CREATE.value: True,
            PermissionCode.USER_VIEW.value: True,
            PermissionCode.USER_CREATE.value: True,
        }
        return Role.objects.create(role='org_admin', permissions=permissions, ...)
    
    @pytest.fixture
    def normal_user_role(self, db):
        """Create normal_user role with only VIEW permissions"""
        permissions = {
            PermissionCode.BRANCH_VIEW.value: True,
            PermissionCode.USER_VIEW.value: True,
        }
        return Role.objects.create(role='normal_user', permissions=permissions, ...)
    
    @pytest.fixture
    def org_admin_user(self, org1, org_admin_role):
        """Create user with org_admin role"""
        user = UserRole.objects.create_user(
            email='admin@org1.com',
            organization=org1,
            password='testpass123'
        )
        user.roles.add(org_admin_role)
        return user
    
    @pytest.fixture
    def normal_user(self, org1, normal_user_role):
        """Create user with normal_user role"""
        user = UserRole.objects.create_user(
            email='normal@org1.com',
            organization=org1,
            password='testpass123'
        )
        user.roles.add(normal_user_role)
        return user
    
    def test_branch_list_requires_permission(self, normal_user, api_client):
        """Test branch list requires BRANCH_VIEW permission"""
        token = RefreshToken.for_user(normal_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.get('/api/admin/branches/')
        assert response.status_code == 200  # Has BRANCH_VIEW
    
    def test_branch_create_requires_permission(self, normal_user, api_client):
        """Test branch create requires BRANCH_CREATE permission"""
        token = RefreshToken.for_user(normal_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.post('/api/admin/branches/create', {
            'name': 'New Branch',
            'code': 'NB',
        })
        assert response.status_code == 403  # No BRANCH_CREATE permission
    
    def test_branch_create_with_permission(self, org_admin_user, api_client):
        """Test branch create succeeds with BRANCH_CREATE permission"""
        token = RefreshToken.for_user(org_admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.post('/api/admin/branches/create', {
            'name': 'New Branch',
            'code': 'NB',
        })
        assert response.status_code == 201  # Has BRANCH_CREATE permission
    
    def test_user_list_requires_permission(self, normal_user, api_client):
        """Test user list requires USER_VIEW permission"""
        token = RefreshToken.for_user(normal_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.get('/api/admin/users/')
        assert response.status_code == 200  # Has USER_VIEW
    
    def test_user_create_requires_permission(self, normal_user, api_client):
        """Test user create requires USER_CREATE permission"""
        token = RefreshToken.for_user(normal_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.post('/api/admin/users/create', {
            'email': 'newuser@org1.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
        })
        assert response.status_code == 403  # No USER_CREATE permission
    
    def test_superuser_bypasses_permissions(self, superuser, api_client):
        """Test superuser bypasses all permission checks"""
        token = RefreshToken.for_user(superuser)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.post('/api/admin/branches/create', {
            'name': 'New Branch',
            'code': 'NB',
        })
        assert response.status_code == 201  # Superuser bypasses
```

**Run Tests**:

```bash
pytest InteriorDesign/Test/Phase3_Test/test_phase3_rbac.py -v
# Must pass 100% before proceeding to Phase 4
```

**Test Coverage Requirements**:

- ✅ Branch endpoints require BRANCH_* permissions
- ✅ User endpoints require USER_* permissions
- ✅ Organization endpoints require ORG_* permissions
- ✅ Users without permissions get 403 Forbidden
- ✅ Users with permissions get 200/201 OK
- ✅ Superuser bypasses all permission checks
- ✅ Permission checks work for list, create, update, delete operations

### 3.3 Create Permission Helper

**File**: `InteriorDesign/utils/rbac_helper.py`

```python
def check_tenant_permission(user, permission_code, organization_id=None):
    """Check if user has permission for specific tenant"""
    if user.is_superuser:
        return True
    if organization_id and user.organization_id != organization_id:
        return False  # Cross-tenant access denied
    return user.get_all_permissions().get(permission_code.value, False)
```

## Phase 4: User Invite/Creation with Branch+Role

### 4.1 Create User Invite Model

**File**: `InteriorDesign/user_accounts/models.py`

```python
class UserInvite(IDBaseModel):  # Inherit from IDBaseModel for consistency
    email = models.EmailField(unique=True)
    organization = models.ForeignKey('company_management.Organization', on_delete=models.CASCADE)
    branch = models.ForeignKey('company_management.Branch', on_delete=models.SET_NULL, null=True, blank=True)
    roles = models.ManyToManyField(Role, blank=True)
    invited_by = models.ForeignKey(UserRole, on_delete=models.SET_NULL, null=True, related_name='invites_sent')
    token = models.CharField(max_length=64, unique=True)  # invitation token
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_invite'
        verbose_name = _('User Invite')
        verbose_name_plural = _('User Invites')
```

### 4.2 Create User Invite Service

**File**: `InteriorDesign/user_accounts/invite_service.py` (NEW)

Follow service pattern:

```python
class UserInviteService:
    @staticmethod
    def get_queryset():
        return UserInvite.objects.select_related('organization', 'branch', 'invited_by')
    
    @staticmethod
    def list_invites(organization_id: int = None) -> QuerySet[UserInvite]:
        qs = UserInvite.objects.select_related('organization', 'branch', 'invited_by')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        return qs.order_by('-created_at')
    
    @staticmethod
    def get_invite_by_token(token: str) -> UserInvite:
        return UserInvite.objects.get(token=token)
    
    @staticmethod
    def create_invite(validated_data: dict, user=None) -> UserInvite:
        # Auto-set organization_id and invited_by from user
        if user:
            validated_data['organization_id'] = user.organization_id
            validated_data['invited_by_id'] = user.id
        # Generate token
        import secrets
        validated_data['token'] = secrets.token_urlsafe(32)
        return UserInvite.objects.create(**validated_data)
    
    @staticmethod
    def accept_invite(token: str, password: str) -> UserRole:
        invite = UserInviteService.get_invite_by_token(token)
        # Create user from invite
        user = UserRole.objects.create_user(
            email=invite.email,
            password=password,
            organization=invite.organization,
            branch=invite.branch
        )
        user.roles.set(invite.roles.all())
        invite.accepted_at = timezone.now()
        invite.save()
        return user
```

### 4.3 Create User Invite Serializer

**File**: `InteriorDesign/user_accounts/serializers.py`

Follow existing serializer pattern (extend IDBaseModelSerializer if needed, or ModelSerializer):

```python
class UserInviteSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), source='branch', write_only=True, required=False, allow_null=True
    )
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), many=True, source='roles', write_only=True, required=False
    )
    roles = RoleSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserInvite
        fields = [
            'id', 'email', 'organization', 'organization_name',
            'branch', 'branch_id', 'branch_name',
            'roles', 'role_ids', 'token', 'expires_at', 'accepted_at',
            'created_at'
        ]
        read_only_fields = ['token', 'accepted_at', 'created_at', 'organization', 'organization_name']
    
    def validate(self, attrs):
        # Validate branch belongs to organization
        branch = attrs.get('branch')
        organization = self.context['request'].user.organization
        if branch and branch.organization_id != organization.id:
            raise serializers.ValidationError("Branch must belong to user's organization")
        return attrs

class UserInviteAcceptSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
```

### 4.4 Create User Invite Views

**File**: `InteriorDesign/user_accounts/invite_views.py` (NEW)

Follow existing view pattern:

```python
class UserInviteViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.USER_VIEW)]
    serializer_class = UserInviteSerializer
    
    def get_queryset(self):
        try:
            # Filter by user's organization
            qs = UserInviteService.list_invites(organization_id=self.request.user.organization_id)
            return qs
        except Exception as e:
            return UserInvite.objects.none()

class UserInviteCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.USER_CREATE)]
    serializer_class = UserInviteSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            invite = UserInviteService.create_invite(serializer.validated_data, user=request.user)
            return build_serialized_response(
                invite, 
                UserInviteSerializer, 
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to create user invite")

class UserInviteAcceptView(generics.CreateAPIView):
    permission_classes = [AllowAny]  # Public endpoint for accepting invites
    serializer_class = UserInviteAcceptSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = UserInviteService.accept_invite(
                serializer.validated_data['token'],
                serializer.validated_data['password']
            )
            return build_serialized_response(
                user, 
                UserRoleSerializer, 
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to accept invite")
```

### 4.5 Update User Creation

**File**: `InteriorDesign/user_accounts/views.py`

Update `RegisterUserView` to require organization_id and follow service pattern:

```python
class RegisterUserView(generics.CreateAPIView):
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [AllowAny]  # Or require USER_CREATE permission
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            # Use service layer
            user = UserService.create_user(serializer.validated_data, user=request.user if request.user.is_authenticated else None)
            return build_serialized_response(
                user, 
                UserRoleSerializer, 
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to register user")
```

**File**: `InteriorDesign/user_accounts/serializers.py`

Update `UserRoleSerializer` to include organization_id:

```python
class UserRoleSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(), source='organization', write_only=True, required=True
    )
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    # ... rest of fields ...
    
    def validate(self, attrs):
        # Validate branch belongs to organization
        branch = attrs.get('branch')
        organization = attrs.get('organization')
        if branch and organization and branch.organization_id != organization.id:
            raise serializers.ValidationError("Branch must belong to the specified organization")
        return attrs
```

### 4.6 Phase 4 Testing

**File**: `InteriorDesign/Test/Phase4_Test/test_phase4_user_invite.py` (NEW)

**Test Requirements** (100% pass required before Phase 5):

```python
@pytest.mark.django_db
class TestPhase4UserInvite:
    """Test Phase 4: User Invite/Creation with Branch+Role"""
    
    @pytest.fixture
    def org_admin_user(self, org1, org_admin_role):
        """Create org admin user"""
        user = UserRole.objects.create_user(
            email='admin@org1.com',
            organization=org1,
            password='testpass123'
        )
        user.roles.add(org_admin_role)
        return user
    
    def test_user_invite_model_exists(self):
        """Test UserInvite model exists"""
        from user_accounts.models import UserInvite
        assert UserInvite is not None
    
    def test_user_invite_service_exists(self):
        """Test UserInviteService exists"""
        from user_accounts.invite_service import UserInviteService
        assert hasattr(UserInviteService, 'create_invite')
        assert hasattr(UserInviteService, 'accept_invite')
    
    def test_create_user_invite(self, org_admin_user, org1, branch, role, api_client):
        """Test creating user invite"""
        token = RefreshToken.for_user(org_admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        response = api_client.post('/api/admin/users/invite', {
            'email': 'invited@org1.com',
            'branch_id': branch.id,
            'role_ids': [role.id],
        })
        assert response.status_code == 201
        assert UserInvite.objects.filter(email='invited@org1.com').exists()
    
    def test_invite_auto_sets_organization(self, org_admin_user, org1, api_client):
        """Test invite auto-sets organization from creating user"""
        token = RefreshToken.for_user(org_admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        
        response = api_client.post('/api/admin/users/invite', {
            'email': 'invited@org1.com',
        })
        invite = UserInvite.objects.get(email='invited@org1.com')
        assert invite.organization_id == org1.id
    
    def test_accept_invite_creates_user(self, org1, branch, role):
        """Test accepting invite creates user with branch and roles"""
        from user_accounts.invite_service import UserInviteService
        invite = UserInvite.objects.create(
            email='invited@org1.com',
            organization=org1,
            branch=branch,
            token='test_token_123',
            expires_at=timezone.now() + timedelta(days=7)
        )
        invite.roles.add(role)
        
        user = UserInviteService.accept_invite('test_token_123', 'password123')
        assert user.email == 'invited@org1.com'
        assert user.organization_id == org1.id
        assert user.branch_id == branch.id
        assert role in user.roles.all()
        assert invite.accepted_at is not None
    
    def test_user_creation_with_organization(self, org1, api_client):
        """Test user creation requires organization_id"""
        response = api_client.post('/api/register/user', {
            'email': 'newuser@org1.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
            'organization_id': org1.id,
        })
        assert response.status_code == 201
        user = UserRole.objects.get(email='newuser@org1.com')
        assert user.organization_id == org1.id
```

**Run Tests**:

```bash
pytest InteriorDesign/Test/Phase4_Test/test_phase4_user_invite.py -v
# Must pass 100% before proceeding to Phase 5
```

**Test Coverage Requirements**:

- ✅ UserInvite model exists with all required fields
- ✅ UserInviteService methods exist and work
- ✅ Creating invite auto-sets organization from user
- ✅ Accepting invite creates user with branch and roles
- ✅ User creation requires organization_id
- ✅ Branch validation works (branch must belong to organization)

## Phase 5: Audit Logging

### 5.1 Create Audit Log Service

**File**: `InteriorDesign/user_accounts/audit_service.py` (NEW)

Follow service pattern:

```python
from django.db.models import QuerySet
from .models import AuditLog
from utils.enums import ColumnName

class AuditService:
    @staticmethod
    def get_queryset():
        return AuditLog.objects.select_related('user', 'organization').order_by('-timestamp')
    
    @staticmethod
    def list_audit_logs(organization_id: int = None, action_type: str = None, 
                       model_name: str = None, user_id: int = None) -> QuerySet[AuditLog]:
        qs = AuditLog.objects.select_related('user', 'organization')
        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        if action_type:
            qs = qs.filter(action_type=action_type)
        if model_name:
            qs = qs.filter(model_name=model_name)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs.order_by('-timestamp')
    
    @staticmethod
    def log_action(user, action_type, model_instance=None, changes=None, request=None):
        """Log an action to audit log"""
        from django.utils import timezone
        from utils.utils import get_client_ip
        
        def get_client_ip(request):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            return ip
        
        AuditLog.objects.create(
            user=user,
            organization=user.organization,
            action_type=action_type,
            model_name=model_instance.__class__.__name__ if model_instance else None,
            object_id=model_instance.id if model_instance else None,
            object_repr=str(model_instance) if model_instance else '',
            changes=changes or {},
            ip_address=get_client_ip(request) if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else ''
        )
```

### 5.2 Create Audit Log Serializer

**File**: `InteriorDesign/user_accounts/serializers.py`

```python
class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    timestamp_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'organization', 'organization_name',
            'action_type', 'model_name', 'object_id', 'object_repr',
            'changes', 'ip_address', 'user_agent', 'timestamp', 'timestamp_display'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_timestamp_display(self, obj):
        from utils.utils import format_date_dd_mon_yyyy
        return format_date_dd_mon_yyyy(obj.timestamp)
```

### 5.3 Create Audit Log Views

**File**: `InteriorDesign/user_accounts/audit_views.py` (NEW)

Follow existing view pattern:

```python
class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAdminOrHasPermission(PermissionCode.AUDIT_VIEW)]
    serializer_class = AuditLogSerializer
    
    def get_queryset(self):
        try:
            organization_id = self.request.user.organization_id
            action_type = self.request.query_params.get('action_type')
            model_name = self.request.query_params.get('model_name')
            user_id = self.request.query_params.get('user_id')
            
            qs = AuditService.list_audit_logs(
                organization_id=organization_id,
                action_type=action_type,
                model_name=model_name,
                user_id=user_id
            )
            return qs
        except Exception as e:
            return AuditLog.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return build_response(serializer.data)
        except Exception as e:
            return proccess_exception(e, "Failed to fetch audit logs")
```

### 5.4 Integrate Audit Logging via Signals

**File**: `InteriorDesign/user_accounts/signals.py` (NEW)

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import UserRole
from .audit_service import AuditService

@receiver(post_save, sender=UserRole)
def log_user_create_update(sender, instance, created, **kwargs):
    action_type = 'CREATE' if created else 'UPDATE'
    # Get user from instance if available, or use system user
    user = getattr(instance, '_audit_user', None) or instance
    AuditService.log_action(
        user=user,
        action_type=action_type,
        model_instance=instance,
        request=getattr(instance, '_audit_request', None)
    )

@receiver(post_delete, sender=UserRole)
def log_user_delete(sender, instance, **kwargs):
    user = getattr(instance, '_audit_user', None) or instance
    AuditService.log_action(
        user=user,
        action_type='DELETE',
        model_instance=instance,
        request=getattr(instance, '_audit_request', None)
    )
```

**File**: `InteriorDesign/user_accounts/apps.py` (NEW or update)

```python
from django.apps import AppConfig

class UserAccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user_accounts'
    
    def ready(self):
        import user_accounts.signals  # Import signals
```

### 5.5 Add Audit Logging to Views

Update all create/update views to log actions:

**Example in `user_accounts/user_views.py`**:

```python
class UserCreateView(generics.CreateAPIView):
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = UserService.create_user(serializer.validated_data, user=request.user)
            # Log audit
            AuditService.log_action(
                user=request.user,
                action_type='CREATE',
                model_instance=user,
                request=request
            )
            return build_serialized_response(...)
        except Exception as e:
            return proccess_exception(e, "Failed to create user")
```

**File**: `InteriorDesign/user_accounts/views.py`

Add audit logging to auth events:

```python
class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            # Log login
            AuditService.log_action(
                user=user,
                action_type='LOGIN',
                request=request
            )
            return Response(build_response_dic(serializer.validated_data), status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response(build_response_msg(e.detail), status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        # Log logout
        AuditService.log_action(
            user=request.user,
            action_type='LOGOUT',
            request=request
        )
        # ... existing logout logic
```

## Phase 6: Superadmin Console

### 6.1 Create Impersonation Model

**File**: `InteriorDesign/user_accounts/models.py`

```python
class ImpersonationSession(models.Model):
    superadmin = models.ForeignKey(
        UserRole, 
        on_delete=models.CASCADE, 
        related_name='impersonations_started',
        verbose_name=_("Superadmin")
    )
    target_user = models.ForeignKey(
        UserRole, 
        on_delete=models.CASCADE, 
        related_name='impersonations_received',
        verbose_name=_("Target User")
    )
    started_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Started At"))
    stopped_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Stopped At"))
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_("IP Address"))
    
    class Meta:
        db_table = 'impersonation_session'
        verbose_name = _('Impersonation Session')
        verbose_name_plural = _('Impersonation Sessions')
        ordering = ['-started_at']
```

### 6.2 Create Superadmin Service

**File**: `InteriorDesign/user_accounts/superadmin_service.py` (NEW)

Follow service pattern:

```python
class SuperadminService:
    @staticmethod
    def get_all_organizations():
        """Get all organizations (superadmin only)"""
        return Organization.objects.all().order_by(ColumnName.NAME)
    
    @staticmethod
    def get_organization_stats(organization_id: int):
        """Get statistics for an organization"""
        org = Organization.objects.get(pk=organization_id)
        return {
            'organization': org,
            'user_count': UserRole.objects.filter(organization_id=organization_id).count(),
            'branch_count': Branch.objects.filter(organization_id=organization_id).count(),
            'active_users': UserRole.objects.filter(organization_id=organization_id, is_active=True).count(),
        }
    
    @staticmethod
    def start_impersonation(superadmin, target_user, request=None):
        """Start impersonation session"""
        session = ImpersonationSession.objects.create(
            superadmin=superadmin,
            target_user=target_user,
            ip_address=get_client_ip(request) if request else None
        )
        # Log audit
        AuditService.log_action(
            user=superadmin,
            action_type='IMPERSONATE_START',
            model_instance=target_user,
            changes={'target_user_id': target_user.id, 'target_user_email': target_user.email},
            request=request
        )
        return session
    
    @staticmethod
    def stop_impersonation(session_id, request=None):
        """Stop impersonation session"""
        session = ImpersonationSession.objects.get(pk=session_id)
        session.stopped_at = timezone.now()
        session.save()
        # Log audit
        AuditService.log_action(
            user=session.superadmin,
            action_type='IMPERSONATE_STOP',
            model_instance=session.target_user,
            changes={'target_user_id': session.target_user.id},
            request=request
        )
        return session
    
    @staticmethod
    def get_active_impersonation(superadmin):
        """Get active impersonation session for superadmin"""
        return ImpersonationSession.objects.filter(
            superadmin=superadmin,
            stopped_at__isnull=True
        ).first()
```

### 6.3 Create Superadmin Serializers

**File**: `InteriorDesign/user_accounts/serializers.py`

```python
class OrganizationStatsSerializer(serializers.Serializer):
    organization = OrganizationSerializer(read_only=True)
    user_count = serializers.IntegerField()
    branch_count = serializers.IntegerField()
    active_users = serializers.IntegerField()

class ImpersonationSessionSerializer(serializers.ModelSerializer):
    superadmin_name = serializers.CharField(source='superadmin.get_full_name', read_only=True)
    target_user_name = serializers.CharField(source='target_user.get_full_name', read_only=True)
    target_user_email = serializers.CharField(source='target_user.email', read_only=True)
    
    class Meta:
        model = ImpersonationSession
        fields = [
            'id', 'superadmin', 'superadmin_name',
            'target_user', 'target_user_name', 'target_user_email',
            'started_at', 'stopped_at', 'ip_address'
        ]
        read_only_fields = ['id', 'started_at', 'stopped_at']
```

### 6.4 Create Superadmin Views

**File**: `InteriorDesign/user_accounts/superadmin_views.py` (NEW)

Follow existing view pattern:

```python
class TenantListView(generics.ListAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = OrganizationSerializer
    
    def get_queryset(self):
        try:
            return SuperadminService.get_all_organizations()
        except Exception as e:
            return Organization.objects.none()
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return build_response(serializer.data)
        except Exception as e:
            return proccess_exception(e, "Failed to fetch tenants")

class TenantDetailView(generics.RetrieveAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = OrganizationStatsSerializer
    lookup_url_kwarg = ColumnName.ID
    
    def retrieve(self, request, *args, **kwargs):
        try:
            org_id = kwargs[ColumnName.ID]
            stats = SuperadminService.get_organization_stats(org_id)
            serializer = self.get_serializer(stats)
            return build_response(serializer.data)
        except Exception as e:
            return proccess_exception(e, "Failed to fetch tenant details")

class ImpersonateStartView(generics.CreateAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = ImpersonationSessionSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            target_user_id = request.data.get('target_user_id')
            target_user = UserRole.objects.get(pk=target_user_id)
            session = SuperadminService.start_impersonation(
                superadmin=request.user,
                target_user=target_user,
                request=request
            )
            return build_serialized_response(
                session,
                ImpersonationSessionSerializer,
                status.HTTP_201_CREATED,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to start impersonation")

class ImpersonateStopView(generics.UpdateAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = ImpersonationSessionSerializer
    lookup_url_kwarg = 'session_id'
    
    def update(self, request, *args, **kwargs):
        try:
            session_id = kwargs['session_id']
            session = SuperadminService.stop_impersonation(session_id, request=request)
            return build_serialized_response(
                session,
                ImpersonationSessionSerializer,
                context={'request': request}
            )
        except Exception as e:
            return proccess_exception(e, "Failed to stop impersonation")
```

### 5.6 Phase 5 Testing

**File**: `InteriorDesign/Test/Phase5_Test/test_phase5_audit_logging.py` (NEW)

**Test Requirements** (100% pass required before Phase 6):

```python
@pytest.mark.django_db
class TestPhase5AuditLogging:
    """Test Phase 5: Audit Logging"""
    
    def test_audit_service_exists(self):
        """Test AuditService exists"""
        from user_accounts.audit_service import AuditService
        assert hasattr(AuditService, 'log_action')
        assert hasattr(AuditService, 'list_audit_logs')
    
    def test_crud_operations_logged(self, org1, user1):
        """Test CRUD operations create audit logs"""
        from user_accounts.audit_service import AuditService
        from user_accounts.models import AuditLog
        
        # Create
        branch = Branch.objects.create(organization=org1, ...)
        AuditService.log_action(
            user=user1,
            action_type='CREATE',
            model_instance=branch,
            request=None
        )
        assert AuditLog.objects.filter(
            user=user1,
            action_type='CREATE',
            model_name='Branch'
        ).exists()
    
    def test_auth_events_logged(self, user1, api_client):
        """Test login/logout events are logged"""
        from user_accounts.models import AuditLog
        
        # Login
        response = api_client.post('/api/login', {
            'email': user1.email,
            'password': 'testpass123'
        })
        assert response.status_code == 200
        assert AuditLog.objects.filter(
            user=user1,
            action_type='LOGIN'
        ).exists()
        
        # Logout
        token = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.post('/api/logout', {
            'refresh': str(token)
        })
        assert AuditLog.objects.filter(
            user=user1,
            action_type='LOGOUT'
        ).exists()
    
    def test_role_changes_logged(self, user1, role):
        """Test role assignment creates audit log"""
        from user_accounts.audit_service import AuditService
        from user_accounts.models import AuditLog
        
        user1.roles.add(role)
        AuditService.log_action(
            user=user1,
            action_type='ROLE_ASSIGN',
            model_instance=user1,
            changes={'role_id': role.id}
        )
        assert AuditLog.objects.filter(
            user=user1,
            action_type='ROLE_ASSIGN'
        ).exists()
    
    def test_audit_log_api(self, org1, user1, api_client):
        """Test audit log API endpoint"""
        from user_accounts.models import AuditLog
        AuditLog.objects.create(
            user=user1,
            organization=org1,
            action_type='CREATE',
            model_name='Branch',
            object_repr='Test Branch'
        )
        
        token = RefreshToken.for_user(user1)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.get('/api/admin/audit-logs')
        assert response.status_code == 200
        assert len(response.data['data']) > 0
    
    def test_audit_log_filtering(self, org1, org2, user1, user2):
        """Test audit logs are filtered by organization"""
        from user_accounts.models import AuditLog
        AuditLog.objects.create(user=user1, organization=org1, action_type='CREATE', ...)
        AuditLog.objects.create(user=user2, organization=org2, action_type='CREATE', ...)
        
        from user_accounts.audit_service import AuditService
        logs = AuditService.list_audit_logs(organization_id=org1.id)
        assert logs.count() == 1
        assert logs.first().organization_id == org1.id
```

**Run Tests**:

```bash
pytest InteriorDesign/Test/Phase5_Test/test_phase5_audit_logging.py -v
# Must pass 100% before proceeding to Phase 6
```

**Test Coverage Requirements**:

- ✅ AuditService exists with required methods
- ✅ CRUD operations create audit logs
- ✅ Auth events (login/logout) are logged
- ✅ Role changes are logged
- ✅ Audit log API endpoint works
- ✅ Audit logs are filtered by organization
- ✅ All action types are properly logged

### 6.5 Update JWT Token for Impersonation

**File**: `InteriorDesign/user_accounts/serializers.py`

Update `CustomTokenObtainPairSerializer`:

```python
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = user.id
        token['full_name'] = f"{user.first_name} {user.last_name}"
        token['branch_id'] = user.branch.id if user.branch else None
        token['organization_id'] = user.organization.id if user.organization else None
        token['roles'] = [role.role for role in user.roles.all()]
        token['is_superuser'] = user.is_superuser
        
        # Check for active impersonation
        from .superadmin_service import SuperadminService
        impersonation = SuperadminService.get_active_impersonation(user)
        if impersonation:
            token['impersonated_by'] = impersonation.superadmin.id
            token['is_impersonating'] = True
        
        return token
```

### 6.6 Create Superadmin URLs

**File**: `InteriorDesign/user_accounts/urls.py`

Add superadmin routes:

```python
from .superadmin_views import (
    TenantListView, TenantDetailView,
    ImpersonateStartView, ImpersonateStopView
)

urlpatterns = [
    # ... existing routes ...
    
    # Superadmin routes
    path("superadmin/tenants", TenantListView.as_view(), name="superadmin-tenant-list"),
    path("superadmin/tenants/<int:id>", TenantDetailView.as_view(), name="superadmin-tenant-detail"),
    path("superadmin/impersonate/start", ImpersonateStartView.as_view(), name="superadmin-impersonate-start"),
    path("superadmin/impersonate/stop/<int:session_id>", ImpersonateStopView.as_view(), name="superadmin-impersonate-stop"),
]
```

### 6.7 Phase 6 Testing

**File**: `InteriorDesign/Test/Phase6_Test/test_phase6_superadmin.py` (NEW)

**Test Requirements** (100% pass required before Phase 7):

```python
@pytest.mark.django_db
class TestPhase6Superadmin:
    """Test Phase 6: Superadmin Console"""
    
    @pytest.fixture
    def superuser(self, db):
        """Create superuser"""
        return UserRole.objects.create_superuser(
            email='superadmin@example.com',
            password='testpass123',
            organization=Organization.objects.first()  # Requires org
        )
    
    def test_impersonation_model_exists(self):
        """Test ImpersonationSession model exists"""
        from user_accounts.models import ImpersonationSession
        assert ImpersonationSession is not None
    
    def test_superadmin_service_exists(self):
        """Test SuperadminService exists"""
        from user_accounts.superadmin_service import SuperadminService
        assert hasattr(SuperadminService, 'get_all_organizations')
        assert hasattr(SuperadminService, 'start_impersonation')
        assert hasattr(SuperadminService, 'stop_impersonation')
    
    def test_tenant_list_api_superadmin_only(self, superuser, normal_user, api_client):
        """Test tenant list API only accessible to superadmin"""
        # Normal user should get 403
        token = RefreshToken.for_user(normal_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.get('/api/superadmin/tenants')
        assert response.status_code == 403
        
        # Superuser should get 200
        token = RefreshToken.for_user(superuser)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.get('/api/superadmin/tenants')
        assert response.status_code == 200
    
    def test_impersonation_start(self, superuser, normal_user, api_client):
        """Test starting impersonation"""
        from user_accounts.models import ImpersonationSession
        
        token = RefreshToken.for_user(superuser)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
        response = api_client.post('/api/superadmin/impersonate/start', {
            'target_user_id': normal_user.id
        })
        assert response.status_code == 201
        assert ImpersonationSession.objects.filter(
            superadmin=superuser,
            target_user=normal_user,
            stopped_at__isnull=True
        ).exists()
    
    def test_impersonation_stop(self, superuser, normal_user):
        """Test stopping impersonation"""
        from user_accounts.models import ImpersonationSession
        from user_accounts.superadmin_service import SuperadminService
        
        session = SuperadminService.start_impersonation(superuser, normal_user)
        SuperadminService.stop_impersonation(session.id)
        
        session.refresh_from_db()
        assert session.stopped_at is not None
    
    def test_jwt_includes_impersonation(self, superuser, normal_user):
        """Test JWT token includes impersonation context"""
        from user_accounts.superadmin_service import SuperadminService
        from user_accounts.serializers import CustomTokenObtainPairSerializer
        
        SuperadminService.start_impersonation(superuser, normal_user)
        token = CustomTokenObtainPairSerializer.get_token(normal_user)
        assert 'impersonated_by' in token
        assert token['impersonated_by'] == superuser.id
        assert token['is_impersonating'] == True
```

**Run Tests**:

```bash
pytest InteriorDesign/Test/Phase6_Test/test_phase6_superadmin.py -v
# Must pass 100% before proceeding to Phase 7
```

**Test Coverage Requirements**:

- ✅ ImpersonationSession model exists
- ✅ SuperadminService exists with required methods
- ✅ Tenant list API only accessible to superadmin
- ✅ Impersonation start/stop works
- ✅ JWT token includes impersonation context
- ✅ Audit logs created for impersonation events

## Phase 7: Frontend Implementation

### 7.1 Tenant/Branch Management UI

**Files**: `my-app/src/pages/admin/`

- `TenantPage.jsx` - List/create/edit organizations (superadmin only)
- `BranchPage.jsx` - List/create/edit branches (filtered by user's organization)
- Use existing `CrudTable` and `CrudForm` components

### 7.2 User Invite/Creation UI

**Files**: `my-app/src/pages/admin/User/`

- `UserInvitePage.jsx` - Create user invites with branch+role selection
- `UserCreatePage.jsx` - Direct user creation form
- `UserListPage.jsx` - List users (filtered by organization)

### 7.3 Superadmin Console UI

**Files**: `my-app/src/pages/superadmin/`

- `TenantListPage.jsx` - List all tenants with stats
- `ImpersonatePage.jsx` - Impersonation interface
- Add to routes with `IsSuperAdmin` check

### 7.4 Audit Log Viewer

**Files**: `my-app/src/pages/admin/AuditLog/`

- `AuditLogPage.jsx` - Filterable audit log table
- Filters: action type, model, date range, user

### 7.5 Update Auth Context

**File**: `my-app/src/context/AuthContext.jsx`

- Add `organization_id` and `organization_name` to user state
- Add impersonation state tracking

## Phase 7: Frontend Implementation

### 7.1 Tenant/Branch Management UI

**Files**: `my-app/src/pages/admin/`

- `TenantPage.jsx` - List/create/edit organizations (superadmin only)
- `BranchPage.jsx` - List/create/edit branches (filtered by user's organization)
- Use existing `CrudTable` and `CrudForm` components

### 7.2 User Invite/Creation UI

**Files**: `my-app/src/pages/admin/User/`

- `UserInvitePage.jsx` - Create user invites with branch+role selection
- `UserCreatePage.jsx` - Direct user creation form
- `UserListPage.jsx` - List users (filtered by organization)

### 7.3 Superadmin Console UI

**Files**: `my-app/src/pages/superadmin/`

- `TenantListPage.jsx` - List all tenants with stats
- `ImpersonatePage.jsx` - Impersonation interface
- Add to routes with `IsSuperAdmin` check

### 7.4 Audit Log Viewer

**Files**: `my-app/src/pages/admin/AuditLog/`

- `AuditLogPage.jsx` - Filterable audit log table
- Filters: action type, model, date range, user

### 7.5 Update Auth Context

**File**: `my-app/src/context/AuthContext.jsx`

- Add `organization_id` and `organization_name` to user state
- Add impersonation state tracking

### 7.6 Phase 7 Testing

**Manual Testing Checklist** (100% pass required before Phase 8):

- ✅ Tenant management page loads and displays organizations (superadmin only)
- ✅ Branch management page loads and filters by user's organization
- ✅ User invite page creates invites successfully
- ✅ User creation page creates users with branch+role assignment
- ✅ User list page shows only users from user's organization
- ✅ Superadmin console shows tenant list
- ✅ Impersonation interface works (start/stop)
- ✅ Audit log viewer displays logs filtered by organization
- ✅ Auth context includes organization and impersonation state
- ✅ All UI components follow existing design patterns
- ✅ All API calls use existing hooks (useAPI, useFetchApi)
- ✅ Error handling works correctly
- ✅ Loading states work correctly

**Integration Tests** (Optional but recommended):

```bash
# Manual testing via browser
# Test all UI flows end-to-end
# Verify tenant isolation in UI
# Verify RBAC in UI
```

## Phase 8: Final Integration Testing & Validation

### 8.1 Comprehensive Integration Tests

**File**: `InteriorDesign/Test/Phase8_Test/test_phase8_integration.py` (NEW)

**Test Requirements** (100% pass required for completion):

```python
@pytest.mark.django_db
class TestPhase8Integration:
    """Test Phase 8: Final Integration Tests"""
    
    def test_full_tenant_isolation_flow(self, org1, org2, user1, user2, api_client):
        """Test complete tenant isolation across all endpoints"""
        # User1 can only see org1 data
        # User2 can only see org2 data
        # Cross-tenant access denied
        pass
    
    def test_full_rbac_flow(self, org_admin_user, normal_user, api_client):
        """Test complete RBAC flow"""
        # Org admin can create/update
        # Normal user can only view
        # Permissions enforced correctly
        pass
    
    def test_full_user_invite_flow(self, org_admin_user, api_client):
        """Test complete user invite flow"""
        # Create invite
        # Accept invite
        # User created with correct org/branch/roles
        pass
    
    def test_full_audit_logging_flow(self, user1, api_client):
        """Test complete audit logging flow"""
        # All actions logged
        # Audit log API works
        # Filtering works
        pass
    
    def test_full_impersonation_flow(self, superuser, normal_user, api_client):
        """Test complete impersonation flow"""
        # Start impersonation
        # Access as target user
        # Stop impersonation
        # Audit logs created
        pass
```

**Run All Tests**:

```bash
# Run all phase tests
pytest InteriorDesign/Test/Phase1_Test/ -v
pytest InteriorDesign/Test/Phase2_Test/ -v
pytest InteriorDesign/Test/Phase3_Test/ -v
pytest InteriorDesign/Test/Phase4_Test/ -v
pytest InteriorDesign/Test/Phase5_Test/ -v
pytest InteriorDesign/Test/Phase6_Test/ -v
pytest InteriorDesign/Test/Phase8_Test/ -v

# Run all tests together
pytest InteriorDesign/Test/ -v --cov=InteriorDesign

# Must pass 100% for completion
```

### 8.2 Test Coverage Requirements

- ✅ All Phase 1-6 tests pass 100%
- ✅ Integration tests pass 100%
- ✅ No regressions in existing tests
- ✅ Code coverage > 80% for new code
- ✅ All edge cases handled
- ✅ Error handling tested
- ✅ Performance acceptable (no N+1 queries)

### 8.3 Documentation

- Update API documentation
- Update README with new features
- Document tenant isolation rules
- Document RBAC permissions
- Document audit logging
- Document superadmin features

## Implementation Order with Testing Gates

**CRITICAL**: Each phase must have 100% test pass rate before proceeding to next phase.

1. **Phase 1: Database Schema** → Run Phase 1 tests → **MUST PASS 100%** → Proceed
2. **Phase 2: Tenant Context** → Run Phase 2 tests → **MUST PASS 100%** → Proceed
3. **Phase 3: RBAC Integration** → Run Phase 3 tests → **MUST PASS 100%** → Proceed
4. **Phase 4: User Invite** → Run Phase 4 tests → **MUST PASS 100%** → Proceed
5. **Phase 5: Audit Logging** → Run Phase 5 tests → **MUST PASS 100%** → Proceed
6. **Phase 6: Superadmin Console** → Run Phase 6 tests → **MUST PASS 100%** → Proceed
7. **Phase 7: Frontend** → Manual testing checklist → **MUST PASS 100%** → Proceed
8. **Phase 8: Final Integration** → Run all tests → **MUST PASS 100%** → Complete

**Testing Gate Process**:

1. Implement phase features
2. Write/update tests for phase
3. Run tests: `pytest InteriorDesign/Test/PhaseX_Test/ -v`
4. **If any test fails**: Fix issues, re-run tests
5. **Only when 100% pass**: Proceed to next phase
6. Document test results

## Key Files to Create/Modify

### Backend Files

**Models** (`*_models.py` or `models.py`):

- `InteriorDesign/user_accounts/models.py` - Add organization_id to UserRole, create AuditLog, UserInvite, ImpersonationSession
- `InteriorDesign/model_base_class/IDBaseModel.py` - Add organization_id field

**Services** (`*_service.py`):

- `InteriorDesign/company_management/organization_service.py` - NEW: OrganizationService
- `InteriorDesign/company_management/branch_service.py` - NEW: BranchService  
- `InteriorDesign/user_accounts/user_service.py` - NEW: UserService
- `InteriorDesign/user_accounts/invite_service.py` - NEW: UserInviteService
- `InteriorDesign/user_accounts/audit_service.py` - NEW: AuditService
- `InteriorDesign/user_accounts/superadmin_service.py` - NEW: SuperadminService

**Views** (`*_views.py`):

- `InteriorDesign/company_management/organization_views.py` - NEW: OrganizationViewSet, OrganizationCreateView, OrganizationUpdateView
- `InteriorDesign/company_management/branch_views.py` - NEW: BranchViewSet, BranchCreateView, BranchUpdateView
- `InteriorDesign/user_accounts/user_views.py` - NEW: UserViewSet, UserCreateView, UserUpdateView
- `InteriorDesign/user_accounts/invite_views.py` - NEW: UserInviteViewSet, UserInviteCreateView, UserInviteAcceptView
- `InteriorDesign/user_accounts/audit_views.py` - NEW: AuditLogListView
- `InteriorDesign/user_accounts/superadmin_views.py` - NEW: TenantListView, TenantDetailView, ImpersonateStartView, ImpersonateStopView
- `InteriorDesign/user_accounts/views.py` - Update RegisterUserView, add audit logging to LoginView/LogoutView
- `InteriorDesign/user_accounts/role_views.py` - Add audit logging to role assignment

**Serializers** (`serializers.py`):

- `InteriorDesign/user_accounts/serializers.py` - Update UserRoleSerializer (add organization_id), create UserInviteSerializer, AuditLogSerializer, ImpersonationSessionSerializer
- `InteriorDesign/company_management/serializers.py` - Update OrganizationSerializer, BranchSerializer (if needed)

**Utilities** (`utils/*.py`):

- `InteriorDesign/utils/tenant_context.py` - NEW: Tenant filtering utility functions
- `InteriorDesign/utils/permissions.py` - Add AUDIT_VIEW permission code if missing

**Signals** (`signals.py`):

- `InteriorDesign/user_accounts/signals.py` - NEW: Django signals for automatic audit logging

**URLs** (`urls.py`):

- `InteriorDesign/user_accounts/urls.py` - Add user, invite, audit, superadmin routes
- `InteriorDesign/company_management/urls.py` - NEW: Add organization and branch routes

### Frontend Files

- `my-app/src/pages/admin/Organization/` - NEW: OrganizationPage.jsx
- `my-app/src/pages/admin/Branch/` - NEW: BranchPage.jsx
- `my-app/src/pages/admin/User/` - NEW: UserListPage.jsx, UserCreatePage.jsx, UserInvitePage.jsx
- `my-app/src/pages/admin/AuditLog/` - NEW: AuditLogPage.jsx
- `my-app/src/pages/superadmin/` - NEW: TenantListPage.jsx, ImpersonatePage.jsx
- `my-app/src/context/AuthContext.jsx` - Add organization_id, organization_name, impersonation state
- `my-app/src/hooks/useOrganizationAPI.js` - NEW: Organization API hooks
- `my-app/src/hooks/useBranchAPI.js` - NEW: Branch API hooks
- `my-app/src/hooks/useUserAPI.js` - Update: Add invite methods
- `my-app/src/routes/adminRouteConfig.jsx` - Add new admin routes

## Code Structure Compliance Checklist

All new code MUST follow these patterns:

✅ **Service Layer Pattern**:

- Static methods only
- Naming: `list_*()`, `get_*_id()`, `get_queryset()`, `create_*()`, `update_*()`
- Private methods prefixed with `_`
- Return QuerySet or model instances

✅ **View Pattern**:

- ViewSets for read-only (list, retrieve) with `IsAuthenticated` or `IsAdminOrHasPermission`
- Separate APIViews for create/update with `IsAdminOrHasPermission`
- Use `build_serialized_response()` for success responses
- Use `proccess_exception()` for error handling
- Call service methods, never direct ORM in views

✅ **Serializer Pattern**:

- Extend `IDBaseModelSerializer` for IDBaseModel children
- Use `PrimaryKeyRelatedField` for write-only foreign keys
- Use `StringRelatedField` or nested serializers for read-only relationships
- Override `validate_unique_scope()` for scoped validation
- Use `SerializerMethodField` for computed fields

✅ **Response Pattern**:

- Use `build_response_dic()` for data wrapping
- Use `build_response_msg()` for messages
- Use `build_serialized_response()` for serialized model responses
- Use `proccess_exception()` for all exception handling

✅ **File Organization**:

- Each app: `models.py`, `serializers.py`, `*_views.py`, `*_service.py`
- Utils in `utils/` directory
- Model base classes in `model_base_class/`