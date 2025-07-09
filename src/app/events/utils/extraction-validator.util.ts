import { EventExtractionResult, EventData, EventConfidence } from '../../shared/utils/event-extraction-types';
import { CONFIDENCE_THRESHOLDS } from './confidence-score.util';
import { LLM_CONSTANTS, REQUIRED_FIELDS } from './event-form.constants';

/**
 * Extraction Result Validation Utilities
 * 
 * Functions for validating LLM extraction results
 * and determining data quality
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedFieldCount: number;
  confidenceScore: number;
}

/**
 * Validate extraction result comprehensively
 */
export function validateExtractionResult(result: EventExtractionResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let extractedFieldCount = 0;
  let confidenceScore = 0;

  // Check if extraction was successful
  if (!result.success) {
    errors.push(result.error || 'Extraction failed');
    return {
      isValid: false,
      errors,
      warnings,
      extractedFieldCount: 0,
      confidenceScore: 0
    };
  }

  // Validate event data exists
  if (!result.eventData) {
    errors.push('No event data found in extraction result');
    return {
      isValid: false,
      errors,
      warnings,
      extractedFieldCount: 0,
      confidenceScore: 0
    };
  }

  // Validate confidence data exists
  if (!result.confidence) {
    warnings.push('No confidence scores available');
  } else {
    confidenceScore = result.confidence.overall || 0;
  }

  // Count extracted fields
  extractedFieldCount = countExtractedFields(result.eventData);

  // Validate required fields
  const requiredFieldValidation = validateRequiredFields(result.eventData, result.confidence);
  errors.push(...requiredFieldValidation.errors);
  warnings.push(...requiredFieldValidation.warnings);

  // Validate data quality
  const qualityValidation = validateDataQuality(result.eventData, result.confidence);
  warnings.push(...qualityValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    extractedFieldCount,
    confidenceScore
  };
}

/**
 * Check if extraction has minimum viable data
 */
export function hasMinimumViableData(result: EventExtractionResult): boolean {
  if (!result.success || !result.eventData || !result.confidence) {
    return false;
  }

  // Check if at least one required field has good confidence
  const requiredFieldsWithGoodConfidence = REQUIRED_FIELDS.filter(field => {
    const fieldValue = result.eventData![field as keyof EventData];
    const fieldConfidence = result.confidence![field as keyof EventConfidence] || 0;
    
    return isValidFieldValue(fieldValue) && 
           fieldConfidence >= CONFIDENCE_THRESHOLDS.MINIMUM_AUTOFILL;
  });

  return requiredFieldsWithGoodConfidence.length >= 2; // At least 2 required fields
}

/**
 * Check if a field value is valid (not empty or "Not found")
 */
export function isValidFieldValue(value: any): boolean {
  return (
    value !== null && 
    value !== undefined && 
    value !== '' && 
    value !== LLM_CONSTANTS.NOT_FOUND_VALUE
  );
}

/**
 * Count how many fields have valid extracted data
 */
export function countExtractedFields(eventData: EventData): number {
  const allFields = [
    'title', 'description', 'date', 'location', 
    'organizer', 'ticketInfo', 'contactInfo', 'website'
  ] as const;

  return allFields.filter(field => 
    isValidFieldValue(eventData[field])
  ).length;
}

/**
 * Validate required fields have adequate data
 */
function validateRequiredFields(
  eventData: EventData, 
  confidence?: EventConfidence
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check each required field
  REQUIRED_FIELDS.forEach(field => {
    const value = eventData[field as keyof EventData];
    const fieldConfidence = confidence?.[field as keyof EventConfidence] || 0;

    if (!isValidFieldValue(value)) {
      errors.push(`Required field '${field}' has no valid data`);
    } else if (fieldConfidence < CONFIDENCE_THRESHOLDS.MINIMUM_AUTOFILL) {
      warnings.push(`Required field '${field}' has low confidence (${fieldConfidence}%)`);
    }
  });

  return { errors, warnings };
}

/**
 * Validate overall data quality
 */
function validateDataQuality(
  eventData: EventData, 
  confidence?: EventConfidence
): { warnings: string[] } {
  const warnings: string[] = [];

  // Check for suspiciously low overall confidence
  if (confidence?.overall && confidence.overall < CONFIDENCE_THRESHOLDS.LOW) {
    warnings.push(`Overall confidence is very low (${confidence.overall}%)`);
  }

  // Check for missing optional but useful fields
  if (!isValidFieldValue(eventData.description)) {
    warnings.push('No event description found - consider adding manually');
  }

  if (!isValidFieldValue(eventData.organizer)) {
    warnings.push('No organizer information found');
  }

  // Validate date format if present
  if (isValidFieldValue(eventData.date)) {
    const dateValidation = validateDateField(eventData.date);
    if (!dateValidation.isValid) {
      warnings.push(`Date format may be problematic: ${eventData.date}`);
    }
  }

  return { warnings };
}

/**
 * Basic date field validation
 */
function validateDateField(dateString: string): { isValid: boolean; reason?: string } {
  // Check for common date indicators
  const hasYear = /\d{4}/.test(dateString);
  const hasMonth = /\d{1,2}/.test(dateString) || 
                   /january|february|march|april|may|june|july|august|september|october|november|december/i.test(dateString);
  const hasDay = /\d{1,2}/.test(dateString);

  if (!hasYear) {
    return { isValid: false, reason: 'No year found' };
  }

  if (!hasMonth) {
    return { isValid: false, reason: 'No month found' };
  }

  if (!hasDay) {
    return { isValid: false, reason: 'No day found' };
  }

  return { isValid: true };
}

/**
 * Get extraction quality level
 */
export function getExtractionQuality(result: EventExtractionResult): 'excellent' | 'good' | 'fair' | 'poor' {
  const validation = validateExtractionResult(result);
  
  if (!validation.isValid) {
    return 'poor';
  }

  if (validation.confidenceScore >= CONFIDENCE_THRESHOLDS.HIGH && validation.extractedFieldCount >= 6) {
    return 'excellent';
  }

  if (validation.confidenceScore >= CONFIDENCE_THRESHOLDS.MEDIUM && validation.extractedFieldCount >= 4) {
    return 'good';
  }

  if (validation.confidenceScore >= CONFIDENCE_THRESHOLDS.LOW && validation.extractedFieldCount >= 2) {
    return 'fair';
  }

  return 'poor';
}

/**
 * Create a human-readable validation summary
 */
export function createValidationSummary(result: EventExtractionResult): string {
  const validation = validateExtractionResult(result);
  const quality = getExtractionQuality(result);

  if (!validation.isValid) {
    return `Extraction failed: ${validation.errors.join(', ')}`;
  }

  const qualityMessages = {
    excellent: `Excellent extraction quality - ${validation.extractedFieldCount} fields extracted with ${validation.confidenceScore}% confidence`,
    good: `Good extraction quality - ${validation.extractedFieldCount} fields extracted with ${validation.confidenceScore}% confidence`,
    fair: `Fair extraction quality - ${validation.extractedFieldCount} fields extracted with ${validation.confidenceScore}% confidence`,
    poor: `Poor extraction quality - manual review recommended`
  };

  return qualityMessages[quality];
}