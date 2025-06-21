#!/bin/bash

# Development setup script for Military Logistics System
# This script helps you start the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js is installed: $(node --version)"
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    
    # Root dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Frontend dependencies
    print_info "Installing frontend dependencies..."
    cd front-end
    npm install
    cd ..
    
    # Backend dependencies
    print_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    print_success "All dependencies installed!"
}

# Create environment files if they don't exist
setup_env() {
    print_info "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        print_info "Creating backend .env file..."
        cat > backend/.env << EOF
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://admin:password@localhost:27017/military-logistics?authSource=admin
JWT_SECRET=your-jwt-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
EOF
        print_success "Backend .env created!"
    fi
    
    # Frontend .env.local
    if [ ! -f "front-end/.env.local" ]; then
        print_info "Creating frontend .env.local file..."
        cat > front-end/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
EOF
        print_success "Frontend .env.local created!"
    fi
}

# Main function
main() {
    print_info "Starting Military Logistics Development Setup..."
    
    check_node
    install_deps
    setup_env
    
    print_success "Setup complete!"
    print_info "To start development:"
    print_info "  Option 1: npm run dev (starts both frontend and backend)"
    print_info "  Option 2: Use Docker - docker-compose up"
    print_info "  Option 3: Start services separately:"
    print_info "    - Backend: cd backend && npm run dev"
    print_info "    - Frontend: cd front-end && npm run dev"
}

# Show usage
show_usage() {
    echo "Usage: ./dev-setup.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Run full setup (default)"
    echo "  env       - Setup environment files only"
    echo "  deps      - Install dependencies only"
    echo "  help      - Show this help"
}

case "${1:-setup}" in
    "setup")
        main
        ;;
    "env")
        setup_env
        ;;
    "deps")
        check_node
        install_deps
        ;;
    "help"|*)
        show_usage
        ;;
esac 