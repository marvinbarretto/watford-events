// Firebase and Firestore testing utilities - Angular 20 Signal-First Approach
// Modern Firebase mocking with signal support and comprehensive logging

import { signal, WritableSignal } from '@angular/core';
import { User } from '@angular/fire/auth';

console.log('🔥 Loading Firebase test utilities - Angular 20 Signal-First approach');

// ==================== FIREBASE AUTH UTILITIES ====================
// Modern Firebase Auth mocking with signal support

export const createMockFirebaseUser = (overrides: Partial<User> = {}): User => {
  const user = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: async () => undefined,
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({
      token: 'mock-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'password',
      claims: {},
      signInSecondFactor: null
    }),
    reload: async () => undefined,
    toJSON: () => ({}),
    ...overrides
  } as User;
  
  console.log('🔐 Created mock Firebase user:', { uid: user.uid, email: user.email });
  return user;
};

/**
 * Creates a modern signal-based mock auth service for Angular 20
 * @param initialUser - Initial user state (null for logged out)
 * @param serviceName - Name for debugging logs
 */
export const createSignalAuthService = (
  initialUser: User | null = null, 
  serviceName = 'MockAuthService'
) => {
  console.log(`🏗️ Creating signal-based auth service "${serviceName}" with initial user:`, initialUser?.uid || 'none');
  
  const userSignal = signal<User | null>(initialUser);
  const isAuthenticated = signal<boolean>(!!initialUser);
  const isLoading = signal<boolean>(false);
  
  return {
    // Signals (Angular 20 style)
    user: userSignal,
    isAuthenticated,
    isLoading,
    
    // Helper methods for testing
    signIn: (user: User) => {
      console.log(`🔐 Mock sign in for user:`, user.uid);
      userSignal.set(user);
      isAuthenticated.set(true);
      isLoading.set(false);
    },
    
    signOut: () => {
      console.log(`🚪 Mock sign out`);
      userSignal.set(null);
      isAuthenticated.set(false);
      isLoading.set(false);
    },
    
    setLoading: (loading: boolean) => {
      console.log(`⏳ Auth loading state:`, loading);
      isLoading.set(loading);
    }
  };
};

// Mock Firestore Document Snapshot
export const createMockDocumentSnapshot = <T>(data: T | null, id = 'test-doc-id') => {
  const snapshot = {
    id,
    exists: () => data !== null,
    data: () => data,
    get: (field: string) => data?.[field as keyof T],
    ref: {
      id,
      path: `collection/${id}`,
      firestore: {},
      parent: {},
      converter: null,
      withConverter: () => ({}),
      isEqual: () => false,
      delete: async () => undefined,
      get: () => Promise.resolve(),
      set: async () => undefined,
      update: async () => undefined,
      onSnapshot: () => () => {}, // Returns unsubscribe function
      collection: () => ({}),
      listCollections: async () => []
    },
    metadata: {
      hasPendingWrites: false,
      fromCache: false,
      isEqual: () => false
    }
  };
  
  console.log(`📄 Created mock document snapshot for ${id}:`, { exists: snapshot.exists(), data: snapshot.data() });
  return snapshot;
};

// Mock Firestore Query Snapshot
export const createMockQuerySnapshot = <T>(docs: T[], ids?: string[]) => {
  const mockDocs = docs.map((data, index) =>
    createMockDocumentSnapshot(data, ids?.[index] || `doc-${index}`)
  );
  
  const querySnapshot = {
    docs: mockDocs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: Function) => {
      mockDocs.forEach(callback);
    },
    metadata: {
      hasPendingWrites: false,
      fromCache: false,
      isEqual: () => false
    }
  };
  
  console.log(`📑 Created mock query snapshot with ${docs.length} documents`);
  return querySnapshot;
};

// Mock Firebase Service Methods
export const createFirebaseServiceMock = () => {
  const createMockFn = () => {
    const fn = (...args: any[]) => undefined;
    Object.assign(fn, {
      mockResolvedValue: (value: any) => Promise.resolve(value),
      mockReturnValue: (value: any) => value,
      mockRejectedValue: (error: any) => Promise.reject(error),
      mockImplementation: (impl: Function) => impl
    });
    return fn;
  };

  return {
    getDocument: createMockFn(),
    getDocuments: createMockFn(),
    createDocument: createMockFn(),
    updateDocument: createMockFn(),
    deleteDocument: createMockFn(),
    subscribeToDocument: createMockFn(),
    subscribeToCollection: createMockFn()
  };
};

// Mock Auth Service
export const createAuthServiceMock = () => {
  const mockFn = (returnValue?: any) => {
    const fn = () => returnValue;
    Object.assign(fn, {
      mockResolvedValue: (value: any) => Promise.resolve(value),
      mockReturnValue: (value: any) => value,
      mockRejectedValue: (error: any) => Promise.reject(error)
    });
    return fn;
  };

  return {
    user: signal<User | null>(null),
    isAuthenticated: signal(false),
    isLoading: signal(false),
    signIn: mockFn(Promise.resolve(undefined)),
    signUp: mockFn(Promise.resolve(undefined)),
    signOut: mockFn(Promise.resolve(undefined)),
    resetPassword: mockFn(Promise.resolve(undefined)),
    updateProfile: mockFn(Promise.resolve(undefined)),
    checkRole: mockFn(false),
    hasAnyRole: mockFn(false)
  };
};

// Auth State Test Helpers
export const setMockAuthState = (authService: any, user: User | null) => {
  authService.user.set(user);
  authService.isAuthenticated.set(!!user);
  authService.isLoading.set(false);
};

// Firestore Response Helpers
export const mockFirestoreSuccess = <T>(data: T) =>
  Promise.resolve(createMockDocumentSnapshot(data));

export const mockFirestoreError = (message = 'Firestore error') =>
  Promise.reject(new Error(message));

export const mockFirestoreCollection = <T>(items: T[]) =>
  Promise.resolve(createMockQuerySnapshot(items));
