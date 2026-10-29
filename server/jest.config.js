module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  // Все тесты работают с одной тестовой БД, поэтому запускаются последовательно
  maxWorkers: 1,
  testTimeout: 20000,
};
