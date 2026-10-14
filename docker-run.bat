@echo off
echo ===================================================
echo Starting LIYUID Full-Stack Application via Docker
echo ===================================================
echo Checking Docker Desktop status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop is not running!
    echo Please launch Docker Desktop from your Windows Start Menu,
    echo wait until it shows "Docker Desktop is running", and then run this script again.
    echo.
    pause
    exit /b 1
)

echo Docker Desktop is active!
echo Starting PostgreSQL (PostGIS + pgvector), Redis, FastAPI Backend, Celery AI Worker, and Next.js Frontend...
docker compose up --build
pause
