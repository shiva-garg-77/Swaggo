@echo off
REM 🚀 SWAGGO DEPLOYMENT SCRIPT (Windows)
REM Comprehensive deployment automation for SwagGo application on Windows

setlocal enabledelayedexpansion

REM Default values
set ENVIRONMENT=development
set BUILD_ONLY=false
set SKIP_TESTS=false
set SKIP_BACKUP=false
set FORCE_DEPLOY=false

REM Parse command line arguments
:parse_args
if "%1"=="" goto start
if "%1"=="-e" goto set_environment
if "%1"=="--environment" goto set_environment
if "%1"=="-b" goto set_build_only
if "%1"=="--build-only" goto set_build_only
if "%1"=="-s" goto set_skip_tests
if "%1"=="--skip-tests" goto set_skip_tests
if "%1"=="-k" goto set_skip_backup
if "%1"=="--skip-backup" goto set_skip_backup
if "%1"=="-f" goto set_force_deploy
if "%1"=="--force" goto set_force_deploy
if "%1"=="-h" goto show_usage
if "%1"=="--help" goto show_usage
echo Unknown option: %1
goto show_usage

:set_environment
shift
set ENVIRONMENT=%1
shift
goto parse_args

:set_build_only
set BUILD_ONLY=true
shift
goto parse_args

:set_skip_tests
set SKIP_TESTS=true
shift
goto parse_args

:set_skip_backup
set SKIP_BACKUP=true
shift
goto parse_args

:set_force_deploy
set FORCE_DEPLOY=true
shift
goto parse_args

:show_usage
echo Usage: %0 [OPTIONS]
echo Deploy SwagGo application
echo.
echo Options:
echo   -e, --environment ENV    Deployment environment (development^|staging^|production^) [default: development]
echo   -b, --build-only         Build images only, don't deploy
echo   -s, --skip-tests         Skip running tests
echo   -k, --skip-backup        Skip database backup
echo   -f, --force              Force deployment (skip confirmation)
echo   -h, --help               Show this help message
echo.
echo Examples:
echo   %0                           # Deploy to development environment
echo   %0 -e staging               # Deploy to staging environment
echo   %0 -e production -f         # Force deploy to production
echo   %0 -b -e production         # Build production images only
exit /b

:start
echo 🚀 Starting SwagGo deployment process...

REM Validate environment
call :validate_environment
if errorlevel 1 exit /b 1

REM Show deployment summary
call :show_summary

REM Confirm deployment (except for development)
if /i not "%ENVIRONMENT%"=="development" (
    if /i not "%FORCE_DEPLOY%"=="true" (
        call :confirm_deployment
        if errorlevel 1 exit /b 1
    )
)

REM Check prerequisites
call :check_prerequisites
if errorlevel 1 exit /b 1

REM Run tests (except for development)
if /i not "%ENVIRONMENT%"=="development" (
    if /i not "%SKIP_TESTS%"=="true" (
        call :run_tests
        if errorlevel 1 exit /b 1
    )
)

REM Backup database (for staging and production)
if /i not "%SKIP_BACKUP%"=="true" (
    if /i not "%ENVIRONMENT%"=="development" (
        call :backup_database
        if errorlevel 1 (
            if /i not "%FORCE_DEPLOY%"=="true" (
                set /p REPLY="Continue deployment without backup? (y/N): "
                if /i not "!REPLY!"=="y" (
                    echo Deployment cancelled by user
                    exit /b 1
                )
            )
        )
    )
)

REM Build Docker images
call :build_images
if errorlevel 1 exit /b 1

REM Deploy application
call :deploy_application
if errorlevel 1 exit /b 1

REM Show final summary
call :show_summary

echo 🎉 Deployment completed successfully!
exit /b

:validate_environment
if /i "%ENVIRONMENT%"=="development" set ENVIRONMENT=development
if /i "%ENVIRONMENT%"=="dev" set ENVIRONMENT=development
if /i "%ENVIRONMENT%"=="staging" set ENVIRONMENT=staging
if /i "%ENVIRONMENT%"=="stage" set ENVIRONMENT=staging
if /i "%ENVIRONMENT%"=="production" set ENVIRONMENT=production
if /i "%ENVIRONMENT%"=="prod" set ENVIRONMENT=production

if /i "%ENVIRONMENT%"=="development" (
    set COMPOSE_FILE=docker-compose.yml
) else if /i "%ENVIRONMENT%"=="staging" (
    set COMPOSE_FILE=deployment/docker-compose.staging.yml
) else if /i "%ENVIRONMENT%"=="production" (
    set COMPOSE_FILE=deployment/docker-compose.prod.yml
) else (
    echo Invalid environment: %ENVIRONMENT%
    echo Valid environments: development, staging, production
    exit /b 1
)
exit /b

:show_summary
echo ==========================================
echo Deployment Summary
echo ==========================================
echo Environment: %ENVIRONMENT%
echo Compose File: %COMPOSE_FILE%
echo Build Only: %BUILD_ONLY%
echo Tests Skipped: %SKIP_TESTS%
echo Backup Skipped: %SKIP_BACKUP%
echo Force Deploy: %FORCE_DEPLOY%
echo ==========================================
exit /b

:confirm_deployment
echo ==========================================
echo Deployment Confirmation
echo ==========================================
echo Environment: %ENVIRONMENT%
echo This will deploy to the %ENVIRONMENT% environment.

if /i "%ENVIRONMENT%"=="production" (
    echo ⚠️  WARNING: This is a PRODUCTION deployment!
    echo Ensure you have proper backups and maintenance windows.
)

set /p REPLY="Continue with deployment? (y/N): "
if /i not "!REPLY!"=="y" (
    echo Deployment cancelled by user
    exit /b 1
)
exit /b

:check_prerequisites
echo Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker is not installed
    exit /b 1
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Docker Compose is not installed
    exit /b 1
)

REM Check if docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker daemon is not running
    exit /b 1
)

echo All prerequisites satisfied
exit /b

:run_tests
echo Running tests...

REM Run unit tests
npm run test:unit
if errorlevel 1 (
    echo Unit tests failed
    exit /b 1
)

REM Run integration tests
npm run test:integration
if errorlevel 1 (
    echo Integration tests failed
    exit /b 1
)

REM Run security audit
npm run security-audit
if errorlevel 1 (
    echo Security audit found vulnerabilities
    if /i not "%FORCE_DEPLOY%"=="true" (
        set /p REPLY="Continue deployment? (y/N): "
        if /i not "!REPLY!"=="y" (
            echo Deployment cancelled by user
            exit /b 1
        )
    )
)
exit /b

:backup_database
echo Creating database backup...

REM Create backup using the backup service
node scripts/create-backup.js
if errorlevel 1 (
    echo Database backup failed
    exit /b 1
) else (
    echo Database backup created successfully
)
exit /b

:build_images
echo Building Docker images for %ENVIRONMENT% environment...

if /i "%ENVIRONMENT%"=="development" (
    docker-compose -f "%COMPOSE_FILE%" build
) else if /i "%ENVIRONMENT%"=="staging" (
    docker-compose -f "%COMPOSE_FILE%" build
) else if /i "%ENVIRONMENT%"=="production" (
    REM Build with production optimizations
    docker-compose -f "%COMPOSE_FILE%" build --no-cache
)

if errorlevel 1 (
    echo Failed to build images
    exit /b 1
)

echo Docker images built successfully
exit /b

:deploy_application
if /i "%BUILD_ONLY%"=="true" (
    echo Build only mode - skipping deployment
    exit /b
)

echo Deploying application to %ENVIRONMENT% environment...

REM Stop existing services
echo Stopping existing services...
docker-compose -f "%COMPOSE_FILE%" down --remove-orphans

REM Pull latest images (for production)
if /i "%ENVIRONMENT%"=="production" (
    echo Pulling latest images...
    docker-compose -f "%COMPOSE_FILE%" pull
)

REM Start services
echo Starting services...
docker-compose -f "%COMPOSE_FILE%" up -d
if errorlevel 1 (
    echo Failed to start services
    exit /b 1
)

REM Wait for services to be healthy
echo Waiting for services to become healthy...
timeout /t 30 /nobreak >nul

echo Application deployed successfully to %ENVIRONMENT% environment
exit /b