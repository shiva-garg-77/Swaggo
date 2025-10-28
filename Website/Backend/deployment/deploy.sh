#!/bin/bash

# 🚀 SWAGGO DEPLOYMENT SCRIPT
# Comprehensive deployment automation for SwagGo application

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
BUILD_ONLY=false
SKIP_TESTS=false
SKIP_BACKUP=false
FORCE_DEPLOY=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Deploy SwagGo application"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Deployment environment (development|staging|production) [default: development]"
    echo "  -b, --build-only         Build images only, don't deploy"
    echo "  -s, --skip-tests         Skip running tests"
    echo "  -k, --skip-backup        Skip database backup"
    echo "  -f, --force              Force deployment (skip confirmation)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to development environment"
    echo "  $0 -e staging               # Deploy to staging environment"
    echo "  $0 -e production -f         # Force deploy to production"
    echo "  $0 -b -e production         # Build production images only"
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -b|--build-only)
                BUILD_ONLY=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -k|--skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Function to validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|dev)
            ENVIRONMENT="development"
            COMPOSE_FILE="docker-compose.yml"
            ;;
        staging|stage)
            ENVIRONMENT="staging"
            COMPOSE_FILE="deployment/docker-compose.staging.yml"
            ;;
        production|prod)
            ENVIRONMENT="production"
            COMPOSE_FILE="deployment/docker-compose.prod.yml"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            print_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed (optional for deployment)"
    fi
    
    # Check if docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests as requested"
        return 0
    fi
    
    print_status "Running tests..."
    
    # Run unit tests
    if ! npm run test:unit; then
        print_error "Unit tests failed"
        exit 1
    fi
    
    # Run integration tests
    if ! npm run test:integration; then
        print_error "Integration tests failed"
        exit 1
    fi
    
    # Run security audit
    if ! npm run security-audit; then
        print_warning "Security audit found vulnerabilities"
        if [ "$FORCE_DEPLOY" = false ]; then
            read -p "Continue deployment? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Deployment cancelled by user"
                exit 1
            fi
        fi
    fi
    
    print_success "All tests passed"
}

# Function to backup database
backup_database() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_warning "Skipping database backup as requested"
        return 0
    fi
    
    if [ "$ENVIRONMENT" = "development" ]; then
        print_warning "Skipping database backup for development environment"
        return 0
    fi
    
    print_status "Creating database backup..."
    
    # Create backup using the backup service
    if ! node scripts/create-backup.js; then
        print_error "Database backup failed"
        if [ "$FORCE_DEPLOY" = false ]; then
            read -p "Continue deployment without backup? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Deployment cancelled by user"
                exit 1
            fi
        fi
    else
        print_success "Database backup created successfully"
    fi
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images for $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        development)
            if ! docker-compose -f "$COMPOSE_FILE" build; then
                print_error "Failed to build development images"
                exit 1
            fi
            ;;
        staging)
            if ! docker-compose -f "$COMPOSE_FILE" build; then
                print_error "Failed to build staging images"
                exit 1
            fi
            ;;
        production)
            # Build with production optimizations
            if ! docker-compose -f "$COMPOSE_FILE" build --no-cache; then
                print_error "Failed to build production images"
                exit 1
            fi
            ;;
    esac
    
    print_success "Docker images built successfully"
}

# Function to deploy application
deploy_application() {
    if [ "$BUILD_ONLY" = true ]; then
        print_status "Build only mode - skipping deployment"
        return 0
    fi
    
    print_status "Deploying application to $ENVIRONMENT environment..."
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Pull latest images (for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Pulling latest images..."
        docker-compose -f "$COMPOSE_FILE" pull
    fi
    
    # Start services
    print_status "Starting services..."
    if ! docker-compose -f "$COMPOSE_FILE" up -d; then
        print_error "Failed to start services"
        exit 1
    fi
    
    # Wait for services to be healthy
    print_status "Waiting for services to become healthy..."
    sleep 30
    
    # Check service health
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
        print_warning "Some services may not be healthy yet. Check status with:"
        echo "  docker-compose -f $COMPOSE_FILE ps"
    fi
    
    print_success "Application deployed successfully to $ENVIRONMENT environment"
}

# Function to show deployment summary
show_summary() {
    print_success "=========================================="
    print_success "Deployment Summary"
    print_success "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "Compose File: $COMPOSE_FILE"
    echo "Build Only: $BUILD_ONLY"
    echo "Tests Skipped: $SKIP_TESTS"
    echo "Backup Skipped: $SKIP_BACKUP"
    echo "Force Deploy: $FORCE_DEPLOY"
    print_success "=========================================="
    
    if [ "$BUILD_ONLY" = false ]; then
        echo ""
        print_status "Access your application:"
        case $ENVIRONMENT in
            development)
                echo "  API: http://localhost:45799"
                echo "  Frontend: http://localhost:3000"
                ;;
            staging)
                echo "  API: https://staging-api.swaggo.com"
                echo "  Frontend: https://staging.swaggo.com"
                ;;
            production)
                echo "  API: https://api.swaggo.com"
                echo "  Frontend: https://swaggo.com"
                ;;
        esac
    fi
}

# Function to confirm deployment
confirm_deployment() {
    if [ "$FORCE_DEPLOY" = true ]; then
        return 0
    fi
    
    echo ""
    print_warning "=========================================="
    print_warning "Deployment Confirmation"
    print_warning "=========================================="
    echo "Environment: $ENVIRONMENT"
    echo "This will deploy to the $ENVIRONMENT environment."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        print_error "⚠️  WARNING: This is a PRODUCTION deployment!"
        echo "Ensure you have proper backups and maintenance windows."
    fi
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
}

# Main deployment function
main() {
    print_status "Starting SwagGo deployment process..."
    
    # Parse command line arguments
    parse_args "$@"
    
    # Validate environment
    validate_environment
    
    # Show deployment summary
    show_summary
    
    # Confirm deployment (except for development)
    if [ "$ENVIRONMENT" != "development" ]; then
        confirm_deployment
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests (except for development)
    if [ "$ENVIRONMENT" != "development" ]; then
        run_tests
    fi
    
    # Backup database (for staging and production)
    backup_database
    
    # Build Docker images
    build_images
    
    # Deploy application
    deploy_application
    
    # Show final summary
    show_summary
    
    print_success "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"