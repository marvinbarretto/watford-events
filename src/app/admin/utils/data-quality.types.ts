/**
 * Data Quality Types and Models
 * 
 * Type definitions for data quality issues, metrics, and resolutions
 * Used throughout the admin data quality management system
 */

import { EventModel } from '@app/events/utils/event.model';
import { Venue } from '@app/venues/utils/venue.model';

/**
 * Types of data quality issues that can be detected
 */
export type DataQualityIssueType = 
  | 'missing-venue-id'
  | 'venue-not-found'
  | 'missing-venue-coordinates'
  | 'duplicate-event'
  | 'orphaned-venue'
  | 'inconsistent-venue-name'
  | 'missing-event-category'
  | 'low-scanner-confidence'
  | 'missing-event-description'
  | 'invalid-date-format';

/**
 * Severity levels for data quality issues
 */
export type DataQualityIssueSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Status of data quality issue resolution
 */
export type DataQualityIssueStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

/**
 * Individual data quality issue
 */
export interface DataQualityIssue {
  id: string;
  type: DataQualityIssueType;
  severity: DataQualityIssueSeverity;
  status: DataQualityIssueStatus;
  
  // Context information
  affectedEntityId: string; // Event ID, Venue ID, etc.
  affectedEntityType: 'event' | 'venue';
  
  // Issue details
  title: string;
  description: string;
  
  // Resolution information
  suggestedFix?: string;
  autoFixAvailable: boolean;
  
  // Metadata
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string; // User UID
  
  // Additional context data
  metadata?: Record<string, any>;
}

/**
 * Venue matching suggestion for resolving venue-related issues
 */
export interface VenueMatchSuggestion {
  venue: Venue;
  confidence: number; // 0-100
  matchType: 'exact' | 'partial' | 'fuzzy' | 'keyword' | 'none';
  matchReason: string;
}

/**
 * Event duplicate detection result
 */
export interface EventDuplicateGroup {
  id: string;
  events: EventModel[];
  similarity: number; // 0-100
  conflictFields: string[];
  suggestedMergeTarget?: EventModel;
}

/**
 * Data quality metrics overview
 */
export interface DataQualityMetrics {
  totalEvents: number;
  totalVenues: number;
  
  // Issue counts by type
  issuesByType: Record<DataQualityIssueType, number>;
  issuesBySeverity: Record<DataQualityIssueSeverity, number>;
  issuesByStatus: Record<DataQualityIssueStatus, number>;
  
  // Overall health score (0-100)
  overallHealthScore: number;
  
  // Specific metrics
  eventsWithoutVenueId: number;
  venuesWithoutCoordinates: number;
  duplicateEventCount: number;
  lowConfidenceEvents: number;
  
  // Improvement tracking
  lastAnalyzed: Date;
  issuesResolvedToday: number;
  issuesResolvedThisWeek: number;
}

/**
 * Data quality analysis configuration
 */
export interface DataQualityConfig {
  // Thresholds
  lowConfidenceThreshold: number; // Scanner confidence below this is flagged
  duplicateSimilarityThreshold: number; // Similarity above this suggests duplicates
  
  // Analysis settings
  analyzeEvents: boolean;
  analyzeVenues: boolean;
  analyzeRelationships: boolean;
  
  // Auto-fix settings
  enableAutoFix: boolean;
  autoFixTypes: DataQualityIssueType[];
}

/**
 * Bulk resolution action
 */
export interface BulkResolutionAction {
  id: string;
  name: string;
  description: string;
  issueTypes: DataQualityIssueType[];
  estimatedAffectedCount: number;
  requiresConfirmation: boolean;
  action: 'auto-fix' | 'assign-venue' | 'merge-duplicates' | 'ignore';
}

/**
 * Data quality analysis result
 */
export interface DataQualityAnalysisResult {
  metrics: DataQualityMetrics;
  issues: DataQualityIssue[];
  venueMatchSuggestions: Map<string, VenueMatchSuggestion[]>; // Event ID -> suggestions
  duplicateGroups: EventDuplicateGroup[];
  bulkActions: BulkResolutionAction[];
  analyzedAt: Date;
}

/**
 * Helper constants for issue categorization
 */
export const ISSUE_SEVERITY_CONFIG: Record<DataQualityIssueType, DataQualityIssueSeverity> = {
  'missing-venue-id': 'high',
  'venue-not-found': 'critical',
  'missing-venue-coordinates': 'medium',
  'duplicate-event': 'high',
  'orphaned-venue': 'low',
  'inconsistent-venue-name': 'medium',
  'missing-event-category': 'low',
  'low-scanner-confidence': 'medium',
  'missing-event-description': 'low',
  'invalid-date-format': 'high'
};

/**
 * Issue type display information
 */
export const ISSUE_TYPE_INFO: Record<DataQualityIssueType, { 
  title: string; 
  description: string; 
  icon: string;
  color: string;
}> = {
  'missing-venue-id': {
    title: 'Missing Venue Reference',
    description: 'Event has location text but no linked venue',
    icon: '📍',
    color: '#f59e0b'
  },
  'venue-not-found': {
    title: 'Venue Not Found',
    description: 'Event references a venue that doesn\'t exist',
    icon: '❌',
    color: '#ef4444'
  },
  'missing-venue-coordinates': {
    title: 'Missing Coordinates',
    description: 'Venue exists but lacks geographic coordinates',
    icon: '🗺️',
    color: '#f59e0b'
  },
  'duplicate-event': {
    title: 'Duplicate Event',
    description: 'Similar events detected that might be duplicates',
    icon: '👥',
    color: '#f59e0b'
  },
  'orphaned-venue': {
    title: 'Unused Venue',
    description: 'Venue exists but no events reference it',
    icon: '🏢',
    color: '#6b7280'
  },
  'inconsistent-venue-name': {
    title: 'Venue Name Mismatch',
    description: 'Event location text doesn\'t match linked venue name',
    icon: '📝',
    color: '#f59e0b'
  },
  'missing-event-category': {
    title: 'No Category',
    description: 'Event lacks categorization for better discovery',
    icon: '🏷️',
    color: '#6b7280'
  },
  'low-scanner-confidence': {
    title: 'Low AI Confidence',
    description: 'Event was scanned with low confidence, needs review',
    icon: '🤖',
    color: '#f59e0b'
  },
  'missing-event-description': {
    title: 'No Description',
    description: 'Event lacks detailed description',
    icon: '📄',
    color: '#6b7280'
  },
  'invalid-date-format': {
    title: 'Invalid Date',
    description: 'Event has malformed or invalid date information',
    icon: '📅',
    color: '#ef4444'
  }
};

/**
 * Severity level styling information
 */
export const SEVERITY_INFO: Record<DataQualityIssueSeverity, {
  label: string;
  color: string;
  priority: number;
}> = {
  'critical': { label: 'Critical', color: '#dc2626', priority: 1 },
  'high': { label: 'High', color: '#ea580c', priority: 2 },
  'medium': { label: 'Medium', color: '#d97706', priority: 3 },
  'low': { label: 'Low', color: '#65a30d', priority: 4 }
};