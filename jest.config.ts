export default {
  // REMOVE THIS LINE - @angular-builders/jest handles setup automatically
  // setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js', 'html', 'json', 'mjs'],
  
  // Focus test matching on current development areas only
  testMatch: [
    '<rootDir>/src/app/events/**/*.spec.ts',
    '<rootDir>/src/app/home/**/*.spec.ts', 
    '<rootDir>/src/app/shared/**/*.spec.ts',
    '<rootDir>/src/testing/**/*.spec.ts',
    '<rootDir>/src/app/auth/**/*.spec.ts',
    '<rootDir>/src/app/users/**/*.spec.ts'
  ],

  // Aggressively ignore large directories to reduce file watching
  watchPathIgnorePatterns: [
    'node_modules',
    'dist',
    'coverage',
    'docs',
    'android',
    'ios',
    '\\.git',
    'firebase-debug\\.log',
    'firestore-debug\\.log',
    'ui-debug\\.log',
    '\\.firebase'
  ],

  // Use native Node.js fs.watch instead of Watchman for better file handle management
  watchman: false,

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
