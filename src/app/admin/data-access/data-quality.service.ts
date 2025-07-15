/**
 * Data Quality Analysis Service
 * 
 * Analyzes events and venues for data quality issues and provides
 * automated suggestions for resolution
 */

import { Injectable, inject } from '@angular/core';
import { 
  DataQualityIssue, 
  DataQualityMetrics, 
  DataQualityAnalysisResult,
  DataQualityIssueType,
  ISSUE_SEVERITY_CONFIG,
  VenueMatchSuggestion,
  EventDuplicateGroup,
  BulkResolutionAction,
  DataQualityConfig
} from '../utils/data-quality.types';
import { EventModel } from '@app/events/utils/event.model';
import { Venue } from '@app/venues/utils/venue.model';
import { EventService } from '@app/events/data-access/event.service';
import { VenueService } from '@app/venues/data-access/venue.service';
import { findBestVenueMatch, VenueMatchResult } from '@shared/utils/venue-matching.utils';

@Injectable({
  providedIn: 'root'
})
export class DataQualityService {
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);

  /**
   * Default configuration for data quality analysis
   */
  private readonly defaultConfig: DataQualityConfig = {
    lowConfidenceThreshold: 70,
    duplicateSimilarityThreshold: 85,
    analyzeEvents: true,
    analyzeVenues: true,
    analyzeRelationships: true,
    enableAutoFix: false,
    autoFixTypes: ['missing-venue-id']
  };

  /**
   * Performs comprehensive data quality analysis
   */
  async analyzeDataQuality(config: Partial<DataQualityConfig> = {}): Promise<DataQualityAnalysisResult> {
    const analysisConfig = { ...this.defaultConfig, ...config };
    
    // Load all data
    const [events, venues] = await Promise.all([
      this.eventService.getAll(),
      this.venueService.getAll()
    ]);

    const issues: DataQualityIssue[] = [];
    const venueMatchSuggestions = new Map<string, VenueMatchSuggestion[]>();
    let duplicateGroups: EventDuplicateGroup[] = [];

    // Analyze events
    if (analysisConfig.analyzeEvents) {
      const eventIssues = this.analyzeEvents(events, venues);
      issues.push(...eventIssues);
    }

    // Analyze venues
    if (analysisConfig.analyzeVenues) {
      const venueIssues = this.analyzeVenues(venues, events);
      issues.push(...venueIssues);
    }

    // Analyze relationships between events and venues
    if (analysisConfig.analyzeRelationships) {
      const relationshipSuggestions = this.analyzeEventVenueRelationships(events, venues);
      relationshipSuggestions.forEach((suggestions, eventId) => {
        venueMatchSuggestions.set(eventId, suggestions);
      });
    }

    // Detect duplicate events
    duplicateGroups = this.detectDuplicateEvents(events, analysisConfig.duplicateSimilarityThreshold);

    // Generate metrics
    const metrics = this.calculateMetrics(events, venues, issues, duplicateGroups);

    // Generate bulk actions
    const bulkActions = this.generateBulkActions(issues, venueMatchSuggestions, duplicateGroups);

    return {
      metrics,
      issues,
      venueMatchSuggestions,
      duplicateGroups,
      bulkActions,
      analyzedAt: new Date()
    };
  }

  /**
   * Analyzes events for data quality issues
   */
  private analyzeEvents(events: EventModel[], venues: Venue[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];

    events.forEach(event => {
      // Check for missing venue ID
      if (event.location && !event.venueId) {
        issues.push(this.createIssue(
          'missing-venue-id',
          event.id,
          'event',
          'Event has location but no venue reference',
          `Event "${event.title}" has location "${event.location}" but no venueId assigned.`,
          'Link this event to an existing venue or create a new venue.',
          { location: event.location }
        ));
      }

      // Check for venue not found
      if (event.venueId && !venues.find(v => v.id === event.venueId)) {
        issues.push(this.createIssue(
          'venue-not-found',
          event.id,
          'event',
          'Referenced venue does not exist',
          `Event "${event.title}" references venue ID "${event.venueId}" which was not found.`,
          'Update the venue reference or remove the venueId.',
          { venueId: event.venueId }
        ));
      }

      // Check for low scanner confidence
      if (event.scannerConfidence && event.scannerConfidence < 70) {
        issues.push(this.createIssue(
          'low-scanner-confidence',
          event.id,
          'event',
          'Low AI extraction confidence',
          `Event "${event.title}" was scanned with ${event.scannerConfidence}% confidence.`,
          'Review and manually verify the extracted event data.',
          { confidence: event.scannerConfidence }
        ));
      }

      // Check for missing categories
      if (!event.categories || event.categories.length === 0) {
        issues.push(this.createIssue(
          'missing-event-category',
          event.id,
          'event',
          'Event lacks categorization',
          `Event "${event.title}" has no categories assigned.`,
          'Add appropriate categories to improve discoverability.',
          {}
        ));
      }

      // Check for missing description
      if (!event.description || event.description.trim().length === 0) {
        issues.push(this.createIssue(
          'missing-event-description',
          event.id,
          'event',
          'Event lacks description',
          `Event "${event.title}" has no description.`,
          'Add a detailed description to provide more information.',
          {}
        ));
      }

      // Check for invalid date format
      if (!this.isValidDate(event.date)) {
        issues.push(this.createIssue(
          'invalid-date-format',
          event.id,
          'event',
          'Invalid date format',
          `Event "${event.title}" has invalid date: "${event.date}".`,
          'Correct the date format to YYYY-MM-DD.',
          { invalidDate: event.date }
        ));
      }
    });

    return issues;
  }

  /**
   * Analyzes venues for data quality issues
   */
  private analyzeVenues(venues: Venue[], events: EventModel[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const usedVenueIds = new Set(events.map(e => e.venueId).filter(Boolean));

    venues.forEach(venue => {
      // Check for missing coordinates
      if (!venue.geo || !venue.geo.lat || !venue.geo.lng) {
        issues.push(this.createIssue(
          'missing-venue-coordinates',
          venue.id,
          'venue',
          'Venue missing coordinates',
          `Venue "${venue.name}" lacks geographic coordinates.`,
          'Add latitude and longitude coordinates for distance calculations.',
          { address: venue.address }
        ));
      }

      // Check for orphaned venues
      if (!usedVenueIds.has(venue.id)) {
        issues.push(this.createIssue(
          'orphaned-venue',
          venue.id,
          'venue',
          'Unused venue',
          `Venue "${venue.name}" is not referenced by any events.`,
          'Consider removing if no longer needed or link to relevant events.',
          {}
        ));
      }
    });

    return issues;
  }

  /**
   * Analyzes relationships between events and venues for better matching
   */
  private analyzeEventVenueRelationships(events: EventModel[], venues: Venue[]): Map<string, VenueMatchSuggestion[]> {
    const suggestions = new Map<string, VenueMatchSuggestion[]>();

    events.forEach(event => {
      if (event.location && !event.venueId) {
        const matches = this.findVenueMatches(event.location, venues);
        if (matches.length > 0) {
          suggestions.set(event.id, matches);
        }
      }
    });

    return suggestions;
  }

  /**
   * Finds potential venue matches for a location string
   */
  private findVenueMatches(location: string, venues: Venue[]): VenueMatchSuggestion[] {
    const matches: VenueMatchSuggestion[] = [];

    // Use existing venue matching utility
    const bestMatch = findBestVenueMatch(location, venues, 50); // Lower threshold for suggestions

    if (bestMatch.venue && bestMatch.score > 0) {
      matches.push({
        venue: bestMatch.venue,
        confidence: bestMatch.score,
        matchType: bestMatch.matchType,
        matchReason: this.getMatchReason(bestMatch)
      });
    }

    // Find additional potential matches with lower scores
    venues.forEach(venue => {
      if (venue.id === bestMatch.venue?.id) return; // Skip the best match

      const match = findBestVenueMatch(location, [venue], 30);
      if (match.venue && match.score > 30) {
        matches.push({
          venue: match.venue,
          confidence: match.score,
          matchType: match.matchType,
          matchReason: this.getMatchReason(match)
        });
      }
    });

    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 matches
  }

  /**
   * Detects potential duplicate events
   */
  private detectDuplicateEvents(events: EventModel[], threshold: number): EventDuplicateGroup[] {
    const duplicateGroups: EventDuplicateGroup[] = [];
    const processed = new Set<string>();

    events.forEach(event => {
      if (processed.has(event.id)) return;

      const duplicates = events.filter(otherEvent => 
        otherEvent.id !== event.id && 
        !processed.has(otherEvent.id) &&
        this.calculateEventSimilarity(event, otherEvent) >= threshold
      );

      if (duplicates.length > 0) {
        const group: EventDuplicateGroup = {
          id: `dup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          events: [event, ...duplicates],
          similarity: Math.max(...duplicates.map(d => this.calculateEventSimilarity(event, d))),
          conflictFields: this.getConflictFields(event, duplicates[0]),
          suggestedMergeTarget: this.selectMergeTarget([event, ...duplicates])
        };

        duplicateGroups.push(group);
        [event, ...duplicates].forEach(e => processed.add(e.id));
      }
    });

    return duplicateGroups;
  }

  /**
   * Calculates similarity between two events
   */
  private calculateEventSimilarity(event1: EventModel, event2: EventModel): number {
    let similarityScore = 0;
    let totalWeight = 0;

    // Title similarity (weight: 40)
    const titleSimilarity = this.calculateStringSimilarity(event1.title, event2.title);
    similarityScore += titleSimilarity * 40;
    totalWeight += 40;

    // Date similarity (weight: 30)
    const dateSimilarity = event1.date === event2.date ? 100 : 0;
    similarityScore += dateSimilarity * 30;
    totalWeight += 30;

    // Location/Venue similarity (weight: 20)
    let locationSimilarity = 0;
    if (event1.venueId && event2.venueId) {
      locationSimilarity = event1.venueId === event2.venueId ? 100 : 0;
    } else if (event1.location && event2.location) {
      locationSimilarity = this.calculateStringSimilarity(event1.location, event2.location);
    }
    similarityScore += locationSimilarity * 20;
    totalWeight += 20;

    // Time similarity (weight: 10)
    const timeSimilarity = event1.startTime === event2.startTime ? 100 : 0;
    similarityScore += timeSimilarity * 10;
    totalWeight += 10;

    return totalWeight > 0 ? similarityScore / totalWeight : 0;
  }

  /**
   * Calculates string similarity percentage
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const distance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return Math.round(((longer.length - distance) / longer.length) * 100);
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculates comprehensive data quality metrics
   */
  private calculateMetrics(
    events: EventModel[], 
    venues: Venue[], 
    issues: DataQualityIssue[],
    duplicateGroups: EventDuplicateGroup[]
  ): DataQualityMetrics {
    const issuesByType = {} as Record<DataQualityIssueType, number>;
    const issuesBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    const issuesByStatus = { open: 0, in_progress: 0, resolved: 0, ignored: 0 };

    issues.forEach(issue => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity]++;
      issuesByStatus[issue.status]++;
    });

    // Calculate health score (0-100, higher is better)
    const totalPossibleIssues = events.length * 5 + venues.length * 2; // Rough estimate
    const actualIssues = issues.filter(i => i.status === 'open').length;
    const healthScore = Math.max(0, Math.round((1 - actualIssues / totalPossibleIssues) * 100));

    return {
      totalEvents: events.length,
      totalVenues: venues.length,
      issuesByType,
      issuesBySeverity,
      issuesByStatus,
      overallHealthScore: healthScore,
      eventsWithoutVenueId: events.filter(e => e.location && !e.venueId).length,
      venuesWithoutCoordinates: venues.filter(v => !v.geo?.lat || !v.geo?.lng).length,
      duplicateEventCount: duplicateGroups.reduce((sum, group) => sum + group.events.length, 0),
      lowConfidenceEvents: events.filter(e => e.scannerConfidence && e.scannerConfidence < 70).length,
      lastAnalyzed: new Date(),
      issuesResolvedToday: 0, // TODO: Implement resolution tracking
      issuesResolvedThisWeek: 0
    };
  }

  /**
   * Generates bulk resolution actions based on analysis results
   */
  private generateBulkActions(
    issues: DataQualityIssue[],
    venueMatchSuggestions: Map<string, VenueMatchSuggestion[]>,
    duplicateGroups: EventDuplicateGroup[]
  ): BulkResolutionAction[] {
    const actions: BulkResolutionAction[] = [];

    // Auto-assign venues with high confidence matches
    const highConfidenceMatches = Array.from(venueMatchSuggestions.entries())
      .filter(([, suggestions]) => suggestions[0]?.confidence >= 90);

    if (highConfidenceMatches.length > 0) {
      actions.push({
        id: 'auto-assign-high-confidence-venues',
        name: 'Auto-assign High-Confidence Venues',
        description: `Automatically assign venues to ${highConfidenceMatches.length} events with 90%+ confidence matches`,
        issueTypes: ['missing-venue-id'],
        estimatedAffectedCount: highConfidenceMatches.length,
        requiresConfirmation: true,
        action: 'assign-venue'
      });
    }

    // Merge duplicate events
    if (duplicateGroups.length > 0) {
      actions.push({
        id: 'merge-duplicate-events',
        name: 'Merge Duplicate Events',
        description: `Merge ${duplicateGroups.length} groups of duplicate events`,
        issueTypes: ['duplicate-event'],
        estimatedAffectedCount: duplicateGroups.reduce((sum, group) => sum + group.events.length - 1, 0),
        requiresConfirmation: true,
        action: 'merge-duplicates'
      });
    }

    return actions;
  }

  /**
   * Helper methods
   */
  private createIssue(
    type: DataQualityIssueType,
    entityId: string,
    entityType: 'event' | 'venue',
    title: string,
    description: string,
    suggestedFix: string,
    metadata: Record<string, any>
  ): DataQualityIssue {
    return {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: ISSUE_SEVERITY_CONFIG[type],
      status: 'open',
      affectedEntityId: entityId,
      affectedEntityType: entityType,
      title,
      description,
      suggestedFix,
      autoFixAvailable: type === 'missing-venue-id',
      detectedAt: new Date(),
      metadata
    };
  }

  private getMatchReason(match: VenueMatchResult): string {
    switch (match.matchType) {
      case 'exact': return `Exact match on ${match.matchedField}`;
      case 'partial': return `Partial match on ${match.matchedField}`;
      case 'keyword': return `Keyword match on ${match.matchedField}`;
      case 'fuzzy': return `Fuzzy match on ${match.matchedField}`;
      default: return 'Unknown match type';
    }
  }

  private getConflictFields(event1: EventModel, event2: EventModel): string[] {
    const conflicts: string[] = [];
    
    if (event1.title !== event2.title) conflicts.push('title');
    if (event1.description !== event2.description) conflicts.push('description');
    if (event1.startTime !== event2.startTime) conflicts.push('startTime');
    if (event1.endTime !== event2.endTime) conflicts.push('endTime');
    if (event1.location !== event2.location) conflicts.push('location');
    if (event1.organizer !== event2.organizer) conflicts.push('organizer');

    return conflicts;
  }

  private selectMergeTarget(events: EventModel[]): EventModel {
    // Prefer the event with the most complete data
    return events.reduce((best, current) => {
      const bestScore = this.calculateCompletenessScore(best);
      const currentScore = this.calculateCompletenessScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateCompletenessScore(event: EventModel): number {
    let score = 0;
    if (event.description) score += 20;
    if (event.venueId) score += 25;
    if (event.startTime) score += 15;
    if (event.endTime) score += 10;
    if (event.organizer) score += 10;
    if (event.website) score += 10;
    if (event.categories?.length) score += 10;
    return score;
  }

  private isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  }
}