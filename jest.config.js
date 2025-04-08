const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/e2e'],
  // Add moduleNameMapper to handle @/ path alias
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Add this line to transform lucide-react
  transformIgnorePatterns: ['/node_modules/(?!(lucide-react)/)'],
};

module.exports = createJestConfig(config);
