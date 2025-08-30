const { createTestClient, closeTestClient } = require('../helpers/database-config');

describe('Database Infrastructure', () => {
  let client;
  
  // Setup before all tests
  beforeAll(async () => {
    console.log('🔧 Setting up database connection for tests...');
    try {
      client = await createTestClient();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('🧹 Cleaning up database connection...');
    await closeTestClient(client);
    console.log('✅ Database connection closed');
  });

  describe('Database Connection', () => {
    test('should connect successfully', async () => {
      const result = await client.query('SELECT 1 as connection_test');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].connection_test).toBe(1);
    });

    test('should be using correct database', async () => {
      const result = await client.query('SELECT current_database()');
      expect(result.rows[0].current_database).toBe('investment_tracker_dev');
    });

    test('should be connected as correct user', async () => {
      const result = await client.query('SELECT current_user');
      expect(result.rows[0].current_user).toBe('dev_user');
    });
  });

  describe('Database Schema', () => {
    test('should have all required tables', async () => {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tables = result.rows.map(row => row.table_name);
      
      // Core tables that must exist
      expect(tables).toContain('users');
      expect(tables).toContain('portfolios');
      expect(tables).toContain('investments');
      expect(tables).toContain('transactions');
    });

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
    });
  });

  describe('Test Data', () => {
    test('should have test users', async () => {
      const result = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(result.rows[0].count);
      expect(userCount).toBeGreaterThan(0);
    });

    test('should have test portfolios', async () => {
      const result = await client.query('SELECT COUNT(*) as count FROM portfolios');
      const portfolioCount = parseInt(result.rows[0].count);
      expect(portfolioCount).toBeGreaterThan(0);
    });

    test('should have test investments', async () => {
      const result = await client.query('SELECT COUNT(*) as count FROM investments');
      const investmentCount = parseInt(result.rows[0].count);
      expect(investmentCount).toBeGreaterThanOrEqual(2);
    });

    test('should have valid data relationships', async () => {
      const result = await client.query(`
        SELECT 
          u.name as user_name,
          u.email,
          p.name as portfolio_name,
          COUNT(i.id) as investment_count
        FROM users u
        JOIN portfolios p ON u.id = p.user_id
        LEFT JOIN investments i ON p.id = i.portfolio_id
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
      });
    });
  });

  describe('Data Integrity', () => {
    test('should enforce foreign key constraints', async () => {
      // Try to insert portfolio with non-existent user_id
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      await expect(
        client.query(`
          INSERT INTO portfolios (id, name, user_id, created_at)
          VALUES (gen_random_uuid(), 'Test Portfolio', $1, NOW())
        `, [fakeUserId])
      ).rejects.toThrow();
    });

    test('should require non-null values for required fields', async () => {
      // Try to insert user without email
      await expect(
        client.query(`
          INSERT INTO users (id, name, created_at)
          VALUES (gen_random_uuid(), 'Test User', NOW())
        `)
      ).rejects.toThrow();
    });
  });
});
