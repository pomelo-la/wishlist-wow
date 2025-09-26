# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pomelo Wishlist** is a comprehensive Go application for initiative prioritization with an intelligent agent system. The application manages the complete lifecycle of business initiatives from intake through scoring and prioritization.

## Architecture

This follows Clean Architecture principles with clear separation of concerns:

```
cmd/api/                    # Application entry point
internal/
  ├── domain/              # Core business entities and models
  ├── application/         # Use cases and business logic
  │   ├── agent/          # Intelligent agent for intake/estimation/scoring
  │   └── scoring/        # Decision matrix and prioritization logic
  ├── infrastructure/     # External concerns (database, server)
  └── interfaces/         # HTTP handlers and middleware
migrations/                # Database schema and seed data
```

### Key Components

- **Agent System**: Handles three intervention moments (intake, estimation, scoring)
- **Scoring Engine**: Implements complex decision matrix with multiple weighted dimensions
- **Role-Based Access**: 5 distinct roles with different permissions
- **Chat System**: Collaborative review with messages and suggestions

## Development Commands

### Setup and Dependencies
```bash
# Install dependencies
go mod tidy

# Start development server
go run cmd/api/main.go

# Build for production
go build -o pomelo-wishlist cmd/api/main.go
```

### Database Operations
```bash
# Create database
createdb pomelo_wishlist

# Run migrations
psql -d pomelo_wishlist -f migrations/001_initial_schema.sql
psql -d pomelo_wishlist -f migrations/002_seed_data.sql
```

### Testing
```bash
# Run all tests
go test ./...

# Test with coverage
go test -cover ./...

# Test specific package
go test ./internal/application/scoring/
```

## Environment Configuration

Required environment variables:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pomelo_wishlist
DB_SSLMODE=disable
PORT=8080
JWT_SECRET=your-secret-key
```

## Key Features

### Initiative States Flow
1. **draft** → **loaded** → **in_review** → **in_estimation** → **evaluation_closed** → **prioritized**

### Agent Interventions
- **Intake**: Guided questionnaire for initiative creation
- **Estimation**: Technical effort and risk assessment
- **Scoring**: Automated scoring using decision matrix

### Decision Matrix Dimensions
- Category scores (regulatory/risk/performance/value_prop/new_product)
- Vertical and client type weighting
- Country prioritization (Brazil=25, Mexico=20, etc.)
- Risk levels (blocker=200, high=30, medium=15, low=5)
- Economic and experience impact scoring
- Innovation level assessment

### Hard Rules
- New products → direct to committee (score 999999)
- Systemic blocker risk → maximum priority (score 999998)
- Tiebreaker: higher confidence, then lower effort

## API Structure

- `/auth/*` - Authentication endpoints
- `/api/initiatives/*` - Core initiative CRUD and operations
- `/api/agent/*` - Agent intervention endpoints
- `/api/dashboard/*` - Analytics and reporting
- `/api/users/*` - User management

## Database Schema

Uses PostgreSQL with:
- UUID primary keys throughout
- JSONB for flexible scoring data
- Arrays for multi-select fields (countries, tags)
- Full audit trail with triggers
- Optimized indexes for filtering and sorting

## Testing Strategy

Focus test coverage on:
- Scoring logic in `internal/application/scoring/`
- Agent decision trees in `internal/application/agent/`
- API endpoints in `internal/interfaces/handlers/`
- Domain model validations in `internal/domain/`