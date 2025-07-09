// Jest setup for Angular testing - no Firebase polyfills needed

// Custom Jest matchers for Angular and Firebase testing
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

declare global {
  namespace jest {
    interface Matchers<R> {
      // Angular-specific matchers
      toHaveClass(className: string): R;
      toHaveText(text: string): R;
      toContainText(text: string): R;
      toBeVisible(): R;
      toBeHidden(): R;
      toHaveAttribute(attribute: string, value?: string): R;
      toHaveValue(value: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      
      // Component-specific matchers
      toHaveComponent<T>(component: new (...args: any[]) => T): R;
      toEmitEvent(eventName: string): R;
      
      // Signal-specific matchers
      toHaveSignalValue<T>(value: T): R;
      
      // Firebase-specific matchers
      toBeFirestoreDoc(): R;
      toHaveFirestoreField(field: string, value?: any): R;
      toBeFirestoreCollection(): R;
      
      // Loading state matchers
      toBeLoading(): R;
      toHaveError(errorMessage?: string): R;
      toBeEmpty(): R;
    }
  }
}

// DOM element matchers
expect.extend({
  toHaveClass(received: HTMLElement, className: string) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () => 
        pass 
          ? `Expected element not to have class "${className}"`
          : `Expected element to have class "${className}"`
    };
  },

  toHaveText(received: HTMLElement, text: string) {
    const pass = received.textContent?.trim() === text;
    return {
      pass,
      message: () => 
        pass 
          ? `Expected element not to have text "${text}"`
          : `Expected element to have text "${text}", but got "${received.textContent?.trim()}"`
    };
  },

  toContainText(received: HTMLElement, text: string) {
    const pass = received.textContent?.includes(text) ?? false;
    return {
      pass,
      message: () => 
        pass 
          ? `Expected element not to contain text "${text}"`
          : `Expected element to contain text "${text}", but got "${received.textContent}"`
    };
  },

  toBeVisible(received: HTMLElement) {
    const pass = !received.hidden && received.style.display !== 'none';
    return {
      pass,
      message: () => 
        pass 
          ? 'Expected element not to be visible'
          : 'Expected element to be visible'
    };
  },

  toBeEmpty(received: any) {
    let pass = false;
    
    if (Array.isArray(received)) {
      pass = received.length === 0;
    } else if (received && typeof received === 'object') {
      pass = Object.keys(received).length === 0;
    } else if (typeof received === 'string') {
      pass = received.length === 0;
    }
    
    return {
      pass,
      message: () => 
        pass 
          ? 'Expected not to be empty'
          : 'Expected to be empty'
    };
  }
});

// Polyfill required for Redis client in test environment
if (typeof setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(fn, 0, ...args);
  };
}


// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});
