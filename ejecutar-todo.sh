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
    if docker exec wishlist-postgres pg_isready -U wishlist -d pomelo_wishlist > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Database failed to become ready"
        exit 1
    fi
    sleep 1
done

print_success "Database is ready!"

print_status "Starting frontend and backend applications..."
npm run dev &

if [ $? -ne 0 ]; then
    print_error "Failed to start applications"
    exit 1
fi

print_success "All services started successfully!"
echo ""
echo "🌐 Applications are running on:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   Database: localhost:5432 (Docker)"
echo ""
echo "📋 Useful commands:"
echo "   View database logs: npm run db:logs"
echo "   Stop database:      npm run db:down"
echo "   Reset database:     npm run db:reset"
echo "   Stop all:           Ctrl+C (apps) + npm run db:down"
echo ""
print_status "Applications are running in development mode"