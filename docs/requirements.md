# Personal Investment Tracker - Project Requirements

## Project Overview

A web-based personal investment portfolio tracking application designed for family use to monitor and analyze investments across multiple categories and currencies.
Primary use is personal/family only (no SaaS scaling planned), but code should be architected with clean interfaces to allow future scaling if needed.

## Core Objectives

- Replace Excel-based investment tracking with a user-friendly web application
- Implement backend first; start with API contracts and database schema before frontend development
- Provide high-level portfolio overview and performance tracking
- Support multiple investment types with different data sources
- Enable family member access with simple authentication
- Maintain flexibility for future enhancements

## Investment Categories

### 1. Public Market Investments
- **Description**: Stocks, ETFs, bonds with publicly available pricing
- **Data Source**: Online price feeds (15-minute delayed acceptable)
- **Features**:
  - Record buy/sell transactions
  - Automatic price updates
  - Real-time portfolio valuation

### 2. Alternative Investments
- **Description**: Real estate, collectibles, other manually valued assets
- **Data Source**: Manual value updates
- **Features**:
  - Record transactions
  - Manual current value updates
  - Performance tracking over time

### 3. Recurring Investments
- **Description**: Dollar-cost averaging programs, monthly contributions
- **Data Source**: Manual value and contribution updates
- **Features**:
  - Track total contributions separately from gains
  - Periodic value updates
  - Calculate actual gains accounting for new contributions

### 4. Private Equity / Long-term Commitments
- **Description**: Private equity funds, long-term investment programs (5-10 year horizon)
- **Data Source**: Manual updates only
- **Features**:
  - Track commitment amount (total obligation)
  - Record capital calls (amounts invested to date)
  - Record distributions (money returned during investment period)
  - No current value calculation (unknown until program completion)
  - Timeline tracking for expected completion
  - Portfolio inclusion options (exclude from total value or include at cost)

## Currency & Market Support

### Phase 1 (MVP)
- **Currencies**: NIS (Israeli Shekel), USD
- **Currency Exposure Tracking**: Record underlying currency exposure (e.g., NIS-traded S&P 500 with USD exposure)
- **Conversion**: Basic currency conversion for reporting

### Future Phases
- Additional currencies (EUR, GBP, etc.)
- Market categorization (Local, US, Europe, Asia)
- Advanced currency hedging analysis

## Core Functionality

### Portfolio Management
- **Multiple Portfolio Support**: Each user can create and manage multiple portfolios (personal, spouse, children, etc.)
- Add/edit/delete investments within each portfolio
- Record transactions (buy, sell, dividend, contribution, capital call, distribution)
- Categorize by investment type
- Tag with currency and exposure information
- Portfolio-level reporting and cross-portfolio summaries

### Investment-Specific Features

**Private Equity Tracking:**
- Record total commitment amount
- Track capital calls (invested amounts) over time
- Record distributions received during investment period
- Timeline tracking (start date, expected completion)
- Portfolio inclusion settings:
  - Exclude from total portfolio value (default)
  - Include at invested amount (capital calls to date)
  - Include at committed amount
- User-configurable portfolio view toggles:
  - "Include Private Equity" checkbox/toggle for all portfolio value displays
  - Separate totals showing "Liquid Investments" vs "Total Including PE"
  - Clear indication when PE is included/excluded in calculations
- Notes and documentation for each capital call/distribution

### Reporting & Analytics
**Phase 1 - Essential Views:**
- Total portfolio value (with/without private equity)
- Total gain/loss (absolute and percentage)
- Individual investment performance
- Basic allocation breakdown by investment type
- Private equity tracking dashboard:
  - Commitment vs. invested amounts
  - Distribution history
  - Timeline progress

**Future Enhancements:**
- Performance charts and trends
- Currency exposure analysis
- Cross-portfolio comparisons
- Market sector allocation
- Risk metrics and diversification analysis

### Data Management
- Manual data entry interface
- Transaction history tracking
- Data validation and error handling
- Basic data export capabilities

## User Requirements

### Authentication
- Google OAuth integration
- Family member access (3-5 users maximum)
- Multi-portfolio support per user
- Portfolio sharing capabilities (view-only or full access)
- Basic user permissions management

### User Experience
- **Primary**: Desktop web interface
- **Secondary**: Mobile-responsive design for viewing/basic updates
- Intuitive data entry forms
- Clear visual hierarchy and navigation

### Performance Requirements
- Personal use scale (hundreds of transactions, not thousands)
- Data updates acceptable within minutes (not real-time)
- Simple caching for price data
- Basic error recovery and validation

## Technical Constraints

### Security
- Basic authentication sufficient (personal use)
- HTTPS for data transmission
- Simple session management
- No sensitive financial account integration

### Scalability
- Support for 3-5 concurrent users
- Handle ~100-500 investments total
- Transaction history up to 10 years
- Price data retention as needed

### Maintenance
- Self-hosted or simple cloud deployment
- Minimal ongoing maintenance requirements
- Clear documentation for future updates
- Modular design for feature additions

## Success Criteria

### Phase 1 (MVP - 3 months)
- [ ] User authentication via Google
- [ ] Multiple portfolio creation and management
- [ ] Add/edit all four investment types
- [ ] Record basic transactions (including capital calls/distributions)
- [ ] Manual price updates for alternatives
- [ ] Automatic price feeds for public investments
- [ ] Private equity commitment and capital call tracking
- [ ] Total portfolio value display (with PE inclusion options)
- [ ] Individual investment gain/loss calculation
- [ ] Basic responsive web interface

### Phase 2 (Enhancements - 6 months)
- [ ] Enhanced reporting and charts
- [ ] Currency conversion and exposure tracking
- [ ] Cross-portfolio analysis and comparisons
- [ ] Private equity timeline and progress tracking
- [ ] Mobile-optimized interface
- [ ] Data export functionality
- [ ] Transaction history analysis

### Phase 3 (Advanced Features - 12 months)
- [ ] Market categorization
- [ ] Advanced analytics and risk metrics
- [ ] Automated reporting and alerts
- [ ] Performance benchmarking

## Assumptions and Dependencies

- Free or low-cost price data sources available (Alpha Vantage, Yahoo Finance)
- Google OAuth remains free for personal use
- User comfortable with basic web interfaces
- Investment data entry acceptable as manual process initially
- Currency exchange rates available via free APIs

## Out of Scope (Permanently)

**These features will NOT be implemented in any phase:**
- Real-time trading integration or brokerage connectivity
- Tax reporting and calculations  
- Automated bank account integration
- Advanced portfolio optimization algorithms
- Multi-tenant SaaS architecture
- Comprehensive audit logging for compliance
- Advanced security features (2FA, encryption at rest)
- Integration with accounting software
- Automated document management
- Complex derivatives tracking
- Institutional-grade reporting
- API access for third parties

## Risk Mitigation

- **Technical Risk**: Choose well-established, beginner-friendly technology stack
- **Data Risk**: Implement basic backup and recovery procedures
- **Complexity Risk**: Start with MVP and iterate based on actual usage
- **Learning Curve Risk**: Focus on one technology at a time, leverage existing tools
