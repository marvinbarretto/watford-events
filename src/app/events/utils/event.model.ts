export type Event = {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  attendeeIds: string[];
  createdAt: Date;
  updatedAt: Date;

  // Future fields for image scanner integration
  imageUrl?: string;
  scannedAt?: Date;
  scannerConfidence?: number;
  rawTextData?: string;
};

/**
 * Type guard for null safety
 */
export function isEvent(event: Event | null): event is Event {
  return event !== null && typeof event === 'object' && 'id' in event;
}