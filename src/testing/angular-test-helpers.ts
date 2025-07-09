// Angular testing utilities and helpers - Angular 20 Signal-First Approach
// Modern testing utilities with comprehensive signal support and logging

import { ComponentFixture, TestBed, TestModuleMetadata } from '@angular/core/testing';
import { Component, signal, Signal, WritableSignal, computed } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';

console.log('🧪 Loading Angular test helpers - Signal-First approach');

// Enhanced TestBed setup with common providers
export const setupTestBed = (config: TestModuleMetadata = {}) => {
  const defaultConfig: TestModuleMetadata = {
    providers: [
      provideLocationMocks(),
      ...(config.providers || [])
    ],
    imports: config.imports || []
  };

  return TestBed.configureTestingModule(defaultConfig);
};

// Enhanced TestBed setup with provider presets
export const setupTestBedWithPreset = (
  presetName: 'basic' | 'firebase' | 'authenticated' | 'firestoreService' | 'authService',
  additionalConfig: TestModuleMetadata = {}
) => {
  // Import here to avoid circular dependency issues
  const { TestProviderPresets } = require('./test-providers');
  
  const presetProviders = TestProviderPresets[presetName] || [];
  
  const config: TestModuleMetadata = {
    providers: [
      ...presetProviders,
      ...(additionalConfig.providers || [])
    ],
    imports: additionalConfig.imports || []
  };

  console.log(`🧪 Setting up TestBed with "${presetName}" preset`);
  return TestBed.configureTestingModule(config);
};

// Quick setup functions for common scenarios
export const setupBasicTest = (additionalConfig: TestModuleMetadata = {}) => 
  setupTestBedWithPreset('basic', additionalConfig);

export const setupFirebaseTest = (additionalConfig: TestModuleMetadata = {}) => 
  setupTestBedWithPreset('firebase', additionalConfig);

export const setupAuthenticatedTest = (additionalConfig: TestModuleMetadata = {}) => 
  setupTestBedWithPreset('authenticated', additionalConfig);

export const setupFirestoreServiceTest = (additionalConfig: TestModuleMetadata = {}) => 
  setupTestBedWithPreset('firestoreService', additionalConfig);

export const setupAuthServiceTest = (additionalConfig: TestModuleMetadata = {}) => 
  setupTestBedWithPreset('authService', additionalConfig);

// Component test setup helper
export const createComponent = async <T>(
  component: new (...args: any[]) => T,
  config: TestModuleMetadata = {}
): Promise<ComponentFixture<T>> => {
  await setupTestBed({
    imports: [component, ...(config.imports || [])],
    providers: config.providers || []
  }).compileComponents();

  return TestBed.createComponent(component);
};

// ==================== SIGNAL TESTING UTILITIES ====================
// Modern Angular 20 signal testing with comprehensive logging

/**
 * Creates an Angular-specific test signal with logging for debugging
 * @param initialValue - Initial value for the signal
 * @param debugName - Name for debugging logs
 */
export const createAngularTestSignal = <T>(initialValue: T, debugName = 'angular-signal'): WritableSignal<T> => {
  console.log(`🔄 Creating test signal "${debugName}" with value:`, initialValue);
  const testSignal = signal(initialValue);
  
  // Wrap set method with logging
  const originalSet = testSignal.set;
  testSignal.set = (value: T) => {
    console.log(`🔄 Signal "${debugName}" updated:`, testSignal(), '->', value);
    originalSet.call(testSignal, value);
  };
  
  return testSignal;
};

/**
 * Creates an Angular-specific computed test signal with logging
 * @param computation - The computation function
 * @param debugName - Name for debugging logs
 */
export const createAngularComputedSignal = <T>(
  computation: () => T, 
  debugName = 'angular-computed'
): Signal<T> => {
  console.log(`⚙️ Creating computed signal "${debugName}"`);
  return computed(() => {
    const result = computation();
    console.log(`⚙️ Computed signal "${debugName}" result:`, result);
    return result;
  });
};

/**
 * Updates a signal value with logging
 * @param testSignal - The signal to update
 * @param value - New value
 * @param debugName - Optional debug name
 */
export const setSignalValue = <T>(testSignal: WritableSignal<T>, value: T, debugName = 'signal'): void => {
  const oldValue = testSignal();
  console.log(`🔄 Updating signal "${debugName}":`, oldValue, '->', value);
  testSignal.set(value);
};

/**
 * Tests that a signal has a specific value
 * @param testSignal - The signal to test
 * @param expectedValue - Expected value
 * @param debugName - Optional debug name
 */
export const expectSignalValue = <T>(
  testSignal: Signal<T>, 
  expectedValue: T, 
  debugName = 'signal'
): void => {
  const actualValue = testSignal();
  console.log(`🧪 Testing signal "${debugName}":`, actualValue, '===', expectedValue);
  // Note: Use expect() in your actual test files
  // This is just the helper pattern
};

// DOM testing helpers
export const getByTestId = <T>(fixture: ComponentFixture<T>, testId: string): HTMLElement => {
  const element = fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  return element?.nativeElement;
};

export const getAllByTestId = <T>(fixture: ComponentFixture<T>, testId: string): HTMLElement[] => {
  const elements = fixture.debugElement.queryAll(By.css(`[data-testid="${testId}"]`));
  return elements.map(el => el.nativeElement);
};

export const getByText = <T>(fixture: ComponentFixture<T>, text: string): HTMLElement => {
  const element = fixture.debugElement.query(
    By.css('*')
  )?.nativeElement.querySelector(`*:contains("${text}")`);
  return element;
};

export const queryByText = <T>(fixture: ComponentFixture<T>, text: string): HTMLElement | null => {
  const walker = document.createTreeWalker(
    fixture.nativeElement,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.textContent?.includes(text)) {
      return node.parentElement;
    }
  }
  return null;
};

// Event simulation helpers
export const clickElement = (element: HTMLElement): void => {
  element.click();
};

export const typeInInput = (input: HTMLInputElement, value: string): void => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

export const selectOption = (select: HTMLSelectElement, value: string): void => {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};

// Async testing utilities
export const waitForAsync = (fn: () => Promise<void>) => async () => {
  await fn();
};

export const flushPromises = (): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Router testing helpers
export const setupRouterTest = (routes: any[] = []) => {
  return {
    providers: [
      provideRouter(routes),
      provideLocationMocks()
    ]
  };
};

export const navigateAndSettle = async (router: Router, location: Location, url: string): Promise<void> => {
  await router.navigate([url]);
  // In your test: expect(location.path()).toBe(url);
};

// Component state testing helper
// Usage: const component = fixture.componentInstance; expect(component.someProperty).toBe(expectedValue);
export const getComponentState = <T>(fixture: ComponentFixture<T>): T => {
  return fixture.componentInstance;
};

// Loading state helpers
export const getLoadingState = <T>(fixture: ComponentFixture<T>): HTMLElement | null => {
  return getByTestId(fixture, 'loading-indicator');
  // In your test: expect(getLoadingState(fixture)).toBeTruthy() or toBeFalsy()
};

// Error state helpers
export const getErrorState = <T>(fixture: ComponentFixture<T>): HTMLElement | null => {
  return getByTestId(fixture, 'error-message');
  // In your test: expect(getErrorState(fixture)).toBeTruthy();
  // expect(getErrorState(fixture)?.textContent).toContain(errorMessage);
};

// Form testing utilities
export const fillForm = <T>(
  fixture: ComponentFixture<T>,
  formData: Record<string, string>
): void => {
  Object.entries(formData).forEach(([fieldName, value]) => {
    const input = getByTestId(fixture, fieldName) as HTMLInputElement;
    if (input) {
      typeInInput(input, value);
    }
  });
  fixture.detectChanges();
};

export const submitForm = <T>(fixture: ComponentFixture<T>): void => {
  const form = fixture.debugElement.query(By.css('form'));
  form?.triggerEventHandler('ngSubmit', null);
  fixture.detectChanges();
};