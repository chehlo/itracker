const { exec } = require('child_process');
const { Client } = require('pg');
const { CONTAINER_NAMES, DATABASE_CONFIGS, TEST_SETTINGS } = require('../config/test-config.js');

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve(stdout.trim());
    });
  });
}

async function checkContainerStatus(containerName) {
  try {
    const result = await execCommand(`docker ps --filter "name=${containerName}" --filter "status=running" --format "{{.Names}}"`);
    return result === containerName;
  } catch (error) {
    console.error(`Error checking status of container ${containerName}:`, error.message);
    return false;
  }
}

async function waitForContainerHealth(containerName, timeout = TEST_SETTINGS.timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const isRunning = await checkContainerStatus(containerName);
    if (isRunning) {
      return true;
    }
    await new Promise(res => setTimeout(res, 1000));
  }
  throw new Error(`Timeout waiting for container ${containerName} to be healthy`);
}

async function validateDatabaseConnection(dbConfig) {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query('SELECT NOW()');
    return {success: true, error: null, troubleshooting: []};
  } catch (error) {
    return {
      success: false,
      error: error.message,
      troubleshooting: [
            'Check if container is running: docker ps',
            'Check container logs: docker logs investment_tracker_db',
            'Verify database credentials match docker-compose.yml'
      ]
    };
  } finally {
    await client.end();
  }
}

async function checkContainerExist(containerName) {
  try {
    const result = await execCommand(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`);
    return result === containerName;
    } catch (error) {
    return false;
  }
}

async function getContainerLogs(containerName) {
  try {
    const logs = await execCommand(`docker logs ${containerName}`);
    return logs;
  } catch (error) {
    console.error(`Error fetching logs for container ${containerName}:`, error.message);
    return null;
  }
}

async function isDatabaseHealthy(env) {
  const containerName = CONTAINER_NAMES[env];
  const dbConfig = DATABASE_CONFIGS[env];

  const containerExists = await checkContainerExist(containerName);
  if (!containerExists) {
    return {
      healthy: false,
      message: `Container ${containerName} does not exist.`,
      troubleshooting: [
        `Ensure the container is defined in your docker-compose.yml`,
        `Start the container with: docker-compose up -d ${containerName}`
      ]
    };
  }

  const isRunning = await checkContainerStatus(containerName);
  if (!isRunning) {
    return {
      healthy: false,
      message: `Container ${containerName} is not running.`,
      troubleshooting: [
        `Start the container with: docker-compose up -d ${containerName}`,
        `Check container logs: docker logs ${containerName}`
      ]
    };
  }

  try {
    await waitForContainerHealth(containerName);
  } catch (error) {
    return {
      healthy: false,
      message: `Container ${containerName} is not healthy: ${error.message}`,
      troubleshooting: [
        `Check container logs: docker logs ${containerName}`,
        `Ensure the database service is configured correctly in docker-compose.yml`
      ]
    };
  }
  return { healthy: true, message: `Database ${containerName} is healthy` };
}

module.exports = {
  checkContainerStatus,
  waitForContainerHealth,
  validateDatabaseConnection,
  checkContainerExist,
  getContainerLogs,
  isDatabaseHealthy,
  CONTAINER_NAMES,
  DATABASE_CONFIGS,
  TEST_SETTINGS,
};
