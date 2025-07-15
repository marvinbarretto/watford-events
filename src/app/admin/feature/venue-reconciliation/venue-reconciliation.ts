/**
 * Venue Reconciliation Component
 * 
 * Interface for resolving venue mismatches and assigning venues to events
 * Provides side-by-side comparison and bulk assignment tools
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataQualityStore } from '../../data-access/data-quality.store';
import { EventService } from '@app/events/data-access/event.service';
import { VenueService } from '@app/venues/data-access/venue.service';
import { EventModel } from '@app/events/utils/event.model';
import { Venue } from '@app/venues/utils/venue.model';
import { VenueMatchSuggestion } from '../../utils/data-quality.types';

interface EventVenueAssignment {
  event: EventModel;
  selectedVenueId: string | null;
  suggestions: VenueMatchSuggestion[];
}

@Component({
  selector: 'app-venue-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="venue-reconciliation">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="title-section">
            <button class="btn btn-link back-btn" routerLink="/admin/data-quality">
              ← Back to Data Quality
            </button>
            <h1>🏢 Venue Reconciliation</h1>
            <p class="subtitle">Assign venues to events with location data</p>
          </div>
          
          <div class="header-stats" *ngIf="reconciliationData().length > 0">
            <div class="stat-item">
              <div class="stat-value">{{ reconciliationData().length }}</div>
              <div class="stat-label">Events to Process</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ processedCount() }}</div>
              <div class="stat-label">Processed</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ highConfidenceCount() }}</div>
              <div class="stat-label">High Confidence</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <div class="bulk-actions-bar" *ngIf="reconciliationData().length > 0">
        <div class="actions-left">
          <button 
            class="btn btn-primary"
            [disabled]="!hasHighConfidenceSelections()"
            (click)="assignHighConfidenceMatches()">
            ⚡ Auto-assign High Confidence ({{ highConfidenceUnprocessedCount() }})
          </button>
          
          <button 
            class="btn btn-secondary"
            [disabled]="processedCount() === 0"
            (click)="saveAllAssignments()">
            💾 Save All Assignments ({{ processedCount() }})
          </button>
        </div>
        
        <div class="actions-right">
          <button class="btn btn-secondary" (click)="clearAllSelections()">
            🗑️ Clear All
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content" *ngIf="reconciliationData().length > 0; else noData">
        <div class="reconciliation-list">
          <div 
            *ngFor="let assignment of reconciliationData(); trackBy: trackByEventId" 
            class="reconciliation-item"
            [class.processed]="assignment.selectedVenueId"
            [class.high-confidence]="hasHighConfidenceSuggestion(assignment)">
            
            <!-- Event Info -->
            <div class="event-section">
              <div class="event-header">
                <h3 class="event-title">{{ assignment.event.title }}</h3>
                <span class="event-id">{{ assignment.event.id }}</span>
              </div>
              
              <div class="event-details">
                <div class="event-location">
                  <strong>📍 Location:</strong> {{ assignment.event.location }}
                </div>
                <div class="event-date">
                  <strong>📅 Date:</strong> {{ formatDate(assignment.event.date) }}
                </div>
                <div class="event-organizer" *ngIf="assignment.event.organizer">
                  <strong>👤 Organizer:</strong> {{ assignment.event.organizer }}
                </div>
              </div>
            </div>

            <!-- Venue Suggestions -->
            <div class="suggestions-section">
              <h4 class="suggestions-title">
                Venue Suggestions ({{ assignment.suggestions.length }})
              </h4>
              
              <div class="suggestions-list" *ngIf="assignment.suggestions.length > 0; else noSuggestions">
                <div 
                  *ngFor="let suggestion of assignment.suggestions" 
                  class="suggestion-item"
                  [class.selected]="assignment.selectedVenueId === suggestion.venue.id"
                  [class.high-confidence]="suggestion.confidence >= 90"
                  (click)="selectVenue(assignment, suggestion.venue.id)">
                  
                  <div class="suggestion-header">
                    <input 
                      type="radio" 
                      [name]="'venue-' + assignment.event.id"
                      [value]="suggestion.venue.id"
                      [checked]="assignment.selectedVenueId === suggestion.venue.id"
                      (change)="selectVenue(assignment, suggestion.venue.id)">
                    
                    <div class="venue-name">{{ suggestion.venue.name }}</div>
                    
                    <div class="confidence-badge" [class]="getConfidenceClass(suggestion.confidence)">
                      {{ suggestion.confidence }}%
                    </div>
                  </div>
                  
                  <div class="venue-details">
                    <div class="venue-address">{{ suggestion.venue.address }}</div>
                    <div class="match-reason">{{ suggestion.matchReason }}</div>
                  </div>
                </div>
                
                <!-- Option to skip/create new venue -->
                <div class="suggestion-item create-new"
                     [class.selected]="assignment.selectedVenueId === 'CREATE_NEW'"
                     (click)="selectVenue(assignment, 'CREATE_NEW')">
                  <div class="suggestion-header">
                    <input 
                      type="radio" 
                      [name]="'venue-' + assignment.event.id"
                      value="CREATE_NEW"
                      [checked]="assignment.selectedVenueId === 'CREATE_NEW'"
                      (change)="selectVenue(assignment, 'CREATE_NEW')">
                    
                    <div class="venue-name">+ Create New Venue</div>
                  </div>
                  <div class="venue-details">
                    Create a new venue with location: "{{ assignment.event.location }}"
                  </div>
                </div>
                
                <div class="suggestion-item skip-item"
                     [class.selected]="assignment.selectedVenueId === 'SKIP'"
                     (click)="selectVenue(assignment, 'SKIP')">
                  <div class="suggestion-header">
                    <input 
                      type="radio" 
                      [name]="'venue-' + assignment.event.id"
                      value="SKIP"
                      [checked]="assignment.selectedVenueId === 'SKIP'"
                      (change)="selectVenue(assignment, 'SKIP')">
                    
                    <div class="venue-name">⏭️ Skip for Now</div>
                  </div>
                  <div class="venue-details">
                    Leave this event without a venue assignment
                  </div>
                </div>
              </div>
              
              <ng-template #noSuggestions>
                <div class="no-suggestions">
                  <p>No venue suggestions found for this location.</p>
                  <button class="btn btn-primary btn-sm" (click)="selectVenue(assignment, 'CREATE_NEW')">
                    + Create New Venue
                  </button>
                </div>
              </ng-template>
            </div>

            <!-- Action Buttons -->
            <div class="item-actions">
              <button 
                class="btn btn-sm btn-success"
                [disabled]="!assignment.selectedVenueId || assignment.selectedVenueId === 'SKIP'"
                (click)="processAssignment(assignment)">
                ✅ Process Assignment
              </button>
              
              <button 
                class="btn btn-sm btn-secondary"
                (click)="clearSelection(assignment)">
                🗑️ Clear Selection
              </button>
              
              <button 
                class="btn btn-sm btn-link"
                (click)="viewEvent(assignment.event)">
                👁️ View Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noData>
        <div class="no-data">
          <div class="no-data-content">
            <div class="no-data-icon">🎉</div>
            <h2>All Venues Assigned!</h2>
            <p>There are no events that need venue assignment at this time.</p>
            <button class="btn btn-primary" routerLink="/admin/data-quality">
              Return to Data Quality Dashboard
            </button>
          </div>
        </div>
      </ng-template>

      <!-- Processing Status -->
      <div class="processing-status" *ngIf="isProcessing()">
        <div class="status-content">
          <div class="spinner"></div>
          <span>Processing venue assignments...</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './venue-reconciliation.scss'
})
export class VenueReconciliationComponent implements OnInit {
  private readonly dataQualityStore = inject(DataQualityStore);
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);

  // Component state
  private readonly assignments = signal<EventVenueAssignment[]>([]);
  protected readonly isProcessing = signal(false);

  // Computed values
  protected readonly reconciliationData = computed(() => this.assignments());
  
  protected readonly processedCount = computed(() => 
    this.assignments().filter(a => a.selectedVenueId && a.selectedVenueId !== 'SKIP').length
  );
  
  protected readonly highConfidenceCount = computed(() => 
    this.assignments().filter(a => this.hasHighConfidenceSuggestion(a)).length
  );
  
  protected readonly highConfidenceUnprocessedCount = computed(() => 
    this.assignments().filter(a => 
      this.hasHighConfidenceSuggestion(a) && !a.selectedVenueId
    ).length
  );

  async ngOnInit() {
    await this.loadReconciliationData();
  }

  private async loadReconciliationData() {
    // Ensure we have fresh data quality analysis
    if (!this.dataQualityStore.lastAnalysis() || this.dataQualityStore.isAnalysisStale()) {
      await this.dataQualityStore.analyzeDataQuality();
    }

    // Load events that need venue assignment
    const eventsWithSuggestions = this.dataQualityStore.eventsWithVenueSuggestions();
    const events = await this.eventService.getAll();
    
    const assignments: EventVenueAssignment[] = eventsWithSuggestions.map(item => {
      const event = events.find(e => e.id === item.eventId);
      if (!event) {
        console.warn('Event not found:', item.eventId);
        return null;
      }
      
      return {
        event,
        selectedVenueId: null,
        suggestions: item.suggestions
      };
    }).filter(Boolean) as EventVenueAssignment[];

    this.assignments.set(assignments);
  }

  protected trackByEventId(index: number, assignment: EventVenueAssignment): string {
    return assignment.event.id;
  }

  protected hasHighConfidenceSuggestion(assignment: EventVenueAssignment): boolean {
    return assignment.suggestions.some(s => s.confidence >= 90);
  }

  protected selectVenue(assignment: EventVenueAssignment, venueId: string | null) {
    this.assignments.update(assignments => 
      assignments.map(a => 
        a.event.id === assignment.event.id 
          ? { ...a, selectedVenueId: venueId }
          : a
      )
    );
  }

  protected clearSelection(assignment: EventVenueAssignment) {
    this.selectVenue(assignment, null);
  }

  protected clearAllSelections() {
    this.assignments.update(assignments => 
      assignments.map(a => ({ ...a, selectedVenueId: null }))
    );
  }

  protected hasHighConfidenceSelections(): boolean {
    return this.assignments().some(a => 
      this.hasHighConfidenceSuggestion(a) && !a.selectedVenueId
    );
  }

  protected assignHighConfidenceMatches() {
    this.assignments.update(assignments => 
      assignments.map(a => {
        if (this.hasHighConfidenceSuggestion(a) && !a.selectedVenueId) {
          const topSuggestion = a.suggestions.find(s => s.confidence >= 90);
          return { ...a, selectedVenueId: topSuggestion?.venue.id || null };
        }
        return a;
      })
    );
  }

  protected async processAssignment(assignment: EventVenueAssignment) {
    if (!assignment.selectedVenueId || assignment.selectedVenueId === 'SKIP') {
      return;
    }

    this.isProcessing.set(true);

    try {
      if (assignment.selectedVenueId === 'CREATE_NEW') {
        await this.createNewVenueAndAssign(assignment);
      } else {
        await this.assignExistingVenue(assignment);
      }
      
      // Remove this assignment from the list
      this.assignments.update(assignments => 
        assignments.filter(a => a.event.id !== assignment.event.id)
      );
      
      // Remove from data quality store suggestions
      this.dataQualityStore.removeVenueSuggestion(assignment.event.id);
      
    } catch (error) {
      console.error('Failed to process assignment:', error);
      // Could show error toast here
    } finally {
      this.isProcessing.set(false);
    }
  }

  protected async saveAllAssignments() {
    const processedAssignments = this.assignments().filter(a => 
      a.selectedVenueId && a.selectedVenueId !== 'SKIP'
    );

    if (processedAssignments.length === 0) return;

    this.isProcessing.set(true);

    try {
      for (const assignment of processedAssignments) {
        if (assignment.selectedVenueId === 'CREATE_NEW') {
          await this.createNewVenueAndAssign(assignment);
        } else {
          await this.assignExistingVenue(assignment);
        }
      }

      // Remove processed assignments
      this.assignments.update(assignments => 
        assignments.filter(a => !a.selectedVenueId || a.selectedVenueId === 'SKIP')
      );

      // Update data quality store
      processedAssignments.forEach(assignment => {
        this.dataQualityStore.removeVenueSuggestion(assignment.event.id);
      });

    } catch (error) {
      console.error('Failed to save assignments:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async assignExistingVenue(assignment: EventVenueAssignment) {
    const updateData = {
      venueId: assignment.selectedVenueId!
    };
    
    await this.eventService.update(assignment.event.id, updateData);
  }

  private async createNewVenueAndAssign(assignment: EventVenueAssignment) {
    // TODO: Implement venue creation flow
    // For now, just log the intention
    console.log('Would create new venue for:', assignment.event.location);
    
    // In a real implementation, this would:
    // 1. Open a venue creation modal/dialog
    // 2. Pre-populate with location data
    // 3. Allow user to add additional details
    // 4. Create the venue
    // 5. Assign it to the event
  }

  protected viewEvent(event: EventModel) {
    // Navigate to event detail view
    console.log('View event:', event.id);
  }

  protected getConfidenceClass(confidence: number): string {
    if (confidence >= 90) return 'high-confidence';
    if (confidence >= 70) return 'medium-confidence';
    return 'low-confidence';
  }

  protected formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}