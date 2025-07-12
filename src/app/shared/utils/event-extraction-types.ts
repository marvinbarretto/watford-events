export type EventExtractionResult = {
  success: boolean;
  eventData: EventData | null;
  confidence: EventConfidence;
  error?: string;
  rawText?: string;
};

export type EventData = {
  title: string;
  description: string;
  date: string; // ISO string or readable date from flyer
  location: string;
  venueId?: string; // Optional venue reference if location matches known venue
  organizer?: string;
  ticketInfo?: string;
  contactInfo?: string;
  website?: string;
  categories?: string[];
  tags?: string[];
  imageUrl?: string;
};

export type EventConfidence = {
  overall: number; // 0-100
  title: number;
  description: number;
  date: number;
  location: number;
  venueId: number;
  organizer: number;
  ticketInfo: number;
  contactInfo: number;
  website: number;
  categories: number;
  tags: number;
};

export type EventField = keyof Omit<EventData, 'imageUrl'>;

export type EventFieldValidation = {
  field: EventField;
  value: string;
  confidence: number;
  hasValue: boolean;
};