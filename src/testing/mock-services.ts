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

// ==================== FIRESTORE CRUD SERVICE MOCK ====================
// Mock for FirestoreCrudService abstract class
export const createFirestoreCrudServiceMock = () => {
  console.log('🔥 Creating FirestoreCrudService mock');
  
  const firestoreMock = createFirestoreServiceMock();
  
  return {
    ...firestoreMock,
    
    // FirestoreCrudService specific methods
    getAll: jest.fn(() => Promise.resolve([])),
    getById: jest.fn(() => Promise.resolve(null)),
    existsById: jest.fn(() => Promise.resolve(false)),
    create: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    createMany: jest.fn(() => Promise.resolve()),
    updateMany: jest.fn(() => Promise.resolve()),
    
    // Protected property for testing
    path: 'mock-path'
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

// ==================== EVENT SERVICE MOCK ====================
// Mock for EventService that extends FirestoreCrudService

export const createEventServiceMock = () => {
  console.log('📅 Creating EventService mock');
  
  const firestoreMock = createFirestoreServiceMock();
  
  return {
    ...firestoreMock,
    
    // EventService specific methods
    getEvent: jest.fn((eventId: string) => of(undefined)),
    getUserEvents: jest.fn((userId: string) => Promise.resolve([])),
    getPublishedEvents: jest.fn(() => Promise.resolve([])),
    createEvent: jest.fn((eventData: any) => Promise.resolve({ id: 'event-123', ...eventData })),
    updateEvent: jest.fn((eventId: string, data: any) => Promise.resolve()),
    deleteEvent: jest.fn((eventId: string) => Promise.resolve()),
    getEventsByLocation: jest.fn((location: string) => Promise.resolve([])),
    getUpcomingEvents: jest.fn(() => Promise.resolve([])),
    searchEvents: jest.fn((searchTerm: string) => Promise.resolve([]))
  };
};

// ==================== VENUE SERVICE MOCK ====================
// Mock for VenueService that extends FirestoreCrudService

export const createVenueServiceMock = () => {
  console.log('🏢 Creating VenueService mock');
  
  const firestoreMock = createFirestoreServiceMock();
  
  return {
    ...firestoreMock,
    
    // VenueService specific methods
    getVenue: jest.fn((venueId: string) => of(undefined)),
    getUserVenues: jest.fn((userId: string) => Promise.resolve([])),
    getPublishedVenues: jest.fn(() => Promise.resolve([])),
    createVenue: jest.fn((venueData: any) => Promise.resolve({ id: 'venue-123', ...venueData })),
    updateVenue: jest.fn((venueId: string, data: any) => Promise.resolve()),
    deleteVenue: jest.fn((venueId: string) => Promise.resolve()),
    getVenuesByCategory: jest.fn((category: string) => Promise.resolve([])),
    getAccessibleVenues: jest.fn(() => Promise.resolve([])),
    searchVenues: jest.fn((searchTerm: string) => Promise.resolve([])),
    getVenuesNearby: jest.fn((lat: number, lng: number, distance?: number) => Promise.resolve([])),
    getVenueSummaries: jest.fn(() => Promise.resolve([])),
    getVenuesByLanguage: jest.fn((language: string) => Promise.resolve([])),
    getVenuesByCapacity: jest.fn((minCapacity: number, maxCapacity?: number) => Promise.resolve([])),
    archiveVenue: jest.fn((venueId: string) => Promise.resolve()),
    restoreVenue: jest.fn((venueId: string) => Promise.resolve())
  };
};

// ==================== LLM SERVICE MOCK ====================
// Mock for LLMService for AI/Gemini integration

export const createLLMServiceMock = () => {
  console.log('🤖 Creating LLMService mock');
  
  const isProcessingSignal = signal(false);
  const requestCountSignal = signal(0);
  
  return {
    // Signals
    isProcessing: isProcessingSignal,
    requestCount: requestCountSignal,
    
    // Methods
    testConnection: jest.fn((prompt?: string) => Promise.resolve({
      success: true,
      data: 'Mock LLM response',
      cached: false
    })),
    extractEventFromImage: jest.fn((imageFile: File) => Promise.resolve({
      success: true,
      eventData: {
        title: 'Mock Event',
        description: 'Mock event description',
        date: '2025-01-01',
        location: 'Mock Location',
        organizer: 'Mock Organizer',
        ticketInfo: 'Mock ticket info',
        contactInfo: 'Mock contact info',
        website: 'Mock website'
      },
      confidence: {
        overall: 85,
        title: 90,
        description: 80,
        date: 85,
        location: 90,
        organizer: 75,
        ticketInfo: 70,
        contactInfo: 80,
        website: 85
      }
    })),
    getStats: jest.fn(() => ({
      requestCount: 0,
      cacheSize: 0,
      isProcessing: false
    })),
    clearCache: jest.fn(() => {
      console.log('Mock LLM cache cleared');
    }),
    
    // Test helpers
    setMockProcessing: (processing: boolean) => {
      isProcessingSignal.set(processing);
    },
    setMockRequestCount: (count: number) => {
      requestCountSignal.set(count);
    }
  };
};

// ==================== ETHICAL SCRAPER SERVICE MOCK ====================
// Mock for EthicalScraperService

export const createEthicalScraperServiceMock = () => {
  console.log('🕷️ Creating EthicalScraperService mock');
  
  return {
    scrapeUrl: jest.fn((request: any) => of({
      url: request.url,
      success: true,
      data: { mockData: 'scraped content' },
      metadata: {
        processingTime: 1000,
        actionsExecuted: 1,
        extractorsRun: 1,
        iframesProcessed: 0,
        cacheUsed: false
      },
      extractedAt: new Date().toISOString()
    })),
    scrapeSimple: jest.fn((url: string, options?: any) => of({
      url,
      success: true,
      data: { mockData: 'simple scraped content' },
      metadata: {
        processingTime: 500,
        actionsExecuted: 0,
        extractorsRun: 0,
        iframesProcessed: 0,
        cacheUsed: true
      },
      extractedAt: new Date().toISOString()
    })),
    scrapeWithActions: jest.fn((url: string, actions: any[], options?: any) => of({
      url,
      success: true,
      data: { mockData: 'action-based scraped content' },
      metadata: {
        processingTime: 2000,
        actionsExecuted: actions?.length || 0,
        extractorsRun: 0,
        iframesProcessed: 0,
        cacheUsed: false
      },
      extractedAt: new Date().toISOString()
    })),
    scrapeWithExtractors: jest.fn((url: string, extractors: any[], options?: any) => of({
      url,
      success: true,
      data: { mockData: 'extractor-based scraped content' },
      metadata: {
        processingTime: 1500,
        actionsExecuted: 0,
        extractorsRun: extractors?.length || 0,
        iframesProcessed: 0,
        cacheUsed: false
      },
      extractedAt: new Date().toISOString()
    })),
    getCacheStats: jest.fn(() => of({ size: 10, urls: ['mock-url-1', 'mock-url-2'] })),
    clearCache: jest.fn(() => of({ message: 'Cache cleared successfully' })),
    
    // Helper methods
    createActionSequence: {
      acceptCookiesAndWait: jest.fn(() => []),
      clickAndNavigate: jest.fn(() => []),
      scrollToLoadMore: jest.fn(() => [])
    },
    createExtractors: {
      articleMetadata: jest.fn(() => []),
      allLinks: jest.fn(() => []),
      imagesWithCaptions: jest.fn(() => [])
    }
  };
};

// ==================== SCHEDULER SERVICE MOCK ====================
// Mock for SchedulerService (Node.js service)

export const createSchedulerServiceMock = () => {
  console.log('⏰ Creating SchedulerService mock');
  
  return {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    getStatus: jest.fn(() => ({
      running: false,
      activeJobs: 0,
      config: {
        runIntervalMinutes: 1440,
        maxConcurrentJobs: 3,
        globalTimeoutMinutes: 30,
        enableDebugLogs: true
      }
    })),
    
    // Test helpers
    setMockRunning: jest.fn((running: boolean) => {
      console.log('Mock scheduler running:', running);
    }),
    setMockActiveJobs: jest.fn((count: number) => {
      console.log('Mock active jobs:', count);
    })
  };
};

// ==================== CAMERA SERVICE MOCK ====================
// Mock for CameraService

export const createCameraServiceMock = () => {
  console.log('📷 Creating CameraService mock');
  
  const stateSignal = signal({
    isActive: false,
    hasPermission: false,
    error: null,
    streamId: null
  });
  
  const mockStream = {
    id: 'mock-stream-id',
    getTracks: jest.fn(() => []),
    getVideoTracks: jest.fn(() => []),
    getAudioTracks: jest.fn(() => [])
  } as any;
  
  return {
    // Observables
    state$: of(stateSignal()),
    currentState: stateSignal(),
    isActive: false,
    currentStream: null,
    
    // Methods
    requestRearCamera: jest.fn(() => Promise.resolve(mockStream)),
    requestFrontCamera: jest.fn(() => Promise.resolve(mockStream)),
    getAvailableCameras: jest.fn(() => Promise.resolve([
      { deviceId: 'mock-rear', kind: 'videoinput', label: 'Rear Camera' },
      { deviceId: 'mock-front', kind: 'videoinput', label: 'Front Camera' }
    ])),
    hasRearCamera: jest.fn(() => Promise.resolve(true)),
    requestCamera: jest.fn(() => Promise.resolve(mockStream)),
    releaseCamera: jest.fn(() => Promise.resolve()),
    registerComponent: jest.fn((componentId: string) => {
      console.log('Mock camera registered component:', componentId);
    }),
    detachFromComponent: jest.fn((componentId: string) => Promise.resolve()),
    attachToVideoElement: jest.fn((videoElement: HTMLVideoElement, stream: MediaStream) => {
      console.log('Mock camera attached to video element');
    }),
    detachFromVideoElement: jest.fn((videoElement: HTMLVideoElement) => {
      console.log('Mock camera detached from video element');
    }),
    emergencyCleanup: jest.fn(() => Promise.resolve()),
    
    // Test helpers
    setMockState: (state: any) => {
      stateSignal.set(state);
    },
    setMockActive: (active: boolean) => {
      const currentState = stateSignal();
      stateSignal.set({ ...currentState, isActive: active });
    }
  };
};

// ==================== VIEWPORT SERVICE MOCK ====================
// Mock for ViewportService

export const createViewportServiceMock = () => {
  console.log('📱 Creating ViewportService mock');
  
  const viewportSignal = signal({
    width: 1920,
    height: 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });
  
  return {
    viewport: viewportSignal,
    width: 1920,
    height: 1080,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    
    // Methods
    checkViewport: jest.fn(() => viewportSignal()),
    onResize: jest.fn(() => of(viewportSignal())),
    
    // Test helpers
    setMockViewport: (viewport: any) => {
      viewportSignal.set(viewport);
    }
  };
};

// ==================== SSR PLATFORM SERVICE MOCK ====================
// Mock for SsrPlatformService

export const createSsrPlatformServiceMock = () => {
  console.log('🌐 Creating SsrPlatformService mock');
  
  return {
    isBrowser: true,
    isServer: false,
    onlyOnBrowser: jest.fn((callback: () => void) => {
      callback();
    }),
    onlyOnServer: jest.fn((callback: () => void) => {
      // Don't execute on mock browser
    }),
    getWindow: jest.fn(() => window),
    getDocument: jest.fn(() => document),
    
    // Test helpers
    setMockPlatform: jest.fn((isBrowser: boolean) => {
      console.log('Mock platform set to browser:', isBrowser);
    })
  };
};

// ==================== DEVICE CAPABILITY CHECK SERVICE MOCK ====================
// Mock for DeviceCapabilityCheckService

export const createDeviceCapabilityCheckServiceMock = () => {
  console.log('📱 Creating DeviceCapabilityCheckService mock');
  
  return {
    checkCameraSupport: jest.fn(() => Promise.resolve(true)),
    checkMicrophoneSupport: jest.fn(() => Promise.resolve(true)),
    checkGeolocationSupport: jest.fn(() => Promise.resolve(true)),
    checkNotificationSupport: jest.fn(() => Promise.resolve(true)),
    checkStorageSupport: jest.fn(() => Promise.resolve(true)),
    checkOfflineSupport: jest.fn(() => Promise.resolve(true)),
    getDeviceInfo: jest.fn(() => ({
      userAgent: 'Mock User Agent',
      platform: 'Mock Platform',
      isMobile: false,
      isIOS: false,
      isAndroid: false
    })),
    
    // Test helpers
    setMockCapabilities: jest.fn((capabilities: any) => {
      console.log('Mock device capabilities set:', capabilities);
    })
  };
};

// ==================== DEBUG SERVICE MOCK ====================
// Mock for DebugService

export const createDebugServiceMock = () => {
  console.log('🐛 Creating DebugService mock');
  
  return {
    log: jest.fn((message: string, data?: any) => {
      console.log('[DEBUG]', message, data);
    }),
    warn: jest.fn((message: string, data?: any) => {
      console.warn('[DEBUG]', message, data);
    }),
    error: jest.fn((message: string, data?: any) => {
      console.error('[DEBUG]', message, data);
    }),
    group: jest.fn((label: string) => {
      console.group('[DEBUG]', label);
    }),
    groupEnd: jest.fn(() => {
      console.groupEnd();
    }),
    time: jest.fn((label: string) => {
      console.time(`[DEBUG] ${label}`);
    }),
    timeEnd: jest.fn((label: string) => {
      console.timeEnd(`[DEBUG] ${label}`);
    }),
    setDebugLevel: jest.fn((level: string) => {
      console.log('Mock debug level set to:', level);
    })
  };
};

// ==================== CLEANUP SERVICE MOCK ====================
// Mock for CleanupService

export const createCleanupServiceMock = () => {
  console.log('🧹 Creating CleanupService mock');
  
  return {
    registerCleanupTask: jest.fn((taskId: string, cleanupFn: () => void) => {
      console.log('Mock cleanup task registered:', taskId);
    }),
    unregisterCleanupTask: jest.fn((taskId: string) => {
      console.log('Mock cleanup task unregistered:', taskId);
    }),
    runCleanupTasks: jest.fn(() => Promise.resolve()),
    runCleanupTask: jest.fn((taskId: string) => Promise.resolve()),
    getRegisteredTasks: jest.fn(() => []),
    
    // Test helpers
    setMockTasks: jest.fn((tasks: string[]) => {
      console.log('Mock cleanup tasks set:', tasks);
    })
  };
};

// ==================== OVERLAY SERVICE MOCK ====================
// Mock for OverlayService

export const createOverlayServiceMock = () => {
  console.log('🎭 Creating OverlayService mock');
  
  const overlaysSignal = signal<any[]>([]);
  
  return {
    overlays: overlaysSignal,
    
    // Methods
    showOverlay: jest.fn((overlayConfig: any) => {
      const overlays = overlaysSignal();
      overlaysSignal.set([...overlays, overlayConfig]);
      return 'mock-overlay-id';
    }),
    hideOverlay: jest.fn((overlayId: string) => {
      const overlays = overlaysSignal();
      overlaysSignal.set(overlays.filter(o => o.id !== overlayId));
    }),
    hideAllOverlays: jest.fn(() => {
      overlaysSignal.set([]);
    }),
    
    // Test helpers
    setMockOverlays: (overlays: any[]) => {
      overlaysSignal.set(overlays);
    }
  };
};

// ==================== INDEXED DB SERVICE MOCK ====================
// Mock for IndexedDbService

export const createIndexedDbServiceMock = () => {
  console.log('💾 Creating IndexedDbService mock');
  
  const mockDb = new Map<string, any>();
  
  return {
    openDatabase: jest.fn((dbName: string, version: number) => Promise.resolve()),
    closeDatabase: jest.fn(() => Promise.resolve()),
    createObjectStore: jest.fn((storeName: string, options?: any) => Promise.resolve()),
    deleteObjectStore: jest.fn((storeName: string) => Promise.resolve()),
    get: jest.fn((storeName: string, key: string) => Promise.resolve(mockDb.get(key))),
    set: jest.fn((storeName: string, key: string, value: any) => {
      mockDb.set(key, value);
      return Promise.resolve();
    }),
    delete: jest.fn((storeName: string, key: string) => {
      mockDb.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn((storeName: string) => {
      mockDb.clear();
      return Promise.resolve();
    }),
    getAllKeys: jest.fn((storeName: string) => Promise.resolve(Array.from(mockDb.keys()))),
    getAllValues: jest.fn((storeName: string) => Promise.resolve(Array.from(mockDb.values()))),
    
    // Test helpers
    setMockData: (key: string, value: any) => {
      mockDb.set(key, value);
    },
    getMockData: () => Object.fromEntries(mockDb)
  };
};

// ==================== MOCK SERVICES CATALOG ====================
// Centralized catalog of all mock services

export const MockServices = {
  firestore: createFirestoreServiceMock,
  firestoreCrud: createFirestoreCrudServiceMock,
  user: createUserServiceMock,
  auth: createAuthServiceMock,
  event: createEventServiceMock,
  venue: createVenueServiceMock,
  llm: createLLMServiceMock,
  ethicalScraper: createEthicalScraperServiceMock,
  scheduler: createSchedulerServiceMock,
  camera: createCameraServiceMock,
  viewport: createViewportServiceMock,
  ssrPlatform: createSsrPlatformServiceMock,
  deviceCapabilityCheck: createDeviceCapabilityCheckServiceMock,
  debug: createDebugServiceMock,
  cleanup: createCleanupServiceMock,
  overlay: createOverlayServiceMock,
  indexedDb: createIndexedDbServiceMock,
  firebaseMetrics: createFirebaseMetricsServiceMock,
  theme: createThemeServiceMock,
  notification: createNotificationServiceMock,
  toast: createToastServiceMock,
  location: createLocationServiceMock,
  pageTitle: createPageTitleServiceMock,
  pagination: createPaginationServiceMock,
  featureFlag: createFeatureFlagServiceMock
};

// ==================== MOCK STORES ====================
// Mock stores for all application stores using Angular Signal pattern

// ==================== AUTH STORE MOCK ====================
// Mock for AuthStore with signal-based state management

export const createAuthStoreMock = () => {
  console.log('🔐 Creating AuthStore mock');
  
  const userSignal = signal<any>(null);
  const tokenSignal = signal<string | null>(null);
  const readySignal = signal(false);
  const userChangeCounterSignal = signal(0);
  
  return {
    // Signals
    user: userSignal,
    token: tokenSignal,
    ready: readySignal,
    userChangeSignal: userChangeCounterSignal,
    
    // Computed properties
    isAuthenticated: computed(() => !!tokenSignal()),
    uid: computed(() => userSignal()?.uid ?? null),
    
    // Methods
    logout: jest.fn(() => {
      userSignal.set(null);
      tokenSignal.set(null);
      userChangeCounterSignal.update(c => c + 1);
    }),
    loginWithGoogle: jest.fn(() => {
      console.log('Mock Google login');
    }),
    loginWithEmail: jest.fn((email: string, password: string) => {
      console.log('Mock email login:', email);
    }),
    
    // Test helpers
    setMockUser: (user: any) => {
      userSignal.set(user);
      tokenSignal.set(user ? 'mock-token' : null);
      userChangeCounterSignal.update(c => c + 1);
    },
    setMockReady: (ready: boolean) => {
      readySignal.set(ready);
    }
  };
};

// ==================== EVENT STORE MOCK ====================
// Mock for EventStore with signal-based state management

export const createEventStoreMock = () => {
  console.log('📅 Creating EventStore mock');
  
  const userEventsSignal = signal<any[]>([]);
  const loadingSignal = signal(false);
  const errorSignal = signal<string | null>(null);
  const currentEventSignal = signal<any>(null);
  
  return {
    // Signals
    userEvents: userEventsSignal,
    loading: loadingSignal,
    error: errorSignal,
    currentEvent: currentEventSignal,
    
    // Computed properties
    hasEvents: computed(() => userEventsSignal().length > 0),
    eventsCount: computed(() => userEventsSignal().length),
    draftEvents: computed(() => userEventsSignal().filter(e => e.status === 'draft')),
    publishedEvents: computed(() => userEventsSignal().filter(e => e.status === 'published')),
    upcomingEvents: computed(() => userEventsSignal().filter(e => new Date(e.date) > new Date())),
    
    // Methods
    loadUserEvents: jest.fn((userId: string) => {
      loadingSignal.set(true);
      setTimeout(() => {
        userEventsSignal.set([]);
        loadingSignal.set(false);
      }, 100);
      return Promise.resolve();
    }),
    reload: jest.fn(() => Promise.resolve()),
    createEvent: jest.fn((eventData: any) => {
      const newEvent = { id: 'event-' + Date.now(), ...eventData };
      userEventsSignal.update(events => [newEvent, ...events]);
      return Promise.resolve(newEvent);
    }),
    updateEvent: jest.fn((eventId: string, updates: any) => {
      userEventsSignal.update(events =>
        events.map(e => e.id === eventId ? { ...e, ...updates } : e)
      );
      return Promise.resolve();
    }),
    deleteEvent: jest.fn((eventId: string) => {
      userEventsSignal.update(events => events.filter(e => e.id !== eventId));
      return Promise.resolve();
    }),
    publishEvent: jest.fn((eventId: string) => Promise.resolve()),
    cancelEvent: jest.fn((eventId: string) => Promise.resolve()),
    loadEvent: jest.fn((eventId: string) => {
      currentEventSignal.set({ id: eventId, title: 'Mock Event' });
      return Promise.resolve();
    }),
    clearCurrentEvent: jest.fn(() => {
      currentEventSignal.set(null);
    }),
    getEventById: jest.fn((eventId: string) => {
      return userEventsSignal().find(e => e.id === eventId) || null;
    }),
    isEventOwner: jest.fn((eventId: string) => true),
    clearError: jest.fn(() => {
      errorSignal.set(null);
    }),
    reset: jest.fn(() => {
      userEventsSignal.set([]);
      currentEventSignal.set(null);
      loadingSignal.set(false);
      errorSignal.set(null);
    }),
    
    // Test helpers
    setMockEvents: (events: any[]) => {
      userEventsSignal.set(events);
    },
    setMockLoading: (loading: boolean) => {
      loadingSignal.set(loading);
    },
    setMockError: (error: string | null) => {
      errorSignal.set(error);
    }
  };
};

// ==================== VENUE STORE MOCK ====================
// Mock for VenueStore with signal-based state management

export const createVenueStoreMock = () => {
  console.log('🏢 Creating VenueStore mock');
  
  const venuesSignal = signal<any[]>([]);
  const selectedVenueSignal = signal<any>(null);
  const venuesLoadingSignal = signal(false);
  const venuesSavingSignal = signal(false);
  const searchTermSignal = signal('');
  const selectedCategorySignal = signal<string>('all');
  const selectedStatusSignal = signal<string>('all');
  const showOnlyAccessibleSignal = signal(false);
  
  return {
    // Signals
    venues: venuesSignal,
    selectedVenue: selectedVenueSignal,
    venuesLoading: venuesLoadingSignal,
    venuesSaving: venuesSavingSignal,
    searchTerm: searchTermSignal,
    selectedCategory: selectedCategorySignal,
    selectedStatus: selectedStatusSignal,
    showOnlyAccessible: showOnlyAccessibleSignal,
    
    // Computed properties
    hasVenues: computed(() => venuesSignal().length > 0),
    hasSelectedVenue: computed(() => !!selectedVenueSignal()),
    filteredVenues: computed(() => venuesSignal()),
    venuesByCategory: computed(() => ({})),
    accessibleVenues: computed(() => venuesSignal().filter(v => v.isAccessible)),
    venueStats: computed(() => ({
      totalVenues: venuesSignal().length,
      publishedVenues: venuesSignal().filter(v => v.status === 'published').length,
      draftVenues: venuesSignal().filter(v => v.status === 'draft').length,
      archivedVenues: venuesSignal().filter(v => v.status === 'archived').length
    })),
    
    // Methods
    setVenues: jest.fn((venues: any[]) => {
      venuesSignal.set(venues);
    }),
    setSelectedVenue: jest.fn((venue: any) => {
      selectedVenueSignal.set(venue);
    }),
    setVenuesLoading: jest.fn((loading: boolean) => {
      venuesLoadingSignal.set(loading);
    }),
    setVenuesSaving: jest.fn((saving: boolean) => {
      venuesSavingSignal.set(saving);
    }),
    addVenue: jest.fn((venue: any) => {
      venuesSignal.update(venues => [...venues, venue]);
    }),
    updateVenue: jest.fn((venueId: string, updates: any) => {
      venuesSignal.update(venues =>
        venues.map(v => v.id === venueId ? { ...v, ...updates } : v)
      );
    }),
    removeVenue: jest.fn((venueId: string) => {
      venuesSignal.update(venues => venues.filter(v => v.id !== venueId));
    }),
    setSearchTerm: jest.fn((term: string) => {
      searchTermSignal.set(term);
    }),
    setSelectedCategory: jest.fn((category: string) => {
      selectedCategorySignal.set(category);
    }),
    setSelectedStatus: jest.fn((status: string) => {
      selectedStatusSignal.set(status);
    }),
    setShowOnlyAccessible: jest.fn((show: boolean) => {
      showOnlyAccessibleSignal.set(show);
    }),
    clearFilters: jest.fn(() => {
      searchTermSignal.set('');
      selectedCategorySignal.set('all');
      selectedStatusSignal.set('all');
      showOnlyAccessibleSignal.set(false);
    }),
    getVenueSummaries: jest.fn(() => []),
    getPublishedVenues: jest.fn(() => venuesSignal().filter(v => v.status === 'published')),
    refreshVenueStats: jest.fn(() => {
      console.log('Mock venue stats refreshed');
    }),
    
    // Test helpers
    setMockVenues: (venues: any[]) => {
      venuesSignal.set(venues);
    }
  };
};

// ==================== ADMIN STORE MOCK ====================
// Mock for AdminStore with signal-based state management

export const createAdminStoreMock = () => {
  console.log('⚙️ Creating AdminStore mock');
  
  const eventsSignal = signal<any[]>([]);
  const usersSignal = signal<any[]>([]);
  const venuesSignal = signal<any[]>([]);
  const selectedEventSignal = signal<any>(null);
  const selectedUserSignal = signal<any>(null);
  const selectedVenueSignal = signal<any>(null);
  const eventsLoadingSignal = signal(false);
  const usersLoadingSignal = signal(false);
  const venuesLoadingSignal = signal(false);
  
  return {
    // Signals
    events: eventsSignal,
    users: usersSignal,
    venues: venuesSignal,
    selectedEvent: selectedEventSignal,
    selectedUser: selectedUserSignal,
    selectedVenue: selectedVenueSignal,
    eventsLoading: eventsLoadingSignal,
    usersLoading: usersLoadingSignal,
    venuesLoading: venuesLoadingSignal,
    
    // Computed properties
    dashboardStats: computed(() => ({
      totalEvents: eventsSignal().length,
      totalUsers: usersSignal().length,
      totalVenues: venuesSignal().length,
      pendingEvents: eventsSignal().filter(e => e.status === 'draft').length,
      approvedEvents: eventsSignal().filter(e => e.status === 'published').length
    })),
    hasEvents: computed(() => eventsSignal().length > 0),
    hasUsers: computed(() => usersSignal().length > 0),
    hasVenues: computed(() => venuesSignal().length > 0),
    hasSelectedEvent: computed(() => !!selectedEventSignal()),
    hasSelectedUser: computed(() => !!selectedUserSignal()),
    hasSelectedVenue: computed(() => !!selectedVenueSignal()),
    
    // Event management methods
    setEvents: jest.fn((events: any[]) => {
      eventsSignal.set(events);
    }),
    setSelectedEvent: jest.fn((event: any) => {
      selectedEventSignal.set(event);
    }),
    setEventsLoading: jest.fn((loading: boolean) => {
      eventsLoadingSignal.set(loading);
    }),
    updateEvent: jest.fn((eventId: string, updates: any) => {
      eventsSignal.update(events =>
        events.map(e => e.id === eventId ? { ...e, ...updates } : e)
      );
    }),
    removeEvent: jest.fn((eventId: string) => {
      eventsSignal.update(events => events.filter(e => e.id !== eventId));
    }),
    
    // User management methods
    setUsers: jest.fn((users: any[]) => {
      usersSignal.set(users);
    }),
    setSelectedUser: jest.fn((user: any) => {
      selectedUserSignal.set(user);
    }),
    setUsersLoading: jest.fn((loading: boolean) => {
      usersLoadingSignal.set(loading);
    }),
    updateUser: jest.fn((userId: string, updates: any) => {
      usersSignal.update(users =>
        users.map(u => u.uid === userId ? { ...u, ...updates } : u)
      );
    }),
    
    // Venue management methods
    setVenues: jest.fn((venues: any[]) => {
      venuesSignal.set(venues);
    }),
    setSelectedVenue: jest.fn((venue: any) => {
      selectedVenueSignal.set(venue);
    }),
    setVenuesLoading: jest.fn((loading: boolean) => {
      venuesLoadingSignal.set(loading);
    }),
    updateVenue: jest.fn((venueId: string, updates: any) => {
      venuesSignal.update(venues =>
        venues.map(v => v.id === venueId ? { ...v, ...updates } : v)
      );
    }),
    removeVenue: jest.fn((venueId: string) => {
      venuesSignal.update(venues => venues.filter(v => v.id !== venueId));
    }),
    
    // Dashboard methods
    refreshDashboardStats: jest.fn(() => {
      console.log('Mock dashboard stats refreshed');
    }),
    
    // Test helpers
    setMockEvents: (events: any[]) => {
      eventsSignal.set(events);
    },
    setMockUsers: (users: any[]) => {
      usersSignal.set(users);
    },
    setMockVenues: (venues: any[]) => {
      venuesSignal.set(venues);
    }
  };
};

// ==================== BASE STORE MOCK ====================
// Mock for BaseStore abstract class

export const createBaseStoreMock = () => {
  console.log('🏗️ Creating BaseStore mock');
  
  const dataSignal = signal<any[]>([]);
  const loadingSignal = signal(false);
  const errorSignal = signal<string | null>(null);
  const userIdSignal = signal<string | null>(null);
  
  return {
    // Signals
    data: dataSignal,
    loading: loadingSignal,
    error: errorSignal,
    userId: userIdSignal,
    
    // Computed properties
    hasData: computed(() => dataSignal().length > 0),
    isEmpty: computed(() => dataSignal().length === 0),
    itemCount: computed(() => dataSignal().length),
    
    // Methods
    loadOnce: jest.fn(() => Promise.resolve()),
    load: jest.fn(() => Promise.resolve()),
    add: jest.fn((item: any) => {
      const newItem = { ...item, id: 'mock-id' };
      dataSignal.update(data => [...data, newItem]);
      return Promise.resolve(newItem);
    }),
    addMany: jest.fn((items: any[]) => {
      const newItems = items.map(item => ({ ...item, id: 'mock-id' }));
      dataSignal.update(data => [...data, ...newItems]);
      return Promise.resolve(newItems);
    }),
    get: jest.fn((id: string) => {
      return dataSignal().find(item => item.id === id);
    }),
    find: jest.fn((predicate: (item: any) => boolean) => {
      return dataSignal().find(predicate);
    }),
    filter: jest.fn((predicate: (item: any) => boolean) => {
      return dataSignal().filter(predicate);
    }),
    update: jest.fn((id: string, updates: any) => {
      dataSignal.update(data =>
        data.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      return Promise.resolve();
    }),
    updateMany: jest.fn((updates: any[]) => Promise.resolve()),
    remove: jest.fn((id: string) => {
      dataSignal.update(data => data.filter(item => item.id !== id));
      return Promise.resolve();
    }),
    removeMany: jest.fn((ids: string[]) => Promise.resolve()),
    reset: jest.fn(() => {
      dataSignal.set([]);
      loadingSignal.set(false);
      errorSignal.set(null);
    }),
    clearError: jest.fn(() => {
      errorSignal.set(null);
    }),
    getDebugInfo: jest.fn(() => ({
      name: 'MockBaseStore',
      itemCount: dataSignal().length,
      hasLoaded: true,
      loading: loadingSignal(),
      error: errorSignal(),
      hasData: dataSignal().length > 0,
      isEmpty: dataSignal().length === 0,
      userId: userIdSignal()
    })),
    
    // Test helpers
    setMockData: (data: any[]) => {
      dataSignal.set(data);
    },
    setMockLoading: (loading: boolean) => {
      loadingSignal.set(loading);
    },
    setMockError: (error: string | null) => {
      errorSignal.set(error);
    },
    setMockUserId: (userId: string | null) => {
      userIdSignal.set(userId);
    }
  };
};

// ==================== THEME STORE MOCK ====================
// Mock for ThemeStore with signal-based state management

export const createThemeStoreMock = () => {
  console.log('🎨 Creating ThemeStore mock');
  
  const themeTypeSignal = signal<string>('fresh');
  const isLoadedSignal = signal(false);
  
  return {
    // Signals
    themeType: themeTypeSignal,
    isLoaded: isLoadedSignal,
    theme: computed(() => ({
      type: themeTypeSignal(),
      name: 'Mock Theme',
      isDark: themeTypeSignal() === 'midnight',
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        text: '#333333'
      }
    })),
    isDark: computed(() => themeTypeSignal() === 'midnight'),
    
    // Methods
    setTheme: jest.fn((type: string) => {
      themeTypeSignal.set(type);
    }),
    toggleTheme: jest.fn(() => {
      const current = themeTypeSignal();
      const newTheme = current === 'fresh' ? 'midnight' : 'fresh';
      themeTypeSignal.set(newTheme);
    }),
    getLightThemes: jest.fn(() => [
      { type: 'fresh', theme: { name: 'Fresh', isDark: false } },
      { type: 'sunshine', theme: { name: 'Sunshine', isDark: false } }
    ]),
    getDarkThemes: jest.fn(() => [
      { type: 'midnight', theme: { name: 'Midnight', isDark: true } },
      { type: 'coral', theme: { name: 'Coral', isDark: true } }
    ]),
    getAllThemes: jest.fn(() => [
      { type: 'fresh', theme: { name: 'Fresh', isDark: false } },
      { type: 'midnight', theme: { name: 'Midnight', isDark: true } }
    ]),
    getCSSVariables: jest.fn(() => ({
      '--color-primary': '#007bff',
      '--color-secondary': '#6c757d',
      '--color-background': '#ffffff',
      '--color-text': '#333333'
    })),
    hasSystemThemePreference: jest.fn(() => true),
    
    // Test helpers
    setMockTheme: (theme: string) => {
      themeTypeSignal.set(theme);
    },
    setMockLoaded: (loaded: boolean) => {
      isLoadedSignal.set(loaded);
    }
  };
};

// ==================== MOCK STORES CATALOG ====================
// Centralized catalog of all mock stores

export const MockStores = {
  auth: createAuthStoreMock,
  event: createEventStoreMock,
  venue: createVenueStoreMock,
  admin: createAdminStoreMock,
  base: createBaseStoreMock,
  theme: createThemeStoreMock
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