import { EventConfidence } from '../../shared/utils/event-extraction-types';

/**
 * Confidence Score Utilities
 * 
 * Functions for working with confidence scores from LLM extraction
 */

// Default confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
  MINIMUM_AUTOFILL: 50 // Minimum confidence required for auto-filling a field
} as const;

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

/**
 * Get confidence score for a specific field
 */
export function getFieldConfidence(
  confidence: EventConfidence | undefined,
  fieldName: string
): number {
  if (!confidence) return 0;

  // Special handling for time field (uses date confidence)
  if (fieldName === 'time') {
    return confidence.date || 0;
  }

  return confidence[fieldName as keyof EventConfidence] || 0;
}

/**
 * Determine confidence level based on score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  if (score >= CONFIDENCE_THRESHOLDS.LOW) return 'low';
  return 'none';
}

/**
 * Check if a field should be auto-filled based on confidence
 */
export function shouldAutoFillField(
  confidence: number,
  threshold: number = CONFIDENCE_THRESHOLDS.MINIMUM_AUTOFILL
): boolean {
  return confidence >= threshold;
}

/**
 * Get CSS class for confidence badge
 */
export function getConfidenceBadgeClass(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high':
      return 'confidence-high';
    case 'medium':
      return 'confidence-medium';
    case 'low':
      return 'confidence-low';
    default:
      return 'confidence-none';
  }
}

/**
 * Format confidence score for display
 */
export function formatConfidenceScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Calculate weighted average confidence for multiple fields
 */
export function calculateWeightedConfidence(
  confidence: EventConfidence,
  weights?: Record<string, number>
): number {
  const defaultWeights = {
    title: 2.0,      // Title is most important
    date: 1.5,       // Date is very important
    location: 1.5,   // Location is very important
    description: 1.0,
    organizer: 0.8,
    ticketInfo: 0.8,
    contactInfo: 0.7,
    website: 0.7
  };

  const fieldWeights = weights || defaultWeights;
  let totalWeight = 0;
  let weightedSum = 0;

  Object.entries(fieldWeights).forEach(([field, weight]) => {
    const fieldConfidence = confidence[field as keyof EventConfidence] || 0;
    weightedSum += fieldConfidence * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get fields with low confidence that might need user review
 */
export function getFieldsNeedingReview(
  confidence: EventConfidence,
  threshold: number = CONFIDENCE_THRESHOLDS.MEDIUM
): string[] {
  const fieldsToReview: string[] = [];

  Object.entries(confidence).forEach(([field, score]) => {
    if (field !== 'overall' && score < threshold && score > 0) {
      fieldsToReview.push(field);
    }
  });

  return fieldsToReview;
}

/**
 * Create a confidence summary message
 */
export function createConfidenceSummary(confidence: EventConfidence): string {
  const overall = confidence.overall || 0;
  const level = getConfidenceLevel(overall);
  
  switch (level) {
    case 'high':
      return 'High confidence extraction - data looks accurate';
    case 'medium':
      return 'Medium confidence - please review the extracted data';
    case 'low':
      return 'Low confidence - manual verification recommended';
    default:
      return 'Unable to extract data with confidence';
  }
}

/**
 * Check if extraction has minimum viable confidence
 */
export function hasViableExtraction(
  confidence: EventConfidence,
  requiredFields: string[] = ['title', 'date', 'location']
): boolean {
  return requiredFields.every(field => {
    const fieldConfidence = getFieldConfidence(confidence, field);
    return fieldConfidence >= CONFIDENCE_THRESHOLDS.MINIMUM_AUTOFILL;
  });
}