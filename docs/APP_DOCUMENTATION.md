# Family Social Network - Application Documentation

This document explains what the app is, the end-to-end flow, database structure,
relationship logic, and key architecture decisions for the Family Social Network.

---

## 1) What the App Is

Family Social Network is a private, family-only social platform designed to keep
family interactions structured and relationship-aware. Unlike public social
networks or unstructured chat apps, this system models each family as a private
space with a relationship graph that can compute "who is who" dynamically
relative to the viewer.

Core goals:
- Private family-only social space.
- Relationship-aware identity (same person can appear as father/son/cousin).
- Minimal stored relationship labels; derived relationships are computed.
- Support for users belonging to multiple families.

---

## 2) High-Level Architecture

Backend:
- Django + Django REST Framework.
- JWT authentication.
- PostgreSQL database.
- Domain-driven app structure with services for business logic.

Frontend:
- React + Vite.
- Material UI for UI components.
- REST API integration via axios.
- Family context-aware routing.

Infrastructure:
- Docker Compose for Postgres.
- Local Python virtual environment for backend dev.

---

## 3) Core Concepts

### Users vs Persons
- User: an authenticated account (login identity).
- Person: a node in a family graph (can exist without a user).

A user can belong to multiple families and is linked to exactly one Person per
family through the FamilyMembership table.

### Families
- A family is a private, isolated space.
- Each family has a unique join code.
- Each family has at least one admin.

### Stored Relationships
Only core relationships are stored:
- PARENT_OF (directional).
- SPOUSE_OF (bidirectional; stored as two edges).

All other relationships are derived dynamically by graph traversal.

### User Profile Module

The User model extends AbstractUser with additional profile fields:
- `email` - Unique email address (required)
- `first_name` - First name (from AbstractUser)
- `last_name` - Last name (from AbstractUser)
- `dob` - Date of birth (optional)
- `gender` - Gender (MALE, FEMALE, OTHER, UNKNOWN, default: UNKNOWN)

**Profile Default Behavior:**
When creating a family or joining a family, if personal information is not explicitly provided, the system automatically uses the user's profile data:
- Family creation: The creator's Person node uses `user.first_name`, `user.last_name`, `user.dob`, and `user.gender`
- Join requests: If `new_person_payload` is not provided or is partial, missing fields are filled from the user's profile when the request is approved

This ensures consistency across families and reduces data entry for users who belong to multiple families.

**Endpoints:**
- `POST /api/auth/register/` - Register new user (public)
- `GET /api/auth/me/` - Get current user profile (authenticated)
- `PATCH /api/auth/me/` - Update user profile (authenticated, partial updates allowed)
- `POST /api/auth/change-password/` - Change password (authenticated)

---

## 4) Flow Structure (User Journeys)

### A) Authentication
1. User registers via `/api/auth/register/` or logs in via JWT endpoint.
2. Registration automatically returns JWT tokens for immediate use.
3. Access token stored in browser localStorage.
4. Token attached to API calls.

### B) First-Time User (Onboarding)
1. User registers account (or logs in if already registered).
2. User lands on onboarding if they have no families.
3. They can:
   - Create a new family (becomes admin, Person created from user profile).
   - Join an existing family using a code (Person created from user profile or provided data).
4. If joining, request stays pending until admin approval.
5. On approval, Person node is created using user profile data if not provided in join request.

### C) Family Selection
1. User selects an active family.
2. Active family ID stored in localStorage.
3. All family-specific views (Feed, Topology, Post) require active family.

### D) Family Feed
1. User views posts for active family.
2. User can create posts (and announcements).

### E) Relationship Management
1. Admin adds Person nodes.
2. Admin creates PARENT_OF or SPOUSE_OF relationships.
3. Topology API returns graph plus viewer-relative relationship labels.

### F) Join Request Approval
1. Admin sees pending join requests.
2. Admin approves or rejects.
3. On approval, membership + person is created or linked.

---

## 5) Database Structure (Conceptual)

### Core Tables
- User
- Family
- Person (belongs to one Family)
- FamilyMembership (User <-> Family <-> Person)
- JoinRequest
- Relationship (PARENT_OF, SPOUSE_OF)
- Post

### FamilyMembership (Critical)
Defines who the user is in each family.

User -- FamilyMembership -- Family
                  |
               Person

This enables:
- Multi-family membership per user.
- Viewer-relative relationship computation.

---

## 6) Relationship Structure and Logic

### Stored Relationship Types
- PARENT_OF: directional edge (parent -> child).
- SPOUSE_OF: stored in both directions.

### Validation Rules
Implemented in `apps.graph.services.relationship_validator`:
- No self-relationships.
- Both persons must belong to same family.
- No cycles in parent relationships.
- Maximum 2 parents per person (configurable).

### Derived Relationships
Derived relationships are computed by graph traversal:
- Shortest path between viewer and target.
- Relationship labels based on path shape, direction, and gender.

Examples:
- Parent of child -> "father/mother/parent".
- Child of parent -> "son/daughter/child".
- Siblings: common parent.
- Grandparent / grandchild.
- Aunt/uncle, niece/nephew.
- Cousin (2-up, 2-down pattern).

AI is not used for relationship computation; AI may later be used only for
natural-language phrasing.

---

## 7) Backend Code Structure

Root: `family-app/backend/`

Key apps:
- `apps.core` - health check, shared utilities.
- `apps.accounts` - custom User model, JWT endpoints, registration, profile management.
- `apps.families` - Family, Membership, JoinRequest and services.
- `apps.graph` - Person, Relationship, topology, relationship resolver.
- `apps.feed` - Post creation and feed listing.

Business logic lives in `services/` modules, views remain thin.

---

## 8) Frontend Code Structure

Root: `family-app/frontend/`

Key areas:
- `context/` for Auth + Family context.
- `services/` for API calls (axios instance with JWT).
- `pages/` for route-level components.
- `components/` for layout and reusable UI.

Routing:
- `/login` for auth.
- `/families` for family selection.
- `/feed`, `/topology`, `/post` for active family views.
- `/onboarding` and `/pending` for new users and join approvals.
- `/join` for manual join flow.
- `/admin/join-requests` for admin approvals.

---

## 9) API Surface (Summary)

Auth:
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/register/` - User registration
- `GET /api/auth/me/` - Get user profile
- `PATCH /api/auth/me/` - Update user profile
- `POST /api/auth/change-password/` - Change password

Families:
- `GET /api/families/`
- `POST /api/families/`
- `POST /api/families/join/`
- `GET /api/families/join-requests/`
- `POST /api/families/join-requests/<id>/approve/`
- `POST /api/families/join-requests/<id>/reject/`
- `GET /api/families/my-join-requests/`

Graph:
- `GET /api/graph/persons/?family_id=<id>`
- `POST /api/graph/persons/`
- `POST /api/graph/relationships/`
- `GET /api/graph/topology/?family_id=<id>&viewer_person_id=<id>`

Feed:
- `GET /api/feed/?family_id=<id>`
- `POST /api/feed/posts/`

---

## 10) Relationship Context (Viewer-Relative)

The same person is labeled differently based on the viewer:

Viewer -> Target -> Displayed label
- Child -> Parent -> Father/Mother
- Parent -> Child -> Son/Daughter
- Sibling -> Sibling -> Brother/Sister
- Cousin -> Cousin -> Cousin

The resolver uses:
- Graph traversal.
- Relationship direction (parent/child).
- Target gender.
- Path pattern length.

---

## 11) Design Principles

- Privacy-first (no public access).
- Minimal stored data.
- Derived intelligence over stored labels.
- Domain-driven backend (services, not fat views).
- Scalable without overengineering.

---

## 12) Future Extensions (Not MVP)

- AI phrasing for relationships.
- Elder-friendly UI mode.
- Family archive / timeline.
- Conflict resolution UI.
- Export family tree.
- Media albums.

---

## 13) Quick Navigation

- Setup & commands: `README.md`
- Code conventions: `CODE_STRUCTURE.md`
- Plans and historical docs: `docs/plans/README.md`
