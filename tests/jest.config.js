module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['jest-extended/all'],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.{js,ts}',
    '**/*.test.{js,ts}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // Coverage reporting
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml'
    }]
  ],
  
  // Verbose output for learning
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Detect open handles (useful for database connections)
  detectOpenHandles: true,
  
  // Force exit after tests (useful for database connections)
  forceExit: true
};
