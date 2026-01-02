# Code Structure Documentation

This document describes the folder layout, app responsibilities, and development conventions for the Family Social Network Django DRF project.

## Folder Layout

```
family-app/
├── backend/                    # Django backend application
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment variables template
│   ├── config/                # Django project configuration
│   │   ├── __init__.py
│   │   ├── settings.py        # Main settings file
│   │   ├── urls.py            # Root URL configuration
│   │   ├── asgi.py            # ASGI configuration
│   │   └── wsgi.py            # WSGI configuration
│   └── apps/                  # Django applications
│       ├── __init__.py
│       ├── core/              # Core utilities and shared code
│       │   ├── __init__.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── views.py
│       │   └── urls.py
│       ├── accounts/          # Authentication and user management
│       │   ├── __init__.py
│       │   ├── apps.py
│       │   ├── models.py      # Custom User model
│       │   ├── serializers.py
│       │   ├── views.py
│       │   └── urls.py        # JWT auth endpoints
│       ├── families/          # Family entities and memberships
│       │   ├── __init__.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── services/      # Business logic for families
│       │       └── __init__.py
│       ├── graph/             # Person nodes and relationships
│       │   ├── __init__.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── services/      # Business logic for graph operations
│       │       └── __init__.py
│       └── feed/              # Posts and announcements
│           ├── __init__.py
│           ├── apps.py
│           ├── models.py
│           ├── serializers.py
│           ├── views.py
│           └── urls.py
├── frontend/                   # Frontend application (future)
├── docker-compose.yml          # PostgreSQL service configuration
├── README.md                   # Setup and run instructions
├── CODE_STRUCTURE.md           # This file
└── .gitignore                  # Git ignore rules
```

## App Responsibilities

### `core` - Core Utilities

**Purpose:** Shared utilities, health checks, and base functionality used across the application.

**Responsibilities:**
- Health check endpoint (`/health/`)
- Base mixins and utilities
- Shared helper functions
- Common decorators and permissions

**Current Implementation:**
- Health check view returning `{"status": "ok"}`

**Future Additions:**
- Base view classes
- Common mixins
- Utility functions

### `accounts` - Authentication and User Management

**Purpose:** Handle user authentication, user model, and JWT token management.

**Responsibilities:**
- Custom User model (extends `AbstractUser`)
- JWT token endpoints
- User registration (future)
- User profile management (future)
- Password reset (future)

**Current Implementation:**
- Custom `User` model in `models.py`
- JWT token obtain endpoint: `POST /api/auth/token/`
- JWT token refresh endpoint: `POST /api/auth/token/refresh/`

**Future Additions:**
- User registration serializer and view
- User profile endpoints
- Password reset functionality

### `families` - Family Entities and Memberships

**Purpose:** Manage family groups, memberships, join codes, and family-related operations.

**Responsibilities:**
- Family model and relationships
- Family membership management
- Join codes for family invitations
- Join requests (future)
- Family roles and permissions (future)

**Current Implementation:**
- Empty app structure (models, serializers, views, urls)
- `services/` directory for business logic

**Future Additions:**
- `Family` model
- `FamilyMembership` model
- Join code generation and validation
- Family invitation system

### `graph` - Person Nodes and Relationships

**Purpose:** Manage person entities and their relationships in a graph structure.

**Responsibilities:**
- Person node model
- Relationship types (parent, sibling, spouse, etc.)
- Graph traversal and queries
- Relationship topology endpoints (future)
- Family tree visualization data (future)

**Current Implementation:**
- Empty app structure (models, serializers, views, urls)
- `services/` directory for graph operations

**Future Additions:**
- `Person` model
- `Relationship` model
- Graph query services
- Topology calculation endpoints

### `feed` - Posts and Announcements

**Purpose:** Handle posts, announcements, and feed-related functionality.

**Responsibilities:**
- Post model
- Announcement model
- Feed aggregation
- Post comments (future)
- Post reactions (future)

**Current Implementation:**
- Empty app structure (models, serializers, views, urls)

**Future Additions:**
- `Post` model
- `Announcement` model
- Feed endpoints
- Comment and reaction models

## Development Conventions

### Business Logic Organization

**Rule:** Keep business logic out of views. Use service modules in `services/` directories.

**Pattern:**
- Views should be thin and delegate to services
- Services contain the actual business logic
- Services can be imported and reused across views

**Example Structure:**
```
apps/families/
├── models.py          # Data models
├── serializers.py     # Request/response serialization
├── views.py           # Thin view layer
├── urls.py            # URL routing
└── services/
    ├── __init__.py
    └── family_service.py  # Business logic
```

**Example Usage:**
```python
# apps/families/services/family_service.py
def create_family(name, creator):
    # Business logic here
    pass

# apps/families/views.py
from apps.families.services.family_service import create_family

class FamilyCreateView(APIView):
    def post(self, request):
        family = create_family(request.data['name'], request.user)
        # Return response
```

### Serializers as Boundaries

**Rule:** Serializers define the request/response boundaries for API endpoints.

**Pattern:**
- Use serializers for input validation
- Use serializers for output formatting
- Keep serializers focused on data transformation

### URL Routing Conventions

**Rule:** Each app exposes its URLs through `urls.py` and is included in `config/urls.py`.

**Pattern:**
- App URLs: `apps/<app>/urls.py`
- Root URLs: `config/urls.py` includes app URLs
- API endpoints follow pattern: `/api/<app>/...`

**Current Routing:**
- `/health/` → `apps.core.urls`
- `/api/auth/...` → `apps.accounts.urls`
- Future: `/api/families/...` → `apps.families.urls`
- Future: `/api/graph/...` → `apps.graph.urls`
- Future: `/api/feed/...` → `apps.feed.urls`

### Environment Variables

**Rule:** All configuration uses environment variables loaded from `.env`.

**Pattern:**
- Never hardcode secrets or configuration
- Use `python-dotenv` to load `.env` file
- Provide `.env.example` with default values
- Document required variables in README

**Current Variables:**
- `DEBUG` - Debug mode flag
- `SECRET_KEY` - Django secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Database config
- `ALLOWED_HOSTS` - Allowed host list
- `CORS_ALLOWED_ORIGINS` - CORS allowed origins

### Database Configuration

**Rule:** Use PostgreSQL in development via Docker Compose.

**Pattern:**
- Database runs in Docker container
- Connection configured via environment variables
- Data persists in Docker volume

### Testing Conventions

**Rule:** Tests mirror app structure in `tests/` directories.

**Pattern:**
```
apps/<app>/
├── models.py
├── views.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_views.py
```

**Testing Framework:**
- Use `pytest` and `pytest-django`
- Run tests with: `pytest`
- Tests should be isolated and independent

## API Routing Conventions

### Current Endpoints

- `GET /health/` - Health check endpoint
- `POST /api/auth/token/` - Obtain JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token

### Future Endpoint Patterns

- `/api/families/` - Family CRUD operations
- `/api/families/<id>/members/` - Family members
- `/api/families/<id>/join-code/` - Join code management
- `/api/graph/persons/` - Person nodes
- `/api/graph/relationships/` - Relationships
- `/api/graph/topology/` - Graph topology queries
- `/api/feed/posts/` - Posts
- `/api/feed/announcements/` - Announcements

## Import Conventions

**Rule:** Apps are imported as `apps.<appname>`.

**Pattern:**
```python
from apps.accounts.models import User
from apps.core.views import health_check
from apps.families.services.family_service import create_family
```

## Model Conventions

**Rule:** Custom user model must be defined before any other models that reference it.

**Pattern:**
- Custom user model in `apps.accounts.models.User`
- Set `AUTH_USER_MODEL = 'accounts.User'` in settings
- Run migrations for accounts app first

## Authentication

**Rule:** JWT authentication is the default authentication method.

**Pattern:**
- All API endpoints require authentication by default
- Use `@permission_classes([AllowAny])` for public endpoints
- JWT tokens obtained via `/api/auth/token/`
- Include token in Authorization header: `Bearer <access_token>`

## Notes for Future Development

1. **Custom User Model:** Already implemented. Any new models that reference User should use `settings.AUTH_USER_MODEL` or `get_user_model()`.

2. **Services Pattern:** When adding business logic, create service modules in `services/` directories rather than putting logic directly in views.

3. **Serializers:** Create serializers for all API endpoints to handle validation and data transformation.

4. **Permissions:** Use DRF permissions classes to control access. Consider creating custom permission classes in `apps.core` if needed.

5. **Testing:** Write tests for all new features. Follow the testing conventions above.

6. **Migrations:** Always create migrations for model changes: `python manage.py makemigrations`

7. **Environment:** Never commit `.env` file. Always update `.env.example` when adding new environment variables.

