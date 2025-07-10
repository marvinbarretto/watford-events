// Test data factories for domain models - Angular 20 Signal-First Approach
// This file provides modern test data factories with comprehensive logging
// and signal-aware patterns for Angular 20 applications

import { signal, WritableSignal } from '@angular/core';
import { User } from '@users/utils/user.model';
import { AuthResponse, LoginPayload, RegisterPayload, RegisterForm } from '@auth/utils/auth.model';
import { generateId, generateEmail, generateTimestamp, createGenericTestSignal } from './common-test-utils';

console.log('🏭 Loading test data factories - Angular 20 Signal-First approach');

// ==================== USER MODEL FACTORIES ====================
// Modern user factories with logging and signal support

export const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = {
    uid: generateId('user'),
    email: generateEmail('user'),
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    photoURL: null,
    joinedAt: generateTimestamp().toISOString(),
    checkedInPubIds: [],
    streaks: {},
    joinedMissionIds: [],
    totalPoints: 0,
    ...overrides
  };
  
  console.log('👤 Created mock user:', { uid: user.uid, email: user.email, displayName: user.displayName });
  return user;
};

/**
 * Creates a signal-wrapped mock user for modern Angular 20 testing
 * @param overrides - Partial user data to override defaults
 * @param debugName - Name for debugging logs
 */
export const createMockUserSignal = (
  overrides: Partial<User> = {}, 
  debugName = 'user-signal'
): WritableSignal<User> => {
  const user = createMockUser(overrides);
  console.log(`🔄 Creating user signal "${debugName}" with user:`, user.uid);
  return createGenericTestSignal(user, debugName);
};

export const createMockUserWithPoints = (points: number, overrides: Partial<User> = {}): User => 
  createMockUser({ totalPoints: points, ...overrides });

export const createMockActiveUser = (overrides: Partial<User> = {}): User => 
  createMockUser({
    checkedInPubIds: ['pub-1', 'pub-2'],
    streaks: { 'weekly': 3, 'monthly': 12 },
    joinedMissionIds: ['mission-1'],
    totalPoints: 150,
    ...overrides
  });

export const createMockAnonymousUser = (overrides: Partial<User> = {}): User => 
  createMockUser({
    isAnonymous: true,
    email: null,
    displayName: 'Anonymous User',
    emailVerified: false,
    ...overrides
  });

// Auth model factories
export const createMockAuthResponse = (overrides: Partial<AuthResponse> = {}): AuthResponse => ({
  jwt: 'mock-jwt-token-123',
  user: createMockUser(),
  ...overrides
});

export const createMockLoginPayload = (overrides: Partial<LoginPayload> = {}): LoginPayload => ({
  identifier: generateEmail('login'),
  password: 'testPassword123',
  ...overrides
});

export const createMockRegisterPayload = (overrides: Partial<RegisterPayload> = {}): RegisterPayload => ({
  username: 'testuser',
  email: generateEmail('register'),
  password: 'testPassword123',
  ...overrides
});

export const createMockRegisterForm = (overrides: Partial<RegisterForm> = {}): RegisterForm => ({
  username: 'testuser',
  email: generateEmail('register'),
  password: 'testPassword123',
  confirmPassword: 'testPassword123',
  ...overrides
});

// Event model factories (if you have events)
export interface MockEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location?: string;
  venueId?: string;
  attendeeIds: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  ownerId: string;
  status: 'draft' | 'published' | 'cancelled';
  
  // LLM extraction metadata
  imageUrl?: string;
  scannedAt?: Date;
  scannerConfidence?: number;
  rawTextData?: string;
  llmModel?: string;
  processingTime?: number;
  
  // Additional event details
  organizer?: string;
  ticketInfo?: string;
  contactInfo?: string;
  website?: string;
  
  // Development/Testing fields
  isMockEvent?: boolean;
}

export const createMockEvent = (overrides: Partial<MockEvent> = {}): MockEvent => ({
  id: generateId('event'),
  title: 'Test Event',
  description: 'This is a test event',
  date: generateTimestamp(7), // 7 days in future
  location: 'Test Venue',
  attendeeIds: [],
  createdAt: generateTimestamp(-1),
  updatedAt: generateTimestamp(),
  createdBy: generateId('user'),
  ownerId: generateId('user'),
  status: 'published',
  isMockEvent: true, // Mark as mock event by default
  ...overrides
});

export const createMockUpcomingEvent = (daysFromNow: number, overrides: Partial<MockEvent> = {}): MockEvent =>
  createMockEvent({
    date: generateTimestamp(daysFromNow),
    ...overrides
  });

export const createMockPastEvent = (daysAgo: number, overrides: Partial<MockEvent> = {}): MockEvent =>
  createMockEvent({
    date: generateTimestamp(-Math.abs(daysAgo)),
    ...overrides
  });

// Specific factories for real vs mock events
export const createRealEvent = (overrides: Partial<MockEvent> = {}): MockEvent =>
  createMockEvent({
    isMockEvent: false,
    ...overrides
  });

export const createMockEventWithAI = (overrides: Partial<MockEvent> = {}): MockEvent =>
  createMockEvent({
    imageUrl: 'https://example.com/flyer.jpg',
    scannedAt: generateTimestamp(-1),
    scannerConfidence: 85,
    llmModel: 'gemini-pro',
    processingTime: 2500,
    rawTextData: 'Extracted text from flyer...',
    ...overrides
  });

// Collection factories for creating arrays of test data
export const createMockUsers = (count: number, factory: (index: number) => Partial<User> = () => ({})): User[] =>
  Array.from({ length: count }, (_, index) => createMockUser({
    uid: generateId(`user-${index}`),
    email: generateEmail(`user${index}`),
    displayName: `Test User ${index + 1}`,
    ...factory(index)
  }));

export const createMockEvents = (count: number, factory: (index: number) => Partial<MockEvent> = () => ({})): MockEvent[] =>
  Array.from({ length: count }, (_, index) => createMockEvent({
    id: generateId(`event-${index}`),
    title: `Test Event ${index + 1}`,
    ...factory(index)
  }));

// Create mixed real and mock events for development
export const createMixedEvents = (
  realCount: number, 
  mockCount: number, 
  factory: (index: number, isReal: boolean) => Partial<MockEvent> = () => ({})
): MockEvent[] => {
  const realEvents = Array.from({ length: realCount }, (_, index) => createRealEvent({
    id: generateId(`real-event-${index}`),
    title: `Real Event ${index + 1}`,
    ...factory(index, true)
  }));
  
  const mockEvents = Array.from({ length: mockCount }, (_, index) => createMockEvent({
    id: generateId(`mock-event-${index}`),
    title: `Mock Event ${index + 1}`,
    ...factory(index, false)
  }));
  
  // Shuffle the events to mix them
  return [...realEvents, ...mockEvents].sort(() => Math.random() - 0.5);
};

// Form data factories
export const createValidFormData = (formType: 'login' | 'register') => {
  switch (formType) {
    case 'login':
      return {
        identifier: generateEmail('form'),
        password: 'validPassword123'
      };
    case 'register':
      return {
        username: 'validuser',
        email: generateEmail('form'),
        password: 'validPassword123',
        confirmPassword: 'validPassword123'
      };
  }
};

export const createInvalidFormData = (formType: 'login' | 'register') => {
  switch (formType) {
    case 'login':
      return {
        identifier: 'invalid-email',
        password: '123' // too short
      };
    case 'register':
      return {
        username: 'a', // too short
        email: 'invalid-email',
        password: '123', // too short
        confirmPassword: '456' // doesn't match
      };
  }
};

// API response factories
export const createMockApiSuccess = <T>(data: T) => ({
  success: true,
  data,
  message: 'Operation successful'
});

export const createMockApiError = (message = 'An error occurred', code = 400) => ({
  success: false,
  error: {
    message,
    code
  }
});

// Firestore document factories
export const createMockFirestoreDoc = <T>(data: T, id = generateId('doc')) => ({
  id,
  data: () => data,
  exists: true,
  ref: {
    id,
    path: `collection/${id}`
  }
});

export const createMockFirestoreCollection = <T>(items: T[], idPrefix = 'doc') => ({
  docs: items.map((item, index) => createMockFirestoreDoc(item, `${idPrefix}-${index}`)),
  empty: items.length === 0,
  size: items.length
});