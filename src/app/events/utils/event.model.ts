/**
 * Base type for all events in the system
 * Provides core properties that all event types should have
 */
export type GenericEventModel = {
  id: string;
  title: string;
  description?: string; // Made optional - many events don't need detailed descriptions
  
  // User-friendly date/time structure
  date: string;           // YYYY-MM-DD format from date input
  startTime?: string;     // HH:MM format from time input
  endTime?: string;       // HH:MM format from time input
  isAllDay?: boolean;     // Flag for all-day events
  
  location?: string; // Optional - can be derived from venue
  venueId?: string; // Reference to venue for location data
  createdAt: Date;
  updatedAt: Date;

  // Owner/Creator fields
  createdBy: string; // User UID who created the event
  ownerId: string;   // Primary owner UID (for permissions)

  // Event status
  status: 'draft' | 'published' | 'cancelled';
};

/**
 * Event type classification
 */
export type EventType = 'single' | 'recurring';

/**
 * Recurrence pattern definition for recurring events
 */
export type RecurrenceRule = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // e.g., every 2 weeks = frequency: 'weekly', interval: 2
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for weekly patterns
  dayOfMonth?: number; // 1-31 for monthly patterns
  monthOfYear?: number; // 1-12 for yearly patterns
  endCondition: {
    type: 'never' | 'date' | 'count';
    endDate?: Date;
    occurrences?: number;
  };
  exceptions?: Date[]; // Dates to skip (for cancelled instances)
};

/**
 * Main domain event type for Watford events
 * Extends GenericEventModel with domain-specific fields
 */
export type EventModel = GenericEventModel & {
  attendeeIds: string[];
  slug?: string; // SEO-friendly URL slug generated from title

  // Event type and recurrence (defaults to single)
  eventType: EventType;
  recurrenceRule?: RecurrenceRule;
  parentEventId?: string; // For exception instances that override recurring pattern
  isException?: boolean; // True if this is a modified instance of recurring event
  originalDate?: string; // Original date if this is an exception instance (string format)

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
  
  // Categorization and tagging
  categories?: EventCategory[];
  tags?: string[];
  
  // Social engagement
  likeCount?: number;
  
  // Development/Testing fields
  isMockEvent?: boolean;
};

/**
 * Event categorization settings
 */
export const EVENT_CATEGORY_SETTINGS = {
  MAX_CATEGORIES_PER_EVENT: 3,
  MAX_TAGS_PER_EVENT: 10 // Also limit tags for better UX
} as const;

/**
 * Predefined event categories for consistent categorization
 */
export type EventCategory = 
  | 'music' 
  | 'sports' 
  | 'arts' 
  | 'community' 
  | 'education' 
  | 'food' 
  | 'nightlife' 
  | 'theatre' 
  | 'comedy' 
  | 'family' 
  | 'business' 
  | 'charity' 
  | 'outdoor' 
  | 'other';

/**
 * Event category options with display labels
 */
export const EVENT_CATEGORIES: { value: EventCategory; label: string; description?: string }[] = [
  { value: 'music', label: 'Music', description: 'Concerts, gigs, festivals' },
  { value: 'sports', label: 'Sports', description: 'Matches, tournaments, fitness' },
  { value: 'arts', label: 'Arts & Culture', description: 'Exhibitions, workshops, performances' },
  { value: 'community', label: 'Community', description: 'Local gatherings, meetings' },
  { value: 'education', label: 'Education', description: 'Workshops, lectures, courses' },
  { value: 'food', label: 'Food & Drink', description: 'Markets, tastings, dining' },
  { value: 'nightlife', label: 'Nightlife', description: 'Clubs, bars, parties' },
  { value: 'theatre', label: 'Theatre', description: 'Plays, musicals, drama' },
  { value: 'comedy', label: 'Comedy', description: 'Stand-up, improv, entertainment' },
  { value: 'family', label: 'Family', description: 'Child-friendly activities' },
  { value: 'business', label: 'Business', description: 'Networking, conferences' },
  { value: 'charity', label: 'Charity', description: 'Fundraising, volunteering' },
  { value: 'outdoor', label: 'Outdoor', description: 'Parks, walking, adventure' },
  { value: 'other', label: 'Other', description: 'Miscellaneous events' }
];

/**
 * Recurrence frequency options for UI
 */
export const RECURRENCE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
] as const;

/**
 * Days of week for recurrence patterns
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
] as const;

/**
 * Type guard for null safety
 */
export function isEvent(event: EventModel | null): event is EventModel {
  return event !== null && typeof event === 'object' && 'id' in event;
}

/**
 * Type guard for recurring events
 */
export function isRecurringEvent(event: EventModel): event is EventModel & { recurrenceRule: RecurrenceRule } {
  return event.eventType === 'recurring' && !!event.recurrenceRule;
}

/**
 * Type guard for single events
 */
export function isSingleEvent(event: EventModel): boolean {
  return event.eventType === 'single';
}

/**
 * Check if event is an exception instance
 */
export function isExceptionEvent(event: EventModel): boolean {
  return !!event.isException && !!event.parentEventId;
}

/**
 * Helper function for creating EventModel objects with smart defaults
 */
export function createEventDefaults(): Partial<EventModel> {
  return {
    attendeeIds: [],
    eventType: 'single',
    status: 'draft',
    categories: [],
    tags: [],
    likeCount: 0
  };
}

/**
 * Helper function to convert date string + time strings to Date object
 */
export function createEventDateTime(date: string, time?: string): Date {
  if (!time) {
    // If no time provided, use start of day
    return new Date(date + 'T00:00:00');
  }
  
  // Combine date and time into ISO string
  return new Date(date + 'T' + time + ':00');
}

/**
 * Helper function to extract date string from Date object
 */
export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to extract time string from Date object
 */
export function getTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5); // HH:MM format
}