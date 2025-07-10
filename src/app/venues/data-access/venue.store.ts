import { Injectable, signal, computed, inject } from '@angular/core';
import { Venue, VenueSummary } from '../utils/venue.model';

@Injectable({ providedIn: 'root' })
export class VenueStore {
  // ===== VENUE MANAGEMENT STATE =====
  
  // Private signals for venue management
  private readonly _venues = signal<Venue[]>([]);
  private readonly _selectedVenue = signal<Venue | null>(null);
  private readonly _venuesLoading = signal(false);
  private readonly _venuesSaving = signal(false);
  
  // Public readonly signals
  readonly venues = this._venues.asReadonly();
  readonly selectedVenue = this._selectedVenue.asReadonly();
  readonly venuesLoading = this._venuesLoading.asReadonly();
  readonly venuesSaving = this._venuesSaving.asReadonly();
  
  // ===== VENUE FILTER/SEARCH STATE =====
  
  // Private signals for filtering and searching
  private readonly _searchTerm = signal('');
  private readonly _selectedCategory = signal<Venue['category'] | 'all'>('all');
  private readonly _selectedStatus = signal<Venue['status'] | 'all'>('all');
  private readonly _showOnlyAccessible = signal(false);
  
  // Public readonly signals
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly selectedStatus = this._selectedStatus.asReadonly();
  readonly showOnlyAccessible = this._showOnlyAccessible.asReadonly();
  
  // ===== VENUE STATS STATE =====
  
  // Private signals for venue stats
  private readonly _totalVenues = signal(0);
  private readonly _publishedVenues = signal(0);
  private readonly _draftVenues = signal(0);
  private readonly _archivedVenues = signal(0);
  
  // Public readonly signals
  readonly totalVenues = this._totalVenues.asReadonly();
  readonly publishedVenues = this._publishedVenues.asReadonly();
  readonly draftVenues = this._draftVenues.asReadonly();
  readonly archivedVenues = this._archivedVenues.asReadonly();
  
  // ===== COMPUTED VALUES =====
  
  // Venue stats computed values
  readonly venueStats = computed(() => ({
    totalVenues: this._totalVenues(),
    publishedVenues: this._publishedVenues(),
    draftVenues: this._draftVenues(),
    archivedVenues: this._archivedVenues(),
  }));
  
  // Venue management computed values
  readonly hasVenues = computed(() => this._venues().length > 0);
  readonly hasSelectedVenue = computed(() => !!this._selectedVenue());
  
  // Filtered venues computed value
  readonly filteredVenues = computed(() => {
    const venues = this._venues();
    const searchTerm = this._searchTerm().toLowerCase();
    const category = this._selectedCategory();
    const status = this._selectedStatus();
    const showOnlyAccessible = this._showOnlyAccessible();
    
    return venues.filter(venue => {
      // Search filter
      if (searchTerm && !venue.name.toLowerCase().includes(searchTerm) && 
          !venue.address.toLowerCase().includes(searchTerm)) {
        return false;
      }
      
      // Category filter
      if (category !== 'all' && venue.category !== category) {
        return false;
      }
      
      // Status filter
      if (status !== 'all' && venue.status !== status) {
        return false;
      }
      
      // Accessibility filter
      if (showOnlyAccessible && !this.isAccessible(venue)) {
        return false;
      }
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  });
  
  // Venues by category computed value
  readonly venuesByCategory = computed(() => {
    const venues = this._venues();
    const categories: Record<string, number> = {};
    
    venues.forEach(venue => {
      const category = venue.category || 'other';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  });
  
  // Accessible venues computed value
  readonly accessibleVenues = computed(() => {
    return this._venues().filter(venue => this.isAccessible(venue));
  });
  
  // ===== VENUE MANAGEMENT METHODS =====
  
  setVenues(venues: Venue[]) {
    this._venues.set(venues);
    this.updateVenueStats(venues);
  }
  
  setSelectedVenue(venue: Venue | null) {
    this._selectedVenue.set(venue);
  }
  
  setVenuesLoading(loading: boolean) {
    this._venuesLoading.set(loading);
  }
  
  setVenuesSaving(saving: boolean) {
    this._venuesSaving.set(saving);
  }
  
  addVenue(venue: Venue) {
    const currentVenues = this._venues();
    const updatedVenues = [...currentVenues, venue];
    this._venues.set(updatedVenues);
    this.updateVenueStats(updatedVenues);
  }
  
  updateVenue(venueId: string, updates: Partial<Venue>) {
    const currentVenues = this._venues();
    const updatedVenues = currentVenues.map((venue: Venue) => 
      venue.id === venueId ? { ...venue, ...updates } : venue
    );
    this._venues.set(updatedVenues);
    this.updateVenueStats(updatedVenues);
    
    // Update selected venue if it's the one being updated
    const selectedVenue = this._selectedVenue();
    if (selectedVenue && selectedVenue.id === venueId) {
      this._selectedVenue.set({ ...selectedVenue, ...updates });
    }
  }
  
  removeVenue(venueId: string) {
    const currentVenues = this._venues();
    const updatedVenues = currentVenues.filter((venue: Venue) => venue.id !== venueId);
    this._venues.set(updatedVenues);
    this.updateVenueStats(updatedVenues);
    
    // Clear selected venue if it's the one being removed
    const selectedVenue = this._selectedVenue();
    if (selectedVenue && selectedVenue.id === venueId) {
      this._selectedVenue.set(null);
    }
  }
  
  // ===== FILTER/SEARCH METHODS =====
  
  setSearchTerm(term: string) {
    this._searchTerm.set(term);
  }
  
  setSelectedCategory(category: Venue['category'] | 'all') {
    this._selectedCategory.set(category);
  }
  
  setSelectedStatus(status: Venue['status'] | 'all') {
    this._selectedStatus.set(status);
  }
  
  setShowOnlyAccessible(show: boolean) {
    this._showOnlyAccessible.set(show);
  }
  
  clearFilters() {
    this._searchTerm.set('');
    this._selectedCategory.set('all');
    this._selectedStatus.set('all');
    this._showOnlyAccessible.set(false);
  }
  
  // ===== UTILITY METHODS =====
  
  /**
   * Get venue summaries for dropdown lists
   */
  getVenueSummaries(): VenueSummary[] {
    return this._venues().map(venue => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      category: venue.category,
      status: venue.status
    }));
  }
  
  /**
   * Get published venues for public display
   */
  getPublishedVenues(): Venue[] {
    return this._venues().filter(venue => venue.status === 'published');
  }
  
  /**
   * Check if venue has accessibility features
   */
  private isAccessible(venue: Venue): boolean {
    return !!(
      venue.accessibleEntrance ||
      venue.stepFreeAccess ||
      venue.elevatorAvailable ||
      venue.toilets?.accessibleToilet
    );
  }
  
  /**
   * Update venue statistics
   */
  private updateVenueStats(venues: Venue[]) {
    this._totalVenues.set(venues.length);
    this._publishedVenues.set(venues.filter(v => v.status === 'published').length);
    this._draftVenues.set(venues.filter(v => v.status === 'draft').length);
    this._archivedVenues.set(venues.filter(v => v.status === 'archived').length);
  }
  
  /**
   * Refresh venue statistics
   */
  refreshVenueStats() {
    const venues = this._venues();
    this.updateVenueStats(venues);
  }
}