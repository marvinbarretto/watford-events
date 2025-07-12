import { Validators } from '@angular/forms';
import { EVENT_CATEGORIES, EVENT_CATEGORY_SETTINGS } from './event.model';

/**
 * Event Form Configuration
 * 
 * Centralized configuration for event form fields,
 * validation rules, and metadata
 */

export interface FormFieldConfig {
  name: string;
  initialValue: any;
  validators: any[];
  label: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'date' | 'time' | 'email' | 'url' | 'multi-select' | 'tag-input';
  autoFillable: boolean;
  confidenceField?: string; // Maps to confidence object key if different from field name
  options?: { value: any; label: string; description?: string }[]; // For multi-select fields
  helpText?: string; // Additional help text for the field
}

export const EVENT_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'title',
    initialValue: '',
    validators: [Validators.required],
    label: 'Event Title',
    placeholder: 'Enter event title',
    type: 'text',
    autoFillable: true
  },
  {
    name: 'description',
    initialValue: '',
    validators: [],
    label: 'Description',
    placeholder: 'Enter event description',
    type: 'textarea',
    autoFillable: true
  },
  {
    name: 'date',
    initialValue: '',
    validators: [Validators.required],
    label: 'Event Date',
    placeholder: '',
    type: 'date',
    autoFillable: true,
    confidenceField: 'date' // Both date and time use 'date' confidence
  },
  {
    name: 'time',
    initialValue: '',
    validators: [Validators.required],
    label: 'Event Time',
    placeholder: '',
    type: 'time',
    autoFillable: true,
    confidenceField: 'date' // Both date and time use 'date' confidence
  },
  {
    name: 'location',
    initialValue: '',
    validators: [Validators.required],
    label: 'Location',
    placeholder: 'Enter event location',
    type: 'text',
    autoFillable: true
  },
  {
    name: 'organizer',
    initialValue: '',
    validators: [],
    label: 'Organizer',
    placeholder: 'Event organizer',
    type: 'text',
    autoFillable: true
  },
  {
    name: 'ticketInfo',
    initialValue: '',
    validators: [],
    label: 'Ticket Information',
    placeholder: 'Ticket prices and purchase info',
    type: 'text',
    autoFillable: true
  },
  {
    name: 'contactInfo',
    initialValue: '',
    validators: [],
    label: 'Contact Information',
    placeholder: 'Phone, email, or contact details',
    type: 'text',
    autoFillable: true
  },
  {
    name: 'website',
    initialValue: '',
    validators: [],
    label: 'Website/Social Media',
    placeholder: 'Website or social media links',
    type: 'url',
    autoFillable: true
  },
  {
    name: 'categories',
    initialValue: [],
    validators: [],
    label: 'Categories',
    placeholder: 'Select up to 3 categories',
    type: 'multi-select',
    autoFillable: true,
    options: EVENT_CATEGORIES,
    helpText: `Select up to ${EVENT_CATEGORY_SETTINGS.MAX_CATEGORIES_PER_EVENT} categories that best describe your event`
  },
  {
    name: 'tags',
    initialValue: [],
    validators: [],
    label: 'Tags',
    placeholder: 'Add custom tags...',
    type: 'tag-input',
    autoFillable: true,
    helpText: `Add up to ${EVENT_CATEGORY_SETTINGS.MAX_TAGS_PER_EVENT} custom tags to help people find your event`
  }
];

/**
 * Get form field configuration by field name
 */
export function getFieldConfig(fieldName: string): FormFieldConfig | undefined {
  return EVENT_FORM_FIELDS.find(field => field.name === fieldName);
}

/**
 * Get all auto-fillable field names
 */
export function getAutoFillableFields(): string[] {
  return EVENT_FORM_FIELDS
    .filter(field => field.autoFillable)
    .map(field => field.name);
}

/**
 * Get all required field names
 */
export function getRequiredFields(): string[] {
  return EVENT_FORM_FIELDS
    .filter(field => field.validators.includes(Validators.required))
    .map(field => field.name);
}

/**
 * Build form group configuration object for FormBuilder
 */
export function buildFormGroupConfig(): Record<string, any> {
  const config: Record<string, any> = {};
  
  EVENT_FORM_FIELDS.forEach(field => {
    config[field.name] = [field.initialValue, field.validators];
  });
  
  return config;
}