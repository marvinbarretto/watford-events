// Mock services catalog for testing - Angular 20 Signal-First Approach
// Pre-configured mock services for common dependencies used across tests

import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';
import { 
  createMockFirebaseUser, 
  createMockDocumentSnapshot, 
  createMockQuerySnapshot 
} from './firebase-test-utils';
import { User as AppUser } from '@users/utils/user.model';

console.log('🏭 Loading mock services catalog');

// ==================== FIRESTORE SERVICE MOCK ====================
// Mock for FirestoreService abstract class

export const createFirestoreServiceMock = () => {
  console.log('🔥 Creating FirestoreService mock');
  
  return {
    // Observable methods (protected in real service, public in mock for testing)
    collection$: jest.fn((path: string) => of([])),
    doc$: jest.fn((path: string) => of(undefined)),
    
    // Promise methods
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    addDocToCollection: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' } as any)),
    getDocByPath: jest.fn(() => Promise.resolve(undefined)),
    getDocsWhere: jest.fn(() => Promise.resolve([])),
    exists: jest.fn(() => Promise.resolve(false)),
    
    // Utility methods
    mapSnapshotWithId: jest.fn((snapshot) => [])
  };
};

// ==================== USER SERVICE MOCK ====================
// Mock for UserService that extends FirestoreService

export const createUserServiceMock = () => {
  console.log('👤 Creating UserService mock');
  
  const firestoreMock = createFirestoreServiceMock();
  
  return {
    ...firestoreMock,
    
    // UserService specific methods
    getUser: jest.fn((uid: string) => of(undefined)),
    updateUser: jest.fn((uid: string, data: Partial<AppUser>) => Promise.resolve()),
    createUser: jest.fn((uid: string, data: AppUser) => Promise.resolve()),
    getAllUsers: jest.fn(() => Promise.resolve([]))
  };
};

// ==================== AUTH SERVICE MOCK ====================
// Mock for AuthService with signals

export const createAuthServiceMock = () => {
  console.log('🔐 Creating AuthService mock');
  
  const userSignal = signal<User | null>(null);
  const isAuthenticatedSignal = signal(false);
  const isLoadingSignal = signal(false);
  
  return {
    // Signals
    user: userSignal,
    isAuthenticated: isAuthenticatedSignal,
    isLoading: isLoadingSignal,
    
    // Methods
    signIn: jest.fn((email: string, password: string) => 
      Promise.resolve({ user: createMockFirebaseUser({ email }) })),
    signUp: jest.fn((email: string, password: string, displayName?: string) => 
      Promise.resolve({ user: createMockFirebaseUser({ email, displayName }) })),
    signOut: jest.fn(() => Promise.resolve()),
    resetPassword: jest.fn((email: string) => Promise.resolve()),
    updateProfile: jest.fn((profile: any) => Promise.resolve()),
    checkRole: jest.fn((role: string) => false),
    hasAnyRole: jest.fn((roles: string[]) => false),
    
    // Test helpers
    setMockUser: (user: User | null) => {
      userSignal.set(user);
      isAuthenticatedSignal.set(!!user);
      isLoadingSignal.set(false);
    },
    setMockLoading: (loading: boolean) => {
      isLoadingSignal.set(loading);
    }
  };
};

// ==================== FIREBASE METRICS SERVICE MOCK ====================
// Mock for FirebaseMetricsService

export const createFirebaseMetricsServiceMock = () => {
  console.log('📊 Creating FirebaseMetricsService mock');
  
  return {
    trackCall: jest.fn(),
    trackError: jest.fn(),
    getMetrics: jest.fn(() => ({}))
  };
};

// ==================== THEME SERVICE MOCK ====================
// Mock for theme-related services

export const createThemeServiceMock = () => {
  console.log('🎨 Creating ThemeService mock');
  
  const themeSignal = signal('light');
  
  return {
    theme: themeSignal,
    setTheme: jest.fn((theme: string) => {
      themeSignal.set(theme);
    }),
    toggleTheme: jest.fn(() => {
      const current = themeSignal();
      themeSignal.set(current === 'light' ? 'dark' : 'light');
    }),
    detectSystemTheme: jest.fn(() => 'light'),
    applyTheme: jest.fn()
  };
};

// ==================== CACHE SERVICE MOCK ====================
// Mock for cache-related services

export const createCacheServiceMock = () => {
  console.log('💾 Creating CacheService mock');
  
  const cache = new Map<string, any>();
  
  return {
    get: jest.fn((key: string) => Promise.resolve(cache.get(key))),
    set: jest.fn((key: string, value: any) => {
      cache.set(key, value);
      return Promise.resolve();
    }),
    delete: jest.fn((key: string) => {
      cache.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      cache.clear();
      return Promise.resolve();
    }),
    has: jest.fn((key: string) => Promise.resolve(cache.has(key))),
    keys: jest.fn(() => Promise.resolve(Array.from(cache.keys()))),
    size: jest.fn(() => Promise.resolve(cache.size))
  };
};

// ==================== NOTIFICATION SERVICE MOCK ====================
// Mock for notification services

export const createNotificationServiceMock = () => {
  console.log('🔔 Creating NotificationService mock');
  
  const notificationsSignal = signal<any[]>([]);
  
  return {
    notifications: notificationsSignal,
    show: jest.fn((notification: any) => {
      const current = notificationsSignal();
      notificationsSignal.set([...current, notification]);
    }),
    hide: jest.fn((id: string) => {
      const current = notificationsSignal();
      notificationsSignal.set(current.filter(n => n.id !== id));
    }),
    clear: jest.fn(() => {
      notificationsSignal.set([]);
    }),
    requestPermission: jest.fn(() => Promise.resolve('granted')),
    showPushNotification: jest.fn(() => Promise.resolve())
  };
};

// ==================== TOAST SERVICE MOCK ====================
// Mock for toast notification services

export const createToastServiceMock = () => {
  console.log('🍞 Creating ToastService mock');
  
  const toastsSignal = signal<any[]>([]);
  
  return {
    toasts: toastsSignal,
    success: jest.fn((message: string) => {
      console.log('Toast success:', message);
    }),
    error: jest.fn((message: string) => {
      console.log('Toast error:', message);
    }),
    info: jest.fn((message: string) => {
      console.log('Toast info:', message);
    }),
    warning: jest.fn((message: string) => {
      console.log('Toast warning:', message);
    }),
    dismiss: jest.fn((id: string) => {
      const current = toastsSignal();
      toastsSignal.set(current.filter(t => t.id !== id));
    }),
    clear: jest.fn(() => {
      toastsSignal.set([]);
    })
  };
};

// ==================== LOCATION SERVICE MOCK ====================
// Mock for location-related services

export const createLocationServiceMock = () => {
  console.log('📍 Creating LocationService mock');
  
  const currentLocationSignal = signal<GeolocationPosition | null>(null);
  
  return {
    currentLocation: currentLocationSignal,
    getCurrentPosition: jest.fn(() => Promise.resolve({
      coords: {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10
      },
      timestamp: Date.now()
    } as GeolocationPosition)),
    watchPosition: jest.fn(() => 'mock-watch-id'),
    clearWatch: jest.fn(),
    checkPermission: jest.fn(() => Promise.resolve('granted')),
    requestPermission: jest.fn(() => Promise.resolve('granted'))
  };
};

// ==================== PAGE TITLE SERVICE MOCK ====================
// Mock for page title services

export const createPageTitleServiceMock = () => {
  console.log('📄 Creating PageTitleService mock');
  
  const titleSignal = signal('Test App');
  
  return {
    title: titleSignal,
    setTitle: jest.fn((title: string) => {
      titleSignal.set(title);
    }),
    appendTitle: jest.fn((suffix: string) => {
      const current = titleSignal();
      titleSignal.set(`${current} - ${suffix}`);
    }),
    resetTitle: jest.fn(() => {
      titleSignal.set('Test App');
    })
  };
};

// ==================== PAGINATION SERVICE MOCK ====================
// Mock for pagination services

export const createPaginationServiceMock = () => {
  console.log('📖 Creating PaginationService mock');
  
  const currentPageSignal = signal(1);
  const totalPagesSignal = signal(0);
  const pageSizeSignal = signal(10);
  
  return {
    currentPage: currentPageSignal,
    totalPages: totalPagesSignal,
    pageSize: pageSizeSignal,
    goToPage: jest.fn((page: number) => {
      currentPageSignal.set(page);
    }),
    nextPage: jest.fn(() => {
      const current = currentPageSignal();
      const total = totalPagesSignal();
      if (current < total) {
        currentPageSignal.set(current + 1);
      }
    }),
    previousPage: jest.fn(() => {
      const current = currentPageSignal();
      if (current > 1) {
        currentPageSignal.set(current - 1);
      }
    }),
    setPageSize: jest.fn((size: number) => {
      pageSizeSignal.set(size);
      currentPageSignal.set(1);
    }),
    reset: jest.fn(() => {
      currentPageSignal.set(1);
      totalPagesSignal.set(0);
    })
  };
};

// ==================== FEATURE FLAG SERVICE MOCK ====================
// Mock for feature flag services

export const createFeatureFlagServiceMock = () => {
  console.log('🏁 Creating FeatureFlagService mock');
  
  const flags = new Map<string, boolean>();
  
  return {
    isEnabled: jest.fn((flag: string) => flags.get(flag) || false),
    enable: jest.fn((flag: string) => {
      flags.set(flag, true);
    }),
    disable: jest.fn((flag: string) => {
      flags.set(flag, false);
    }),
    toggle: jest.fn((flag: string) => {
      const current = flags.get(flag) || false;
      flags.set(flag, !current);
    }),
    getAllFlags: jest.fn(() => Object.fromEntries(flags)),
    loadFlags: jest.fn(() => Promise.resolve())
  };
};

// ==================== MOCK SERVICES CATALOG ====================
// Centralized catalog of all mock services

export const MockServices = {
  firestore: createFirestoreServiceMock,
  user: createUserServiceMock,
  auth: createAuthServiceMock,
  firebaseMetrics: createFirebaseMetricsServiceMock,
  theme: createThemeServiceMock,
  cache: createCacheServiceMock,
  notification: createNotificationServiceMock,
  toast: createToastServiceMock,
  location: createLocationServiceMock,
  pageTitle: createPageTitleServiceMock,
  pagination: createPaginationServiceMock,
  featureFlag: createFeatureFlagServiceMock
};

// ==================== MOCK SERVICE FACTORY ====================
// Factory function to create multiple mock services at once

export const createMockServices = (serviceNames: (keyof typeof MockServices)[]): Record<string, any> => {
  console.log('🏭 Creating mock services:', serviceNames);
  
  const services: Record<string, any> = {};
  
  serviceNames.forEach(serviceName => {
    if (MockServices[serviceName]) {
      services[serviceName] = MockServices[serviceName]();
    } else {
      console.warn(`⚠️ Unknown mock service: ${serviceName}`);
    }
  });
  
  return services;
};

// ==================== MOCK SERVICE PROVIDERS ====================
// Helper to create providers from mock services

export const createMockServiceProviders = (
  services: Record<string, any>, 
  serviceMap: Record<string, any>
): any[] => {
  return Object.entries(services).map(([key, mockService]) => ({
    provide: serviceMap[key],
    useValue: mockService
  }));
};