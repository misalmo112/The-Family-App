# PowerShell script to start Django development server on Windows
# This script bypasses Windows autoreloader issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Django Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "WARNING: Virtual environment not detected." -ForegroundColor Yellow
    Write-Host "It's recommended to activate your virtual environment first:" -ForegroundColor Yellow
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        exit
    }
}

# Check database connection first
Write-Host "Checking database connection..." -ForegroundColor Cyan
try {
    python -c "import psycopg; conn = psycopg.connect(host='localhost', port=5432, dbname='family_app', user='family_user', password='family_pass', connect_timeout=3); conn.close(); print('OK')" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Database connection failed!" -ForegroundColor Yellow
        Write-Host "The server may hang. Check TROUBLESHOOTING.md for solutions." -ForegroundColor Yellow
        Write-Host ""
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne "y") {
            exit
        }
    }
} catch {
    Write-Host "[WARNING] Could not test database connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting server on http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python manage.py runserver 127.0.0.1:8000 --noreload
