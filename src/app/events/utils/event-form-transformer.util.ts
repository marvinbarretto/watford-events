import { EventExtractionResult } from '../../shared/utils/event-extraction-types';

/**
 * Event Form Transformation Utilities
 * 
 * Functions for transforming data between form values,
 * Event models, and LLM extraction results
 */

export interface EventFormValue {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  ticketInfo: string;
  contactInfo: string;
  website: string;
}

export interface EventCreationData {
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer?: string;
  ticketInfo?: string;
  contactInfo?: string;
  website?: string;
  status: 'draft' | 'published';
  attendeeIds: string[];
  
  // LLM metadata
  imageUrl?: string;
  scannedAt?: Date;
  scannerConfidence?: number;
  rawTextData?: string;
  llmModel?: string;
  processingTime?: number;
}

/**
 * Transform form values to event creation data
 */
export function transformFormToEventData(
  formValue: EventFormValue, 
  status: 'draft' | 'published',
  metadata?: {
    capturedImage?: string;
    extractionResult?: EventExtractionResult;
    processingTime?: number;
  }
): EventCreationData {
  // Combine date and time into a single Date object
  const eventDateTime = combineDateAndTime(formValue.date, formValue.time);

  return {
    title: formValue.title,
    description: formValue.description,
    date: eventDateTime,
    location: formValue.location,
    organizer: formValue.organizer || undefined,
    ticketInfo: formValue.ticketInfo || undefined,
    contactInfo: formValue.contactInfo || undefined,
    website: formValue.website || undefined,
    status,
    attendeeIds: [],
    
    // Add LLM metadata if available
    ...(metadata && {
      imageUrl: metadata.capturedImage,
      scannedAt: new Date(),
      scannerConfidence: metadata.extractionResult?.confidence?.overall,
      rawTextData: metadata.extractionResult?.rawText,
      llmModel: 'gemini-1.5-flash',
      processingTime: metadata.processingTime || 0
    })
  };
}

/**
 * Combine separate date and time strings into a Date object
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  if (dateStr && timeStr) {
    return new Date(`${dateStr}T${timeStr}`);
  } else if (dateStr) {
    return new Date(dateStr);
  } else {
    return new Date();
  }
}

/**
 * Extract fields that should be auto-filled from LLM result
 */
export function extractAutoFillFields(
  extractionResult: EventExtractionResult
): Partial<EventFormValue> {
  if (!extractionResult.success || !extractionResult.eventData) {
    return {};
  }

  const data = extractionResult.eventData;
  const formData: Partial<EventFormValue> = {};

  // Simple field mapping
  const simpleFields: (keyof EventFormValue)[] = [
    'title', 'description', 'location', 'organizer',
    'ticketInfo', 'contactInfo', 'website'
  ];

  simpleFields.forEach(field => {
    const value = data[field as keyof typeof data];
    if (value && value !== 'Not found') {
      formData[field] = value as string;
    }
  });

  return formData;
}

/**
 * Check if a field value should be considered valid for auto-fill
 */
export function isValidFieldValue(value: any, confidence: number = 0): boolean {
  return (
    value !== null && 
    value !== undefined && 
    value !== 'Not found' && 
    value !== '' &&
    confidence > 0
  );
}

/**
 * Create a display-friendly summary of extraction results
 */
export function createExtractionSummary(result: EventExtractionResult): string {
  if (!result.success || !result.eventData) {
    return 'No data extracted';
  }

  const fields = [];
  const data = result.eventData;
  
  if (data.title) fields.push(`Title: ${data.title}`);
  if (data.date) fields.push(`Date: ${data.date}`);
  if (data.location) fields.push(`Location: ${data.location}`);
  
  return fields.length > 0 
    ? fields.join(', ') 
    : 'Partial data extracted';
}

/**
 * Calculate completion percentage of the form
 */
export function calculateFormCompletion(formValue: EventFormValue): number {
  const requiredFields: (keyof EventFormValue)[] = ['title', 'date', 'time', 'location'];
  const filledRequired = requiredFields.filter(field => !!formValue[field]).length;
  
  const optionalFields: (keyof EventFormValue)[] = [
    'description', 'organizer', 'ticketInfo', 'contactInfo', 'website'
  ];
  const filledOptional = optionalFields.filter(field => !!formValue[field]).length;
  
  // Required fields count for 70%, optional for 30%
  const requiredScore = (filledRequired / requiredFields.length) * 70;
  const optionalScore = (filledOptional / optionalFields.length) * 30;
  
  return Math.round(requiredScore + optionalScore);
}