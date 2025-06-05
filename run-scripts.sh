#!/bin/bash

# Script helper để chạy các scripts backend với Docker
# Usage: ./run-scripts.sh [script-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if database is ready
wait_for_db() {
    print_info "Waiting for database to be ready..."
    
    # Start database if not running
    docker-compose up -d db
    
    # Wait for database to be ready
    until docker-compose exec db mongosh --host localhost:27017 --username admin --password password --authenticationDatabase admin --eval "db.runCommand('ping').ok" > /dev/null 2>&1; do
        print_info "Database is not ready yet. Waiting..."
        sleep 2
    done
    
    print_success "Database is ready!"
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC} ./run-scripts.sh [script-name]"
    echo ""
    echo -e "${BLUE}Available scripts:${NC}"
    echo "  seed              - Seed database with initial data (users, units, categories, products)"
    echo "  seed-content      - Seed database with sample content"
    echo "  migrate           - Run database migration"
    echo "  custom [script]   - Run custom script file"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./run-scripts.sh seed"
    echo "  ./run-scripts.sh seed-content"
    echo "  ./run-scripts.sh migrate"
    echo "  ./run-scripts.sh custom scripts/my-script.ts"
}

# Main script logic
case "${1:-help}" in
    "seed")
        print_info "Running database seed script..."
        wait_for_db
        docker-compose --profile seed up --build seed
        print_success "Database seeding completed!"
        ;;
    
    "seed-content")
        print_info "Running content seed script..."
        wait_for_db
        docker-compose --profile seed up --build seed-content
        print_success "Content seeding completed!"
        ;;
    
    "migrate")
        print_info "Running database migration..."
        wait_for_db
        docker-compose --profile migrate up --build migrate
        print_success "Database migration completed!"
        ;;
    
    "custom")
        if [ -z "$2" ]; then
            print_error "Please specify the script file to run"
            echo "Example: ./run-scripts.sh custom scripts/my-script.ts"
            exit 1
        fi
        
        print_info "Running custom script: $2"
        wait_for_db
        
        # Build the scripts target
        docker-compose build --build-arg TARGET=scripts backend
        
        # Run the custom script
        docker-compose run --rm \
            -e MONGODB_URI=mongodb://admin:password@db:27017/military-logistics?authSource=admin \
            backend npx ts-node --project tsconfig.json "$2"
        
        print_success "Custom script completed!"
        ;;
    
    "help"|*)
        show_usage
        ;;
esac 