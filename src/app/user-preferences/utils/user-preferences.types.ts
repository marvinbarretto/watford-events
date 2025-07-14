// Distance unit preference
export type DistanceUnit = 'miles' | 'kilometers' | 'walking-minutes';

// Event sort order preference
export type EventSortOrder = 'date-asc' | 'date-desc' | 'distance' | 'alphabetical';

// Language preference
export type LanguageCode = 'en' | 'es' | 'fr' | 'de';

// Theme preference
export type ThemePreference = 'light' | 'dark' | 'system';

// Event category preferences
export interface EventCategoryPreferences {
  music: boolean;
  sports: boolean;
  arts: boolean;
  food: boolean;
  family: boolean;
  business: boolean;
  community: boolean;
  education: boolean;
  entertainment: boolean;
  health: boolean;
}

// Notification preferences
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  eventReminders: boolean;
  newEventAlerts: boolean;
  weeklyDigest: boolean;
}

// Contextual preferences (frequently adjusted)
export interface ContextualPreferences {
  searchRadius: number; // in kilometers, converted based on unit preference
  distanceUnit: DistanceUnit;
  defaultSortOrder: EventSortOrder;
  preferredCategories: EventCategoryPreferences;
  showPastEvents: boolean;
  autoRefresh: boolean;
  resultsPerPage: number;
}

// Persistent preferences (rarely changed)
export interface PersistentPreferences {
  language: LanguageCode;
  theme: ThemePreference;
  notifications: NotificationPreferences;
  accessibility: {
    fontSize: number;
    highContrast: boolean;
    reduceMotion: boolean;
  };
  privacy: {
    shareLocation: boolean;
    analytics: boolean;
    personalizedRecommendations: boolean;
  };
}

// Complete user preferences
export interface UserPreferences {
  id: string; // Required by FirestoreCrudService
  userId?: string;
  contextual: ContextualPreferences;
  persistent: PersistentPreferences;
  lastUpdated: Date;
  version: number; // For migration purposes
}

// Default values
export const DEFAULT_CONTEXTUAL_PREFERENCES: ContextualPreferences = {
  searchRadius: 10, // 10km default
  distanceUnit: 'miles',
  defaultSortOrder: 'date-asc',
  preferredCategories: {
    music: true,
    sports: true,
    arts: true,
    food: true,
    family: true,
    business: false,
    community: true,
    education: false,
    entertainment: true,
    health: false,
  },
  showPastEvents: false,
  autoRefresh: true,
  resultsPerPage: 20,
};

export const DEFAULT_PERSISTENT_PREFERENCES: PersistentPreferences = {
  language: 'en',
  theme: 'system',
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    newEventAlerts: false,
    weeklyDigest: true,
  },
  accessibility: {
    fontSize: 16,
    highContrast: false,
    reduceMotion: false,
  },
  privacy: {
    shareLocation: true,
    analytics: true,
    personalizedRecommendations: true,
  },
};

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'userId'> = {
  contextual: DEFAULT_CONTEXTUAL_PREFERENCES,
  persistent: DEFAULT_PERSISTENT_PREFERENCES,
  lastUpdated: new Date(),
  version: 1,
};

// Preference update events
export interface PreferenceUpdateEvent {
  type: 'contextual' | 'persistent';
  field: string;
  value: any;
  timestamp: Date;
}