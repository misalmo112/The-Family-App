# Family Social Network - Django DRF Backend

A Django REST Framework backend for a family social network application with JWT authentication and PostgreSQL database.

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

```bash
python manage.py runserver
```

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

## Phase 1 API Usage

### Creating a Family

Create a new family (you will automatically become the admin):

```bash
curl -X POST http://127.0.0.1:8000/api/families/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name": "The Smith Family"}'
```

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
- Create a new person: provide `new_person_payload`

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

**Option 2: Join with new person**
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

## Development Notes

- The database runs in a Docker container and persists data in a volume
- All configuration uses environment variables from `.env`
- Custom user model is located in `apps.accounts.models.User`
- Business logic should be placed in `services/` modules within each app
- API endpoints follow the pattern `/api/<app>/...`

