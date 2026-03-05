# The Family App

A **family social network** with a Django REST backend (JWT auth, PostgreSQL) and an optional React frontend. Create families, manage members and relationships, join via invite codes, and use a family feed (posts, announcements, comments).

---

## Contents

- [Quick start](#quick-start)
- [Prerequisites](#prerequisites)
- [Setup (step by step)](#setup-step-by-step)
- [Testing the setup](#testing-the-setup)
- [Running the app](#running-the-app)
- [API overview](#api-overview)
- [Running tests](#running-tests)
- [Project structure](#project-structure)
- [Development notes](#development-notes)
- [Agent prompts](#agent-prompts)

---

## Quick start

From the **project root**:

1. **Start the database**
   ```bash
   docker compose up -d
   ```

2. **Backend**
   ```bash
   cd family-app/backend
   python -m venv venv
   # Activate: Windows PowerShell → .\venv\Scripts\Activate.ps1  |  macOS/Linux → source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```
   Backend: **http://127.0.0.1:8000/**

3. **Frontend (optional)**
   ```bash
   cd family-app/frontend
   npm install
   npm run dev
   ```
   Frontend: **http://localhost:5173/** (ensure backend is running first)

---

## Prerequisites

- **Python** 3.11+
- **Docker** and **Docker Compose** (for PostgreSQL)
- **Node.js** and **npm** (only if you run the frontend)

---

## Setup (step by step)

### 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d
docker ps   # verify container is running
```

### 2. Backend: virtual environment and dependencies

```bash
cd family-app/backend
python -m venv venv
```

Activate the venv:

| Platform | Command |
|----------|---------|
| Windows (PowerShell) | `.\venv\Scripts\Activate.ps1` |
| Windows (CMD) | `venv\Scripts\activate.bat` |
| macOS / Linux | `source venv/bin/activate` |

Then:

```bash
pip install -r requirements.txt
```

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env` if you need different database credentials or settings. Defaults (e.g. `family_user` / `family_pass`) are for **local development only**.

### 4. Database migrations

```bash
python manage.py migrate
```

(Use `python manage.py makemigrations` only when you change models.)

### 5. Create an admin user

```bash
python manage.py createsuperuser
```

Use this account for Django admin and for JWT login.

### 6. Run the backend server

**Windows (recommended, avoids autoreloader issues):**
```powershell
.\start_server.ps1
# or: python manage.py runserver 127.0.0.1:8000 --noreload
```

**macOS / Linux:**
```bash
python manage.py runserver
```

Server: **http://127.0.0.1:8000/**

---

## Testing the setup

- **Health:** `curl http://127.0.0.1:8000/health/` → `{"status": "ok"}`
- **JWT login:**  
  `curl -X POST http://127.0.0.1:8000/api/auth/token/ -H "Content-Type: application/json" -d '{"username":"YOUR_USER","password":"YOUR_PASS"}'`
- **Registration:**  
  `POST /api/auth/register/` with JSON body (username, email, password, password_confirm, first_name, last_name, dob, gender). See [API overview](#api-overview) for more.

---

## Running the app

- **Backend only:** run Django as in [Setup step 6](#6-run-the-backend-server); use API with curl/Postman or the frontend elsewhere.
- **Backend + frontend:** start backend first, then in `family-app/frontend` run `npm run dev`. Frontend talks to `http://127.0.0.1:8000/` by default.

---

## API overview

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/token/`, `POST /api/auth/token/refresh/`, `POST /api/auth/register/`, `GET/PATCH /api/auth/me/`, `POST /api/auth/change-password/` |
| **Families** | `GET/POST /api/families/`, `POST /api/families/join/`, `GET /api/families/join-requests/`, approve/reject join requests |
| **Graph** | `GET/POST /api/graph/persons/?family_id=`, `POST /api/graph/relationships/`, `GET /api/graph/topology/?family_id=&viewer_person_id=` |
| **Feed** | `POST /api/feed/posts/`, `GET /api/feed/?family_id=` (paginated) |
| **Admin** | `GET /api/admin/health/`, stats, users, families, logs, feedback (superadmin only) |

Full request/response examples and curl samples are in the sections below (e.g. [Phase 1 API usage](#phase-1-api-usage), [Feed API usage](#feed-api-usage)). See also `CODE_STRUCTURE.md` for app layout and conventions.

### Phase 1 API usage

- **Create family:** `POST /api/families/` with `{"name": "The Smith Family"}` (Bearer token). You become admin; a Person is created from your profile.
- **Join family:** `POST /api/families/join/` with `{"code": "FAMILY_CODE"}` (and optional `chosen_person_id` or `new_person_payload`).
- **List join requests (admin):** `GET /api/families/join-requests/`. Approve: `POST /api/families/join-requests/<id>/approve/`.
- **Persons:** `POST /api/graph/persons/` (admin), `GET /api/graph/persons/?family_id=<id>`.

### Phase 2 API usage

- **Create relationship:** `POST /api/graph/relationships/` with `family_id`, `type` (e.g. `PARENT_OF`, `SPOUSE_OF`), `from_person_id`, `to_person_id`.
- **Topology:** `GET /api/graph/topology/?family_id=&viewer_person_id=`.

### Feed API usage

- **Create post:** `POST /api/feed/posts/` with `family_id`, `type` (`POST` or `ANNOUNCEMENT`), `text`, optional `author_person_id`, `image_url`.
- **List posts:** `GET /api/feed/?family_id=1&page=1` (paginated, newest first).

### Superadmin

- Grant superadmin: Django admin → Users → user → check “Is superadmin”, or via shell: `User.objects.get(username='...').is_superadmin = True` then `save()`.
- Admin API: `/api/admin/` (health, stats, users, families, logs, feedback). All require JWT with a superadmin user.

---

## Running tests

From `family-app/backend` (with venv active and DB running):

```bash
pytest
```

---

## Project structure

- **family-app/backend** — Django project (`config/`), apps: `accounts`, `families`, `graph`, `feed`, `core`. See `CODE_STRUCTURE.md`.
- **family-app/frontend** — React app (Vite).
- **docker-compose.yml** — PostgreSQL for local development.

---

## Development notes

- Database data is stored in a Docker volume.
- Config is via `.env`; never commit real `.env` (use `.env.example` as template).
- Custom user model: `apps.accounts.models.User`.
- Put business logic in `services/` inside each app; APIs under `/api/<app>/...`.

---

## Agent prompts

Copy-paste these prompts for an AI or script to set up or run the project. Adjust paths and platform if needed.

### First-time setup (full)

```
Set up The Family App from scratch on this machine. Steps:
1. From the project root, run: docker compose up -d
2. In family-app/backend: create a Python venv, activate it, run: pip install -r requirements.txt
3. Copy .env.example to .env in family-app/backend
4. Run: python manage.py migrate
5. Run: python manage.py createsuperuser (use interactive prompts or non-interactive if supported)
6. Optionally in family-app/frontend: npm install

Do not overwrite an existing .env. If .env already exists, skip copying .env.example. Confirm when done what URLs to use (backend 127.0.0.1:8000, frontend localhost:5173).
```

### Run backend only

```
Start the Family App backend. From family-app/backend with virtual environment activated, run the Django dev server (e.g. python manage.py runserver or .\start_server.ps1 on Windows). Ensure Docker PostgreSQL is up (docker compose up -d from project root) and .env exists. Tell me the URL (e.g. http://127.0.0.1:8000/) when ready.
```

### Run backend and frontend

```
Start the Family App backend and frontend. First start the Django server from family-app/backend (venv active, DB running). Then start the frontend from family-app/frontend with npm run dev. Report both URLs (backend and frontend) when ready.
```

### Create demo account (optional)

```
In family-app/backend with venv active and Django server not required: run python manage.py create_demo_account. This creates a demo user (username: demo, password: Demo123!) with sample families and data. If the demo user already exists, use --reset to remove and recreate, or run without --reset to leave existing data. Confirm when done.
```

### Troubleshoot “database connection failed”

```
The Family App backend cannot connect to PostgreSQL. Check: (1) docker compose up -d from project root, (2) .env in family-app/backend has DB_HOST=localhost, DB_PORT=5432, DB_NAME=family_app, DB_USER=family_user, DB_PASSWORD=family_pass (or match your docker-compose DB settings), (3) no firewall blocking port 5432. See family-app/backend/TROUBLESHOOTING.md for more. Suggest concrete commands to verify the DB is reachable (e.g. python -c "import psycopg; conn = psycopg.connect(...); conn.close()").
```

---

For detailed API examples (curl for auth, families, graph, feed), see the sections above or the full endpoint list under [API overview](#api-overview). For code layout and conventions, see `CODE_STRUCTURE.md`.
