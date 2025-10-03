
## Overview
This document tracks the setup and configuration of the complete development environment for the Personal Investment Tracker project.

## Environment Components

### Core Development Stack
- **Editor**: Neovim (extended for web development)
- **Runtime**: Node.js (v18+)
- **Database**: PostgreSQL (v14+)
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git (already configured)

### Additional Tools
- **API Testing**: Bruno or Postman
- **Database Management**: pgAdmin or DBeaver
- **Package Management**: npm/yarn
- **Process Management**: PM2 (for production)

## Setup Progress Tracker

### ✅ Phase 1: Neovim Web Development Extensions

**Status**: 🔄 Completed (for now)

For detailed information:  https://github.com/chehlo/nvim

### 🔄 Phase 2: Docker Development Environment

**Status**: ⏳ Pending

#### Docker Compose Setup
**File**: `docker-compose.dev.yml`
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: investment_tracker_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@localhost.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "8080:80"
    depends_on:
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Action Items for Phase 2:**
- [ ] Create Docker Compose configuration
- [ ] Set up database initialization scripts
      *Note: For initial development, PostgreSQL can run locally without Docker. Add containerization once the first vertical slice (API + DB + simple frontend) is working.*   
- [ ] Configure PostgreSQL connection in Neovim
- [ ] Test database connectivity
- [ ] Create development database schema

---

### 🔄 Phase 3: Node.js Project Structure

**Status**: ⏳ Pending

#### Project Structure
```
investment-tracker/
├── frontend/                 # Next.js app
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                  # Express API
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
├── shared/                   # Shared types and utilities
│   ├── package.json
│   └── types/
├── database/
│   ├── migrations/
│   └── seeds/
└── package.json              # Workspace root
```

#### Package.json Workspace Setup
**Root package.json:**
```json
{
  "name": "investment-tracker",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "test": "npm run test:backend && npm run test:frontend",
    "lint": "npm run lint:backend && npm run lint:frontend"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  }
}
```

**Action Items for Phase 3:**
- [ ] Initialize npm workspaces
- [ ] Set up TypeScript configurations
      - Begin with backend APIs only. Define core DB schema and migrations before any frontend work. 
        Keep interfaces modular so later features (Redis caching, family sharing) plug in cleanly.
- [ ] Configure ESLint and Prettier
- [ ] Create basic project structure
- [ ] Set up development scripts

---

### 🔄 Phase 4: Testing Infrastructure

**Status**: ⏳ Pending

#### Testing Strategy Overview
- **Unit Tests**: Jest + Testing Library
- **Integration Tests**: Supertest for API
- **E2E Tests**: Playwright
- **Database Tests**: Test containers
- **Development**: Hot reload and watch modes

#### Testing Configuration Files

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/**/*.test.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/frontend/**/*.test.{js,ts,tsx}'],
      preset: 'next/jest',
      testEnvironment: 'jsdom',
    },
  ],
};
```

**Action Items for Phase 4:**
- [ ] Set up Jest configuration
- [ ] Configure Testing Library
- [ ] Set up Playwright for E2E tests
- [ ] Create test database setup
- [ ] Write example test cases
- [ ] Configure CI/CD testing pipeline

---

### 🔄 Phase 5: Development Tools & Workflow

**Status**: ⏳ Pending

#### Additional Development Tools
- **API Testing**: Bruno (open-source Postman alternative)
- **Database GUI**: DBeaver or pgAdmin
- **Git Hooks**: Husky for pre-commit hooks
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

#### Development Scripts
```json
{
  "scripts": {
    "dev": "Start all services in development mode",
    "test:watch": "Run tests in watch mode",
    "test:coverage": "Generate test coverage reports",
    "lint:fix": "Auto-fix linting issues",
    "db:migrate": "Run database migrations",
    "db:seed": "Seed development database",
    "docker:up": "Start Docker development environment",
    "docker:down": "Stop Docker development environment"
  }
}
```

**Action Items for Phase 5:**
- [ ] Install and configure development tools
- [ ] Set up pre-commit hooks
      - Enable TypeScript strict mode from the start to avoid subtle type issues. 
- [ ] Create development workflow documentation
- [ ] Configure hot-reload for all services
- [ ] Set up debugging configurations

---

## Installation Priority

### Immediate (Week 1)
1. **Neovim Web Extensions** - Enable productive web development
2. **Docker Environment** - Consistent development setup
3. **Basic Project Structure** - Start coding foundation

### Short-term (Week 2-3)
1. **Testing Infrastructure** - Don't accumulate testing debt
2. **Development Workflow** - Efficient daily development

### Medium-term (Week 4+)
1. **Advanced Tooling** - Performance monitoring, advanced debugging
2. **CI/CD Pipeline** - Automated testing and deployment

## Success Criteria

### Phase 1 Complete When:
- [ ] Neovim provides full TypeScript/JavaScript support
- [ ] LSP working for all web technologies
- [ ] Code formatting and linting functional
- [ ] Database connectivity from editor working

### Environment Complete When:
- [ ] One-command start of full development stack
- [ ] Hot-reload working for frontend and backend
- [ ] Tests running in watch mode
- [ ] Database migrations and seeding automated
- [ ] All tools integrated and documented

## Notes & Troubleshooting

### Common Issues
- **LSP servers not starting**: Check npm global installation
- **Docker permission issues**: Add user to docker group
- **Port conflicts**: Ensure ports 3000, 5432, 8080 available
- **TypeScript errors**: Verify tsconfig.json configurations

### Performance Considerations
- **Neovim LSP memory usage**: Monitor with large TypeScript projects
- **Docker volume performance**: Use bind mounts for development
- **Test execution speed**: Use test.only during development

### Backup Strategy
- **Configuration backup**: All configs in version control
- **Database backup**: Regular pg_dump during development
- **Environment recovery**: Documented in this guide

# Project File Organization Guidelines
### Directory Structure Rules
 - `/backend` - Backend source code only (Express, routes, middleware)
 - `/frontend` - Frontend source code only (React/Next.js when added)
 - `/tests` - All test files organized by component
 - `/docs` - Project documentation
 - `/environment` - Development environment setup (Docker, scripts)

 ### Test Organization Pattern
 - `/tests/backend/` - Backend API and unit tests
 - `/tests/frontend/` - Frontend component tests (future)
 - `/tests/infrastructure/` - Database, environment, setup tests
 - `/tests/e2e/` - End-to-end user journey tests (future)

 ### New File Guidelines
 **Backend Development:**
 - Source files: `backend/src/[feature]/`
 - Test files: `tests/backend/[feature].test.js`

 **Frontend Development:** (future)
 - Source files: `frontend/src/[feature]/`
 - Test files: `tests/frontend/[feature].test.js`

## Testing Environment Isolation

### Database Testing Strategy
- **Production Database**: Used by backend application (`backend/src/config/database.js`)
- **Test Database**: Separate isolated configuration (`tests/helpers/database-config.js`)
- **Principle**: Tests never use production database configuration

### Database Connection Rules
**Backend Application:**
- Uses environment variables from `backend/.env`
- Connects to `investment_tracker_dev` database
- Pool management for production workloads

**Test Environment:**
- Uses test-specific database configuration
- Connects to `investment_tracker_test` database (or separate test instance)
- Independent connection management
- Environment-agnostic (works regardless of working directory)

### Test Database Configuration Requirements
All test files must use:
```javascript
const { createTestClient, closeTestClient } = require('../helpers/database-config');

### Current Status: Database Configuration Refactoring

**Issue Identified**: Test and production database connections use incompatible patterns
- Tests create isolated Client connections
- Controllers import production Pool connections
- Need unified approach that works in both contexts

**In Progress**: Implementing environment-based configuration pattern
- Single database module with NODE_ENV awareness
- Tests set environment variables before app initialization
- Controllers remain unchanged (dependency on abstraction)
