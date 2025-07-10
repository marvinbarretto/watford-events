/**
 * Base type for all events in the system
 * Provides core properties that all event types should have
 */
export type GenericEvent = {
  id: string;
  title: string;
  description: string;
  date: Date;
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
 * Main domain event type for Watford events
 * Extends GenericEvent with domain-specific fields
 */
export type Event = GenericEvent & {
  attendeeIds: string[];
  slug?: string; // SEO-friendly URL slug generated from title

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
};

/**
 * Type guard for null safety
 */
export function isEvent(event: Event | null): event is Event {
  return event !== null && typeof event === 'object' && 'id' in event;
}