import { Injectable, inject } from '@angular/core';
import { VenueService } from '../../venues/data-access/venue.service';
import { Venue } from '../../venues/utils/venue.model';
import { TypeaheadOption } from '../ui/typeahead/typeahead.component';
import { findBestMatch, findSimilarMatches } from '../utils/string-similarity.utils';

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

  /**
   * Find similar venues using fuzzy matching
   * @param query The search query
   * @param threshold Minimum similarity score (default: 0.6)
   * @returns Best matching venue with similarity score, or null if none found
   */
  async findSimilarVenues(query: string, threshold: number = 0.6): Promise<{
    venue: Venue;
    similarity: number;
  } | null> {
    try {
      const allVenues = await this.venueService.getPublishedVenues();
      const venueNames = allVenues.map(v => v.name);
      
      const bestMatch = findBestMatch(query, venueNames, threshold);
      
      if (!bestMatch) return null;
      
      const matchingVenue = allVenues.find(v => v.name === bestMatch.match);
      
      return matchingVenue ? {
        venue: matchingVenue,
        similarity: bestMatch.similarity
      } : null;
    } catch (error) {
      console.error('Error finding similar venues:', error);
      return null;
    }
  }

  /**
   * Analyze venue input and determine inference type
   * @param query The user input
   * @returns Inference information about the venue
   */
  async analyzeVenueInput(query: string): Promise<{
    type: 'exact-match' | 'close-match' | 'new-venue';
    venue?: Venue;
    similarity?: number;
    message: string;
  }> {
    if (!query || query.length < 2) {
      return {
        type: 'new-venue',
        message: ''
      };
    }

    try {
      // First check for exact matches
      const exactMatches = await this.venueService.searchVenues(query);
      if (exactMatches.length > 0) {
        return {
          type: 'exact-match',
          venue: exactMatches[0],
          message: ''
        };
      }

      // Then check for similar matches
      const similarMatch = await this.findSimilarVenues(query, 0.6);
      if (similarMatch) {
        return {
          type: 'close-match',
          venue: similarMatch.venue,
          similarity: similarMatch.similarity,
          message: `Similar to ${similarMatch.venue.name}`
        };
      }

      // No matches found - it's a new venue
      return {
        type: 'new-venue',
        message: 'New/unknown venue'
      };
    } catch (error) {
      console.error('Error analyzing venue input:', error);
      return {
        type: 'new-venue',
        message: 'New/unknown venue'
      };
    }
  }
}