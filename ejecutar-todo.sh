#!/bin/bash

echo "🚀 Wishlist WOW - Ejecutar Todo Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

# Check if Go is installed
if ! command_exists go; then
    print_warning "Go is not installed. Installing Go..."
    if command_exists brew; then
        brew install go
        if [ $? -ne 0 ]; then
            print_error "Failed to install Go. Please install it manually."
            exit 1
        fi
        print_success "Go installed successfully!"
    else
        print_error "Homebrew not found. Please install Go manually from https://golang.org/dl/"
        exit 1
    fi
else
    print_success "Go is already installed: $(go version)"
fi

# Check if Node.js is installed
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js is installed: $(node --version)"

# Install root dependencies
print_status "Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install root dependencies"
    exit 1
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend && npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend && go mod tidy
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Create backend config.env if it doesn't exist
print_status "Setting up backend configuration..."
if [ ! -f "backend/config.env" ]; then
    print_warning "Creating backend/config.env file..."
    cat > backend/config.env << EOF
# Cloudflare AI Gateway Configuration
CLOUDFLARE_AI_GATEWAY_TOKEN=tu_token_aqui
CLOUDFLARE_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/tu_account_id/pomethon_wow/openai/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USER=wishlist
DB_PASSWORD=wishlist
DB_NAME=wishlist
DB_SSLMODE=disable
EOF
    print_success "Backend config.env created!"
else
    print_success "Backend config.env already exists"
fi

print_status "Checking for existing database container..."
if [ "$(docker-compose -f docker-compose.db.yml ps -q)" ]; then
    print_warning "Stopping existing database container..."
    docker-compose -f docker-compose.db.yml down
fi

print_status "Starting PostgreSQL database..."
docker-compose -f docker-compose.db.yml up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start database"
    exit 1
fi

print_success "Database started successfully!"

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 5

# Check if database is healthy
for i in {1..30}; do
    if docker exec wishlist-postgres pg_isready -U wishlist -d postgres > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Database failed to become ready"
        exit 1
    fi
    sleep 1
done

print_success "Database is ready!"

# Create the wishlist database if it doesn't exist
print_status "Creating wishlist database..."
docker exec wishlist-postgres psql -U wishlist -d postgres -c "CREATE DATABASE wishlist;" 2>/dev/null || true
print_success "Database setup complete!"

print_status "Starting frontend and backend applications..."
npm run dev &

if [ $? -ne 0 ]; then
    print_error "Failed to start applications"
    exit 1
fi

# Wait a moment for applications to start
sleep 3

# Test if applications are running
print_status "Testing applications..."

# Test backend
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    print_success "Backend is running on http://localhost:8080"
else
    print_warning "Backend might not be ready yet, but it should start shortly"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is running on http://localhost:3000"
else
    print_warning "Frontend might not be ready yet, but it should start shortly"
fi

print_success "All services started successfully!"
echo ""
echo "🌐 Applications are running on:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   Database: localhost:5433 (Docker)"
echo ""
echo "📋 Useful commands:"
echo "   View database logs: docker logs wishlist-postgres"
echo "   Stop database:      docker-compose -f docker-compose.db.yml down"
echo "   Stop all:           Ctrl+C (apps) + docker-compose -f docker-compose.db.yml down"
echo ""
echo "🔧 Configuration:"
echo "   Backend config: backend/config.env"
echo "   Database: PostgreSQL in Docker"
echo "   AI Gateway: Configured (update tokens in backend/config.env)"
echo ""
print_status "Applications are running in development mode"
print_warning "Remember to update Cloudflare AI Gateway tokens in backend/config.env for full functionality"