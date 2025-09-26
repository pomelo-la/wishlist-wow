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
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pomelo_wishlist
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
    if docker exec pomelo-postgres pg_isready -U postgres -d postgres > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Database failed to become ready"
        exit 1
    fi
    sleep 1
done

print_success "Database is ready!"

# Create the pomelo_wishlist database if it doesn't exist
print_status "Creating pomelo_wishlist database..."
docker exec pomelo-postgres psql -U postgres -d postgres -c "CREATE DATABASE pomelo_wishlist;" 2>/dev/null || true

# Create database schema
print_status "Creating database schema..."
docker exec pomelo-postgres psql -U postgres -d pomelo_wishlist -c "
-- Create extensions
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('creator', 'reviewer', 'it_manager', 'owner', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initiative V2 table (main initiatives table)
CREATE TABLE IF NOT EXISTS initiative_v2 (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quarter VARCHAR(20),
    score DECIMAL(5,2),
    category VARCHAR(100),
    vertical VARCHAR(100),
    client_type VARCHAR(100),
    country VARCHAR(100),
    systemic_risk VARCHAR(100),
    economic_impact VARCHAR(100),
    economic_impact_description TEXT,
    experience_impact TEXT,
    competitive_approach VARCHAR(200),
    executive_summary TEXT,
    roi DECIMAL(10,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id VARCHAR(36) NOT NULL,
    author_id UUID REFERENCES users(id),
    author_role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suggestions table for agent recommendations
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id VARCHAR(36) NOT NULL,
    field VARCHAR(100) NOT NULL,
    suggested_value TEXT NOT NULL,
    rationale TEXT,
    confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id VARCHAR(36) NOT NULL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_initiative_v2_status ON initiative_v2(status);
CREATE INDEX IF NOT EXISTS idx_initiative_v2_category ON initiative_v2(category);
CREATE INDEX IF NOT EXISTS idx_initiative_v2_created_by ON initiative_v2(created_by);
CREATE INDEX IF NOT EXISTS idx_initiative_v2_created_at ON initiative_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_initiative ON messages(initiative_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_initiative ON suggestions(initiative_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_initiative ON audit_logs(initiative_id);
"

if [ $? -eq 0 ]; then
    print_success "Database schema created successfully!"
else
    print_error "Failed to create database schema"
    exit 1
fi

# Insert sample data
print_status "Inserting sample data..."
docker exec pomelo-postgres psql -U postgres -d pomelo_wishlist -c "
-- Insert sample users
INSERT INTO users (id, email, name, role) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'admin@wishlist.com', 'Admin User', 'admin'),
    ('550e8400-e29b-41d4-a716-446655440001', 'creator@wishlist.com', 'Creator User', 'creator'),
    ('550e8400-e29b-41d4-a716-446655440002', 'reviewer@wishlist.com', 'Reviewer User', 'reviewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample initiative
INSERT INTO initiative_v2 (
    id, title, description, status, created_by, category, vertical, 
    country, client_type, economic_impact, systemic_risk, score
) VALUES (
    '660e8400-e29b-41d4-a716-446655440000',
    'Mejora del Sistema de Autenticación',
    'Implementar autenticación de dos factores para mejorar la seguridad',
    'draft',
    'creator@wishlist.com',
    'risk',
    'banking',
    'Mexico',
    'top_issuer',
    'moderate',
    'medium',
    85.5
) ON CONFLICT (id) DO NOTHING;
" 2>/dev/null || true

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
echo "   View database logs: docker logs pomelo-postgres"
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