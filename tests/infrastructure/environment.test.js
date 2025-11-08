const { spawn } = require('child_process');
const { createTestClient, closeTestClient } = require('../helpers/database-config');
const { checkContainerStatus, validateDatabaseConnection } = require('../helpers/container-utils');
const { CONTAINER_NAMES, DATABASE_CONFIGS } = require('../config/test-config');

// Global state to track prerequisite status
let dockerRunning = false;
let dockerComposeAvailable = false;
let containerRunning = false;
let databaseReady = false;

const DB_SERVICE_NAME = 'db-dev';

describe('Development Environment Prerequisites (Sequential)', () => {

  describe('Step 1: Docker Environment', () => {
    test('Docker must be running', async () => {
      return new Promise((resolve, reject) => {
        const dockerInfo = spawn('docker', ['info'], { stdio: 'pipe' });

        let errorOutput = '';
        dockerInfo.stderr.on('data', (chunk) => {
          errorOutput += chunk.toString();
        });

        dockerInfo.on('close', (code) => {
          if (code === 0) {
            dockerRunning = true;
            console.log('✅ Docker is running');
            resolve();
          } else {
            console.error('❌ Docker is not running');
            console.error('   Please start Docker Desktop and try again');
            reject(new Error(`PREREQUISITE FAILED: Docker is not running\n\nError: ${errorOutput}\n\n🔧 Fix: Start Docker Desktop and wait for it to be ready`));
          }
        });

        dockerInfo.on('error', (error) => {
          console.error('❌ Docker command not found');
          reject(new Error(`PREREQUISITE FAILED: Docker not installed or not in PATH\n\nError: ${error.message}\n\n🔧 Fix: Install Docker Desktop`));
        });
      });
    });

    test('Docker Compose must be available', async () => {
      if (!dockerRunning) {
        throw new Error('SKIPPED: Docker not running');
      }

      // Try docker compose (V2) first, then docker-compose (V1)
      const tryCommand = (cmd, args) => {
        return new Promise((resolve, reject) => {
          const process = spawn(cmd, args, { stdio: 'pipe' });

          process.on('close', (code) => {
            resolve(code === 0);
          });

          process.on('error', () => {
            resolve(false);
          });
        });
      };

      const v2Available = await tryCommand('docker', ['compose', '--version']);
      const v1Available = await tryCommand('docker-compose', ['--version']);

      if (v2Available || v1Available) {
        dockerComposeAvailable = true;
        const version = v2Available ? 'V2 (docker compose)' : 'V1 (docker-compose)';
        console.log(`✅ Docker Compose ${version} is available`);
      } else {
        console.error('❌ Docker Compose not found');
        throw new Error(`PREREQUISITE FAILED: Docker Compose not available\n\n🔧 Fix: Install Docker Compose\n  - For V2: Usually included with Docker Desktop\n  - For V1: sudo apt-get install docker-compose`);
      }
    });
  });

  describe('Step 2: Database Container', () => {
    test('PostgreSQL container must be running', async () => {
      if (!dockerRunning || !dockerComposeAvailable) {
        throw new Error('SKIPPED: Docker prerequisites not met');
      }

      const isRunning = await checkContainerStatus(CONTAINER_NAMES.development);
      if (isRunning) {
        containerRunning = true;
        console.log('✅ PostgreSQL container is running');
      } else {
        console.error('ℹ️ PostgreSQL container not running, checking status...');
        throw new Error(`PREREQUISITE FAILED: PostgreSQL container not running\n\n🔧 Fix: Start the container:\n  cd environment\n  docker compose up -d ${DB_SERVICE_NAME}  # or docker-compose up -d ${DB_SERVICE_NAME}\n  Wait 10-30 seconds for initialization\n\n🔍 Debug commands:\n  docker ps\n  docker logs investment_tracker_db`);
      }
    });

    test('PostgreSQL container must be healthy and accepting connections', async () => {
      if (!containerRunning) {
        throw new Error('SKIPPED: PostgreSQL container not running');
      }
      const result = await validateDatabaseConnection(DATABASE_CONFIGS.development);
      if (result.success) {
        databaseReady = true;
        console.log('✅ Database is accepting connections');
      } else {
        console.error('❌ Database connection failed');
        result.troubleshooting.forEach(tip => console.error(`   - ${tip}`));
        throw new Error(`PREREQUISITE FAILED: Cannot connect to database\n\nError: ${result.error}\n\n🔧 Fix:\n  ${result.troubleshooting.join('\n  ')}\n`);
      }
    });
  });

  describe('Step 3: Database Connection & Schema (Only if prerequisites pass)', () => {
    let client;

    beforeAll(async () => {
      if (!databaseReady) {
        throw new Error('SKIPPED: Database prerequisites not met');
      }
    });

    afterEach(async () => {
      await closeTestClient(client);
      client = null;
    });

    test('should connect to database successfully', async () => {
      try {
        client = await createTestClient();
        console.log('✅ Database connection successful');
        expect(client).toBeDefined();
      } catch (error) {
        console.error('❌ Database connection failed');
        throw new Error(`DATABASE CONNECTION FAILED: ${error.message}\n\n🔧 Debug steps:\n  1. Check container: docker ps\n  2. Check logs: docker logs investment_tracker_db\n  3. Test connection: docker exec investment_tracker_db psql -U dev_user -d investment_tracker_dev -c "SELECT 1;"`);
      }
    });

    test('should have correct database and user', async () => {
      client = await createTestClient();

      const dbResult = await client.query('SELECT current_database()');
      const userResult = await client.query('SELECT current_user');

      expect(dbResult.rows[0].current_database).toBe('investment_tracker_test');
      expect(userResult.rows[0].current_user).toBe('test_user');
      console.log('✅ Database name and user verified');
    });

    test('should have all required tables', async () => {
      client = await createTestClient();

      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const tables = result.rows.map(row => row.table_name);
      const requiredTables = ['users', 'portfolios', 'investments', 'transactions'];

      requiredTables.forEach(table => {
        if (!tables.includes(table)) {
          throw new Error(`SCHEMA ERROR: Required table '${table}' not found\n\nFound tables: ${tables.join(', ')}\n\n🔧 Fix: Check database initialization\n   docker logs investment_tracker_db\n   Look for SQL errors during startup`);
        }
      });

      console.log(`✅ All required tables found: ${requiredTables.join(', ')}`);
    });

    test('should accept test data inserts', async () => {
      client = await createTestClient();

      // Test that database can accept a user insert (verifies schema is correct)
      const testEmail = `test-${Date.now()}@example.com`;
      const insertResult = await client.query(`
        INSERT INTO users (email, password_hash, name)
        VALUES ($1, $2, $3)
        RETURNING id, email
      `, [testEmail, '$2b$10$test', 'Test User']);

      expect(insertResult.rows[0].id).toBeDefined();
      expect(insertResult.rows[0].email).toBe(testEmail);

      // Clean up test data
      await client.query('DELETE FROM users WHERE id = $1', [insertResult.rows[0].id]);

      console.log('✅ Database accepts test data correctly');
    });
  });
});

// Don't show setup instructions in test mode
if (process.env.NODE_ENV !== 'test') {
  afterAll(() => {
    console.log(`
🎯 NEXT STEPS:
1. Fix the first failing prerequisite
2. Re-run tests: npm test
3. Each test failure will show exactly what to fix

🐳 Quick Setup Commands:
cd environment
docker compose up -d $DB_SERVICE_NAME  # or docker-compose up -d $DB_SERVICE_NAME
cd ../tests
npm test
`);
  });
}
