/**
 * Data Quality Store
 * 
 * Manages data quality state using Angular signals
 * Provides computed values for dashboard insights and issue tracking
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  DataQualityAnalysisResult,
  DataQualityIssue,
  DataQualityMetrics,
  DataQualityIssueType,
  DataQualityIssueSeverity,
  DataQualityIssueStatus,
  VenueMatchSuggestion,
  EventDuplicateGroup,
  BulkResolutionAction
} from '../utils/data-quality.types';
import { DataQualityService } from './data-quality.service';

/**
 * Data Quality Store State
 */
interface DataQualityState {
  // Analysis state
  isAnalyzing: boolean;
  lastAnalysis: DataQualityAnalysisResult | null;
  analysisError: string | null;
  
  // Current data
  metrics: DataQualityMetrics | null;
  issues: DataQualityIssue[];
  venueMatchSuggestions: Map<string, VenueMatchSuggestion[]>;
  duplicateGroups: EventDuplicateGroup[];
  bulkActions: BulkResolutionAction[];
  
  // UI state
  selectedIssueTypes: DataQualityIssueType[];
  selectedSeverities: DataQualityIssueSeverity[];
  selectedStatuses: DataQualityIssueStatus[];
  searchQuery: string;
  
  // Resolution state
  resolvingIssues: Set<string>; // Issue IDs currently being resolved
  recentlyResolved: string[]; // Recently resolved issue IDs
}

/**
 * Initial state
 */
const initialState: DataQualityState = {
  isAnalyzing: false,
  lastAnalysis: null,
  analysisError: null,
  metrics: null,
  issues: [],
  venueMatchSuggestions: new Map(),
  duplicateGroups: [],
  bulkActions: [],
  selectedIssueTypes: [],
  selectedSeverities: [],
  selectedStatuses: ['open'],
  searchQuery: '',
  resolvingIssues: new Set(),
  recentlyResolved: []
};

@Injectable({ providedIn: 'root' })
export class DataQualityStore {
  // 🔧 Dependencies
  private readonly dataQualityService = inject(DataQualityService);

  // 🗂️ Private state signals
  private readonly _state = signal<DataQualityState>(initialState);

  // 📡 Public state signals
  readonly isAnalyzing = computed(() => this._state().isAnalyzing);
  readonly lastAnalysis = computed(() => this._state().lastAnalysis);
  readonly analysisError = computed(() => this._state().analysisError);
  readonly metrics = computed(() => this._state().metrics);
  readonly issues = computed(() => this._state().issues);
  readonly venueMatchSuggestions = computed(() => this._state().venueMatchSuggestions);
  readonly duplicateGroups = computed(() => this._state().duplicateGroups);
  readonly bulkActions = computed(() => this._state().bulkActions);
  readonly selectedIssueTypes = computed(() => this._state().selectedIssueTypes);
  readonly selectedSeverities = computed(() => this._state().selectedSeverities);
  readonly selectedStatuses = computed(() => this._state().selectedStatuses);
  readonly searchQuery = computed(() => this._state().searchQuery);
  readonly resolvingIssues = computed(() => this._state().resolvingIssues);
  readonly recentlyResolved = computed(() => this._state().recentlyResolved);

  // 🧮 Computed values
  /**
   * Filtered issues based on current filters and search
   */
  readonly filteredIssues = computed(() => {
    const state = this._state();
    let filtered = state.issues;
    
    // Filter by issue types
    if (state.selectedIssueTypes.length > 0) {
      filtered = filtered.filter((issue: DataQualityIssue) => 
        state.selectedIssueTypes.includes(issue.type)
      );
    }
    
    // Filter by severities
    if (state.selectedSeverities.length > 0) {
      filtered = filtered.filter((issue: DataQualityIssue) => 
        state.selectedSeverities.includes(issue.severity)
      );
    }
    
    // Filter by statuses
    if (state.selectedStatuses.length > 0) {
      filtered = filtered.filter((issue: DataQualityIssue) => 
        state.selectedStatuses.includes(issue.status)
      );
    }
    
    // Filter by search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter((issue: DataQualityIssue) => 
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.affectedEntityId.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });

  /**
   * Issues grouped by type for dashboard display
   */
  readonly issuesByType = computed(() => {
    const grouped = new Map<DataQualityIssueType, DataQualityIssue[]>();
    
    this._state().issues.forEach((issue: DataQualityIssue) => {
      if (!grouped.has(issue.type)) {
        grouped.set(issue.type, []);
      }
      grouped.get(issue.type)!.push(issue);
    });
    
    return grouped;
  });

  /**
   * Issues grouped by severity
   */
  readonly issuesBySeverity = computed(() => {
    const grouped = new Map<DataQualityIssueSeverity, DataQualityIssue[]>();
    
    this._state().issues.forEach((issue: DataQualityIssue) => {
      if (!grouped.has(issue.severity)) {
        grouped.set(issue.severity, []);
      }
      grouped.get(issue.severity)!.push(issue);
    });
    
    return grouped;
  });

  /**
   * Critical issues that need immediate attention
   */
  readonly criticalIssues = computed(() => 
    this._state().issues.filter((issue: DataQualityIssue) => 
      issue.severity === 'critical' && issue.status === 'open'
    )
  );

  /**
   * Issues that can be auto-fixed
   */
  readonly autoFixableIssues = computed(() => 
    this._state().issues.filter((issue: DataQualityIssue) => 
      issue.autoFixAvailable && issue.status === 'open'
    )
  );

  /**
   * Events with venue matching suggestions
   */
  readonly eventsWithVenueSuggestions = computed(() => {
    const suggestions = this._state().venueMatchSuggestions;
    return Array.from(suggestions.keys()).map(eventId => ({
      eventId,
      suggestions: suggestions.get(eventId) || []
    }));
  });

  /**
   * High-confidence venue matches (90%+ confidence)
   */
  readonly highConfidenceVenueMatches = computed(() => {
    const suggestions = this._state().venueMatchSuggestions;
    const highConfidence: Array<{eventId: string, suggestion: VenueMatchSuggestion}> = [];
    
    suggestions.forEach((eventSuggestions: VenueMatchSuggestion[], eventId: string) => {
      const topSuggestion = eventSuggestions[0];
      if (topSuggestion && topSuggestion.confidence >= 90) {
        highConfidence.push({ eventId, suggestion: topSuggestion });
      }
    });
    
    return highConfidence;
  });

  /**
   * Dashboard summary statistics
   */
  readonly dashboardSummary = computed(() => {
    const metrics = this._state().metrics;
    if (!metrics) return null;
    
    return {
      totalIssues: this._state().issues.length,
      openIssues: this._state().issues.filter((i: DataQualityIssue) => i.status === 'open').length,
      criticalIssues: this.criticalIssues().length,
      autoFixableIssues: this.autoFixableIssues().length,
      duplicateGroups: this._state().duplicateGroups.length,
      venueMatchOpportunities: this.eventsWithVenueSuggestions().length,
      healthScore: metrics.overallHealthScore,
      lastAnalyzed: this._state().lastAnalysis?.analyzedAt
    };
  });

  /**
   * Resolution progress tracking
   */
  readonly resolutionProgress = computed(() => {
    const total = this._state().issues.length;
    const resolved = this._state().issues.filter((i: DataQualityIssue) => i.status === 'resolved').length;
    const inProgress = this._state().issues.filter((i: DataQualityIssue) => i.status === 'in_progress').length;
    
    return {
      total,
      resolved,
      inProgress,
      open: total - resolved - inProgress,
      percentageComplete: total > 0 ? Math.round((resolved / total) * 100) : 0
    };
  });

  /**
   * Whether analysis data is stale (older than 1 hour)
   */
  readonly isAnalysisStale = computed(() => {
    const lastAnalysis = this._state().lastAnalysis;
    if (!lastAnalysis) return true;
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastAnalysis.analyzedAt < oneHourAgo;
  });

  /**
   * Quick stats for header/summary display
   */
  readonly quickStats = computed(() => ({
    healthScore: this._state().metrics?.overallHealthScore || 0,
    totalIssues: this._state().issues.length,
    criticalCount: this.criticalIssues().length,
    isAnalyzing: this._state().isAnalyzing
  }));

  // 🔧 Public methods
  /**
   * Triggers a new data quality analysis
   */
  async analyzeDataQuality(): Promise<void> {
    this._updateState({
      isAnalyzing: true,
      analysisError: null
    });

    try {
      const result = await this.dataQualityService.analyzeDataQuality();
      
      this._updateState({
        lastAnalysis: result,
        metrics: result.metrics,
        issues: result.issues,
        venueMatchSuggestions: result.venueMatchSuggestions,
        duplicateGroups: result.duplicateGroups,
        bulkActions: result.bulkActions,
        isAnalyzing: false,
        analysisError: null
      });
    } catch (error) {
      this._updateState({
        isAnalyzing: false,
        analysisError: error instanceof Error ? error.message : 'Analysis failed'
      });
      throw error;
    }
  }

  /**
   * Updates the status of a specific issue
   */
  updateIssueStatus(issueId: string, status: DataQualityIssueStatus): void {
    const currentState = this._state();
    this._updateState({
      issues: currentState.issues.map((issue: DataQualityIssue) => 
        issue.id === issueId 
          ? { ...issue, status, resolvedAt: status === 'resolved' ? new Date() : undefined }
          : issue
      ),
      recentlyResolved: status === 'resolved' 
        ? [...currentState.recentlyResolved, issueId].slice(-10) // Keep last 10
        : currentState.recentlyResolved
    });
  }

  /**
   * Marks an issue as being resolved (UI feedback)
   */
  setIssueResolving(issueId: string, isResolving: boolean): void {
    const currentState = this._state();
    const newResolvingIssues = new Set(currentState.resolvingIssues);
    if (isResolving) {
      newResolvingIssues.add(issueId);
    } else {
      newResolvingIssues.delete(issueId);
    }
    
    this._updateState({
      resolvingIssues: newResolvingIssues
    });
  }

  /**
   * Resolves multiple issues at once
   */
  resolveIssues(issueIds: string[]): void {
    const currentState = this._state();
    this._updateState({
      issues: currentState.issues.map((issue: DataQualityIssue) => 
        issueIds.includes(issue.id)
          ? { ...issue, status: 'resolved' as DataQualityIssueStatus, resolvedAt: new Date() }
          : issue
      ),
      recentlyResolved: [...currentState.recentlyResolved, ...issueIds].slice(-20)
    });
  }

  /**
   * Updates filter selections
   */
  setIssueTypeFilter(types: DataQualityIssueType[]): void {
    this._updateState({ selectedIssueTypes: types });
  }

  setSeverityFilter(severities: DataQualityIssueSeverity[]): void {
    this._updateState({ selectedSeverities: severities });
  }

  setStatusFilter(statuses: DataQualityIssueStatus[]): void {
    this._updateState({ selectedStatuses: statuses });
  }

  setSearchQuery(query: string): void {
    this._updateState({ searchQuery: query });
  }

  /**
   * Clears all filters
   */
  clearFilters(): void {
    this._updateState({
      selectedIssueTypes: [],
      selectedSeverities: [],
      selectedStatuses: ['open'],
      searchQuery: ''
    });
  }

  /**
   * Removes resolved venue suggestions after assignment
   */
  removeVenueSuggestion(eventId: string): void {
    const currentState = this._state();
    const newSuggestions = new Map(currentState.venueMatchSuggestions);
    newSuggestions.delete(eventId);
    
    this._updateState({
      venueMatchSuggestions: newSuggestions
    });
  }

  /**
   * Removes a duplicate group after resolution
   */
  removeDuplicateGroup(groupId: string): void {
    const currentState = this._state();
    this._updateState({
      duplicateGroups: currentState.duplicateGroups.filter((group: EventDuplicateGroup) => group.id !== groupId)
    });
  }

  /**
   * Resets the store to initial state
   */
  reset(): void {
    this._state.set(initialState);
  }

  // 🔒 Private helper methods
  private _updateState(updates: Partial<DataQualityState>): void {
    this._state.update(current => ({ ...current, ...updates }));
  }
}