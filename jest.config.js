const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup-simple.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/performance/',
    '<rootDir>/tests/security/',
    '<rootDir>/tests/integration/disabled/',
    '<rootDir>/backup/'
  ],
  collectCoverageFrom: [
    'src/lib/**/*.{js,jsx,ts,tsx}',
    'src/components/**/*.{js,jsx,ts,tsx}',
    'src/hooks/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/types/**/*',
    '!src/lib/prisma.ts',
    '!src/lib/test-db.ts',
    '!**/*.config.*',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 0, // Desabilitado temporariamente durante MVP
      functions: 0, // Desabilitado temporariamente durante MVP  
      lines: 0, // Desabilitado temporariamente durante MVP
      statements: 0 // Desabilitado temporariamente durante MVP
    }
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false, // Only when explicitly requested
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)