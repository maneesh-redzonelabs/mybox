module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['dotenv/config'],
  globalSetup: '<rootDir>/scripts/resetTestSchema.js',
  verbose: true,
  forceExit: true,
};
