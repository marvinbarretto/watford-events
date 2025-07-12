import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { VenueService } from '../data-access/venue.service';
import { VenueStore } from '../data-access/venue.store';
import { Venue } from '../utils/venue.model';
import { VenueCardSlimComponent } from '../ui/venue-card-slim/venue-card-slim.component';
import { VenueCardComponent } from '../ui/venue-card/venue-card.component';

type ViewMode = 'slim' | 'grid';
type SortBy = 'name' | 'category' | 'status' | 'createdAt';

@Component({
  selector: 'app-venue-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VenueCardSlimComponent, VenueCardComponent],
  template: `
    <div class="venue-list-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Venues in Watford</h1>
          <p class="header-subtitle">Discover amazing venues around Watford</p>
        </div>

        <!-- View Controls -->
        <div class="view-controls">
          <div class="view-mode-toggle">
            <button 
              class="view-btn" 
              [class.active]="viewMode() === 'slim'"
              (click)="setViewMode('slim')"
              type="button">
              <span>📋</span>
              <span>List</span>
            </button>
            <button 
              class="view-btn" 
              [class.active]="viewMode() === 'grid'"
              (click)="setViewMode('grid')"
              type="button">
              <span>⊞</span>
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filters-section">
        <div class="search-bar">
          <input 
            type="text" 
            placeholder="Search venues..." 
            [(ngModel)]="searchTerm"
            class="search-input"
          />
        </div>

        <div class="filters">
          <div class="filter-group">
            <label>Category:</label>
            <select [(ngModel)]="selectedCategory" class="filter-select">
              <option value="all">All Categories</option>
              @for (category of categories; track category.value) {
                <option [value]="category.value">{{ category.label }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <label>Sort by:</label>
            <select [(ngModel)]="sortBy" class="filter-select">
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="createdAt">Recently Added</option>
            </select>
          </div>

          <div class="filter-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="showOnlyAccessible" />
              <span>Accessible venues only</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading venues...</p>
        </div>
      }

      <!-- Venues List -->
      @if (!loading()) {
        @if (filteredVenues().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🏢</div>
            <h3>No venues found</h3>
            @if (searchTerm || selectedCategory !== 'all' || showOnlyAccessible) {
              <p>Try adjusting your search criteria or filters.</p>
              <button class="clear-filters-btn" (click)="clearFilters()">Clear Filters</button>
            } @else {
              <p>No venues have been added yet.</p>
            }
          </div>
        } @else {
          <!-- Results Count -->
          <div class="results-info">
            <span class="results-count">{{ filteredVenues().length }} venue{{ filteredVenues().length !== 1 ? 's' : '' }} found</span>
          </div>

          <!-- Venue Cards -->
          <div class="venues-container" [class]="'view-' + viewMode()">
            @if (viewMode() === 'slim') {
              @for (venue of filteredVenues(); track venue.id) {
                <app-venue-card-slim
                  [venue]="venue"
                  (clicked)="onVenueClick($event)"
                  (viewClicked)="onViewVenue($event)"
                  (directionsClicked)="onGetDirections($event)"
                />
              }
            } @else {
              @for (venue of filteredVenues(); track venue.id) {
                <app-venue-card
                  [venue]="venue"
                  (clicked)="onVenueClick($event)"
                  (viewClicked)="onViewVenue($event)"
                  (directionsClicked)="onGetDirections($event)"
                  (websiteClicked)="onVisitWebsite($event)"
                />
              }
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .venue-list-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      gap: 2rem;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      color: var(--color-text);
      font-size: 2.5rem;
      font-weight: 700;
    }

    .header-subtitle {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 1.1rem;
    }

    .view-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .view-mode-toggle {
      display: flex;
      background: var(--color-background-darker);
      border-radius: 8px;
      padding: 4px;
      gap: 2px;
    }

    .view-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }

    .view-btn.active {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .view-btn:hover:not(.active) {
      background: var(--color-background-lighter);
      color: var(--color-text);
    }

    .filters-section {
      background: var(--color-background-lighter);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--color-border);
    }

    .search-bar {
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-size: 16px;
      background: var(--color-background-lighter);
      color: var(--color-text);
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .filters {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-group.checkbox-group {
      flex-direction: row;
      align-items: center;
    }

    .filter-group label {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text);
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-background-lighter);
      color: var(--color-text);
      font-size: 14px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--color-text-secondary);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-top: 4px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--color-text-secondary);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 1rem 0;
      color: var(--color-text);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
    }

    .clear-filters-btn {
      padding: 12px 24px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .clear-filters-btn:hover {
      background: var(--color-primary-hover);
    }

    .results-info {
      margin-bottom: 1.5rem;
      padding: 0 0.5rem;
    }

    .results-count {
      color: var(--color-text-secondary);
      font-size: 14px;
      font-weight: 500;
    }

    .venues-container.view-slim {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .venues-container.view-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .venue-list-page {
        padding: 1rem 0.5rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-content h1 {
        font-size: 2rem;
      }

      .filters {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .venues-container.view-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VenueListComponent implements OnInit {
  private readonly venueService = inject(VenueService);
  private readonly venueStore = inject(VenueStore);
  private readonly router = inject(Router);

  // Component state
  readonly loading = signal(false);
  readonly viewMode = signal<ViewMode>('grid');
  
  // Filter state
  searchTerm = '';
  selectedCategory: Venue['category'] | 'all' = 'all';
  sortBy: SortBy = 'name';
  showOnlyAccessible = false;

  // Data
  readonly venues = signal<Venue[]>([]);

  readonly categories = [
    { value: 'theatre', label: 'Theatre' },
    { value: 'pub', label: 'Pub/Bar' },
    { value: 'stadium', label: 'Stadium' },
    { value: 'park', label: 'Park' },
    { value: 'hall', label: 'Hall' },
    { value: 'museum', label: 'Museum' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'club', label: 'Club' },
    { value: 'community', label: 'Community Center' },
    { value: 'other', label: 'Other' }
  ] as const;

  // Computed
  readonly filteredVenues = computed(() => {
    let filtered = this.venues();

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(term) ||
        venue.address.toLowerCase().includes(term) ||
        (venue.notesForVisitors && venue.notesForVisitors.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(venue => venue.category === this.selectedCategory);
    }

    // Accessibility filter
    if (this.showOnlyAccessible) {
      filtered = filtered.filter(venue => this.isAccessible(venue));
    }

    // Only show published venues
    filtered = filtered.filter(venue => venue.status === 'published');

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  });

  async ngOnInit() {
    await this.loadVenues();
  }

  private async loadVenues() {
    this.loading.set(true);
    
    try {
      const venues = await this.venueService.getPublishedVenues();
      this.venues.set(venues);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private isAccessible(venue: Venue): boolean {
    return !!(
      venue.accessibleEntrance ||
      venue.stepFreeAccess ||
      venue.elevatorAvailable ||
      venue.toilets?.accessibleToilet
    );
  }

  setViewMode(mode: ViewMode) {
    this.viewMode.set(mode);
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.showOnlyAccessible = false;
    this.sortBy = 'name';
  }

  // Event handlers
  onVenueClick(venue: Venue) {
    // Navigate to venue detail page (to be implemented)
    console.log('Navigate to venue:', venue.id);
  }

  onViewVenue(venue: Venue) {
    // Navigate to venue detail page
    console.log('View venue details:', venue.id);
  }

  onGetDirections(venue: Venue) {
    // Open directions in maps app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.geo.lat},${venue.geo.lng}`;
    window.open(url, '_blank');
  }

  onVisitWebsite(venue: Venue) {
    if (venue.contactInfo?.website) {
      window.open(venue.contactInfo.website, '_blank');
    }
  }
}