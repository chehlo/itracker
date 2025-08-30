// Helper functions for running specific test suites
const { spawn } = require('child_process');

function runTests(pattern = '', options = {}) {
  const args = ['test'];
  
  if (pattern) {
    args.push(pattern);
  }
  
  if (options.watch) {
    args.push('--watch');
  }
  
  if (options.verbose) {
    args.push('--verbose');
  }
  
  if (options.coverage) {
    args.push('--coverage');
  }
  
  const jest = spawn('npm', args, {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  
  return new Promise((resolve, reject) => {
    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    jest.on('error', reject);
  });
}

module.exports = {
  runTests
};
