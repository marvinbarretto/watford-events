import { Injectable, inject } from '@angular/core';
import { FirestoreCrudService } from '@shared/data-access/firestore-crud.service';
import { 
  Venue, 
  VenueCreateRequest, 
  VenueUpdateRequest, 
  VenueMergeRequest,
  createVenue 
} from '../utils/venue.model';
import { EventModel } from '../../events/utils/event.model';

@Injectable({
  providedIn: 'root'
})
export class VenueEntityService extends FirestoreCrudService<Venue> {
  protected path = 'venues-entities';

  /**
   * Get all venue entities
   */
  async getVenues(): Promise<Venue[]> {
    return this.getAll();
  }

  /**
   * Get venue by ID
   */
  async getVenue(id: string): Promise<Venue | null> {
    try {
      return await this.getById(id);
    } catch (error) {
      console.error('Error getting venue:', error);
      return null;
    }
  }

  /**
   * Create a new venue entity
   */
  async createVenue(request: VenueCreateRequest): Promise<Venue> {
    const venueData = createVenue(request);
    const id = this.generateId();
    const venueWithId = { ...venueData, id };
    
    await this.create(venueWithId);
    return venueWithId;
  }

  private generateId(): string {
    return 'venue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update an existing venue
   */
  async updateVenue(id: string, updates: VenueUpdateRequest): Promise<void> {
    await this.update(id, updates);
    await this.updateDoc(`${this.path}/${id}`, { 'metadata.lastUpdated': new Date() });
  }

  /**
   * Delete a venue (only if no events reference it)
   */
  async deleteVenue(id: string): Promise<void> {
    const venue = await this.getVenue(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    if (venue.eventIds.length > 0) {
      throw new Error('Cannot delete venue with associated events');
    }

    await this.delete(id);
  }

  /**
   * Add an alias to a venue
   */
  async addAlias(id: string, alias: string): Promise<void> {
    const venue = await this.getVenue(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    if (!venue.aliases.includes(alias)) {
      const updatedAliases = [...venue.aliases, alias];
      await this.updateVenue(id, { aliases: updatedAliases });
    }
  }

  /**
   * Remove an alias from a venue
   */
  async removeAlias(id: string, alias: string): Promise<void> {
    const venue = await this.getVenue(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const updatedAliases = venue.aliases.filter(a => a !== alias);
    await this.updateVenue(id, { aliases: updatedAliases });
  }

  /**
   * Link an event to a venue
   */
  async linkEvent(venueId: string, eventId: string): Promise<void> {
    const venue = await this.getVenue(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    if (!venue.eventIds.includes(eventId)) {
      const updatedEventIds = [...venue.eventIds, eventId];
      await this.update(venueId, { eventIds: updatedEventIds });
      await this.updateDoc(`${this.path}/${venueId}`, { 'metadata.lastUpdated': new Date() });

      // Also update the event to reference this venue
      await this.updateEventVenueReference(eventId, venueId, 'add');
    }
  }

  /**
   * Unlink an event from a venue
   */
  async unlinkEvent(venueId: string, eventId: string): Promise<void> {
    const venue = await this.getVenue(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const updatedEventIds = venue.eventIds.filter(id => id !== eventId);
    await this.update(venueId, { eventIds: updatedEventIds });
    await this.updateDoc(`${this.path}/${venueId}`, { 'metadata.lastUpdated': new Date() });

    // Also update the event to remove this venue reference
    await this.updateEventVenueReference(eventId, venueId, 'remove');
  }

  /**
   * Merge multiple venues into one
   */
  async mergeVenues(request: VenueMergeRequest): Promise<Venue> {
    const { targetVenueId, sourceVenueIds, newCanonicalName } = request;
    
    // Get target venue
    const targetVenue = await this.getVenue(targetVenueId);
    if (!targetVenue) {
      throw new Error('Target venue not found');
    }

    // Get source venues
    const sourceVenues: Venue[] = [];
    for (const sourceId of sourceVenueIds) {
      const venue = await this.getVenue(sourceId);
      if (venue) {
        sourceVenues.push(venue);
      }
    }

    if (sourceVenues.length === 0) {
      throw new Error('No source venues found');
    }

    // Merge data
    const mergedAliases = new Set([
      ...targetVenue.aliases,
      targetVenue.name, // Add original name as alias if changing canonical name
    ]);

    const mergedEventIds = new Set([...targetVenue.eventIds]);
    const mergedFrom = [...(targetVenue.metadata.mergedFrom || [])];

    // Merge addresses and websites (prefer non-empty values)
    let mergedAddress = targetVenue.address;
    let mergedWebsite = targetVenue.website;

    sourceVenues.forEach(venue => {
      // Add source name and aliases
      mergedAliases.add(venue.name);
      venue.aliases.forEach(alias => mergedAliases.add(alias));
      
      // Add source event IDs
      venue.eventIds.forEach(id => mergedEventIds.add(id));
      
      // Merge address and website (prefer first non-empty value)
      if (!mergedAddress && venue.address) {
        mergedAddress = venue.address;
      }
      if (!mergedWebsite && venue.website) {
        mergedWebsite = venue.website;
      }
      
      // Track merge history
      mergedFrom.push(venue.id);
      if (venue.metadata.mergedFrom) {
        mergedFrom.push(...venue.metadata.mergedFrom);
      }
    });

    // Update target venue
    const updates: VenueUpdateRequest = {
      name: newCanonicalName || targetVenue.name,
      aliases: Array.from(mergedAliases).filter(alias => 
        alias !== (newCanonicalName || targetVenue.name)
      ),
      address: mergedAddress,
      website: mergedWebsite
    };

    await this.update(targetVenueId, {
      ...updates,
      eventIds: Array.from(mergedEventIds)
    });
    
    await this.updateDoc(`${this.path}/${targetVenueId}`, {
      'metadata.lastUpdated': new Date(),
      'metadata.mergedFrom': mergedFrom
    });

    // Update all events to reference the target venue
    for (const eventId of mergedEventIds) {
      await this.updateEventVenueReferencesAfterMerge(
        eventId, 
        targetVenueId, 
        sourceVenueIds
      );
    }

    // Delete source venues
    for (const sourceId of sourceVenueIds) {
      await this.delete(sourceId);
    }

    // Return updated target venue
    const updatedVenue = await this.getVenue(targetVenueId);
    if (!updatedVenue) {
      throw new Error('Failed to retrieve merged venue');
    }
    
    return updatedVenue;
  }

  /**
   * Search venues by name or alias
   */
  async searchVenues(query: string): Promise<Venue[]> {
    const venues = await this.getVenues();
    const queryLower = query.toLowerCase();
    
    return venues.filter(venue => 
      venue.name.toLowerCase().includes(queryLower) ||
      venue.aliases.some(alias => alias.toLowerCase().includes(queryLower)) ||
      (venue.address && venue.address.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Get venues by event IDs
   */
  async getVenuesByEvents(eventIds: string[]): Promise<Venue[]> {
    const venues = await this.getVenues();
    return venues.filter(venue => 
      venue.eventIds.some(eventId => eventIds.includes(eventId))
    );
  }

  /**
   * Update event's venue reference (add/remove venueEntityId)
   */
  private async updateEventVenueReference(
    eventId: string, 
    venueId: string, 
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      const event = await this.getDocByPath<EventModel>(`events/${eventId}`);
      if (!event) return;

      // Note: We'll add venueEntityId field to events later
      // For now, just update venueId to maintain compatibility
      if (action === 'add') {
        await this.updateDoc(`events/${eventId}`, {
          venueEntityId: venueId
        });
      } else {
        await this.updateDoc(`events/${eventId}`, {
          venueEntityId: null
        });
      }
    } catch (error) {
      console.error(`Error updating event ${eventId} venue reference:`, error);
    }
  }

  /**
   * Update event's venue references after merge operation
   */
  private async updateEventVenueReferencesAfterMerge(
    eventId: string,
    targetVenueId: string,
    sourceVenueIds: string[]
  ): Promise<void> {
    try {
      const event = await this.getDocByPath<EventModel>(`events/${eventId}`);
      if (!event) return;

      await this.updateDoc(`events/${eventId}`, {
        venueEntityId: targetVenueId
      });
    } catch (error) {
      console.error(`Error updating event ${eventId} after venue merge:`, error);
    }
  }
}