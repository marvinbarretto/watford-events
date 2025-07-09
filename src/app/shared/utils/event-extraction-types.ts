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
  organizer?: string;
  ticketInfo?: string;
  contactInfo?: string;
  website?: string;
  imageUrl?: string;
};

export type EventConfidence = {
  overall: number; // 0-100
  title: number;
  description: number;
  date: number;
  location: number;
  organizer: number;
  ticketInfo: number;
  contactInfo: number;
  website: number;
};

export type EventField = keyof Omit<EventData, 'imageUrl'>;

export type EventFieldValidation = {
  field: EventField;
  value: string;
  confidence: number;
  hasValue: boolean;
};