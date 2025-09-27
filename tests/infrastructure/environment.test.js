const { spawn } = require('child_process');
const { createTestClient, closeTestClient } = require('../helpers/database-config');

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

      return new Promise((resolve, reject) => {
        // Try docker compose first, then docker-compose
        const tryDockerCompose = (command) => {
          const dockerPs = spawn(command.split(' ')[0], [...command.split(' ').slice(1), 'ps', DB_SERVICE_NAME], {
            cwd: '../environment',
            stdio: 'pipe'
          });

          let output = '';
          let errorOutput = '';

          dockerPs.stdout.on('data', (chunk) => {
            output += chunk.toString();
          });

          dockerPs.stderr.on('data', (chunk) => {
            errorOutput += chunk.toString();
          });

          return new Promise((res, rej) => {
            dockerPs.on('close', (code) => {
              if (code === 0) {
                res({ success: true, output, errorOutput });
              } else {
                res({ success: false, output, errorOutput });
              }
            });

            dockerPs.on('error', (error) => {
              res({ success: false, error: error.message });
            });
          });
        };

        // Try both versions
        Promise.resolve()
          .then(() => tryDockerCompose('docker compose'))
          .then((result) => {
            if (result.success) return result;
            return tryDockerCompose('docker-compose');
          })
          .then((result) => {
            if (result.success) {
              const { output } = result;
              if (output.includes(DB_SERVICE_NAME) && output.includes('Up')) {
                containerRunning = true;
                console.log('✅ PostgreSQL container is running');
                resolve();
              } else if (output.includes(DB_SERVICE_NAME) && !output.includes('Up')) {
                console.error('❌ PostgreSQL container exists but is not running');
                reject(new Error(`PREREQUISITE FAILED: PostgreSQL container is stopped\n\n🔧 Fix: Start the container\n   cd environment\n   docker compose up -d DB_SERVICE_NAME\n   # or\n   docker-compose up -d DB_SERVICE_NAME`));
              } else {
                console.error('❌ PostgreSQL container not found');
                reject(new Error(`PREREQUISITE FAILED: PostgreSQL container not found\n\n🔧 Fix: Create and start the container\n   cd environment\n   docker compose up -d DB_SERVICE_NAME\n   # or\n   docker-compose up -d DB_SERVICE_NAME`));
              }
            } else {
              console.error('❌ Cannot check container status');
              reject(new Error(`PREREQUISITE FAILED: Cannot run docker compose commands\n\nError: ${result.error || result.errorOutput}\n\n🔧 Fix: Ensure you're in the project root and environment/docker-compose.yml exists`));
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    });

    test('PostgreSQL container must be healthy and accepting connections', async () => {
      if (!containerRunning) {
        throw new Error('SKIPPED: PostgreSQL container not running');
      }

      return new Promise((resolve, reject) => {
        // Try both docker compose versions for health check
        const healthCheck = spawn('docker', ['exec', 'investment_tracker_db', 'pg_isready', '-U', 'dev_user', '-d', 'investment_tracker_dev'], {
          stdio: 'pipe'
        });

        let output = '';
        let errorOutput = '';

        healthCheck.stdout.on('data', (chunk) => {
          output += chunk.toString();
        });

        healthCheck.stderr.on('data', (chunk) => {
          errorOutput += chunk.toString();
        });

        healthCheck.on('close', (code) => {
          if (code === 0) {
            databaseReady = true;
            console.log('✅ PostgreSQL is ready and accepting connections');
            resolve();
          } else {
            console.error('❌ PostgreSQL is not ready');
            console.error(`   Output: ${output}`);
            console.error(`   Error: ${errorOutput}`);
            reject(new Error(`PREREQUISITE FAILED: PostgreSQL not ready to accept connections\n\n🔧 Common causes:\n  1. Container still starting up (wait 10-30 seconds and retry)\n  2. Database initialization failed\n  3. Wrong database name or user\n\n🔍 Debug commands:\n   docker logs investment_tracker_db\n   docker exec investment_tracker_db psql -U dev_user -d investment_tracker_dev -c "SELECT 1;"`));
          }
        });

        healthCheck.on('error', (error) => {
          console.error('❌ Health check command failed');
          reject(new Error(`PREREQUISITE FAILED: Cannot execute health check\n\nError: ${error.message}\n\n🔧 Fix: Ensure container name is correct: investment_tracker_db`));
        });
      });
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

      expect(dbResult.rows[0].current_database).toBe('investment_tracker_dev');
      expect(userResult.rows[0].current_user).toBe('dev_user');
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

    test('should have test data', async () => {
      client = await createTestClient();

      const result = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(result.rows[0].count);

      if (userCount === 0) {
        throw new Error(`TEST DATA ERROR: No users found in database\n\n🔧 Fix: Check seed data loading\n   docker logs investment_tracker_db\n   Look for seed-dev.sql execution errors`);
      }

      console.log(`✅ Test data loaded: ${userCount} users found`);
      expect(userCount).toBeGreaterThan(0);
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
