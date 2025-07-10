export default {
  // REMOVE THIS LINE - @angular-builders/jest handles setup automatically
  // setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js', 'html', 'json', 'mjs'],
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)'],

  // ignore everything in node_modules EXCEPT Angular packages
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@ngrx|ngx-.*|@ngx-.*)/)',
  ],

  // 10 seconds default timeout for all tests
  testTimeout: 10000,

  // Transform configuration
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: 'tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },

  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@auth/(.*)$': '<rootDir>/src/app/auth/$1',
    '^@users/(.*)$': '<rootDir>/src/app/users/$1'
  },

  // Coverage configuration
  collectCoverage: false, // Enable with --coverage flag
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.d.ts',
    '!src/app/**/index.ts',
    '!src/app/**/*.model.ts',
    '!src/app/**/*.enum.ts',
    '!src/app/**/*.interface.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
