import { Injectable, inject } from '@angular/core';
import { VenueService } from '../../venues/data-access/venue.service';
import { Venue } from '../../venues/utils/venue.model';
import { TypeaheadOption } from '../ui/typeahead/typeahead.component';

/**
 * Service for venue lookup functionality in forms
 * Provides formatted venues for typeahead components
 */
@Injectable({
  providedIn: 'root'
})
export class VenueLookupService {
  private venueService = inject(VenueService);

  /**
   * Search venues and format them for typeahead component
   */
  async searchVenues(query: string): Promise<TypeaheadOption<Venue>[]> {
    try {
      const venues = await this.venueService.searchVenues(query);
      
      return venues.map(venue => ({
        value: venue,
        label: venue.name,
        description: `${venue.address}${venue.category ? ` • ${this.formatCategory(venue.category)}` : ''}`,
        disabled: venue.status !== 'published'
      }));
    } catch (error) {
      console.error('Error searching venues:', error);
      return [];
    }
  }

  /**
   * Get all published venues for dropdown
   */
  async getAllVenues(): Promise<TypeaheadOption<Venue>[]> {
    try {
      const venues = await this.venueService.getPublishedVenues();
      
      return venues.map(venue => ({
        value: venue,
        label: venue.name,
        description: `${venue.address}${venue.category ? ` • ${this.formatCategory(venue.category)}` : ''}`,
        disabled: false
      }));
    } catch (error) {
      console.error('Error getting all venues:', error);
      return [];
    }
  }

  /**
   * Get venue by ID and format for display
   */
  async getVenueOption(venueId: string): Promise<TypeaheadOption<Venue> | null> {
    try {
      const venue = await this.venueService.getVenue(venueId).toPromise();
      
      if (!venue) return null;
      
      return {
        value: venue,
        label: venue.name,
        description: `${venue.address}${venue.category ? ` • ${this.formatCategory(venue.category)}` : ''}`,
        disabled: venue.status !== 'published'
      };
    } catch (error) {
      console.error('Error getting venue:', error);
      return null;
    }
  }

  /**
   * Search venues with location-based filtering
   */
  async searchVenuesNearby(query: string, latitude: number, longitude: number, maxDistance: number = 10): Promise<TypeaheadOption<Venue>[]> {
    try {
      // First get nearby venues
      const nearbyVenues = await this.venueService.getVenuesNearby(latitude, longitude, maxDistance);
      
      // Then filter by search query
      const filteredVenues = nearbyVenues.filter(venue => 
        venue.name.toLowerCase().includes(query.toLowerCase()) ||
        venue.address.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredVenues.map(venue => ({
        value: venue,
        label: venue.name,
        description: `${venue.address} • ${this.formatDistance(this.calculateDistance(latitude, longitude, venue.geo.lat, venue.geo.lng))}`,
        disabled: venue.status !== 'published'
      }));
    } catch (error) {
      console.error('Error searching nearby venues:', error);
      return [];
    }
  }

  /**
   * Format venue category for display
   */
  private formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'theatre': 'Theatre',
      'pub': 'Pub',
      'stadium': 'Stadium',
      'park': 'Park',
      'hall': 'Hall',
      'museum': 'Museum',
      'restaurant': 'Restaurant',
      'club': 'Club',
      'community': 'Community Centre',
      'other': 'Other'
    };
    
    return categoryMap[category] || category;
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  private formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  }

  /**
   * Display function for venue values
   */
  displayVenue(venue: Venue): string {
    return venue.name;
  }

  /**
   * Compare function for venue values
   */
  compareVenues(a: Venue, b: Venue): boolean {
    return a.id === b.id;
  }
}