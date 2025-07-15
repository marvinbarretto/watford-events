/**
 * Admin Data Quality Dashboard Component
 * 
 * Provides comprehensive overview of data quality issues and metrics
 * Includes tools for bulk resolution and monitoring
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataQualityStore } from '../../data-access/data-quality.store';
import { 
  DataQualityIssue, 
  DataQualityIssueType,
  DataQualityIssueSeverity,
  DataQualityIssueStatus,
  ISSUE_TYPE_INFO,
  SEVERITY_INFO
} from '../../utils/data-quality.types';

@Component({
  selector: 'app-admin-data-quality',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-data-quality">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <div class="title-section">
            <h1>📊 Data Quality Dashboard</h1>
            <p class="subtitle">Monitor and improve your event data quality</p>
          </div>
          
          <div class="header-actions">
            <button 
              class="btn btn-primary" 
              [disabled]="dataQualityStore.isAnalyzing()"
              (click)="runAnalysis()">
              <span *ngIf="dataQualityStore.isAnalyzing()">🔄 Analyzing...</span>
              <span *ngIf="!dataQualityStore.isAnalyzing()">🔍 Run Analysis</span>
            </button>
          </div>
        </div>
        
        <!-- Health Score Card -->
        <div class="health-score-card" *ngIf="dataQualityStore.dashboardSummary() as summary">
          <div class="health-score" [class]="getHealthScoreClass(summary.healthScore)">
            <div class="score-value">{{ summary.healthScore }}%</div>
            <div class="score-label">Data Health Score</div>
          </div>
          
          <div class="quick-stats">
            <div class="stat-item">
              <div class="stat-value">{{ summary.totalIssues }}</div>
              <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat-item critical" *ngIf="summary.criticalIssues > 0">
              <div class="stat-value">{{ summary.criticalIssues }}</div>
              <div class="stat-label">Critical</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ summary.autoFixableIssues }}</div>
              <div class="stat-label">Auto-Fixable</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Critical Issues Alert -->
      <div class="critical-alert" *ngIf="dataQualityStore.criticalIssues().length > 0">
        <div class="alert-content">
          <div class="alert-icon">⚠️</div>
          <div class="alert-text">
            <strong>{{ dataQualityStore.criticalIssues().length }} critical issues</strong> 
            require immediate attention
          </div>
          <button class="btn btn-sm btn-danger" (click)="showCriticalIssues()">
            View Critical Issues
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filter-group">
            <label>Issue Types:</label>
            <div class="filter-chips">
              <button 
                *ngFor="let type of availableIssueTypes" 
                class="filter-chip"
                [class.active]="isTypeSelected(type)"
                (click)="toggleIssueType(type)">
                {{ ISSUE_TYPE_INFO[type].icon }} {{ ISSUE_TYPE_INFO[type].title }}
              </button>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Severity:</label>
            <div class="filter-chips">
              <button 
                *ngFor="let severity of availableSeverities" 
                class="filter-chip severity"
                [class.active]="isSeveritySelected(severity)"
                [style.border-color]="SEVERITY_INFO[severity].color"
                (click)="toggleSeverity(severity)">
                {{ SEVERITY_INFO[severity].label }}
              </button>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Status:</label>
            <div class="filter-chips">
              <button 
                *ngFor="let status of availableStatuses" 
                class="filter-chip status"
                [class.active]="isStatusSelected(status)"
                (click)="toggleStatus(status)">
                {{ getStatusIcon(status) }} {{ getStatusLabel(status) }}
              </button>
            </div>
          </div>
          
          <div class="filter-group search-group">
            <label>Search:</label>
            <input 
              type="text" 
              class="search-input"
              placeholder="Search issues..."
              [ngModel]="dataQualityStore.searchQuery()"
              (ngModelChange)="dataQualityStore.setSearchQuery($event)">
          </div>
          
          <button class="btn btn-secondary btn-sm" (click)="clearFilters()">
            Clear Filters
          </button>
        </div>

        <!-- Issues Grid -->
        <div class="issues-section">
          <div class="section-header">
            <h2>Issues ({{ dataQualityStore.filteredIssues().length }})</h2>
            
            <div class="bulk-actions" *ngIf="selectedIssues().size > 0">
              <span class="selection-count">{{ selectedIssues().size }} selected</span>
              <button class="btn btn-sm btn-success" (click)="resolveBulkIssues()">
                ✅ Resolve Selected
              </button>
              <button class="btn btn-sm btn-secondary" (click)="clearSelection()">
                Clear Selection
              </button>
            </div>
          </div>
          
          <div class="issues-grid" *ngIf="dataQualityStore.filteredIssues().length > 0; else noIssues">
            <div 
              *ngFor="let issue of dataQualityStore.filteredIssues()" 
              class="issue-card"
              [class]="'severity-' + issue.severity">
              
              <div class="issue-header">
                <input 
                  type="checkbox" 
                  [checked]="isIssueSelected(issue.id)"
                  (change)="toggleIssueSelection(issue.id)">
                
                <div class="issue-type">
                  <span class="type-icon">{{ ISSUE_TYPE_INFO[issue.type].icon }}</span>
                  <span class="type-name">{{ ISSUE_TYPE_INFO[issue.type].title }}</span>
                </div>
                
                <div class="issue-severity" [style.background-color]="SEVERITY_INFO[issue.severity].color">
                  {{ SEVERITY_INFO[issue.severity].label }}
                </div>
              </div>
              
              <div class="issue-content">
                <h4 class="issue-title">{{ issue.title }}</h4>
                <p class="issue-description">{{ issue.description }}</p>
                
                <div class="issue-metadata">
                  <span class="entity-info">
                    {{ issue.affectedEntityType === 'event' ? '🎪' : '🏢' }} 
                    {{ issue.affectedEntityId }}
                  </span>
                  <span class="detected-date">
                    Detected {{ formatDate(issue.detectedAt) }}
                  </span>
                </div>
                
                <div class="suggested-fix" *ngIf="issue.suggestedFix">
                  <strong>💡 Suggested Fix:</strong> {{ issue.suggestedFix }}
                </div>
              </div>
              
              <div class="issue-actions">
                <button 
                  *ngIf="issue.autoFixAvailable" 
                  class="btn btn-sm btn-primary"
                  (click)="autoFixIssue(issue)">
                  🔧 Auto-Fix
                </button>
                
                <button 
                  class="btn btn-sm btn-success"
                  [disabled]="dataQualityStore.resolvingIssues().has(issue.id)"
                  (click)="resolveIssue(issue)">
                  <span *ngIf="!dataQualityStore.resolvingIssues().has(issue.id)">✅ Resolve</span>
                  <span *ngIf="dataQualityStore.resolvingIssues().has(issue.id)">🔄 Resolving...</span>
                </button>
                
                <button 
                  class="btn btn-sm btn-secondary"
                  (click)="ignoreIssue(issue)">
                  🚫 Ignore
                </button>
                
                <button 
                  class="btn btn-sm btn-link"
                  (click)="viewEntity(issue)">
                  👁️ View
                </button>
              </div>
            </div>
          </div>
          
          <ng-template #noIssues>
            <div class="no-issues">
              <div class="no-issues-content">
                <div class="no-issues-icon">🎉</div>
                <h3>No Issues Found</h3>
                <p>Your data quality looks great! No issues match your current filters.</p>
                <button class="btn btn-primary" (click)="clearFilters()">
                  Clear Filters
                </button>
              </div>
            </div>
          </ng-template>
        </div>

        <!-- Venue Reconciliation Section -->
        <div class="venue-reconciliation-section" *ngIf="dataQualityStore.eventsWithVenueSuggestions().length > 0">
          <div class="section-header">
            <h2>🏢 Venue Reconciliation ({{ dataQualityStore.eventsWithVenueSuggestions().length }})</h2>
            <button class="btn btn-primary" routerLink="/admin/venue-reconciliation">
              Open Venue Reconciliation Tool
            </button>
          </div>
          
          <div class="venue-suggestions-preview">
            <div 
              *ngFor="let item of dataQualityStore.eventsWithVenueSuggestions().slice(0, 3)" 
              class="suggestion-preview">
              <div class="event-info">Event: {{ item.eventId }}</div>
              <div class="suggestion-info">
                {{ item.suggestions.length }} venue suggestions available
                <span *ngIf="item.suggestions[0] && item.suggestions[0].confidence >= 90" class="high-confidence">
                  ({{ item.suggestions[0].confidence }}% confidence)
                </span>
              </div>
            </div>
            
            <div *ngIf="dataQualityStore.eventsWithVenueSuggestions().length > 3" class="more-suggestions">
              +{{ dataQualityStore.eventsWithVenueSuggestions().length - 3 }} more events need venue assignment
            </div>
          </div>
        </div>

        <!-- Duplicate Events Section -->
        <div class="duplicates-section" *ngIf="dataQualityStore.duplicateGroups().length > 0">
          <div class="section-header">
            <h2>👥 Duplicate Events ({{ dataQualityStore.duplicateGroups().length }} groups)</h2>
          </div>
          
          <div class="duplicate-groups">
            <div *ngFor="let group of dataQualityStore.duplicateGroups().slice(0, 3)" class="duplicate-group">
              <div class="group-info">
                <strong>{{ group.events.length }} similar events</strong>
                ({{ group.similarity }}% similarity)
              </div>
              <div class="event-titles">
                <div *ngFor="let event of group.events.slice(0, 2)">{{ event.title }}</div>
                <div *ngIf="group.events.length > 2">+{{ group.events.length - 2 }} more</div>
              </div>
              <button class="btn btn-sm btn-warning" (click)="reviewDuplicateGroup(group)">
                Review Group
              </button>
            </div>
            
            <div *ngIf="dataQualityStore.duplicateGroups().length > 3" class="more-duplicates">
              +{{ dataQualityStore.duplicateGroups().length - 3 }} more duplicate groups
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-data-quality.scss'
})
export class AdminDataQualityComponent implements OnInit {
  protected readonly dataQualityStore = inject(DataQualityStore);
  protected readonly ISSUE_TYPE_INFO = ISSUE_TYPE_INFO;
  protected readonly SEVERITY_INFO = SEVERITY_INFO;
  
  // Component state
  protected selectedIssues = signal<Set<string>>(new Set());
  
  // Filter options
  protected readonly availableIssueTypes: DataQualityIssueType[] = [
    'missing-venue-id', 'venue-not-found', 'missing-venue-coordinates',
    'duplicate-event', 'low-scanner-confidence', 'missing-event-category'
  ];
  
  protected readonly availableSeverities: DataQualityIssueSeverity[] = ['critical', 'high', 'medium', 'low'];
  protected readonly availableStatuses: DataQualityIssueStatus[] = ['open', 'in_progress', 'resolved', 'ignored'];

  async ngOnInit() {
    // Load data quality analysis on component init
    if (!this.dataQualityStore.lastAnalysis() || this.dataQualityStore.isAnalysisStale()) {
      await this.runAnalysis();
    }
  }

  async runAnalysis() {
    try {
      await this.dataQualityStore.analyzeDataQuality();
    } catch (error) {
      console.error('Failed to analyze data quality:', error);
      // Could show toast notification here
    }
  }

  // Filter methods
  protected isTypeSelected(type: DataQualityIssueType): boolean {
    return this.dataQualityStore.selectedIssueTypes().includes(type);
  }

  protected isSeveritySelected(severity: DataQualityIssueSeverity): boolean {
    return this.dataQualityStore.selectedSeverities().includes(severity);
  }

  protected isStatusSelected(status: DataQualityIssueStatus): boolean {
    return this.dataQualityStore.selectedStatuses().includes(status);
  }

  protected toggleIssueType(type: DataQualityIssueType) {
    const current = this.dataQualityStore.selectedIssueTypes();
    const updated = current.includes(type) 
      ? current.filter(t => t !== type)
      : [...current, type];
    this.dataQualityStore.setIssueTypeFilter(updated);
  }

  protected toggleSeverity(severity: DataQualityIssueSeverity) {
    const current = this.dataQualityStore.selectedSeverities();
    const updated = current.includes(severity)
      ? current.filter(s => s !== severity)
      : [...current, severity];
    this.dataQualityStore.setSeverityFilter(updated);
  }

  protected toggleStatus(status: DataQualityIssueStatus) {
    const current = this.dataQualityStore.selectedStatuses();
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    this.dataQualityStore.setStatusFilter(updated);
  }

  protected clearFilters() {
    this.dataQualityStore.clearFilters();
    this.selectedIssues.set(new Set());
  }

  // Issue selection methods
  protected isIssueSelected(issueId: string): boolean {
    return this.selectedIssues().has(issueId);
  }

  protected toggleIssueSelection(issueId: string) {
    const current = new Set(this.selectedIssues());
    if (current.has(issueId)) {
      current.delete(issueId);
    } else {
      current.add(issueId);
    }
    this.selectedIssues.set(current);
  }

  protected clearSelection() {
    this.selectedIssues.set(new Set());
  }

  // Issue resolution methods
  protected resolveIssue(issue: DataQualityIssue) {
    this.dataQualityStore.setIssueResolving(issue.id, true);
    
    // Simulate resolution process
    setTimeout(() => {
      this.dataQualityStore.updateIssueStatus(issue.id, 'resolved');
      this.dataQualityStore.setIssueResolving(issue.id, false);
    }, 1000);
  }

  protected ignoreIssue(issue: DataQualityIssue) {
    this.dataQualityStore.updateIssueStatus(issue.id, 'ignored');
  }

  protected autoFixIssue(issue: DataQualityIssue) {
    this.dataQualityStore.setIssueResolving(issue.id, true);
    
    // TODO: Implement actual auto-fix logic
    setTimeout(() => {
      this.dataQualityStore.updateIssueStatus(issue.id, 'resolved');
      this.dataQualityStore.setIssueResolving(issue.id, false);
    }, 2000);
  }

  protected resolveBulkIssues() {
    const selectedIds = Array.from(this.selectedIssues());
    this.dataQualityStore.resolveIssues(selectedIds);
    this.selectedIssues.set(new Set());
  }

  protected viewEntity(issue: DataQualityIssue) {
    // Navigate to entity view
    const path = issue.affectedEntityType === 'event' 
      ? `/admin/events/${issue.affectedEntityId}`
      : `/admin/venues/${issue.affectedEntityId}`;
    // Router navigation would go here
    console.log('Navigate to:', path);
  }

  protected showCriticalIssues() {
    this.dataQualityStore.setSeverityFilter(['critical']);
    this.dataQualityStore.setStatusFilter(['open']);
  }

  protected reviewDuplicateGroup(group: any) {
    // TODO: Open duplicate review modal or navigate to detailed view
    console.log('Review duplicate group:', group);
  }

  // Helper methods
  protected getHealthScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  protected getStatusIcon(status: DataQualityIssueStatus): string {
    const icons = {
      'open': '🔴',
      'in_progress': '🟡',
      'resolved': '✅',
      'ignored': '⚫'
    };
    return icons[status];
  }

  protected getStatusLabel(status: DataQualityIssueStatus): string {
    const labels = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'ignored': 'Ignored'
    };
    return labels[status];
  }

  protected formatDate(date: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day');
  }
}