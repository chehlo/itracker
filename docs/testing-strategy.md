# Testing Strategy & Implementation Plan

## Testing Philosophy

### Core Principles
- **Test-Driven Development (TDD)**: Write tests before implementation where practical
- **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
- **Fail Fast**: Catch errors as early as possible in the development cycle
- **Comprehensive Coverage**: Financial calculations require high confidence
- **Realistic Data**: Use production-like test data for accurate validation

### Risk-Based Testing Priorities
1. **Critical**: Financial calculations, currency conversions, portfolio math
2. **High**: Authentication, data persistence, API endpoints
3. **Medium**: UI components, form validation, error handling
4. **Low**: Styling, non-critical user preferences

## Testing Architecture

### Test Types & Tools

#### 1. Unit Tests
**Scope**: Individual functions, components, and modules
**Tools**: Jest + Testing Library
**Coverage Target**: 90%+ for business logic, 70%+ overall

```javascript
// Example: Portfolio calculation unit test
describe('Portfolio Calculations', () => {
  test('should calculate total value excluding private equity by default', () => {
    const investments = [
      { type: 'public', value: 1000, currency: 'USD' },
      { type: 'private_equity', invested: 500, currency: 'USD' },
      { type: 'alternative', value: 300, currency: 'USD' }
    ];
    
    const result = calculatePortfolioValue(investments, { includePE: false });
    expect(result.totalValue).toBe(1300);
    expect(result.excludedPE).toBe(500);
  });
});
```

#### 2. Integration Tests
**Scope**: API endpoints, database operations, external service integration
**Tools**: Supertest + Test Database
**Coverage Target**: All API endpoints and database operations

```javascript
// Example: API integration test
describe('Investment API', () => {
  test('POST /api/investments should create new investment', async () => {
    const newInvestment = {
      name: 'Apple Stock',
      type: 'public_market',
      symbol: 'AAPL',
      currency: 'USD'
    };
    
    const response = await request(app)
      .post('/api/investments')
      .send(newInvestment)
      .expect(201);
      
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('Apple Stock');
  });
});
```

#### 3. Component Tests
**Scope**: React components in isolation
**Tools**: React Testing Library + Jest
**Coverage Target**: All interactive components

```javascript
// Example: Component test
describe('InvestmentForm', () => {
  test('should validate required fields', async () => {
    render(<InvestmentForm onSubmit={mockSubmit} />);
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
```

#### 4. End-to-End Tests
**Scope**: Complete user workflows
**Tools**: Playwright
**Coverage Target**: Critical user journeys only

```javascript
// Example: E2E test
test('complete investment tracking workflow', async ({ page }) => {
  await page.goto('/login');
  await page.click('text=Login with Google');
  
  await page.goto('/dashboard');
  await page.click('text=Add Investment');
  
  await page.fill('[name="name"]', 'Test Stock');
  await page.selectOption('[name="type"]', 'public_market');
  await page.click('text=Save');
  
  await expect(page.locator('text=Test Stock')).toBeVisible();
});
```

## Testing Infrastructure Setup

### Test Database Strategy
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: investment_tracker_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed
```

### Test Environment Configuration
```javascript
// config/test.js
module.exports = {
  database: {
    host: 'localhost',
    port: 5433,
    database: 'investment_tracker_test',
    username: 'test_user',
    password: 'test_password',
    logging: false,  // Disable SQL logs in tests
  },
  auth: {
    jwtSecret: 'test-secret-key',
    googleAuth: false,  // Mock Google auth in tests
  },
  externalAPIs: {
    priceData: 'mock',  // Use mock price data
    exchangeRates: 'mock',
  }
};
```

### Test Data Management

#### Factory Pattern for Test Data (Implemented)
Factories located in `tests/factories/`: userFactory, portfolioFactory, investmentFactory, transactionFactory.
Each provides `build()` (data only) and `create()` (insert to DB) methods. Use for database tests, not API integration tests.
### Lessons Learned: Test Database Isolation

**Challenge**: Initial implementation had separate connection patterns for tests vs production
- Production used Pool exports from database.js
- Tests used Client connections from database-config.js
- Controllers couldn't work with both patterns simultaneously

**Solution**: Environment-based configuration (implemented)
- Single database module reads NODE_ENV
- Test files set environment variables before requiring app
- Controllers import unified abstraction layer

**Key Insight**: Test database configuration must be set BEFORE app initialization, not after.

#### Realistic Test Scenarios
```javascript
// tests/fixtures/portfolioScenarios.js
export const diversifiedPortfolio = {
  name: 'Diversified Portfolio Test',
  investments: [
    { type: 'public_market', symbol: 'SPY', value: 10000, currency: 'USD' },
    { type: 'public_market', symbol: 'VTI', value: 5000, currency: 'USD' },
    { type: 'alternative', name: 'Real Estate', value: 50000, currency: 'USD' },
    { type: 'recurring', name: '401k', totalContributions: 25000, currentValue: 30000 },
    { type: 'private_equity', commitment: 100000, invested: 30000, distributions: 5000 }
  ]
};
```

## Critical Test Cases

### Financial Calculations (High Priority)
```javascript
describe('Critical Financial Calculations', () => {
  describe('Currency Conversion', () => {
    test('should handle multi-currency portfolio correctly');
    test('should apply exchange rates consistently');
    test('should handle currency exposure vs base currency');
  });
  
  describe('Private Equity Math', () => {
    test('should calculate net invested amount after distributions');
    test('should not include PE in liquid portfolio value by default');
    test('should handle partial capital calls correctly');
  });
  
  describe('Recurring Investment Tracking', () => {
    test('should separate contributions from gains');
    test('should calculate true returns accounting for new money');
  });
  
  describe('Portfolio Aggregation', () => {
    test('should sum investments correctly across currencies');
    test('should calculate total gains/losses accurately');
    test('should handle missing price data gracefully');
  });
});
```

### Authentication & Security
```javascript
describe('Authentication Security', () => {
  test('should reject unauthenticated API requests');
  test('should isolate user data properly');
  test('should validate portfolio ownership');
  test('should handle expired tokens gracefully');
});
```

### Data Validation
```javascript
describe('Input Validation', () => {
  test('should reject invalid currency codes');
  test('should validate transaction amounts are positive');
  test('should prevent duplicate investment symbols in portfolio');
  test('should validate date formats consistently');
});
```

## Test Automation & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:unit",
      "pre-push": "npm run test:integration"
    }
  },
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Development Testing Workflow

### Daily Development
1. **Unit tests in watch mode** while coding
2. **Integration tests** before committing
3. **Component tests** for UI changes
4. **Manual testing** for user experience

### Before Deployment
1. **Full test suite** passes
2. **E2E tests** on staging environment
3. **Performance tests** for critical paths
4. **Security tests** for authentication flows

### Test-Driven Development Process
```
1. Write failing test for new feature
2. Implement minimal code to make test pass
3. Refactor while keeping tests green
4. Add integration tests if needed
5. Commit with confidence
```

## Monitoring & Maintenance

### Test Health Metrics
- **Test execution time**: Keep under 30 seconds for unit tests
- **Test reliability**: 99%+ pass rate on CI
- **Coverage trends**: Monitor for coverage regression
- **Flaky test detection**: Identify and fix unstable tests

### Test Data Cleanup
```javascript
// Global test setup
beforeEach(async () => {
  await clearTestDatabase();
  await seedBasicTestData();
});

afterAll(async () => {
  await closeTestConnections();
});
```

### Mock Management
```javascript
// tests/mocks/priceService.js
export const mockPriceService = {
  getCurrentPrice: jest.fn().mockResolvedValue({ price: 100, currency: 'USD' }),
  getHistoricalPrices: jest.fn().mockResolvedValue([]),
  getExchangeRate: jest.fn().mockResolvedValue(1.0)
};
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Jest and Testing Library
- [ ] Configure test database
- [ ] Write first unit tests for core calculations
- [ ] Set up basic CI pipeline

### Week 2: Coverage
- [ ] Add integration tests for APIs
- [ ] Component tests for forms
- [ ] Mock external services
- [ ] Achieve 80% coverage target

### Week 3: E2E & Performance
- [ ] Set up Playwright
- [ ] Write critical user journey tests
- [ ] Add performance benchmarks
- [ ] Configure test monitoring

### Week 4: Advanced
- [ ] Property-based testing for calculations
- [ ] Load testing for multi-user scenarios
- [ ] Security testing automation
- [ ] Test documentation and training

## Success Criteria

### Short-term (1 month)
- All new code has accompanying tests
- CI pipeline catches regressions immediately
- High confidence in financial calculations
- Fast feedback loop for developers

### Long-term (3 months)
- Comprehensive test coverage across all features
- Automated testing prevents production bugs
- Performance tests ensure scalability
- Team comfortable with testing practices
