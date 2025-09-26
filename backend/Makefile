# Pomelo Wishlist Makefile

.PHONY: help build up down logs clean restart

# Default target
help:
	@echo "Available commands:"
	@echo "  build   - Build Docker images"
	@echo "  up      - Start all services"
	@echo "  down    - Stop all services"
	@echo "  logs    - Show logs"
	@echo "  clean   - Remove all containers and volumes"
	@echo "  restart - Restart all services"
	@echo "  dev     - Run in development mode (local)"

# Build Docker images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Show logs
logs:
	docker-compose logs -f

# Clean up everything
clean:
	docker-compose down -v
	docker system prune -f

# Restart services
restart:
	docker-compose restart

# Development mode (requires local PostgreSQL)
dev:
	@echo "Starting in development mode..."
	@echo "Make sure PostgreSQL is running locally on port 5432"
	go run cmd/api/main.go

# Run only database for local development
db:
	docker-compose up -d postgres

# Stop only database
db-down:
	docker-compose stop postgres