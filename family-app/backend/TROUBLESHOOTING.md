# Troubleshooting Guide

## Server Hangs After System Checks

### Symptom
When running `python manage.py runserver`, the server hangs after showing:
```
System check identified no issues (0 silenced).
```

### Root Cause
The server is trying to connect to PostgreSQL but the connection times out. This is typically a Docker port forwarding issue on Windows.

### Solutions

#### 1. Check Docker Port Mapping
Verify that port 5432 is properly mapped:
```powershell
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

You should see `0.0.0.0:5432->5432/tcp` for the postgres container.

#### 2. Restart Docker Container
```powershell
docker restart family_postgres
```

Wait for the container to be healthy:
```powershell
docker ps --filter "name=family_postgres"
```

#### 3. Check if Port is Listening
```powershell
netstat -an | findstr :5432
```

If nothing is shown, the port mapping isn't working.

#### 4. Restart Docker Desktop
Sometimes Docker Desktop's port forwarding gets stuck. Try:
1. Close Docker Desktop completely
2. Restart Docker Desktop
3. Wait for containers to start
4. Try connecting again

#### 5. Check Docker Desktop Settings
- Open Docker Desktop
- Go to Settings > Resources > Network
- Ensure port forwarding is enabled
- Try resetting network settings if needed

#### 6. Test Database Connection Directly
```powershell
cd family-app/backend
python -c "import psycopg; conn = psycopg.connect(host='localhost', port=5432, dbname='family_app', user='family_user', password='family_pass', connect_timeout=5); print('OK'); conn.close()"
```

If this times out, the port mapping isn't working.

#### 7. Alternative: Use Docker Network IP
If localhost doesn't work, try using the container's IP:
```powershell
# Get container IP
$ip = docker inspect family_postgres --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
echo $ip

# Update .env file with this IP as DB_HOST
```

#### 8. Check Windows Firewall
Windows Firewall might be blocking the connection:
1. Open Windows Defender Firewall
2. Check if port 5432 is allowed
3. Temporarily disable firewall to test (remember to re-enable!)

#### 9. Verify Database Container is Healthy
```powershell
docker exec family_postgres pg_isready -U family_user -d family_app
```

This should return `family_postgres:5432 - accepting connections`

### If All Else Fails

1. **Recreate the container:**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

2. **Check Docker Desktop logs:**
   - Open Docker Desktop
   - Check the logs for any errors

3. **Use SQLite for development (temporary):**
   If you need to work immediately, you can temporarily switch to SQLite in `config/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'db.sqlite3',
       }
   }
   ```
   **Note:** This is only for development. Don't commit this change.
