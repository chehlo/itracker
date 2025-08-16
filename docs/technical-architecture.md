# Personal Investment Tracker - Technical Architecture

## Technology Stack Recommendation

### Frontend
**Recommendation: React with Next.js**
- **Rationale**: 
  - Excellent learning path for web development
  - Great documentation and community
  - Built-in responsive design capabilities
  - Easy deployment options
  - Good TypeScript support for coming from C background

**Alternative**: Vue.js (simpler learning curve but smaller ecosystem)

### Backend
**Recommendation: Node.js with Express**
- **Rationale**:
  - JavaScript across full stack (single language to learn)
  - Extensive package ecosystem
  - Great API development tools
  - Easy integration with frontend

**Alternative**: Python FastAPI (leverages your Python experience but adds language switching complexity)

### Database
**Recommendation: PostgreSQL**
- **Rationale**:
  - Robust relational structure for financial data
  - Excellent JSON support for flexible schemas
  - Strong consistency guarantees for financial calculations
  - Great free hosting options

**Alternative**: SQLite for development, migrate to PostgreSQL for production

### Authentication
**Recommendation: NextAuth.js**
- Google OAuth integration
- Session management
- Built for Next.js ecosystem

### Hosting & Deployment
**Phase 1**: Local development with Docker
**Phase 2**: Cloud deployment (Vercel for frontend, Railway/Render for backend)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - React UI      │    │ - REST API      │    │ - User Data     │
│ - Auth Pages    │    │ - Auth Handling │    │ - Investments   │
│ - Dashboard     │    │ - Price Feeds   │    │ - Transactions  │
│ - Forms         │    │ - Calculations  │    │ - Price History │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │                       │                       
┌─────────────────┐    ┌─────────────────┐              
│ External APIs   │    │   File Storage  │              
│                 │    │   (Optional)    │              
│ - Price Data    │    │ - Backups       │              
│ - Currency      │    │ - Documents     │              
│ - Market Data   │    │                 │              
└─────────────────┘    └─────────────────┘              
```

## Database Schema (Initial Design)

### Core Entities

```sql
-- Users table
users (
    id UUID PRIMARY KEY,
    google_id VARCHAR UNIQUE,
    email VARCHAR,
    name VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- Investment types and categories
investment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR, -- 'public_market', 'alternative', 'recurring'
    description TEXT
)

-- Main investments table
investments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR,
    symbol VARCHAR, -- For public investments
    investment_type_id INTEGER REFERENCES investment_types(id),
    base_currency VARCHAR(3), -- NIS, USD, EUR
    exposure_currency VARCHAR(3), -- Currency exposure
    market_region VARCHAR, -- Future use
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- All transactions (buy, sell, dividend, contribution, value_update)
transactions (
    id UUID PRIMARY KEY,
    investment_id UUID REFERENCES investments(id),
    transaction_type VARCHAR, -- 'buy', 'sell', 'dividend', 'contribution', 'manual_update'
    quantity DECIMAL,
    price_per_unit DECIMAL,
    total_amount DECIMAL,
    currency VARCHAR(3),
    transaction_date DATE,
    notes TEXT,
    created_at TIMESTAMP
)

-- Price history for automated tracking
price_history (
    id UUID PRIMARY KEY,
    investment_id UUID REFERENCES investments(id),
    price DECIMAL,
    currency VARCHAR(3),
    price_date DATE,
    source VARCHAR, -- 'manual', 'api', 'calculated'
    created_at TIMESTAMP
)

-- Currency exchange rates
exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency VARCHAR(3),
    to_currency VARCHAR(3),
    rate DECIMAL,
    rate_date DATE,
    source VARCHAR,
    created_at TIMESTAMP
)
```

## API Design

### RESTful Endpoints

```
Authentication:
POST /auth/login
POST /auth/logout
GET  /auth/me

Investments:
GET    /api/investments           # List all investments
POST   /api/investments           # Create investment
GET    /api/investments/:id       # Get investment details
PUT    /api/investments/:id       # Update investment
DELETE /api/investments/:id       # Delete investment

Transactions:
GET    /api/investments/:id/transactions    # Get investment transactions
POST   /api/investments/:id/transactions    # Add transaction
PUT    /api/transactions/:id                # Update transaction
DELETE /api/transactions/:id                # Delete transaction

Portfolio:
GET    /api/portfolio/summary               # Total value, gain/loss
GET    /api/portfolio/performance           # Performance metrics
GET    /api/portfolio/allocation            # Asset allocation

Market Data:
GET    /api/prices/:symbol                  # Get current price
POST   /api/prices/update                   # Force price update
GET    /api/currencies/rates                # Exchange rates
```

## Development Environment Setup

### Required Tools
```bash
# Development tools
- Node.js (v18+)
- npm or yarn
- PostgreSQL (v14+)
- Git
- VS Code or continue with Neovim

# Optional but recommended
- Docker & Docker Compose
- Postman or similar API testing tool
- Database GUI (pgAdmin, DBeaver)
```

### Project Structure
```
investment-tracker/
├── frontend/                 # Next.js application
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── migrations/
│   └── tests/
├── database/
│   ├── migrations/
│   └── seeds/
├── docker-compose.yml        # Local development
├── docs/                     # Documentation
└── README.md
```

## External Integrations

### Price Data Sources
**Primary**: Alpha Vantage (free tier: 500 requests/day)
**Backup**: Yahoo Finance (unofficial API)
**Currency**: Fixer.io or ExchangeRate-API

### Price Update Strategy
- Batch updates once daily for all public investments
- Cache prices for 1 hour during market hours
- Manual override always available
- Graceful degradation if API unavailable

## Security Considerations

### Data Protection
- HTTPS everywhere
- JWT tokens for API authentication
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- Rate limiting on API endpoints

### Access Control
- User-based data isolation
- Family sharing through explicit user relationships
- No admin/super-user roles initially

## Performance & Scalability

### Caching Strategy
- Price data cached for 1 hour
- Portfolio calculations cached for 15 minutes
- User sessions cached in Redis (future)

### Database Optimization
- Indexes on foreign keys and date fields
- Partitioning for price_history (future)
- Connection pooling

### Monitoring
- Basic error logging
- API response time tracking
- Database query performance monitoring

## Deployment Strategy

### Phase 1: Local Development
```bash
# Using Docker Compose
docker-compose up -d postgres
npm run dev  # Frontend
npm run api  # Backend
```

### Phase 2: Cloud Deployment
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Railway or Render
- **Database**: PostgreSQL on Railway/Render or managed service
- **Environment**: Staging and Production

## Learning Path Recommendations

### Week 1-2: Foundation
1. React fundamentals
2. Next.js basics
3. Node.js and Express setup
4. PostgreSQL basics

### Week 3-4: Core Features
1. Database schema implementation
2. Basic CRUD operations
3. Authentication integration
4. Simple frontend forms

### Week 5-8: Investment Logic
1. Transaction recording
2. Price data integration
3. Portfolio calculations
4. Basic reporting

### Week 9-12: Polish & Deploy
1. Error handling
2. Responsive design
3. Testing
4. Deployment setup

## Development Tools Configuration

### Neovim Extensions for Web Development
```lua
-- Add to your Neovim config
-- TypeScript/JavaScript support
'neovim/nvim-lspconfig'
'jose-elias-alvarez/null-ls.nvim'  -- ESLint, Prettier
'windwp/nvim-ts-autotag'           -- HTML tag completion

-- Database tools
'tpope/vim-dadbod'                 -- SQL queries
'kristijanhusak/vim-dadbod-ui'     -- Database UI
```

### Alternative: VS Code Setup
If complexity becomes overwhelming, VS Code with these extensions:
- ES7+ React/Redux/React-Native snippets
- REST Client
- PostgreSQL
- GitLens
