---
name: Create Normal User Account
overview: Create a standalone Python script that creates a normal user account under the Alpha Computer LLC organization with the normal_user role, enabling them to view currency, country, and state data.
todos:
  - id: create_script
    content: Create InteriorDesign/create_normal_user.py script with Django setup and imports
    status: pending
  - id: get_organization
    content: Add logic to get Alpha Computer LLC organization (with fallback creation if needed)
    status: pending
  - id: get_branch
    content: Add logic to get Alpha Computer LLC HQ branch (with fallback creation if needed)
    status: pending
  - id: get_role
    content: Add logic to get or create normal_user role with correct permissions
    status: pending
  - id: create_user
    content: Create user account with email, password, name, organization, branch, and role assignment
    status: pending
  - id: add_output
    content: Add print statements for confirmation and display user credentials at the end
    status: pending
---

# Plan: Create Normal User Account for Alpha Computer LLC

## Overview

Create a Python script that sets up a normal user account in the Alpha Computer LLC organization with the `normal_user` role, which has permissions to view currency, country, and state data.

## Implementation Steps

### 1. Create Script File

- **File**: `InteriorDesign/create_normal_user.py`
- Standalone script similar to `load_initial_data.py` and `setup_test_user.py`
- Setup Django environment and import required models

### 2. Script Logic

The script will:

1. **Setup Django environment** - Initialize Django settings
2. **Get Alpha Computer LLC organization** - Query by name "Alpha Computer LLC"
3. **Get Alpha Computer LLC HQ branch** - Query by name "Alpha Computer LLC HQ"
4. **Get or create normal_user role** - Ensure the role exists with correct permissions from `PERMISSION_GROUPS["normal_user"]`
5. **Create user account** with:

   - Email: `normaluser@alphacomputer.com`
   - Password: `NormalUser123!`
   - First name: `Normal`
   - Last name: `User`
   - Organization: Alpha Computer LLC
   - Branch: Alpha Computer LLC HQ
   - Role: normal_user
   - Phone number: Optional (can be empty or a placeholder)
   - is_active: True

### 3. User Creation Details

- Use `UserRole.objects.create_user()` or `UserService.create_user()`
- Set password using `user.set_password()`
- Assign role using `user.roles.add(normal_user_role)`
- Handle case where user already exists (get_or_create pattern)

### 4. Error Handling

- Check if organization exists, create if missing (fallback)
- Check if branch exists, create if missing (fallback)
- Check if role exists, create if missing
- Print success/error messages

### 5. Output

- Print confirmation messages for each step
- Display user credentials at the end
- Return user object for potential programmatic use

## Files to Create/Modify

### New File

- `InteriorDesign/create_normal_user.py` - Main script to create the normal user

## Dependencies

- Uses existing models: `UserRole`, `Role`, `Organization`, `Branch`
- Uses existing services: `UserService` (optional)
- Uses existing permissions: `PERMISSION_GROUPS` from `utils.permissions`

## Testing

After running the script:

1. Verify user can log in with provided credentials
2. Verify user is assigned to Alpha Computer LLC organization
3. Verify user has normal_user role
4. Verify user can access currency, country, and state endpoints via API

## Usage

```bash
# From project root
python InteriorDesign/create_normal_user.py
```

Or from Django shell:

```python
exec(open('InteriorDesign/create_normal_user.py').read())
```