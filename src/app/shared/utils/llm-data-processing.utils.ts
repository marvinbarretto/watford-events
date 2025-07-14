/**
 * LLM Data Processing Utilities
 * 
 * Integration layer that combines all parsing utilities to process
 * raw LLM extracted data into clean, structured event information.
 */

import { EventData } from './event-extraction-types';
import { EventCategory } from '../../events/utils/event.model';
import { Venue } from '../../venues/utils/venue.model';
import { normalizeEventTitle, normalizeLocationText } from './text-processing.utils';
import { parseNaturalDateTime, ParsedDateTime } from './date-parsing.utils';
import { findBestVenueMatch, VenueMatchResult } from './venue-matching.utils';

/**
 * Processed event data with normalized and parsed fields
 */
export interface ProcessedEventData {
  // Basic fields (cleaned and normalized)
  title: string;
  description: string;
  location: string;
  organizer: string;
  ticketInfo: string;
  contactInfo: string;
  website: string;
  categories: EventCategory[];
  tags: string[];

  // Parsed date/time information
  date: string | null;           // ISO format: YYYY-MM-DD
  startTime: string | null;      // 24-hour format: HH:MM
  endTime: string | null;        // 24-hour format: HH:MM
  isAllDay: boolean;

  // Venue matching
  venueId: string | null;        // Matched venue ID
  matchedVenue: Venue | null;    // Full venue object if matched
  venueMatchScore: number;       // Match confidence (0-100)

  // Processing metadata
  processingNotes: string[];     // Issues or corrections made
  originalData: EventData;       // Original LLM data for reference
}

/**
 * Validation result for processed data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredFieldsMissing: string[];
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  venues?: Venue[];              // Available venues for matching
  venueMatchThreshold?: number;  // Minimum score for venue matching (default: 70)
  strictValidation?: boolean;    // Strict validation mode (default: false)
  normalizeText?: boolean;       // Apply text normalization (default: true)
}

/**
 * Processes raw LLM extracted event data into clean, structured format
 * Applies all normalization, parsing, and matching utilities
 * 
 * @param rawData - Raw event data from LLM extraction
 * @param options - Processing options
 * @returns Processed and normalized event data
 * 
 * @example
 * const processed = processExtractedEventData(rawLLMData, { venues: allVenues });
 * // Returns normalized data with parsed dates and matched venues
 */
export function processExtractedEventData(
  rawData: EventData, 
  options: ProcessingOptions = {}
): ProcessedEventData {
  const {
    venues = [],
    venueMatchThreshold = 70,
    normalizeText = true
  } = options;

  const processingNotes: string[] = [];

  // Process title
  const title = normalizeText ? normalizeEventTitle(rawData.title || '') : (rawData.title || '');
  if (title !== rawData.title) {
    processingNotes.push(`Normalized title: "${rawData.title}" → "${title}"`);
  }

  // Process description
  const description = normalizeText ? 
    normalizeEventTitle(rawData.description || '') : 
    (rawData.description || '');

  // Process location
  const location = normalizeText ? 
    normalizeLocationText(rawData.location || '') : 
    (rawData.location || '');

  // Parse date and time
  const dateTimeInfo = parseEventDateTime(rawData.date || '');
  if (dateTimeInfo.raw !== dateTimeInfo.date) {
    processingNotes.push(`Parsed date/time: "${rawData.date}" → date: ${dateTimeInfo.date}, time: ${dateTimeInfo.startTime}`);
  }

  // Match venue
  const venueMatch = matchEventVenue(location, venues, venueMatchThreshold);
  if (venueMatch.venue) {
    processingNotes.push(`Matched venue: "${location}" → "${venueMatch.venue.name}" (score: ${venueMatch.score})`);
  }

  // Process other text fields
  const organizer = normalizeText ? normalizeEventTitle(rawData.organizer || '') : (rawData.organizer || '');
  const ticketInfo = rawData.ticketInfo || '';
  const contactInfo = rawData.contactInfo || '';
  const website = rawData.website || '';

  // Process categories and tags
  const categories = validateCategories(rawData.categories || []);
  const tags = processTags(rawData.tags || []);

  return {
    // Basic fields
    title,
    description,
    location,
    organizer,
    ticketInfo,
    contactInfo,
    website,
    categories,
    tags,

    // Date/time
    date: dateTimeInfo.date,
    startTime: dateTimeInfo.startTime,
    endTime: dateTimeInfo.endTime,
    isAllDay: dateTimeInfo.isAllDay,

    // Venue matching
    venueId: venueMatch.venue?.id || null,
    matchedVenue: venueMatch.venue,
    venueMatchScore: venueMatch.score,

    // Metadata
    processingNotes,
    originalData: rawData
  };
}

/**
 * Validates processed event data
 * 
 * @param data - Processed event data
 * @param strict - Use strict validation rules
 * @returns Validation result
 */
export function validateExtractedData(
  data: ProcessedEventData, 
  strict: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredFieldsMissing: string[] = [];

  // Required fields
  if (!data.title || data.title.trim().length === 0) {
    requiredFieldsMissing.push('title');
  }

  if (!data.date) {
    requiredFieldsMissing.push('date');
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push('Invalid date format. Expected YYYY-MM-DD.');
    }
  }

  if (!data.location || data.location.trim().length === 0) {
    requiredFieldsMissing.push('location');
  }

  // Time validation
  if (!data.isAllDay && !data.startTime) {
    warnings.push('No start time specified for non-all-day event');
  }

  if (data.startTime && data.endTime) {
    if (data.startTime >= data.endTime) {
      errors.push('End time must be after start time');
    }
  }

  // Strict validation
  if (strict) {
    if (!data.description || data.description.trim().length === 0) {
      warnings.push('Description is empty');
    }
    
    if (!data.organizer || data.organizer.trim().length === 0) {
      warnings.push('Organizer is empty');
    }
  }

  return {
    isValid: errors.length === 0 && requiredFieldsMissing.length === 0,
    errors,
    warnings,
    requiredFieldsMissing
  };
}

/**
 * Parses event date/time string into structured format
 * Wrapper around parseNaturalDateTime with event-specific logic
 * 
 * @param dateTimeString - Date/time string from LLM
 * @returns Parsed date/time information
 */
export function parseEventDateTime(dateTimeString: string): ParsedDateTime {
  if (!dateTimeString || dateTimeString === 'Not found') {
    return {
      date: null,
      startTime: null,
      endTime: null,
      isAllDay: false,
      raw: dateTimeString
    };
  }

  return parseNaturalDateTime(dateTimeString);
}

/**
 * Matches event location against known venues
 * 
 * @param location - Location string from LLM
 * @param venues - Available venues
 * @param threshold - Minimum match score
 * @returns Venue match result
 */
export function matchEventVenue(
  location: string, 
  venues: Venue[], 
  threshold: number = 70
): VenueMatchResult {
  if (!location || location === 'Not found' || venues.length === 0) {
    return {
      venue: null,
      score: 0,
      matchType: 'none',
      matchedField: 'none'
    };
  }

  return findBestVenueMatch(location, venues, threshold);
}

/**
 * Validates and filters event categories
 * 
 * @param categories - Raw categories from LLM
 * @returns Valid event categories
 */
function validateCategories(categories: string[]): EventCategory[] {
  const validCategories: EventCategory[] = [
    'music', 'sports', 'arts', 'community', 'education', 'food', 
    'nightlife', 'theatre', 'comedy', 'family', 'business', 
    'charity', 'outdoor', 'other'
  ];

  return categories
    .filter(cat => validCategories.includes(cat as EventCategory))
    .slice(0, 3) as EventCategory[]; // Limit to 3 categories
}

/**
 * Processes and cleans event tags
 * 
 * @param tags - Raw tags from LLM
 * @returns Cleaned tags array
 */
function processTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0 && tag.length <= 30)
    .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
    .slice(0, 10); // Limit to 10 tags
}

/**
 * Creates a summary of processing changes made
 * 
 * @param processed - Processed event data
 * @returns Human-readable summary of changes
 */
export function createProcessingSummary(processed: ProcessedEventData): string {
  const notes = processed.processingNotes;
  
  if (notes.length === 0) {
    return 'No processing changes were needed.';
  }

  return `Made ${notes.length} improvements:\n${notes.map(note => `• ${note}`).join('\n')}`;
}