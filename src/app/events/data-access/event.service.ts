import { Injectable, inject } from '@angular/core';
import { FirestoreCrudService } from '../../shared/data-access/firestore-crud.service';
import { EventModel } from '../utils/event.model';
import { Observable, combineLatest, map } from 'rxjs';
import { VenueService } from '../../venues/data-access/venue.service';
import { Venue } from '../../venues/utils/venue.model';
import { generateUniqueSlug } from '../../shared/utils/slug.utils';

/**
 * Enhanced event with venue data
 */
export type EventWithVenue = EventModel & {
  venue?: Venue;
  distance?: number; // Distance in km from user location
};

@Injectable({
  providedIn: 'root',
})
export class EventService extends FirestoreCrudService<EventModel> {
  protected path = 'events';
  
  private venueService = inject(VenueService);

  /**
   * Get a single event by ID
   */
  getEvent(eventId: string): Observable<EventModel | undefined> {
    return this.doc$<EventModel>(`events/${eventId}`);
  }

  /**
   * Get a single event by slug
   */
  async getEventBySlug(slug: string): Promise<EventModel | null> {
    const allEvents = await this.getAll();
    const event = allEvents.find(e => e.slug === slug);
    return event || null;
  }

  /**
   * Get all events for a specific user
   */
  async getUserEvents(userId: string): Promise<EventModel[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => event.createdBy === userId)
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all published events (public feed)
   */
  async getPublishedEvents(): Promise<EventModel[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => event.status === 'published')
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Create a new event with auto-generated ID and slug
   */
  async createEvent(eventData: Omit<EventModel, 'id'>): Promise<EventModel> {
    const id = this.generateId();
    
    // Generate unique slug if not provided
    let slug = eventData.slug;
    if (!slug) {
      const allEvents = await this.getAll();
      const existingSlugs = allEvents.map(e => e.slug).filter(Boolean) as string[];
      slug = generateUniqueSlug(eventData.title, existingSlugs);
    }
    
    const event: EventModel = {
      id,
      ...eventData,
      slug
    };
    await this.create(event);
    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, data: Partial<EventModel>): Promise<void> {
    await this.update(eventId, {
      ...data,
      updatedAt: new Date()
    });
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.delete(eventId);
  }

  /**
   * Get events by location (for discovery)
   */
  async getEventsByLocation(location: string): Promise<EventModel[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => 
      event.location === location && event.status === 'published'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(): Promise<EventModel[]> {
    const now = new Date();
    const allEvents = await this.getAll();
    return allEvents.filter(event => 
      new Date(event.date) >= now && event.status === 'published'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Search events by title or description
   */
  async searchEvents(searchTerm: string): Promise<EventModel[]> {
    const allEvents = await this.getAll();
    const term = searchTerm.toLowerCase();
    return allEvents.filter(event => 
      event.status === 'published' && (
        event.title.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term)
      )
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get events with venue information
   */
  async getEventsWithVenues(): Promise<EventWithVenue[]> {
    const [events, venues] = await Promise.all([
      this.getPublishedEvents(),
      this.venueService.getPublishedVenues()
    ]);

    const venueMap = new Map(venues.map(venue => [venue.id, venue]));

    return events.map(event => ({
      ...event,
      venue: event.venueId ? venueMap.get(event.venueId) : undefined
    }));
  }

  /**
   * Get events by venue ID
   */
  async getEventsByVenue(venueId: string): Promise<EventWithVenue[]> {
    const [events, venue] = await Promise.all([
      this.getPublishedEvents(),
      this.venueService.getVenue(venueId).toPromise()
    ]);

    const venueEvents = events.filter(event => event.venueId === venueId);
    
    return venueEvents.map(event => ({
      ...event,
      venue: venue
    }));
  }

  /**
   * Get events within a geographic radius
   */
  async getEventsNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<EventWithVenue[]> {
    const [events, venues] = await Promise.all([
      this.getPublishedEvents(),
      this.venueService.getVenuesNearby(latitude, longitude, radiusKm)
    ]);

    const nearbyVenueIds = new Set(venues.map(venue => venue.id));
    const venueMap = new Map(venues.map(venue => [venue.id, venue]));

    // Filter events that are at nearby venues
    const nearbyEvents = events.filter(event => 
      event.venueId && nearbyVenueIds.has(event.venueId)
    );

    return nearbyEvents.map(event => {
      const venue = event.venueId ? venueMap.get(event.venueId) : undefined;
      const distance = venue ? this.calculateDistance(
        latitude, longitude, venue.geo.lat, venue.geo.lng
      ) : undefined;

      return {
        ...event,
        venue,
        distance
      };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * Search events with venue information
   */
  async searchEventsWithVenues(searchTerm: string): Promise<EventWithVenue[]> {
    const [events, venues] = await Promise.all([
      this.searchEvents(searchTerm),
      this.venueService.searchVenues(searchTerm)
    ]);

    const venueMap = new Map(venues.map(venue => [venue.id, venue]));
    const venueIds = new Set(venues.map(venue => venue.id));

    // Include events that match search OR are at matching venues
    const allEvents = await this.getPublishedEvents();
    const additionalEvents = allEvents.filter(event => 
      event.venueId && venueIds.has(event.venueId) &&
      !events.some(e => e.id === event.id) // Don't duplicate events
    );

    const combinedEvents = [...events, ...additionalEvents];

    return combinedEvents.map(event => ({
      ...event,
      venue: event.venueId ? venueMap.get(event.venueId) : undefined
    }));
  }

  /**
   * Get events by location (enhanced with venue support)
   */
  async getEventsByLocationEnhanced(location: string): Promise<EventWithVenue[]> {
    const [events, venues] = await Promise.all([
      this.getEventsByLocation(location),
      this.venueService.searchVenues(location)
    ]);

    const venueMap = new Map(venues.map(venue => [venue.id, venue]));

    return events.map(event => ({
      ...event,
      venue: event.venueId ? venueMap.get(event.venueId) : undefined
    }));
  }

  /**
   * Get upcoming events with venues
   */
  async getUpcomingEventsWithVenues(): Promise<EventWithVenue[]> {
    const [events, venues] = await Promise.all([
      this.getUpcomingEvents(),
      this.venueService.getPublishedVenues()
    ]);

    const venueMap = new Map(venues.map(venue => [venue.id, venue]));

    return events.map(event => ({
      ...event,
      venue: event.venueId ? venueMap.get(event.venueId) : undefined
    }));
  }

  /**
   * Get events by accessibility requirements
   */
  async getAccessibleEvents(): Promise<EventWithVenue[]> {
    const [events, accessibleVenues] = await Promise.all([
      this.getPublishedEvents(),
      this.venueService.getAccessibleVenues()
    ]);

    const accessibleVenueIds = new Set(accessibleVenues.map(venue => venue.id));
    const venueMap = new Map(accessibleVenues.map(venue => [venue.id, venue]));

    const accessibleEvents = events.filter(event => 
      event.venueId && accessibleVenueIds.has(event.venueId)
    );

    return accessibleEvents.map(event => ({
      ...event,
      venue: event.venueId ? venueMap.get(event.venueId) : undefined
    }));
  }

  /**
   * Get events by venue category
   */
  async getEventsByVenueCategory(category: Venue['category']): Promise<EventWithVenue[]> {
    const [events, venues] = await Promise.all([
      this.getPublishedEvents(),
      this.venueService.getVenuesByCategory(category)
    ]);

    const categoryVenueIds = new Set(venues.map(venue => venue.id));
    const venueMap = new Map(venues.map(venue => [venue.id, venue]));

    const categoryEvents = events.filter(event => 
      event.venueId && categoryVenueIds.has(event.venueId)
    );

    return categoryEvents.map(event => ({
      ...event,
      venue: event.venueId ? venueMap.get(event.venueId) : undefined
    }));
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

  /**
   * Get all mock events (for development/debugging)
   */
  async getMockEvents(): Promise<EventModel[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => event.isMockEvent === true);
  }

  /**
   * Delete all mock events while preserving real events (development only)
   * Uses individual deletes with error handling
   */
  async deleteMockEvents(): Promise<{ deleted: number; errors: string[] }> {
    const mockEvents = await this.getMockEvents();
    const results = {
      deleted: 0,
      errors: [] as string[]
    };

    for (const event of mockEvents) {
      try {
        await this.delete(event.id);
        results.deleted++;
      } catch (error: any) {
        results.errors.push(`Failed to delete ${event.title}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Batch delete all mock events (admin-only, no permission checks)
   * Cost-efficient: single write operation vs N individual writes
   */
  async deleteMockEventsBatch(): Promise<{ deleted: number }> {
    const mockEvents = await this.getMockEvents();
    
    if (mockEvents.length === 0) {
      return { deleted: 0 };
    }

    // Create document paths for batch deletion
    const documentPaths = mockEvents.map(event => `${this.path}/${event.id}`);
    
    // Execute batch operation using inherited FirestoreService method (single Firestore write)
    await this.batchDelete(documentPaths);
    
    return { deleted: mockEvents.length };
  }

  /**
   * Generate a unique ID for new events
   */
  private generateId(): string {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}