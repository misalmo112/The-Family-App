---
name: Add Navigation Links
overview: "Add navigation links/buttons to the Admin Sidebar for all new multi-tenant features: Organization Management, Branch Management, User Management, Audit Logs, and Superadmin Console."
todos:
  - id: update-icons
    content: Add new icons for Organization, Branch, Users, Audit, Superadmin sections
    status: completed
  - id: update-translations
    content: Add translation keys for new navigation items
    status: completed
  - id: update-sidebar
    content: Add new sections to AdminSidebar with role-based visibility
    status: completed
---

# Add Navigation Links for Multi-Tenant Features

## Current State

The sidebar (`AdminSidebar.jsx`) currently has two sections:

- **Geography Management**: Countries, States
- **Finance Management**: Currencies

## Changes Required

### 1. Update Icons (`my-app/src/utils/icons.js`)

Add new icons for the new sections:

- Organization/Business icon (🏢)
- User Management icon (👥 - already exists)
- Audit/System icon (📋)
- Superadmin icon (🔐)
- Branch icon (🏬)
- Invite icon (✉️)

### 2. Update Translations (`my-app/src/locales/en.json`)

Add translation keys for:

- Organization management, branch management
- User invite, audit logs
- Superadmin sections (tenants, impersonate)

### 3. Update AdminSidebar (`my-app/src/components/Layout/admin/AdminSidebar.jsx`)

Add new navigation sections:

**Organization Management** (Admin + Superadmin)

- Organizations → `/admin/organizations`
- Branches → `/admin/branches`

**User Management** (Admin + Superadmin)

- Users → `/admin/users`
- User Invites → `/admin/users/invite`

**System** (Admin + Superadmin)

- Audit Logs → `/admin/audit-logs`

**Superadmin Console** (Superadmin only)

- Tenant List → `/admin/superadmin/tenants`
- Impersonate → `/admin/superadmin/impersonate`

### 4. Role-Based Visibility

- Some sections should only be visible to superadmins
- Need to integrate with AuthContext to check user roles

## Files to Modify

- [my-app/src/utils/icons.js](my-app/src/utils/icons.js) - Add new icons
- [my-app/src/locales/en.json](my-app/src/locales/en.json) - Add translations
- [my-app/src/components/Layout/admin/AdminSidebar.jsx](my-app/src/components/Layout/admin/AdminSidebar.jsx) - Add sections