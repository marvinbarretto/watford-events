export type Event = {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  attendeeIds: string[];
  createdAt: Date;
  updatedAt: Date;

  // Owner/Creator fields
  createdBy: string; // User UID who created the event
  ownerId: string;   // Primary owner UID (for permissions)

  // Event status
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
};

/**
 * Type guard for null safety
 */
export function isEvent(event: Event | null): event is Event {
  return event !== null && typeof event === 'object' && 'id' in event;
}