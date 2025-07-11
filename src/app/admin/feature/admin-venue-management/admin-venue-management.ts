import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AdminStore } from '../../data-access/admin.store';
import { VenueService } from '@app/venues/data-access/venue.service';
import { Venue } from '@app/venues/utils/venue.model';

@Component({
  selector: 'app-admin-venue-management',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-venue-management.html',
  styleUrl: './admin-venue-management.scss'
})
export class AdminVenueManagement implements OnInit {
  private readonly adminStore = inject(AdminStore);
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);

  // Expose store signals to template
  readonly venues = this.adminStore.venues;
  readonly venuesLoading = this.adminStore.venuesLoading;
  readonly selectedVenue = this.adminStore.selectedVenue;

  // Component state
  filterStatus: 'all' | 'draft' | 'published' | 'archived' = 'all';
  filterCategory: Venue['category'] | 'all' = 'all';
  sortBy: 'name' | 'address' | 'status' | 'createdAt' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  showOnlyAccessible = false;


  // Available categories for filtering
  readonly categories: Array<{ value: Venue['category'] | 'all', label: string }> = [
    { value: 'all', label: 'All Categories' },
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
  ];

  async ngOnInit() {
    await this.loadVenues();
  }

  private async loadVenues() {
    this.adminStore.setVenuesLoading(true);
    
    try {
      const venues = await this.venueService.getAll();
      this.adminStore.setVenues(venues);
    } catch (error) {
      console.error('Failed to load venues:', error);
    } finally {
      this.adminStore.setVenuesLoading(false);
    }
  }

  get filteredAndSortedVenues(): Venue[] {
    let filtered = this.venues();
    
    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((venue: Venue) => venue.status === this.filterStatus);
    }
    
    // Apply category filter
    if (this.filterCategory !== 'all') {
      filtered = filtered.filter((venue: Venue) => venue.category === this.filterCategory);
    }
    
    // Apply accessibility filter
    if (this.showOnlyAccessible) {
      filtered = filtered.filter((venue: Venue) => this.isAccessible(venue));
    }
    
    // Apply sorting
    filtered.sort((a: Venue, b: Venue) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'address':
          comparison = a.address.localeCompare(b.address);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }

  async updateVenueStatus(venueId: string, newStatus: 'draft' | 'published' | 'archived') {
    try {
      const venue = this.venues().find((v: Venue) => v.id === venueId);
      if (!venue) return;

      await this.venueService.updateVenue(venueId, { status: newStatus });
      
      // Update store
      this.adminStore.updateVenue(venueId, { status: newStatus, updatedAt: new Date() });
    } catch (error) {
      console.error('Failed to update venue status:', error);
    }
  }

  async deleteVenue(venueId: string) {
    if (!confirm('Are you sure you want to delete this venue?')) return;
    
    try {
      await this.venueService.deleteVenue(venueId);
      this.adminStore.removeVenue(venueId);
    } catch (error) {
      console.error('Failed to delete venue:', error);
    }
  }

  selectVenue(venue: Venue) {
    this.adminStore.setSelectedVenue(venue);
  }

  clearSelection() {
    this.adminStore.setSelectedVenue(null);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'medium';
      default: return 'medium';
    }
  }

  getCategoryDisplay(category: Venue['category']): string {
    const categoryMap: Record<string, string> = {
      'theatre': 'Theatre',
      'pub': 'Pub/Bar',
      'stadium': 'Stadium',
      'park': 'Park',
      'hall': 'Hall',
      'museum': 'Museum',
      'restaurant': 'Restaurant',
      'club': 'Club',
      'community': 'Community Center',
      'other': 'Other'
    };
    return categoryMap[category || 'other'] || 'Other';
  }

  isAccessible(venue: Venue): boolean {
    return !!(
      venue.accessibleEntrance ||
      venue.stepFreeAccess ||
      venue.elevatorAvailable ||
      venue.toilets?.accessibleToilet
    );
  }

  getAccessibilityFeatures(venue: Venue): string[] {
    const features: string[] = [];
    
    if (venue.accessibleEntrance) features.push('Accessible Entrance');
    if (venue.stepFreeAccess) features.push('Step-free Access');
    if (venue.elevatorAvailable) features.push('Elevator Available');
    if (venue.toilets?.accessibleToilet) features.push('Accessible Toilets');
    if (venue.toilets?.babyChanging) features.push('Baby Changing');
    if (venue.toilets?.genderNeutral) features.push('Gender Neutral Toilets');
    
    return features;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCoordinates(geo: { lat: number, lng: number }): string {
    return `${geo.lat.toFixed(6)}, ${geo.lng.toFixed(6)}`;
  }

  async createNewVenue() {
    await this.router.navigate(['/admin/venues/new']);
  }

  async editVenue(venue: Venue) {
    await this.router.navigate(['/admin/venues', venue.id, 'edit']);
  }
}