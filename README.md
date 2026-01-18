# Family Social Network - Django DRF Backend

A Django REST Framework backend for a family social network application with JWT authentication and PostgreSQL database.

## Quick Start

Get the project up and running in minutes:

### Backend Setup

1. **Start the database:**
   ```bash
   docker compose up -d
   ```

2. **Set up the backend:**
   ```bash
   cd family-app/backend
   python -m venv venv
   # Activate venv (Windows PowerShell: .\venv\Scripts\Activate.ps1)
   pip install -r requirements.txt
   cp .env.example .env
   python manage.py migrate
   python manage.py createsuperuser
   ```

3. **Start the server:**
   ```bash
   python manage.py runserver
   ```

4. **Verify it's working:**
   ```bash
   curl http://127.0.0.1:8000/health/
   ```

The backend server will be running at `http://127.0.0.1:8000/`

### Frontend Setup (Optional)

1. **Navigate to frontend directory:**
   ```bash
   cd family-app/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173/` (or the port shown in the terminal)

**Note:** Make sure the backend is running before starting the frontend. The frontend is configured to connect to `http://127.0.0.1:8000/` by default.

For detailed setup instructions, see the [Setup Instructions](#setup-instructions) section below.

## Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose
- pip (Python package manager)

## Setup Instructions

### 1. Start PostgreSQL Database

From the project root, start the PostgreSQL container:

```bash
docker compose up -d
```

Verify the container is running:

```bash
docker ps
```

### 2. Set Up Python Virtual Environment

Navigate to the backend directory and create a virtual environment:

```bash
cd family-app/backend
python -m venv venv
```

Activate the virtual environment:

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

Install all required Python packages:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if you need to change any default values (database credentials, etc.).

### 5. Run Database Migrations

Create migrations for the custom user model and other apps:

```bash
python manage.py makemigrations
```

Apply migrations to the database:

```bash
python manage.py migrate
```

### 6. Create Superuser

Create an admin user to access the Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password.

### 7. Run Development Server

Start the Django development server:

**Windows (Recommended):**
```powershell
# Use the provided PowerShell script to avoid autoreloader issues
.\start_server.ps1

# Or manually with --noreload flag:
python manage.py runserver 127.0.0.1:8000 --noreload
```

**macOS/Linux:**
```bash
python manage.py runserver
```

**Note for Windows users:** If the server hangs after "System check identified no issues", this is a known Windows issue with Django's autoreloader. Use the `--noreload` flag or the `start_server.ps1` script. With `--noreload`, you'll need to manually restart the server after code changes.

The server will be available at `http://127.0.0.1:8000/`

## Testing the Setup

### Health Check Endpoint

Test that the server is running:

```bash
curl http://127.0.0.1:8000/health/
```

Expected response:
```json
{"status": "ok"}
```

### JWT Authentication

Obtain JWT tokens using your superuser credentials:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

Expected response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Refresh the access token:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your_refresh_token"}'
```

### User Registration

Register a new user account:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123",
    "password_confirm": "securepass123",
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-01-15",
    "gender": "MALE"
  }'
```

Expected response:
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-01-15",
    "gender": "MALE",
    "date_joined": "2024-01-01T12:00:00Z"
  },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

**Note:** Registration automatically returns JWT tokens, so you can immediately use the access token for authenticated requests.

### User Profile Management

**Get Profile:**
```bash
curl -X GET http://127.0.0.1:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Profile:**
```bash
curl -X PATCH http://127.0.0.1:8000/api/auth/me/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "first_name": "Jane",
    "dob": "1992-05-20"
  }'
```

**Change Password:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/change-password/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "old_password": "oldpass123",
    "new_password": "newpass456",
    "new_password_confirm": "newpass456"
  }'
```

## Phase 1 API Usage

### Creating a Family

Create a new family (you will automatically become the admin). Your user profile information (first_name, last_name, dob, gender) will be used to create your Person node in the family:

```bash
curl -X POST http://127.0.0.1:8000/api/families/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name": "The Smith Family"}'
```

**Note:** The Person node for the family creator is automatically created using the user's profile data. Make sure your profile is up to date in `/api/auth/me/`.

Expected response:
```json
{
  "id": 1,
  "name": "The Smith Family",
  "code": "A1B2C3D4",
  "created_by": "username",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Listing Families

List all families you belong to:

```bash
curl -X GET http://127.0.0.1:8000/api/families/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "The Smith Family",
    "code": "A1B2C3D4",
    "created_by": "username",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
]
```

### Submitting a Join Request

Submit a request to join a family using the family code. You can either:
- Use an existing person: provide `chosen_person_id`
- Create a new person: provide `new_person_payload` (optional - if omitted, your user profile data will be used)
- Omit both: your user profile data will be used automatically

**Option 1: Join with existing person**
```bash
curl -X POST http://127.0.0.1:8000/api/families/join/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "A1B2C3D4",
    "chosen_person_id": 1
  }'
```

**Option 2: Join with new person (custom data)**
```bash
curl -X POST http://127.0.0.1:8000/api/families/join/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "A1B2C3D4",
    "new_person_payload": {
      "first_name": "John",
      "last_name": "Doe",
      "dob": "1990-01-01",
      "gender": "MALE"
    }
  }'
```

**Option 3: Join using profile data (no payload)**
```bash
curl -X POST http://127.0.0.1:8000/api/families/join/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "A1B2C3D4"
  }'
```

**Note:** If `new_person_payload` is not provided, your user profile data (first_name, last_name, dob, gender) will be used when the join request is approved.

Expected response:
```json
{
  "id": 1,
  "family": "The Smith Family",
  "requested_by": "username",
  "chosen_person_id": 1,
  "new_person_payload": null,
  "status": "PENDING",
  "reviewed_by": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Listing Join Requests (Admin Only)

List pending join requests for families where you are an admin:

```bash
curl -X GET http://127.0.0.1:8000/api/families/join-requests/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
[
  {
    "id": 1,
    "family": {
      "id": 1,
      "name": "The Smith Family",
      "code": "A1B2C3D4",
      ...
    },
    "requested_by": "username",
    "chosen_person_id": 1,
    "new_person_payload": null,
    "status": "PENDING",
    "reviewed_by": null,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
]
```

### Approving a Join Request (Admin Only)

Approve a join request:

```bash
curl -X POST http://127.0.0.1:8000/api/families/join-requests/1/approve/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "message": "Join request approved successfully",
  "membership_id": 1
}
```

### Creating a Person (Admin Only)

Create a new person in a family (only family admins can do this):

```bash
curl -X POST http://127.0.0.1:8000/api/graph/persons/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "family": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "dob": "1985-05-15",
    "gender": "FEMALE"
  }'
```

Expected response:
```json
{
  "id": 1,
  "family": 1,
  "first_name": "Jane",
  "last_name": "Smith",
  "dob": "1985-05-15",
  "gender": "FEMALE",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Listing Persons

List all persons in a family (family members can view):

```bash
curl -X GET "http://127.0.0.1:8000/api/graph/persons/?family_id=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
[
  {
    "id": 1,
    "family": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "dob": "1985-05-15",
    "gender": "FEMALE",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
]
```

## Phase 2 API Usage

### Creating a Relationship (Admin Only)

Create a relationship between two persons in the same family. `PARENT_OF` is directional; `SPOUSE_OF` creates two edges (A->B and B->A).

```bash
curl -X POST http://127.0.0.1:8000/api/graph/relationships/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "family_id": 1,
    "type": "PARENT_OF",
    "from_person_id": 1,
    "to_person_id": 2
  }'
```

### Fetching Topology

Get the family graph topology (nodes + edges). Spouse edges are not deduped.

```bash
curl -X GET "http://127.0.0.1:8000/api/graph/topology/?family_id=1&viewer_person_id=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "family_id": 1,
  "viewer_person_id": 1,
  "nodes": [
    {
      "id": 1,
      "family": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "dob": "1985-05-15",
      "gender": "FEMALE",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "edges": [
    { "from": 1, "to": 2, "type": "PARENT_OF" }
  ]
}
```

## Running Tests

Run tests using pytest:

```bash
cd family-app/backend
pytest
```

## Project Structure

See `CODE_STRUCTURE.md` for detailed documentation about the project structure, app responsibilities, and development conventions.

## API Endpoints

### Phase 0 (Basic Setup)
- `GET /health/` - Health check endpoint
- `POST /api/auth/token/` - Obtain JWT access and refresh tokens
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/register/` - User registration
- `GET /api/auth/me/` - Get current user profile
- `PATCH /api/auth/me/` - Update user profile
- `POST /api/auth/change-password/` - Change password
- `GET /admin/` - Django admin panel

### Phase 1 (Families & Graph)
- `GET /api/families/` - List families the user belongs to
- `POST /api/families/` - Create a new family
- `POST /api/families/join/` - Submit a join request to a family
- `GET /api/families/join-requests/` - List pending join requests (admin only)
- `POST /api/families/join-requests/<id>/approve/` - Approve a join request (admin only)
- `POST /api/families/join-requests/<id>/reject/` - Reject a join request (admin only)
- `GET /api/graph/persons/?family_id=<id>` - List persons in a family
- `POST /api/graph/persons/` - Create a new person (admin only)

### Phase 2 (Relationships & Topology)
- `POST /api/graph/relationships/` - Create a relationship (admin only)
- `GET /api/graph/topology/?family_id=<id>&viewer_person_id=<id>` - Graph topology (nodes + edges)

### Phase 3 (Feed)
- `POST /api/feed/posts/` - Create a new post
- `GET /api/feed/?family_id=<id>` - List posts for a family (with pagination)

## Feed API Usage

### Creating a Post

Create a new post in a family feed (family members only):

**Basic post:**
```bash
curl -X POST http://127.0.0.1:8000/api/feed/posts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "family_id": 1,
    "type": "POST",
    "text": "Hello everyone! How is everyone doing today?"
  }'
```

**Post with author person:**
```bash
curl -X POST http://127.0.0.1:8000/api/feed/posts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "family_id": 1,
    "author_person_id": 5,
    "type": "POST",
    "text": "This is a post from Jane Smith"
  }'
```

**Announcement with image:**
```bash
curl -X POST http://127.0.0.1:8000/api/feed/posts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "family_id": 1,
    "type": "ANNOUNCEMENT",
    "text": "Family reunion next month!",
    "image_url": "https://example.com/reunion-poster.jpg"
  }'
```

Expected response:
```json
{
  "id": 1,
  "family_id": 1,
  "family_name": "The Smith Family",
  "author_user": "username",
  "author_person_id": 5,
  "author_person_name": "Jane Smith",
  "type": "POST",
  "text": "Hello everyone! How is everyone doing today?",
  "image_url": null,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### Listing Posts

List posts for a family with pagination (family members only):

```bash
curl -X GET "http://127.0.0.1:8000/api/feed/?family_id=1&page=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "results": [
    {
      "id": 1,
      "family_id": 1,
      "family_name": "The Smith Family",
      "author_user": "username",
      "author_person_id": 5,
      "author_person_name": "Jane Smith",
      "type": "POST",
      "text": "Hello everyone! How is everyone doing today?",
      "image_url": null,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "count": 25,
  "page": 1,
  "page_size": 20,
  "total_pages": 2,
  "has_next": true,
  "has_previous": false
}
```

**Pagination:**
- Default page size: 20 posts per page
- Use `page` query parameter to navigate (e.g., `?family_id=1&page=2`)
- Posts are ordered by newest first (`-created_at`)

**Post Types:**
- `POST` - Regular post (default)
- `ANNOUNCEMENT` - Announcement post

**Optional Fields:**
- `author_person_id` - Associate post with a specific person in the family
- `image_url` - URL to an image for the post

## Development Notes

- The database runs in a Docker container and persists data in a volume
- All configuration uses environment variables from `.env`
- Custom user model is located in `apps.accounts.models.User`
- Business logic should be placed in `services/` modules within each app
- API endpoints follow the pattern `/api/<app>/...`

## Superadmin Management

### Granting Superadmin Status

To grant superadmin status to a user, you can use Django shell or admin panel:

**Option 1: Django Shell**
```bash
python manage.py shell
```
```python
from apps.accounts.models import User
user = User.objects.get(username='your_username')
user.is_superadmin = True
user.save()
```

**Option 2: Django Admin Panel**
1. Navigate to `http://127.0.0.1:8000/admin/`
2. Go to Users
3. Select the user
4. Check the "Is superadmin" checkbox
5. Save

### Superadmin Endpoints Summary

All endpoints under `/api/admin/` require superadmin status (`is_superadmin=True`).

**Health Check:**
- `GET /api/admin/health/` - System health check (returns status, time, db status)

**Statistics:**
- `GET /api/admin/stats/?days=30` - System statistics (users, families, posts, join requests)

**User Management:**
- `GET /api/admin/users/?q=&page=` - List users with search and pagination
- `POST /api/admin/users/<id>/disable/` - Disable a user
- `POST /api/admin/users/<id>/make-superadmin/` - Grant superadmin status
- `POST /api/admin/users/<id>/revoke-superadmin/` - Revoke superadmin status

**Family Management:**
- `GET /api/admin/families/?q=&page=` - List families with search and pagination
- `POST /api/admin/families/<id>/suspend/` - Suspend a family
- `POST /api/admin/families/<id>/unsuspend/` - Unsuspend a family

**Error Logs:**
- `GET /api/admin/logs/errors/?q=&page=&since_hours=` - List error logs
- `GET /api/admin/logs/errors/<id>/` - Get error log detail

**Audit Logs:**
- `GET /api/admin/logs/audit/?page=&action_type=&entity_type=&family_id=` - List audit logs

**Feedback Management:**
- `GET /api/admin/feedback/?page=&status=&type=` - List feedback
- `POST /api/admin/feedback/<id>/status/` - Update feedback status

**Note:** All admin endpoints require JWT authentication with a superadmin user token.

