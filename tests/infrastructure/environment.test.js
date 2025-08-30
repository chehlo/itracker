const { spawn } = require('child_process');
const { createTestClient, closeTestClient } = require('../helpers/database-config');

describe('Development Environment', () => {
  describe('Docker Services', () => {
    test('PostgreSQL container should be running', async () => {
      return new Promise((resolve, reject) => {
        const dockerPs = spawn('docker-compose', ['ps', 'postgres'], {
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

        dockerPs.on('close', (code) => {
          if (code === 0) {
            expect(output).toContain('postgres');
            expect(output).toContain('Up');
            resolve();
          } else {
            reject(new Error(`Docker command failed: ${errorOutput}`));
          }
        });

        dockerPs.on('error', (error) => {
          reject(error);
        });
      });
    });
  });

  describe('Service Health', () => {
    test('PostgreSQL should be accepting connections', async () => {
      let client;
      try {
        client = await createTestClient();
        // If we get here, connection succeeded
        expect(client).toBeDefined();
      } finally {
        await closeTestClient(client);
      }
    });

    test('database should respond within acceptable time', async () => {
      let client;
      try {
        client = await createTestClient();
        
        const start = Date.now();
        await client.query('SELECT 1');
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(1000); // Should respond in under 1 second
      } finally {
        await closeTestClient(client);
      }
    });
  });
});
