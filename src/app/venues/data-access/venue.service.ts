import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../../shared/data-access/firestore-crud.service';
import { Venue, VenueSummary } from '../utils/venue.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VenueService extends FirestoreCrudService<Venue> {
  protected path = 'venues';

  /**
   * Get a single venue by ID
   */
  getVenue(venueId: string): Observable<Venue | undefined> {
    return this.doc$<Venue>(`venues/${venueId}`);
  }

  /**
   * Get all venues for a specific user
   */
  async getUserVenues(userId: string): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => venue.createdBy === userId)
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all published venues (public directory)
   */
  async getPublishedVenues(): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => venue.status === 'published')
                   .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create a new venue with auto-generated ID
   */
  async createVenue(venueData: Omit<Venue, 'id'>): Promise<Venue> {
    const id = this.generateId();
    const venue: Venue = {
      id,
      ...venueData
    };
    await this.create(venue);
    return venue;
  }

  /**
   * Update an existing venue
   */
  async updateVenue(venueId: string, data: Partial<Venue>): Promise<void> {
    await this.update(venueId, {
      ...data,
      updatedAt: new Date()
    });
  }

  /**
   * Delete a venue
   */
  async deleteVenue(venueId: string): Promise<void> {
    await this.delete(venueId);
  }

  /**
   * Get venues by category
   */
  async getVenuesByCategory(category: Venue['category']): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => 
      venue.category === category && venue.status === 'published'
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get venues with accessibility features
   */
  async getAccessibleVenues(): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => 
      venue.status === 'published' && (
        venue.accessibleEntrance === true ||
        venue.stepFreeAccess === true ||
        venue.elevatorAvailable === true ||
        venue.toilets?.accessibleToilet === true
      )
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search venues by name or address
   */
  async searchVenues(searchTerm: string): Promise<Venue[]> {
    const allVenues = await this.getAll();
    const term = searchTerm.toLowerCase();
    return allVenues.filter(venue => 
      venue.status === 'published' && (
        venue.name.toLowerCase().includes(term) ||
        venue.address.toLowerCase().includes(term) ||
        venue.notesForVisitors?.toLowerCase().includes(term)
      )
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get venues within a certain distance (simplified proximity search)
   */
  async getVenuesNearby(centerLat: number, centerLng: number, maxDistance: number = 5): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => {
      if (venue.status !== 'published') return false;
      
      // Simple distance calculation (not precise but sufficient for local venues)
      const distance = this.calculateDistance(
        centerLat, centerLng, 
        venue.geo.lat, venue.geo.lng
      );
      return distance <= maxDistance;
    }).sort((a, b) => {
      // Sort by distance from center
      const distanceA = this.calculateDistance(centerLat, centerLng, a.geo.lat, a.geo.lng);
      const distanceB = this.calculateDistance(centerLat, centerLng, b.geo.lat, b.geo.lng);
      return distanceA - distanceB;
    });
  }

  /**
   * Get venue summary data for lists
   */
  async getVenueSummaries(): Promise<VenueSummary[]> {
    const allVenues = await this.getAll();
    return allVenues.map(venue => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      category: venue.category,
      status: venue.status
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get venues by language support
   */
  async getVenuesByLanguage(language: string): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => 
      venue.status === 'published' && 
      venue.languageSupport?.includes(language)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get venues by capacity range
   */
  async getVenuesByCapacity(minCapacity: number, maxCapacity?: number): Promise<Venue[]> {
    const allVenues = await this.getAll();
    return allVenues.filter(venue => {
      if (venue.status !== 'published' || !venue.capacity) return false;
      
      const venueCapacity = venue.capacity.maxCapacity;
      if (maxCapacity) {
        return venueCapacity >= minCapacity && venueCapacity <= maxCapacity;
      }
      return venueCapacity >= minCapacity;
    }).sort((a, b) => {
      const capacityA = a.capacity?.maxCapacity || 0;
      const capacityB = b.capacity?.maxCapacity || 0;
      return capacityA - capacityB;
    });
  }

  /**
   * Archive a venue (soft delete)
   */
  async archiveVenue(venueId: string): Promise<void> {
    await this.update(venueId, {
      status: 'archived',
      updatedAt: new Date()
    });
  }

  /**
   * Restore an archived venue
   */
  async restoreVenue(venueId: string): Promise<void> {
    await this.update(venueId, {
      status: 'published',
      updatedAt: new Date()
    });
  }

  /**
   * Generate a unique ID for new venues
   */
  private generateId(): string {
    return 'venue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
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
}