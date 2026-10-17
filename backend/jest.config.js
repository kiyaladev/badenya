module.exports = {
  preset: 'ts-jest',
  maxWorkers: 2,
  // Runtime regressions transpile independently; npm run build checks all types.
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testTimeout: 180000,
};
