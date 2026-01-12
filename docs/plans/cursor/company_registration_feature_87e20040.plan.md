---
name: Company Registration Feature
overview: Add a "Register New Company" button on the login page that allows organizations to self-register. After registration, they can login as organization admins (businessadmin role), and superadmins can view all registered organizations in the tenant list panel.
todos:
  - id: backend-service
    content: Create OrganizationRegistrationService with register_organization_with_admin method
    status: pending
  - id: backend-serializer
    content: Create OrganizationRegistrationSerializer combining organization and admin user fields
    status: pending
  - id: backend-view
    content: Create OrganizationRegistrationView with AllowAny permission
    status: pending
  - id: backend-url
    content: Add /api/register/company URL route
    status: pending
  - id: backend-role-helper
    content: Add get_role_by_type method to RoleService
    status: pending
  - id: frontend-registration-page
    content: Create CompanyRegistration.jsx component with form for organization and admin user data
    status: pending
  - id: frontend-api-hook
    content: Add registerCompany function to useOrganizationAPI hook
    status: pending
  - id: frontend-login-button
    content: Add 'Register New Company' button to Login page
    status: pending
  - id: frontend-route
    content: Add /register/company route to RouteConfig
    status: pending
  - id: frontend-translations
    content: Add translation keys for registration UI
    status: pending
---

# Company Registration Feature Implementation

## Overview

Add organization self-registration functionality that allows companies to register themselves, creating both the organization and an admin user account. The registered organization will be immediately active and visible in the superadmin tenant panel.

## Architecture Flow

```
Login Page → Register Company Button → Registration Form
    ↓
POST /api/register/company (Public endpoint)
    ↓
Backend: OrganizationRegistrationView
    ├─> Create Organization (via OrganizationService)
    ├─> Create User with businessadmin role (via UserService)
    └─> Link user to organization
    ↓
Return success → Redirect to Login
```

## Implementation Details

### 1. Backend Changes

#### 1.1 Create Organization Registration Service

**File:** `InteriorDesign/company_management/organization_registration_service.py` (NEW)

- Create `OrganizationRegistrationService` class following existing service pattern
- Method: `register_organization_with_admin(organization_data, admin_user_data)`
  - Creates organization using `OrganizationService.create_organization()`
  - Creates user with businessadmin role using `UserService.create_user()`
  - Links user to the created organization
  - Returns both organization and user instances
  - Handles transaction rollback on errors

#### 1.2 Create Organization Registration Serializer

**File:** `InteriorDesign/company_management/serializers.py` (MODIFY)

- Add `OrganizationRegistrationSerializer` class
  - Nested serializer combining organization and admin user fields
  - Organization fields: name, code, address, city, phone, email, website, organization_type, state_id, country_id
  - Admin user fields: first_name, last_name, email, password
  - Validation: ensure admin email is unique, password strength, organization code uniqueness

#### 1.3 Create Organization Registration View

**File:** `InteriorDesign/company_management/organization_views.py` (MODIFY)

- Add `OrganizationRegistrationView(generics.CreateAPIView)`
  - Permission: `AllowAny` (public endpoint)
  - Serializer: `OrganizationRegistrationSerializer`
  - Uses `OrganizationRegistrationService.register_organization_with_admin()`
  - Returns serialized organization and user data
  - Error handling with proper response format

#### 1.4 Add URL Route

**File:** `InteriorDesign/company_management/urls.py` (MODIFY)

- Add route: `path("register/company", organization_views.OrganizationRegistrationView.as_view(), name="organization-register")`

#### 1.5 Get BusinessAdmin Role Helper

**File:** `InteriorDesign/user_accounts/role_service.py` (MODIFY)

- Add method: `get_role_by_type(role_type: str) -> Role`
  - Retrieves role by role type string (e.g., "businessadmin")
  - Used during registration to assign role

### 2. Frontend Changes

#### 2.1 Update Login Page

**File:** `my-app/src/pages/Login/Login.jsx` (MODIFY)

- Add "Register New Company" button below the login form
- Button should navigate to `/register/company` route
- Style consistently with existing login UI

#### 2.2 Create Company Registration Page

**File:** `my-app/src/pages/Register/CompanyRegistration.jsx` (NEW)

- Create registration form component
- Form sections:
  - **Organization Information:**
    - Name (required)
    - Code (required)
    - Address (required)
    - City (required)
    - Phone (required)
    - Email (required)
    - Website (optional)
    - Organization Type (dropdown, required)
    - Country (dropdown, required)
    - State (dropdown, required, depends on country)
  - **Admin User Information:**
    - First Name (required)
    - Last Name (required)
    - Email (required, must match organization email or be different)
    - Password (required, with strength indicator)
    - Confirm Password (required)
- Form validation:
  - Client-side validation for all required fields
  - Email format validation
  - Password match validation
  - Password strength requirements
- On submit:
  - Call registration API
  - Show success message
  - Redirect to login page after 2 seconds
- Error handling:
  - Display validation errors
  - Show API error messages

#### 2.3 Create Registration API Hook

**File:** `my-app/src/hooks/useOrganizationAPI.js` (MODIFY)

- Add `registerCompany(organizationData, adminUserData)` function
  - POST to `/api/register/company`
  - Combines organization and admin data in request body
  - Returns response with status and data/error

#### 2.4 Add Route Configuration

**File:** `my-app/src/routes/RouteConfig.jsx` (MODIFY)

- Add public route: `/register/company` → `CompanyRegistration` component
- Ensure route is accessible without authentication

#### 2.5 Fetch Countries/States for Dropdowns

**File:** `my-app/src/pages/Register/CompanyRegistration.jsx` (NEW)

- Use existing `useCountryAPI` and `useStateAPI` hooks
- Fetch countries on component mount
- Fetch states when country is selected
- Populate dropdowns with fetched data

### 3. Super Admin Panel (Already Exists)

**File:** `my-app/src/pages/superadmin/TenantListPage.jsx` (NO CHANGES NEEDED)

- Existing `TenantListView` already lists all organizations
- Newly registered organizations will automatically appear in this list
- Superadmin can view, update, and manage registered organizations

### 4. Translation Keys

**File:** `my-app/src/locales/en.json` (MODIFY)

- Add translation keys:
  - `register_new_company`: "Register New Company"
  - `company_registration`: "Company Registration"
  - `organization_information`: "Organization Information"
  - `admin_user_information`: "Admin User Information"
  - `confirm_password`: "Confirm Password"
  - `passwords_do_not_match`: "Passwords do not match"
  - `registration_success`: "Registration successful! Redirecting to login..."
  - `registration_failed`: "Registration failed. Please try again."

## Code Structure Compliance

### Backend Pattern (Following Existing Structure):

```
Views (organization_views.py)
    ↓
Services (organization_registration_service.py)
    ↓
Models (Organization, UserRole)
```

### Frontend Pattern (Following Existing Structure):

```
Pages (CompanyRegistration.jsx)
    ↓
Hooks (useOrganizationAPI.js)
    ↓
API Client (useAPI.js)
```

## Security Considerations

1. **Public Endpoint:** Registration endpoint uses `AllowAny` permission - ensure proper validation
2. **Password Security:** Enforce password strength requirements
3. **Email Uniqueness:** Validate admin email is unique across all users
4. **Organization Code:** Validate organization code uniqueness
5. **Rate Limiting:** Consider adding rate limiting to prevent abuse (future enhancement)

## Testing Checklist

1. Test organization registration with valid data
2. Test validation errors (missing fields, invalid email, etc.)
3. Test password mismatch
4. Test duplicate organization code
5. Test duplicate admin email
6. Verify organization appears in superadmin tenant list
7. Verify admin user can login after registration
8. Verify admin user has businessadmin role
9. Test error handling and user feedback

## Files to Create/Modify

### New Files:

- `InteriorDesign/company_management/organization_registration_service.py`
- `my-app/src/pages/Register/CompanyRegistration.jsx`

### Modified Files:

- `InteriorDesign/company_management/serializers.py`
- `InteriorDesign/company_management/organization_views.py`
- `InteriorDesign/company_management/urls.py`
- `InteriorDesign/user_accounts/role_service.py`
- `my-app/src/pages/Login/Login.jsx`
- `my-app/src/hooks/useOrganizationAPI.js`
- `my-app/src/routes/RouteConfig.jsx`
- `my-app/src/locales/en.json`