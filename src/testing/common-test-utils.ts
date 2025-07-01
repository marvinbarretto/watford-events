// Common testing utilities and helpers - Angular 20 Signal-First Approach
// This file provides modern testing utilities prioritizing Angular signals over RxJS
// where appropriate, while maintaining RxJS support for HTTP/Observable testing

import { signal, computed, WritableSignal, Signal } from '@angular/core';
import { Observable, of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

console.log('🧪 Loading common test utilities - Angular 20 Signal-First approach');

// ==================== MOCK DATA GENERATION ====================
// Modern utilities for generating test data with proper logging

export const generateId = (prefix = 'test'): string => {
  const id = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔧 Generated test ID: ${id}`);
  return id;
};

export const generateEmail = (prefix = 'test'): string => {
  const email = `${prefix}-${Date.now()}@example.com`;
  console.log(`📧 Generated test email: ${email}`);
  return email;
};

export const generateTimestamp = (daysOffset = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  console.log(`📅 Generated timestamp: ${date.toISOString()} (offset: ${daysOffset} days)`);
  return date;
};

// ==================== ANGULAR 20 SIGNAL UTILITIES (PREFERRED) ====================
// Modern signal-based testing utilities - use these for new Angular 20 code

/**
 * Creates a generic writable signal for testing with logging
 * @param initialValue - The initial value for the signal
 * @param debugName - Optional name for debugging logs
 */
export const createGenericTestSignal = <T>(initialValue: T, debugName = 'generic-signal'): WritableSignal<T> => {
  console.log(`🔄 Creating test signal "${debugName}" with initial value:`, initialValue);
  const testSignal = signal(initialValue);
  
  // Add logging wrapper for development
  const originalSet = testSignal.set;
  testSignal.set = (value: T) => {
    console.log(`🔄 Signal "${debugName}" updated from:`, testSignal(), 'to:', value);
    originalSet.call(testSignal, value);
  };
  
  return testSignal;
};

/**
 * Creates a generic computed signal for testing with logging
 * @param computation - The computation function
 * @param debugName - Optional name for debugging logs
 */
export const createGenericComputedSignal = <T>(
  computation: () => T, 
  debugName = 'generic-computed'
): Signal<T> => {
  console.log(`⚙️ Creating computed signal "${debugName}"`);
  const computedSignal = computed(() => {
    const result = computation();
    console.log(`⚙️ Computed signal "${debugName}" calculated:`, result);
    return result;
  });
  return computedSignal;
};

/**
 * Updates a signal and logs the change for testing
 * @param signal - The writable signal to update
 * @param value - The new value
 * @param debugName - Optional name for debugging
 */
export const updateTestSignal = <T>(
  signal: WritableSignal<T>, 
  value: T, 
  debugName = 'signal'
): void => {
  const oldValue = signal();
  console.log(`🔄 Updating test signal "${debugName}":`, oldValue, '->', value);
  signal.set(value);
};

/**
 * Creates a mock service with signal-based state for testing
 * @param initialState - Initial state object
 * @param serviceName - Name for debugging logs
 */
export const createSignalMockService = <T extends Record<string, any>>(
  initialState: T,
  serviceName = 'MockService'
): { [K in keyof T]: WritableSignal<T[K]> } => {
  console.log(`🏗️ Creating signal-based mock service "${serviceName}" with state:`, initialState);
  
  const mockService = {} as { [K in keyof T]: WritableSignal<T[K]> };
  
  Object.keys(initialState).forEach((key) => {
    mockService[key as keyof T] = createGenericTestSignal(
      initialState[key as keyof T], 
      `${serviceName}.${key}`
    );
  });
  
  return mockService;
};

// ==================== RXJS UTILITIES (Legacy/HTTP Support) ====================
// Use these only for HTTP requests, complex async operations, or legacy Observable code

export const createMockObservable = <T>(value: T, delayMs = 0): Observable<T> => {
  console.log(`📡 Creating mock Observable with value:`, value, delayMs ? `(delayed ${delayMs}ms)` : '');
  return delayMs > 0 ? of(value).pipe(delay(delayMs)) : of(value);
};

export const createMockErrorObservable = (error: string | Error, delayMs = 0): Observable<never> => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  console.log(`❌ Creating mock error Observable:`, errorObj.message, delayMs ? `(delayed ${delayMs}ms)` : '');
  return delayMs > 0 ? throwError(() => errorObj).pipe(delay(delayMs)) : throwError(() => errorObj);
};

export const createMockSubject = <T>(initialValue?: T): Subject<T> => {
  console.log(`📡 Creating mock Subject${initialValue !== undefined ? ' with initial value:' : ':'}`, initialValue);
  if (initialValue !== undefined) {
    return new BehaviorSubject<T>(initialValue);
  }
  return new Subject<T>();
};

// ==================== ASYNC TESTING UTILITIES ====================
// Modern async testing with comprehensive logging

export const waitFor = (conditionFn: () => boolean, timeout = 5000): Promise<void> => {
  console.log(`⏳ Starting waitFor with ${timeout}ms timeout`);
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const elapsed = Date.now() - startTime;
      const conditionMet = conditionFn();
      
      if (conditionMet) {
        console.log(`✅ Condition met after ${elapsed}ms`);
        resolve();
      } else if (elapsed > timeout) {
        console.log(`❌ Timeout after ${elapsed}ms waiting for condition`);
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
      } else {
        // Log progress every 1000ms for long waits
        if (elapsed % 1000 === 0 && elapsed > 0) {
          console.log(`⏳ Still waiting... ${elapsed}ms elapsed`);
        }
        setTimeout(check, 50);
      }
    };
    
    check();
  });
};

export const sleep = (ms: number): Promise<void> => {
  console.log(`😴 Sleeping for ${ms}ms`);
  return new Promise(resolve => setTimeout(() => {
    console.log(`⏰ Woke up after ${ms}ms`);
    resolve();
  }, ms));
};

// Mock function utilities (use these in test files with jest.fn())
export const createMockFunction = <T extends (...args: any[]) => any>(
  returnValue?: ReturnType<T>
) => {
  const mockFn = (...args: any[]) => returnValue;
  return Object.assign(mockFn, {
    mockReturnValue: (value: any) => Object.assign(mockFn, { returnValue: value }),
    mockImplementation: (impl: T) => impl,
    mock: { calls: [] as any[][] }
  });
};

export const createMockAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  returnValue?: Awaited<ReturnType<T>>
) => {
  const mockFn = async (...args: any[]) => returnValue;
  return Object.assign(mockFn, {
    mockResolvedValue: (value: any) => Promise.resolve(value),
    mockRejectedValue: (error: any) => Promise.reject(error),
    mockImplementation: (impl: T) => impl,
    mock: { calls: [] as any[][] }
  });
};

export const createMockRejectedFunction = <T extends (...args: any[]) => Promise<any>>(
  error?: string | Error
) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error || new Error('Mock error');
  const mockFn = async (...args: any[]) => { throw errorObj; };
  return Object.assign(mockFn, {
    mockRejectedValue: (err: any) => Promise.reject(err),
    mockResolvedValue: (value: any) => Promise.resolve(value),
    mockImplementation: (impl: T) => impl,
    mock: { calls: [] as any[][] }
  });
};

// Test data array utilities
export const createMockArray = <T>(factory: (index: number) => T, count: number): T[] => {
  return Array.from({ length: count }, (_, index) => factory(index));
};

// Local storage mock utilities
// Use this pattern in your test files:
// beforeEach(() => {
//   const mockStorage = createMockStorage();
//   jest.spyOn(Storage.prototype, 'getItem').mockImplementation(mockStorage.getItem);
//   jest.spyOn(Storage.prototype, 'setItem').mockImplementation(mockStorage.setItem);
//   // etc.
// });
export const createMockStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    getStore: () => ({ ...store })
  };
};

// Date mocking utilities
// Use this pattern in your test files:
// beforeEach(() => {
//   const mockDate = createMockDate('2024-01-01');
//   jest.spyOn(global, 'Date').mockImplementation(mockDate);
// });
export const createMockDate = (fixedDate: Date | string) => {
  const date = typeof fixedDate === 'string' ? new Date(fixedDate) : fixedDate;
  return () => date as any;
};

// Console mocking utilities
// Use this pattern in your test files:
// beforeEach(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'warn').mockImplementation(() => {});
//   jest.spyOn(console, 'error').mockImplementation(() => {});
// });
export const createMockConsole = () => ({
  log: () => {},
  warn: () => {},
  error: () => {}
});

// URL mocking utilities
export const mockWindowLocation = (url: string): void => {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    writable: true
  });
};

// Intersection Observer mock
// Use this pattern in your test files:
// beforeEach(() => {
//   global.IntersectionObserver = jest.fn().mockImplementation(createMockIntersectionObserver);
// });
export const createMockIntersectionObserver = (callback?: Function) => ({
  observe: () => {},
  unobserve: () => {},
  disconnect: () => {},
  root: null,
  rootMargin: '',
  thresholds: []
});

// Resize Observer mock
// Use this pattern in your test files:
// beforeEach(() => {
//   global.ResizeObserver = jest.fn().mockImplementation(createMockResizeObserver);
// });
export const createMockResizeObserver = (callback?: Function) => ({
  observe: () => {},
  unobserve: () => {},
  disconnect: () => {}
});

// Media query mock
// Use this pattern in your test files:
// beforeEach(() => {
//   Object.defineProperty(window, 'matchMedia', {
//     writable: true,
//     value: jest.fn().mockImplementation(createMockMatchMedia(true))
//   });
// });
export const createMockMatchMedia = (matches = false) => (query: string) => ({
  matches,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false
});

// Test cleanup utilities
// Use this pattern in your test files:
// afterEach(() => {
//   jest.clearAllMocks();
//   jest.restoreAllMocks();
//   cleanupTestEnvironment();
// });
export const cleanupTestEnvironment = (): void => {
  localStorage.clear();
  sessionStorage.clear();
};