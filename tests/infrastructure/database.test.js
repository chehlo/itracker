const { createTestClient, closeTestClient } = require('../helpers/database-config');
const { userFactory, portfolioFactory, investmentFactory, transactionFactory } = require('../factories');

// Test data constants for consistency and readability
const TEST_DATA = {
  user: {
    email: 'test@example.com',
    password_hash: '$2b$10$test',
    name: 'Test User'
  },
  constraintTest: {
    email: 'constraint-test@example.com',
    password_hash: '$2b$10$test',
    name: 'Constraint Test User'
  },
  portfolio: {
    name: 'Test Portfolio'
  },
  investments: [
    { type: 'public_market', name: 'Apple Inc', symbol: 'AAPL' },
    { type: 'alternative', name: 'Real Estate Fund', notes: 'Real Estate Fund' },
    { type: 'recurring', name: 'Monthly Investment', notes: 'Monthly recurring investment' },
    { type: 'private_equity', name: 'Startup Investment', commitment_amount: 10000.00, notes: 'Startup Investment' }
  ]
};

describe('Database Schema & Data Tests (Run after environment tests pass)', () => {
  let client;

  // Setup before all tests
  beforeAll(async () => {
    console.log('🔧 Setting up database connection for schema tests...');
    try {
      client = await createTestClient();
      console.log('✅ Database connection established for schema tests');
    } catch (error) {
      console.error('❌ Failed to connect to database for schema tests:', error.message);
      console.error('   This usually means environment prerequisites are not met');
      console.error('   Run environment tests first: npm run test:infrastructure -- --testNamePattern="Prerequisites"');
      throw new Error(`DATABASE CONNECTION FAILED: ${error.message}\n\n🔧 Run environment tests first to set up prerequisites`);
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('🧹 Cleaning up database connection...');
    await closeTestClient(client);
    console.log('✅ Database connection closed');
  });

  describe('Database Schema Validation', () => {
    test('users table should have correct structure', async () => {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const columns = result.rows.reduce((acc, row) => {
        acc[row.column_name] = {
          type: row.data_type,
          nullable: row.is_nullable === 'YES'
        };
        return acc;
      }, {});

      // Required columns
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('email');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('created_at');

      // Check data types
      expect(columns.id.type).toBe('uuid');
      expect(columns.email.type).toBe('character varying');
      expect(columns.name.type).toBe('character varying');

      console.log('✅ Users table structure validated');
    });

    test('portfolios table should have user relationship', async () => {
      const result = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'portfolios'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('users');
      expect(result.rows[0].column_name).toBe('user_id');

      console.log('✅ Portfolio-User relationship validated');
    });

    test('investments table should have portfolio relationship and correct enums', async () => {
      // Check foreign key
      const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'investments'
      `);

      expect(fkResult.rows.some(row => row.foreign_table_name === 'portfolios')).toBe(true);

      // Check investment_type enum
      const enumResult = await client.query(`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'investment_type')
        ORDER BY enumlabel
      `);

      const enumValues = enumResult.rows.map(row => row.enumlabel);
      expect(enumValues).toContain('public_market');
      expect(enumValues).toContain('alternative');
      expect(enumValues).toContain('recurring');
      expect(enumValues).toContain('private_equity');

      console.log('✅ Investment table structure and enums validated');
    });
  });

  describe('Test Data Validation', () => {
    // Sets up test data before each test in this describe block
    // Creates: 1 user, 1 portfolio, 4 investments (one of each type), 3 transactions
    beforeEach(async () => {
      console.log('🧼 Resetting database state for data validation tests...');
      try {
        // Clear all tables in correct order (respecting foreign key constraints)
        await client.query('DELETE FROM transactions');
        await client.query('DELETE FROM investments');
        await client.query('DELETE FROM portfolios');
        await client.query('DELETE FROM users');

        // Create test user using factory
        const user = await userFactory.create(client, TEST_DATA.user);

        // Create test portfolio using factory
        const portfolio = await portfolioFactory.create(client, {
          name: TEST_DATA.portfolio.name,
          user_id: user.id
        });

        // Create test investments (one of each type) using factory
        const investmentIds = [];
        for (const inv of TEST_DATA.investments) {
          const investment = await investmentFactory.create(client, {
            ...inv,
            portfolio_id: portfolio.id
          });
          investmentIds.push(investment.id);
        }

        // Create test transactions for the first investment using factory
        const [firstInvestmentId] = investmentIds;
        await transactionFactory.create(client, {
          investment_id: firstInvestmentId,
          type: 'buy',
          amount: 1000.00,
          currency: 'USD'
        });
        await transactionFactory.create(client, {
          investment_id: firstInvestmentId,
          type: 'capital_call',
          amount: 500.00,
          currency: 'USD'
        });
        await transactionFactory.create(client, {
          investment_id: firstInvestmentId,
          type: 'contribution',
          amount: 200.00,
          currency: 'USD'
        });

        console.log('✅ Database state reset complete');
      } catch (error) {
        console.error('❌ Error resetting database state:', error.message);
        throw error;
      }
    });

    // Cleans up test data after each test
    // Deletes in correct order to respect foreign key constraints
    afterEach(async () => {
      console.log('🧹 Cleaning up test data after each test...');
      try {
        await client.query('DELETE FROM transactions');
        await client.query('DELETE FROM investments');
        await client.query('DELETE FROM portfolios');
        await client.query('DELETE FROM users');
        console.log('✅ Test data cleanup complete');
      } catch (error) {
        console.error('❌ Error during test data cleanup:', error.message);
      }
    });

    test('should have test users with valid data', async () => {
      const result = await client.query('SELECT COUNT(*) as count, MIN(email) as sample_email FROM users');
      const userCount = parseInt(result.rows[0].count);
      const sampleEmail = result.rows[0].sample_email;

      expect(userCount).toBeGreaterThan(0);
      expect(sampleEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      console.log(`✅ Found ${userCount} test users with valid emails`);
    });

    test('should have test portfolios linked to users', async () => {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM portfolios p
        JOIN users u ON p.user_id = u.id
      `);
      const portfolioCount = parseInt(result.rows[0].count);

      expect(portfolioCount).toBeGreaterThan(0);
      console.log(`✅ Found ${portfolioCount} test portfolios with valid user relationships`);
    });

    test('should have test investments of different types', async () => {
      const result = await client.query(`
        SELECT type, COUNT(*) as count
        FROM investments
        GROUP BY type
        ORDER BY type
      `);

      const investmentsByType = result.rows.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {});

      expect(investmentsByType).toHaveProperty('public_market');
      expect(investmentsByType).toHaveProperty('alternative');
      expect(investmentsByType).toHaveProperty('recurring');
      expect(investmentsByType).toHaveProperty('private_equity');

      const totalInvestments = Object.values(investmentsByType).reduce((sum, count) => sum + count, 0);
      console.log(`✅ Found ${totalInvestments} test investments across ${Object.keys(investmentsByType).length} types`);
    });

    test('should have test transactions with valid relationships', async () => {
      const result = await client.query(`
        SELECT
          t.type as transaction_type,
          COUNT(*) as count
        FROM transactions t
        JOIN investments i ON t.investment_id = i.id
        GROUP BY t.type
        ORDER BY t.type
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const transactionTypes = result.rows.map(row => row.transaction_type);
      expect(transactionTypes).toContain('buy');
      expect(transactionTypes).toContain('capital_call');
      expect(transactionTypes).toContain('contribution');

      const totalTransactions = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      console.log(`✅ Found ${totalTransactions} test transactions across ${transactionTypes.length} types`);
    });

    test('should have valid data relationships across all tables', async () => {
      const result = await client.query(`
        SELECT
          u.name as user_name,
          u.email,
          p.name as portfolio_name,
          COUNT(DISTINCT i.id) as investment_count,
          COUNT(DISTINCT t.id) as transaction_count
        FROM users u
        JOIN portfolios p ON u.id = p.user_id
        LEFT JOIN investments i ON p.id = i.portfolio_id
        LEFT JOIN transactions t ON i.id = t.investment_id
        GROUP BY u.id, u.name, u.email, p.id, p.name
        ORDER BY u.name
      `);

      expect(result.rows).toHaveLength(1);

      // Check that each row has valid data
      result.rows.forEach(row => {
        expect(row.user_name).toBeTruthy();
        expect(row.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(row.portfolio_name).toBeTruthy();
        expect(parseInt(row.investment_count)).toBeGreaterThanOrEqual(0);
        expect(parseInt(row.transaction_count)).toBeGreaterThanOrEqual(0);
      });

      const summary = result.rows[0];
      console.log(`✅ Data relationships validated: ${summary.user_name} has ${summary.investment_count} investments with ${summary.transaction_count} transactions`);
    });
  });

  describe('Data Integrity Constraints', () => {
    test('should enforce foreign key constraints', async () => {
      const user = await userFactory.create(client);
      const portfolio = await portfolioFactory.create(client, { user_id: user.id });

      expect(portfolio.user_id).toBe(user.id);

      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      await expect(
        client.query(`
          INSERT INTO portfolios (id, name, user_id, created_at)
          VALUES (gen_random_uuid(), 'Test Portfolio', $1, NOW())
        `, [fakeUserId])
      ).rejects.toThrow();

      await client.query('DELETE FROM portfolios WHERE id = $1', [portfolio.id]);
      await client.query('DELETE FROM users WHERE id = $1', [user.id]);

      console.log('✅ Foreign key constraints working correctly');
    });

    test('should require non-null values for required fields', async () => {
      // Try to insert user without email
      await expect(
        client.query(`
          INSERT INTO users (id, name, created_at)
          VALUES (gen_random_uuid(), 'Test User', NOW())
        `)
      ).rejects.toThrow();

      console.log('✅ NOT NULL constraints working correctly');
    });

    test('should enforce positive amount constraint on transactions', async () => {
      const user = await userFactory.create(client, TEST_DATA.constraintTest);
      const portfolio = await portfolioFactory.create(client, {
        user_id: user.id,
        name: TEST_DATA.portfolio.name
      });

      const investment = await investmentFactory.create(client, {
        portfolio_id: portfolio.id,
        type: 'public_market',
        name: 'Apple Inc',
        symbol: 'AAPL'
      });

      // Attempt to insert transaction with negative amount (should fail)
      await expect(
        client.query(`
          INSERT INTO transactions (id, investment_id, type, amount, currency, transaction_date)
          VALUES (gen_random_uuid(), $1, 'buy', -100.00, 'USD', NOW())
        `, [investment.id])
      ).rejects.toThrow();

      await client.query('DELETE FROM transactions WHERE investment_id = $1', [investment.id]);
      await client.query('DELETE FROM investments WHERE id = $1', [investment.id]);
      await client.query('DELETE FROM portfolios WHERE id = $1', [portfolio.id]);
      await client.query('DELETE FROM users WHERE id = $1', [user.id]);

      console.log('✅ Positive amount constraint on transactions working correctly');
    });
  });
});
