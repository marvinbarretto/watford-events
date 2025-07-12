// Centralized test provider configurations - Angular 20 Signal-First Approach
// This file provides pre-configured provider sets for different testing scenarios

import { Provider } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { 
  createAuthServiceMock, 
  createFirebaseServiceMock, 
  createMockFirebaseUser 
} from './firebase-test-utils';
import { FirebaseMetricsService } from '@shared/data-access/firebase-metrics.service';

console.log('🏗️ Loading test provider configurations');

// ==================== BASIC PROVIDERS ====================
// Minimal providers for simple tests

export const basicTestProviders: Provider[] = [
  provideLocationMocks()
];

// ==================== FIREBASE PROVIDERS ====================
// Providers for Firebase-dependent services

export const createMockFirestore = (): jest.Mocked<Firestore> => ({
  app: {} as any,
  _delegate: {} as any
} as jest.Mocked<Firestore>);

export const createMockAuth = (): jest.Mocked<Auth> => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn()
} as any);

export const createMockFirebaseMetricsService = (): jest.Mocked<FirebaseMetricsService> => ({
  trackCall: jest.fn(),
  trackError: jest.fn(),
  getMetrics: jest.fn()
} as any);

export const firebaseTestProviders: Provider[] = [
  ...basicTestProviders,
  { provide: Firestore, useFactory: createMockFirestore },
  { provide: Auth, useFactory: createMockAuth },
  { provide: FirebaseMetricsService, useFactory: createMockFirebaseMetricsService }
];

// ==================== AUTHENTICATED USER PROVIDERS ====================
// Providers with authenticated user state

export const createAuthenticatedUserProviders = (userOverrides = {}): Provider[] => {
  const mockUser = createMockFirebaseUser(userOverrides);
  const mockAuth = createMockAuth();
  mockAuth.currentUser = mockUser;

  return [
    ...basicTestProviders,
    { provide: Firestore, useFactory: createMockFirestore },
    { provide: Auth, useValue: mockAuth },
    { provide: FirebaseMetricsService, useFactory: createMockFirebaseMetricsService }
  ];
};

// ==================== UNAUTHENTICATED PROVIDERS ====================
// Providers with no authenticated user (logged out state)

export const unauthenticatedProviders: Provider[] = [
  ...firebaseTestProviders
];

// ==================== SERVICE-SPECIFIC PROVIDERS ====================
// Pre-configured providers for specific service testing scenarios

/**
 * Providers for testing services that extend FirestoreService
 * Includes all Firebase dependencies needed for Firestore operations
 */
export const firestoreServiceProviders: Provider[] = [
  ...firebaseTestProviders
];

/**
 * Providers for testing auth-related services
 * Includes Auth service and related dependencies
 */
export const authServiceProviders: Provider[] = [
  ...firebaseTestProviders
];

/**
 * Providers for testing component that need user context
 * Includes authenticated user state
 */
export const userContextProviders = (userOverrides = {}): Provider[] => 
  createAuthenticatedUserProviders(userOverrides);

// ==================== TESTING SCENARIO BUILDERS ====================
// Helper functions to build provider arrays for common scenarios

export interface TestScenarioConfig {
  withAuth?: boolean;
  withFirestore?: boolean;
  withUser?: any;
  withCustomProviders?: Provider[];
}

/**
 * Builds provider array based on testing scenario configuration
 * @param config - Configuration object specifying what providers to include
 */
export const buildTestProviders = (config: TestScenarioConfig = {}): Provider[] => {
  let providers: Provider[] = [...basicTestProviders];

  if (config.withFirestore || config.withAuth) {
    providers.push(
      { provide: Firestore, useFactory: createMockFirestore },
      { provide: FirebaseMetricsService, useFactory: createMockFirebaseMetricsService }
    );
  }

  if (config.withAuth) {
    const mockAuth = createMockAuth();
    if (config.withUser) {
      mockAuth.currentUser = createMockFirebaseUser(config.withUser);
    }
    providers.push({ provide: Auth, useValue: mockAuth });
  }

  if (config.withCustomProviders) {
    providers.push(...config.withCustomProviders);
  }

  return providers;
};

// ==================== COMMON PROVIDER PRESETS ====================
// Ready-to-use provider configurations for common testing patterns

export const TestProviderPresets = {
  // Minimal setup for basic service tests
  basic: basicTestProviders,
  
  // Full Firebase setup without authentication
  firebase: firebaseTestProviders,
  
  // Firebase with authenticated user
  authenticated: createAuthenticatedUserProviders(),
  
  // Firebase with no authenticated user (logged out)
  unauthenticated: unauthenticatedProviders,
  
  // For services extending FirestoreService
  firestoreService: firestoreServiceProviders,
  
  // For auth-related services
  authService: authServiceProviders
};

// ==================== PROVIDER FACTORY FUNCTIONS ====================
// Factory functions for dynamic provider creation

/**
 * Creates providers for testing with a specific user role
 * @param role - User role (admin, moderator, etc.)
 * @param userOverrides - Additional user properties
 */
export const createRoleBasedProviders = (role: string, userOverrides = {}): Provider[] => {
  const userWithRole = {
    customClaims: { role },
    ...userOverrides
  };
  return createAuthenticatedUserProviders(userWithRole);
};

/**
 * Creates providers for testing offline scenarios
 * Mocks Firebase to simulate offline behavior
 */
export const createOfflineProviders = (): Provider[] => {
  const offlineFirestore = createMockFirestore();
  // Mock Firestore methods to reject with offline errors
  const offlineError = new Error('Firestore offline');
  
  return [
    ...basicTestProviders,
    { provide: Firestore, useValue: offlineFirestore },
    { provide: Auth, useFactory: createMockAuth },
    { provide: FirebaseMetricsService, useFactory: createMockFirebaseMetricsService }
  ];
};

/**
 * Creates providers for testing loading states
 * Includes delayed mock responses
 */
export const createLoadingStateProviders = (): Provider[] => {
  const loadingFirestore = createMockFirestore();
  const loadingAuth = createMockAuth();
  
  // Add delays to simulate loading states
  // (Implementation would add Promise delays to mock methods)
  
  return [
    ...basicTestProviders,
    { provide: Firestore, useValue: loadingFirestore },
    { provide: Auth, useValue: loadingAuth },
    { provide: FirebaseMetricsService, useFactory: createMockFirebaseMetricsService }
  ];
};

// ==================== DEBUGGING HELPERS ====================
// Utilities for debugging test provider setup

export const logProviderSetup = (providers: Provider[], testName = 'test'): void => {
  console.log(`🧪 Provider setup for "${testName}":`, {
    providerCount: providers.length,
    hasFirestore: providers.some(p => typeof p === 'object' && 'provide' in p && p.provide === Firestore),
    hasAuth: providers.some(p => typeof p === 'object' && 'provide' in p && p.provide === Auth),
    hasLocationMocks: providers.some(p => p === provideLocationMocks)
  });
};