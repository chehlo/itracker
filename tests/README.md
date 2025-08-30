# Investment Tracker - Test Suite

This directory contains the complete test infrastructure for the Investment Tracker project.

## Structure

```
tests/
├── infrastructure/          # Infrastructure tests (database, environment)
├── helpers/                # Test utilities and configurations  
├── fixtures/               # Test data and mock objects
├── coverage/               # Test coverage reports (generated)
├── package.json            # Test dependencies and scripts
├── jest.config.js          # Jest configuration
└── README.md               # This file
```

## Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run only infrastructure tests
npm run test:infrastructure

# Run with coverage report
npm run test:coverage

# Run with verbose output
npm run test:verbose

# Run silently (less output)
npm run test:silent
```

## Test Categories

### Infrastructure Tests
- **Database Tests**: Schema validation, connection testing, data integrity
- **Environment Tests**: Docker services, health checks, performance

### Expected Test Flow
1. Environment tests verify Docker services are running
2. Database tests verify schema and test data
3. All tests should pass before proceeding to application development

## Test Configuration

- **Timeout**: 30 seconds per test (database operations can be slow)
- **Environment**: Node.js test environment
- **Coverage**: Collected from all JS/TS files except node_modules
- **Reporters**: Console output + JUnit XML for CI/CD

## Troubleshooting

### Common Issues
- **Connection refused**: Ensure Docker containers are running (`docker-compose up -d`)
- **Timeout errors**: Database might be starting up, wait and retry
- **Permission errors**: Ensure user has docker access rights

### Debug Commands
```bash
# Check if database is responding
npm run test:infrastructure -- --testNamePattern="should connect successfully"

# Run single test file
npm test infrastructure/database.test.js

# Run with maximum verbosity
npm run test:verbose
```

## Development Workflow

### Before Starting Development
1. Ensure Docker is running
2. Start database services: `cd ../environment && docker-compose up -d`
3. Run infrastructure tests: `npm run test:infrastructure`
4. All tests should pass before coding

### During Development
1. Run tests in watch mode: `npm run test:watch`
2. Tests will re-run automatically on file changes
3. Focus on making failing tests pass incrementally

### Test-Driven Development
1. Write failing test for new feature
2. Implement minimal code to make test pass
3. Refactor while keeping tests green
4. Commit with confidence

## Test Data Management

Test data is managed through:
- **Database seeds**: Initial test data loaded on startup
- **Test fixtures**: Reusable test objects in `fixtures/` directory
- **Factory functions**: Generate test objects with variations

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: Open `coverage/lcov-report/index.html` in browser
- **Console Summary**: Shown after running `npm run test:coverage`
- **Target**: Aim for >90% coverage on business logic

## CI/CD Integration

Tests are configured for CI/CD with:
- **JUnit XML**: Compatible with most CI systems
- **Exit codes**: Proper exit codes for build pipelines
- **Timeouts**: Reasonable timeouts for CI environments

## Next Steps

After infrastructure tests pass:
1. Create backend API tests
2. Add frontend component tests
3. Implement end-to-end user journey tests
4. Set up continuous integration pipeline
