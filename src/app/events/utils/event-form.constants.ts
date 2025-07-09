/**
 * Event Form Constants
 * 
 * Centralized constants for event form configuration,
 * field names, and other shared values
 */

// Form field names as constants to avoid magic strings
export const FORM_FIELDS = {
  TITLE: 'title',
  DESCRIPTION: 'description',
  DATE: 'date',
  TIME: 'time',
  LOCATION: 'location',
  ORGANIZER: 'organizer',
  TICKET_INFO: 'ticketInfo',
  CONTACT_INFO: 'contactInfo',
  WEBSITE: 'website'
} as const;

// Event status types
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
} as const;

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_TIME: 'Please enter a valid time',
  FORM_INVALID: 'Please fill in all required fields'
} as const;

// Default form values
export const DEFAULT_FORM_VALUES = {
  [FORM_FIELDS.TITLE]: '',
  [FORM_FIELDS.DESCRIPTION]: '',
  [FORM_FIELDS.DATE]: '',
  [FORM_FIELDS.TIME]: '',
  [FORM_FIELDS.LOCATION]: '',
  [FORM_FIELDS.ORGANIZER]: '',
  [FORM_FIELDS.TICKET_INFO]: '',
  [FORM_FIELDS.CONTACT_INFO]: '',
  [FORM_FIELDS.WEBSITE]: ''
} as const;

// Field labels for display
export const FIELD_LABELS = {
  [FORM_FIELDS.TITLE]: 'Event Title',
  [FORM_FIELDS.DESCRIPTION]: 'Description',
  [FORM_FIELDS.DATE]: 'Event Date',
  [FORM_FIELDS.TIME]: 'Event Time',
  [FORM_FIELDS.LOCATION]: 'Location',
  [FORM_FIELDS.ORGANIZER]: 'Organizer',
  [FORM_FIELDS.TICKET_INFO]: 'Ticket Information',
  [FORM_FIELDS.CONTACT_INFO]: 'Contact Information',
  [FORM_FIELDS.WEBSITE]: 'Website/Social Media'
} as const;

// Field placeholders
export const FIELD_PLACEHOLDERS = {
  [FORM_FIELDS.TITLE]: 'Enter event title',
  [FORM_FIELDS.DESCRIPTION]: 'Enter event description',
  [FORM_FIELDS.DATE]: '',
  [FORM_FIELDS.TIME]: '',
  [FORM_FIELDS.LOCATION]: 'Enter event location',
  [FORM_FIELDS.ORGANIZER]: 'Event organizer',
  [FORM_FIELDS.TICKET_INFO]: 'Ticket prices and purchase info',
  [FORM_FIELDS.CONTACT_INFO]: 'Phone, email, or contact details',
  [FORM_FIELDS.WEBSITE]: 'Website or social media links'
} as const;

// Required fields list
export const REQUIRED_FIELDS = [
  FORM_FIELDS.TITLE,
  FORM_FIELDS.DATE,
  FORM_FIELDS.TIME,
  FORM_FIELDS.LOCATION
] as const;

// Auto-fillable fields from LLM extraction
export const AUTO_FILLABLE_FIELDS = [
  FORM_FIELDS.TITLE,
  FORM_FIELDS.DESCRIPTION,
  FORM_FIELDS.DATE,
  FORM_FIELDS.TIME,
  FORM_FIELDS.LOCATION,
  FORM_FIELDS.ORGANIZER,
  FORM_FIELDS.TICKET_INFO,
  FORM_FIELDS.CONTACT_INFO,
  FORM_FIELDS.WEBSITE
] as const;

// Field input types
export const FIELD_TYPES = {
  [FORM_FIELDS.TITLE]: 'text',
  [FORM_FIELDS.DESCRIPTION]: 'textarea',
  [FORM_FIELDS.DATE]: 'date',
  [FORM_FIELDS.TIME]: 'time',
  [FORM_FIELDS.LOCATION]: 'text',
  [FORM_FIELDS.ORGANIZER]: 'text',
  [FORM_FIELDS.TICKET_INFO]: 'text',
  [FORM_FIELDS.CONTACT_INFO]: 'text',
  [FORM_FIELDS.WEBSITE]: 'url'
} as const;

// LLM processing constants
export const LLM_CONSTANTS = {
  MODEL_NAME: 'gemini-1.5-flash',
  DEFAULT_PROCESSING_TIME: 0,
  NOT_FOUND_VALUE: 'Not found'
} as const;

// UI constants
export const UI_CONSTANTS = {
  SPINNER_SIZE: {
    SMALL: 24,
    MEDIUM: 40,
    LARGE: 60
  },
  ANIMATION_DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  }
} as const;