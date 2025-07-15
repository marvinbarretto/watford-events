import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EntityResolutionService } from '../../data-access/entity-resolution.service';
import { EntityMetricsService } from '../../data-access/entity-metrics.service';
import { ArtistService } from '../../data-access/artist.service';
import { VenueEntityService } from '../../data-access/venue-entity.service';

import { 
  UnresolvedArtist, 
  Artist, 
  ArtistResolutionCandidate 
} from '../../utils/artist.model';
import { 
  UnresolvedVenue, 
  Venue, 
  VenueResolutionCandidate 
} from '../../utils/venue.model';

export type TabType = 'overview' | 'unresolved-artists' | 'unresolved-venues' | 'duplicates' | 'artists' | 'venues';

@Component({
  selector: 'app-entity-reconciliation',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="entity-reconciliation">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>🎭 Entity Reconciliation</h1>
            <p class="subtitle">Resolve artists and venues for better data quality</p>
          </div>
          
          <div class="header-actions">
            <button 
              class="btn btn-secondary" 
              [disabled]="isLoading()"
              (click)="refreshData()">
              <span *ngIf="!isLoading()">🔄 Refresh</span>
              <span *ngIf="isLoading()">⏳ Loading...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading()">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Loading entity data...</p>
        </div>
      </div>

      <!-- Content -->
      <div class="content" *ngIf="!isLoading()">
        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button 
            *ngFor="let tab of tabs()" 
            [class]="getTabClass(tab)"
            (click)="setActiveTab(tab.id)">
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-title">{{ tab.title }}</span>
            <span class="tab-badge" *ngIf="tab.badge && tab.badge > 0">{{ tab.badge }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Overview Tab -->
          <div *ngIf="activeTab() === 'overview'" class="overview-section">
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-icon">🎭</div>
                <div class="metric-content">
                  <h3>{{ entityMetrics()?.unresolvedArtists || 0 }}</h3>
                  <p>Unresolved Artists</p>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-icon">🏗️</div>
                <div class="metric-content">
                  <h3>{{ entityMetrics()?.unresolvedVenues || 0 }}</h3>
                  <p>Unresolved Venues</p>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-icon">👥</div>
                <div class="metric-content">
                  <h3>{{ duplicateCandidates().length }}</h3>
                  <p>Duplicate Candidates</p>
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-icon">📊</div>
                <div class="metric-content">
                  <h3>{{ entityMetrics()?.dataHealthScore || 0 }}%</h3>
                  <p>Data Health Score</p>
                </div>
              </div>
            </div>

            <div class="quick-actions">
              <h2>Quick Actions</h2>
              <div class="action-grid">
                <button 
                  class="action-button primary"
                  (click)="setActiveTab('unresolved-artists')"
                  [disabled]="(entityMetrics()?.unresolvedArtists || 0) === 0">
                  <span class="action-icon">🎭</span>
                  <div class="action-content">
                    <h4>Resolve Artists</h4>
                    <p>{{ entityMetrics()?.unresolvedArtists || 0 }} artists need resolution</p>
                  </div>
                </button>
                
                <button 
                  class="action-button primary"
                  (click)="setActiveTab('unresolved-venues')"
                  [disabled]="(entityMetrics()?.unresolvedVenues || 0) === 0">
                  <span class="action-icon">🏗️</span>
                  <div class="action-content">
                    <h4>Resolve Venues</h4>
                    <p>{{ entityMetrics()?.unresolvedVenues || 0 }} venues need resolution</p>
                  </div>
                </button>
                
                <button 
                  class="action-button secondary"
                  (click)="setActiveTab('duplicates')"
                  [disabled]="duplicateCandidates().length === 0">
                  <span class="action-icon">👥</span>
                  <div class="action-content">
                    <h4>Review Duplicates</h4>
                    <p>{{ duplicateCandidates().length }} potential duplicates found</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Unresolved Artists Tab -->
          <div *ngIf="activeTab() === 'unresolved-artists'" class="unresolved-section">
            <div class="section-header">
              <h2>Unresolved Artists ({{ unresolvedArtists().length }})</h2>
              <p>Artist names from events that need to be linked to entities</p>
            </div>
            
            <div class="unresolved-list" *ngIf="unresolvedArtists().length > 0; else noUnresolvedArtists">
              <div *ngFor="let artist of unresolvedArtists(); trackBy: trackByArtistName" class="unresolved-item">
                <div class="item-header">
                  <h3>{{ artist.name }}</h3>
                  <span class="event-count">{{ artist.eventCount }} event{{ artist.eventCount === 1 ? '' : 's' }}</span>
                </div>
                
                <div class="suggested-matches" *ngIf="artist.suggestedMatches && artist.suggestedMatches.length > 0">
                  <h4>Suggested Matches:</h4>
                  <div class="match-list">
                    <button 
                      *ngFor="let match of artist.suggestedMatches" 
                      class="match-button"
                      (click)="linkArtistToEntity(artist, match.artistId)">
                      <div class="match-content">
                        <strong>{{ getArtistById(match.artistId)?.name || 'Unknown' }}</strong>
                        <span class="confidence">{{ (match.confidence * 100).toFixed(0) }}% match</span>
                        <small>{{ match.reason }}</small>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div class="item-actions">
                  <button class="btn btn-primary" (click)="createNewArtist(artist)">
                    ➕ Create New Artist
                  </button>
                  <button class="btn btn-secondary" (click)="searchExistingArtists(artist)">
                    🔍 Search Existing
                  </button>
                </div>
              </div>
            </div>
            
            <ng-template #noUnresolvedArtists>
              <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>All Artists Resolved!</h3>
                <p>All artist names have been linked to entities.</p>
              </div>
            </ng-template>
          </div>

          <!-- Unresolved Venues Tab -->
          <div *ngIf="activeTab() === 'unresolved-venues'" class="unresolved-section">
            <div class="section-header">
              <h2>Unresolved Venues ({{ unresolvedVenues().length }})</h2>
              <p>Venue names from events that need to be linked to entities</p>
            </div>
            
            <div class="unresolved-list" *ngIf="unresolvedVenues().length > 0; else noUnresolvedVenues">
              <div *ngFor="let venue of unresolvedVenues(); trackBy: trackByVenueName" class="unresolved-item">
                <div class="item-header">
                  <h3>{{ venue.name }}</h3>
                  <span class="event-count">{{ venue.eventCount }} event{{ venue.eventCount === 1 ? '' : 's' }}</span>
                </div>
                
                <div class="suggested-matches" *ngIf="venue.suggestedMatches && venue.suggestedMatches.length > 0">
                  <h4>Suggested Matches:</h4>
                  <div class="match-list">
                    <button 
                      *ngFor="let match of venue.suggestedMatches" 
                      class="match-button"
                      (click)="linkVenueToEntity(venue, match.venueId)">
                      <div class="match-content">
                        <strong>{{ getVenueById(match.venueId)?.name || 'Unknown' }}</strong>
                        <span class="confidence">{{ (match.confidence * 100).toFixed(0) }}% match</span>
                        <small>{{ match.reason }}</small>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div class="item-actions">
                  <button class="btn btn-primary" (click)="createNewVenue(venue)">
                    ➕ Create New Venue
                  </button>
                  <button class="btn btn-secondary" (click)="searchExistingVenues(venue)">
                    🔍 Search Existing
                  </button>
                </div>
              </div>
            </div>
            
            <ng-template #noUnresolvedVenues>
              <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <h3>All Venues Resolved!</h3>
                <p>All venue names have been linked to entities.</p>
              </div>
            </ng-template>
          </div>

          <!-- Other tabs would go here -->
          <div *ngIf="activeTab() === 'duplicates'" class="duplicates-section">
            <div class="section-header">
              <h2>Duplicate Candidates ({{ duplicateCandidates().length }})</h2>
              <p>Potential duplicate entities that might need merging</p>
            </div>
            
            <div class="placeholder">
              <p>🚧 Duplicate detection coming soon...</p>
            </div>
          </div>
          
          <div *ngIf="activeTab() === 'artists'" class="entities-section">
            <div class="section-header">
              <h2>All Artists ({{ allArtists().length }})</h2>
              <p>Manage existing artist entities</p>
            </div>
            
            <div class="placeholder">
              <p>🚧 Artist management coming soon...</p>
            </div>
          </div>
          
          <div *ngIf="activeTab() === 'venues'" class="entities-section">
            <div class="section-header">
              <h2>All Venues ({{ allVenues().length }})</h2>
              <p>Manage existing venue entities</p>
            </div>
            
            <div class="placeholder">
              <p>🚧 Venue management coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .entity-reconciliation {
      min-height: 100vh;
      background: var(--background);
    }

    /* Header Styles */
    .page-header {
      background: var(--background-lighter);
      border-bottom: 1px solid var(--border);
      padding: 1.5rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .title-section h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.25rem 0;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0;
      font-size: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary);
      color: var(--on-primary);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: var(--background);
      color: var(--text);
      border: 2px solid var(--border);
    }

    .btn-secondary:hover:not(:disabled) {
      border-color: var(--primary);
    }

    /* Loading Styles */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-content {
      background: var(--background-lighter);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Content Styles */
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    /* Tab Navigation */
    .tab-navigation {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid var(--border);
      overflow-x: auto;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
    }

    .tab-button:hover {
      color: var(--text);
      background: var(--background);
    }

    .tab-button.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: var(--background);
    }

    .tab-badge {
      background: var(--error);
      color: var(--on-error);
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Overview Section */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .metric-card {
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .metric-icon {
      font-size: 2rem;
    }

    .metric-content h3 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .metric-content p {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.9rem;
    }

    .quick-actions h2 {
      font-size: 1.5rem;
      color: var(--text);
      margin: 0 0 1rem 0;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--background-lighter);
      border: 2px solid var(--border);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .action-button:hover:not(:disabled) {
      border-color: var(--primary);
      transform: translateY(-2px);
    }

    .action-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-button.primary {
      border-color: var(--primary);
    }

    .action-icon {
      font-size: 1.5rem;
    }

    .action-content h4 {
      color: var(--text);
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
    }

    .action-content p {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.85rem;
    }

    /* Unresolved Section */
    .section-header {
      margin-bottom: 2rem;
    }

    .section-header h2 {
      font-size: 1.5rem;
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    .section-header p {
      color: var(--text-secondary);
      margin: 0;
    }

    .unresolved-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .unresolved-item {
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .item-header h3 {
      color: var(--text);
      margin: 0;
      font-size: 1.25rem;
    }

    .event-count {
      background: var(--primary);
      color: var(--on-primary);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .suggested-matches h4 {
      color: var(--text);
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .match-button {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .match-button:hover {
      border-color: var(--primary);
      background: var(--primary-light);
    }

    .match-content strong {
      display: block;
      color: var(--text);
      margin-bottom: 0.25rem;
    }

    .confidence {
      color: var(--success);
      font-weight: 600;
      font-size: 0.85rem;
    }

    .match-content small {
      display: block;
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .item-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    /* Placeholder */
    .placeholder {
      text-align: center;
      padding: 3rem;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text-secondary);
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .content {
        padding: 1rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .action-grid {
        grid-template-columns: 1fr;
      }

      .item-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .item-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EntityReconciliationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly entityResolutionService = inject(EntityResolutionService);
  private readonly entityMetricsService = inject(EntityMetricsService);
  private readonly artistService = inject(ArtistService);
  private readonly venueEntityService = inject(VenueEntityService);

  // State
  protected readonly isLoading = signal(false);
  protected readonly activeTab = signal<TabType>('overview');
  
  // Data
  protected readonly entityMetrics = signal<any>(null);
  protected readonly unresolvedArtists = signal<UnresolvedArtist[]>([]);
  protected readonly unresolvedVenues = signal<UnresolvedVenue[]>([]);
  protected readonly allArtists = signal<Artist[]>([]);
  protected readonly allVenues = signal<Venue[]>([]);
  protected readonly duplicateCandidates = signal<(ArtistResolutionCandidate | VenueResolutionCandidate)[]>([]);

  // Computed
  protected readonly tabs = computed(() => [
    { 
      id: 'overview' as TabType, 
      title: 'Overview', 
      icon: '📊',
      badge: 0
    },
    { 
      id: 'unresolved-artists' as TabType, 
      title: 'Unresolved Artists', 
      icon: '🎭',
      badge: this.entityMetrics()?.unresolvedArtists || 0
    },
    { 
      id: 'unresolved-venues' as TabType, 
      title: 'Unresolved Venues', 
      icon: '🏗️',
      badge: this.entityMetrics()?.unresolvedVenues || 0
    },
    { 
      id: 'duplicates' as TabType, 
      title: 'Duplicates', 
      icon: '👥',
      badge: this.duplicateCandidates().length
    },
    { 
      id: 'artists' as TabType, 
      title: 'All Artists', 
      icon: '🎭',
      badge: 0
    },
    { 
      id: 'venues' as TabType, 
      title: 'All Venues', 
      icon: '🏗️',
      badge: 0
    }
  ]);

  async ngOnInit() {
    // Check for tab parameter in URL
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab'] as TabType);
      }
    });

    await this.loadData();
  }

  private async loadData() {
    this.isLoading.set(true);
    
    try {
      const [
        metrics,
        unresolvedArtists,
        unresolvedVenues,
        artists,
        venues,
        duplicateArtists,
        duplicateVenues
      ] = await Promise.all([
        this.entityMetricsService.getEntityMetrics(),
        this.entityResolutionService.findUnresolvedArtists(),
        this.entityResolutionService.findUnresolvedVenues(),
        this.artistService.getArtists(),
        this.venueEntityService.getVenues(),
        this.entityResolutionService.findDuplicateArtists(),
        this.entityResolutionService.findDuplicateVenues()
      ]);

      this.entityMetrics.set(metrics);
      this.unresolvedArtists.set(unresolvedArtists);
      this.unresolvedVenues.set(unresolvedVenues);
      this.allArtists.set(artists);
      this.allVenues.set(venues);
      this.duplicateCandidates.set([...duplicateArtists, ...duplicateVenues]);
      
    } catch (error) {
      console.error('Error loading entity data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async refreshData() {
    await this.loadData();
  }

  protected setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
  }

  protected getTabClass(tab: any): string {
    const baseClass = 'tab-button';
    return this.activeTab() === tab.id ? `${baseClass} active` : baseClass;
  }

  // Helper methods for templates
  protected trackByArtistName(index: number, artist: UnresolvedArtist): string {
    return artist.name;
  }

  protected trackByVenueName(index: number, venue: UnresolvedVenue): string {
    return venue.name;
  }

  protected getArtistById(id: string): Artist | undefined {
    return this.allArtists().find(artist => artist.id === id);
  }

  protected getVenueById(id: string): Venue | undefined {
    return this.allVenues().find(venue => venue.id === id);
  }

  // Action methods (placeholders for now)
  protected async linkArtistToEntity(unresolvedArtist: UnresolvedArtist, artistId: string) {
    console.log('Linking artist:', unresolvedArtist.name, 'to entity:', artistId);
    // TODO: Implement linking logic
  }

  protected async linkVenueToEntity(unresolvedVenue: UnresolvedVenue, venueId: string) {
    console.log('Linking venue:', unresolvedVenue.name, 'to entity:', venueId);
    // TODO: Implement linking logic
  }

  protected async createNewArtist(unresolvedArtist: UnresolvedArtist) {
    console.log('Creating new artist for:', unresolvedArtist.name);
    // TODO: Implement artist creation
  }

  protected async createNewVenue(unresolvedVenue: UnresolvedVenue) {
    console.log('Creating new venue for:', unresolvedVenue.name);
    // TODO: Implement venue creation
  }

  protected searchExistingArtists(unresolvedArtist: UnresolvedArtist) {
    console.log('Searching existing artists for:', unresolvedArtist.name);
    // TODO: Implement search dialog
  }

  protected searchExistingVenues(unresolvedVenue: UnresolvedVenue) {
    console.log('Searching existing venues for:', unresolvedVenue.name);
    // TODO: Implement search dialog
  }
}