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

### Backend
**Recommendation: Node.js with Express**
- **Rationale**:
  - JavaScript across full stack (single language to learn)
  - Extensive package ecosystem
  - Great API development tools
  - Easy integration with frontend
  - Start with pure Express + PostgreSQL (no Redis initially). Define API interfaces and database schema migration before adding additional services. 

### Database
**Recommendation: PostgreSQL**
- **Rationale**:
  - Robust relational structure for financial data
  - Excellent JSON support for flexible schemas
  - Strong consistency guarantees for financial calculations
  - Great free hosting options

### Authentication
- **Current** JWT-based email/password authentication
- **Planned (Phase 2)** Google OAuth with NextAuth.js
- Session management
- Built for Next.js ecosystem

### Caching Layer
**Recommendation: Redis**
- **Rationale**:
  - Fast data retrieval for portfolio calculations
  - Price data caching for performance
  - Session management
  - Background job coordination
    - Planned for Phase 2+. do not implement untill core CRUD API are Complete and functional. 

### Hosting & Deployment
**Phase 1**: Local development with Docker
**Phase 2**: Cloud deployment (Vercel for frontend, Railway/Render for backend)

## Enhanced Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - React UI      │    │ - REST API      │    │ - User Data     │
│ - Auth Pages    │    │ - Auth Handling │    │ - Investments   │
│ - Dashboard     │    │ - Multi-Market  │    │ - Transactions  │
│ - Family Sharing│    │ - Price Feeds   │    │ - Permissions   │
│ - Multi-language│    │ - Calculations  │    │ - Price History │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ External APIs   │    │   Cache Layer   │    │   Background    │
│                 │    │   (Redis)       │    │   Jobs          │
│ - US Markets    │    │ - Price Cache   │    │ - Price Updates │
│ - Israeli Mkts  │    │ - Portfolio     │    │ - Calculations  │
│ - Currency Rates│    │ - User Sessions │    │ - Cache Refresh │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Architectural Principles

Development will proceed backend-first. Define database tables, API contracts, and TypeScript interfaces early.
Keep abstractions clean to allow adding Redis, background jobs, and permissions later without refactoring core logic.

### 1. Multi-Market Support
- **Architecture**: Pluggable price provider system
- **Markets**: US (Alpha Vantage), Israeli (Funder.co.il, TASE), Manual entry
- **Currencies**: NIS, USD with currency exposure tracking
- **Data Sources**: API-based for public markets, manual for alternatives

### 2. Family Access Control
- **Permission Model**: Private, Family Read, Family Write per portfolio
- **Family Groups**: Link users for shared portfolio access
- **Data Isolation**: Strong user-based data separation with controlled sharing

### 3. Performance-First Design
- **Caching Strategy**: Multi-layer (Memory → Redis → Database → Fresh)
- **Response Philosophy**: Show cached data immediately, update in background
- **Cache Invalidation**: Smart invalidation based on data freshness requirements
- **Graceful Degradation**: Always show something, even if stale

### 4. Data Integrity & Safety
- **Transactional Operations**: Database transactions for multi-step operations
- **Audit Trail**: Track all changes to financial data
- **Backup Strategy**: Regular automated backups
- **Validation**: Server-side validation for all financial calculations

## Database Schema Architecture

### Core Entities (High-Level)

```sql
-- User Management & Family Sharing
users, family_groups, portfolio_permissions

-- Investment Tracking
portfolios, investments, transactions, price_history

-- Market Data & Caching
exchange_rates, cache_status, price_providers

-- Multi-Market Support
market_configurations, data_sources
```

### Key Architectural Decisions

1. **Portfolio-Level Permissions**: Each portfolio has its own sharing settings
2. **Market-Agnostic Design**: Investment entities support any market/currency
3. **Audit Trail**: All financial changes tracked with timestamps and user info
4. **Cache Management**: Dedicated tables for cache status and invalidation

## API Architecture

### RESTful Design Principles
```
Authentication: /auth/*
Investments: /api/investments/*
Portfolios: /api/portfolios/*
Transactions: /api/transactions/*
Market Data: /api/market/*
Family: /api/family/*
```

### Multi-Market API Strategy
- **Unified Interface**: Same API structure for all markets
- **Market-Specific Adapters**: Backend handles market differences
- **Fallback Mechanisms**: Graceful handling of API failures
- **Rate Limiting**: Respect external API limits

## External Integration Architecture

### Price Data Sources
- **Primary US**: Alpha Vantage (500 requests/day free)
- **Primary Israeli**: Funder.co.il (scraping/API)
- **Currency**: ExchangeRate-API
- **Fallback Strategy**: Multiple providers per market

### Update Strategy
- **Frequency**: Market-specific (US: hourly, Israeli: 4-hourly)
- **Scheduling**: Background jobs during market hours
- **Failure Handling**: Graceful degradation, retry logic
- **Cache Warming**: Pre-populate cache before market open

## Security Architecture

### Authentication & Authorization
- **Primary Auth**: Google OAuth via NextAuth.js
- **Session Management**: JWT tokens with Redis storage
- **API Security**: Token validation on all protected endpoints
- **Data Isolation**: User-based data filtering at database level

### Family Sharing Security
- **Explicit Permissions**: No default sharing, explicit grants only
- **Permission Inheritance**: Portfolio settings override global settings
- **Audit Logging**: Track all permission changes

## Performance Architecture

### Caching Strategy
```
Response Time Priority:
1. Memory Cache (< 50ms)
2. Redis Cache (< 200ms)
3. Database Cache (< 500ms)
4. Fresh Calculation (< 2000ms)
```

### Background Processing
- **Price Updates**: Scheduled jobs for market data
- **Portfolio Calculations**: Async calculation with cache updates
- **Cache Warming**: Pre-calculate common queries
- **Cleanup Jobs**: Regular cache and audit log cleanup

## Deployment Architecture

### Development Environment
```
Local: Docker Compose (PostgreSQL + Redis + Node.js)
Development workflow: Hot reload, local database
```

### Production Environment
```
Frontend: Vercel (CDN, auto-scaling)
Backend: Railway/Render (container-based)
Database: Managed PostgreSQL
Cache: Redis Cloud/managed service
```

### Environment Strategy
- **Development**: Local Docker with test data
- **Staging**: Cloud environment with production-like setup
- **Production**: Fully managed services with monitoring

## Scalability Considerations

### Current Scale Target
- **Users**: 3-5 family members
- **Investments**: 100-500 per family
- **Transactions**: 1000-5000 total
- **Performance**: Sub-second response times

### Growth Architecture
- **Database**: PostgreSQL can handle 10x growth easily
- **Caching**: Redis cluster for high availability
- **API**: Horizontal scaling via load balancers
- **Storage**: Separate file storage for documents (future)

## Risk Mitigation Architecture

### Data Safety
- **Backups**: Automated daily database backups
- **Validation**: Multi-layer input validation
- **Transactions**: Atomic operations for financial data
- **Audit Trail**: Complete change history

### System Reliability
- **Graceful Degradation**: Show cached data if APIs fail
- **Error Handling**: Comprehensive error logging and alerting
- **Monitoring**: Health checks and performance monitoring
- **Rollback Strategy**: Database migration rollback procedures

## Learning Path Architecture

### Development Phases
1. **Foundation**: Single-user, single-market, backend-first basic CRUD via API before frontend dwork
2. **Multi-Market**: Add Israeli market support and caching
3. **Family Sharing**: Add permission system and family features
4. **Performance**: Optimize caching and background jobs

### Technology Learning Progression
1. **Week 1-2**: React + Express + PostgreSQL basics
2. **Week 3-4**: Authentication and basic investment tracking
3. **Week 5-6**: Multi-market price feeds and caching
4. **Week 7-8**: Family sharing and permissions
5. **Week 9-12**: Performance optimization and deployment
