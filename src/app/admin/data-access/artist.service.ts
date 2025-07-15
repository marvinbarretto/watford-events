import { Injectable, inject } from '@angular/core';
import { FirestoreCrudService } from '@shared/data-access/firestore-crud.service';
import { 
  Artist, 
  ArtistCreateRequest, 
  ArtistUpdateRequest, 
  ArtistMergeRequest,
  createArtist 
} from '../utils/artist.model';
import { EventModel } from '../../events/utils/event.model';

@Injectable({
  providedIn: 'root'
})
export class ArtistService extends FirestoreCrudService<Artist> {
  protected path = 'artists';

  /**
   * Get all artists
   */
  async getArtists(): Promise<Artist[]> {
    return this.getAll();
  }

  /**
   * Get artist by ID
   */
  async getArtist(id: string): Promise<Artist | null> {
    try {
      return await this.getById(id);
    } catch (error) {
      console.error('Error getting artist:', error);
      return null;
    }
  }

  /**
   * Create a new artist
   */
  async createArtist(request: ArtistCreateRequest): Promise<Artist> {
    const artistData = createArtist(request);
    const id = this.generateId();
    const artistWithId = { ...artistData, id };
    
    await this.create(artistWithId);
    return artistWithId;
  }

  private generateId(): string {
    return 'artist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update an existing artist
   */
  async updateArtist(id: string, updates: ArtistUpdateRequest): Promise<void> {
    await this.update(id, updates);
    await this.updateDoc(`${this.path}/${id}`, { 'metadata.lastUpdated': new Date() });
  }

  /**
   * Delete an artist (only if no events reference it)
   */
  async deleteArtist(id: string): Promise<void> {
    const artist = await this.getArtist(id);
    if (!artist) {
      throw new Error('Artist not found');
    }

    if (artist.eventIds.length > 0) {
      throw new Error('Cannot delete artist with associated events');
    }

    await this.delete(id);
  }

  /**
   * Add an alias to an artist
   */
  async addAlias(id: string, alias: string): Promise<void> {
    const artist = await this.getArtist(id);
    if (!artist) {
      throw new Error('Artist not found');
    }

    if (!artist.aliases.includes(alias)) {
      const updatedAliases = [...artist.aliases, alias];
      await this.updateArtist(id, { aliases: updatedAliases });
    }
  }

  /**
   * Remove an alias from an artist
   */
  async removeAlias(id: string, alias: string): Promise<void> {
    const artist = await this.getArtist(id);
    if (!artist) {
      throw new Error('Artist not found');
    }

    const updatedAliases = artist.aliases.filter(a => a !== alias);
    await this.updateArtist(id, { aliases: updatedAliases });
  }

  /**
   * Link an event to an artist
   */
  async linkEvent(artistId: string, eventId: string): Promise<void> {
    const artist = await this.getArtist(artistId);
    if (!artist) {
      throw new Error('Artist not found');
    }

    if (!artist.eventIds.includes(eventId)) {
      const updatedEventIds = [...artist.eventIds, eventId];
      await this.update(artistId, { eventIds: updatedEventIds });
      await this.updateDoc(`${this.path}/${artistId}`, { 'metadata.lastUpdated': new Date() });

      // Also update the event to reference this artist
      await this.updateEventArtistReference(eventId, artistId, 'add');
    }
  }

  /**
   * Unlink an event from an artist
   */
  async unlinkEvent(artistId: string, eventId: string): Promise<void> {
    const artist = await this.getArtist(artistId);
    if (!artist) {
      throw new Error('Artist not found');
    }

    const updatedEventIds = artist.eventIds.filter(id => id !== eventId);
    await this.update(artistId, { eventIds: updatedEventIds });
    await this.updateDoc(`${this.path}/${artistId}`, { 'metadata.lastUpdated': new Date() });

    // Also update the event to remove this artist reference
    await this.updateEventArtistReference(eventId, artistId, 'remove');
  }

  /**
   * Merge multiple artists into one
   */
  async mergeArtists(request: ArtistMergeRequest): Promise<Artist> {
    const { targetArtistId, sourceArtistIds, newCanonicalName } = request;
    
    // Get target artist
    const targetArtist = await this.getArtist(targetArtistId);
    if (!targetArtist) {
      throw new Error('Target artist not found');
    }

    // Get source artists
    const sourceArtists: Artist[] = [];
    for (const sourceId of sourceArtistIds) {
      const artist = await this.getArtist(sourceId);
      if (artist) {
        sourceArtists.push(artist);
      }
    }

    if (sourceArtists.length === 0) {
      throw new Error('No source artists found');
    }

    // Merge data
    const mergedAliases = new Set([
      ...targetArtist.aliases,
      targetArtist.name, // Add original name as alias if changing canonical name
    ]);

    const mergedEventIds = new Set([...targetArtist.eventIds]);
    const mergedFrom = [...(targetArtist.metadata.mergedFrom || [])];

    sourceArtists.forEach(artist => {
      // Add source name and aliases
      mergedAliases.add(artist.name);
      artist.aliases.forEach(alias => mergedAliases.add(alias));
      
      // Add source event IDs
      artist.eventIds.forEach(id => mergedEventIds.add(id));
      
      // Track merge history
      mergedFrom.push(artist.id);
      if (artist.metadata.mergedFrom) {
        mergedFrom.push(...artist.metadata.mergedFrom);
      }
    });

    // Update target artist
    const updates: ArtistUpdateRequest = {
      name: newCanonicalName || targetArtist.name,
      aliases: Array.from(mergedAliases).filter(alias => 
        alias !== (newCanonicalName || targetArtist.name)
      )
    };

    await this.update(targetArtistId, {
      ...updates,
      eventIds: Array.from(mergedEventIds)
    });
    
    await this.updateDoc(`${this.path}/${targetArtistId}`, {
      'metadata.lastUpdated': new Date(),
      'metadata.mergedFrom': mergedFrom
    });

    // Update all events to reference the target artist
    for (const eventId of mergedEventIds) {
      await this.updateEventArtistReferencesAfterMerge(
        eventId, 
        targetArtistId, 
        sourceArtistIds
      );
    }

    // Delete source artists
    for (const sourceId of sourceArtistIds) {
      await this.delete(sourceId);
    }

    // Return updated target artist
    const updatedArtist = await this.getArtist(targetArtistId);
    if (!updatedArtist) {
      throw new Error('Failed to retrieve merged artist');
    }
    
    return updatedArtist;
  }

  /**
   * Search artists by name or alias
   */
  async searchArtists(query: string): Promise<Artist[]> {
    const artists = await this.getArtists();
    const queryLower = query.toLowerCase();
    
    return artists.filter(artist => 
      artist.name.toLowerCase().includes(queryLower) ||
      artist.aliases.some(alias => alias.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Get artists by event IDs
   */
  async getArtistsByEvents(eventIds: string[]): Promise<Artist[]> {
    const artists = await this.getArtists();
    return artists.filter(artist => 
      artist.eventIds.some(eventId => eventIds.includes(eventId))
    );
  }

  /**
   * Update event's artist reference (add/remove organizerIds)
   */
  private async updateEventArtistReference(
    eventId: string, 
    artistId: string, 
    action: 'add' | 'remove'
  ): Promise<void> {
    try {
      const event = await this.getDocByPath<EventModel>(`events/${eventId}`);
      if (!event) return;

      if (action === 'add') {
        await this.updateDoc(`events/${eventId}`, {
          organizer: artistId
        });
      } else {
        await this.updateDoc(`events/${eventId}`, {
          organizer: null
        });
      }
    } catch (error) {
      console.error(`Error updating event ${eventId} artist reference:`, error);
    }
  }

  /**
   * Update event's artist references after merge operation
   */
  private async updateEventArtistReferencesAfterMerge(
    eventId: string,
    targetArtistId: string,
    sourceArtistIds: string[]
  ): Promise<void> {
    try {
      const event = await this.getDocByPath<EventModel>(`events/${eventId}`);
      if (!event) return;

      // If the current organizer is one of the source artists being merged,
      // update it to the target artist
      if (event.organizer && sourceArtistIds.includes(event.organizer)) {
        await this.updateDoc(`events/${eventId}`, {
          organizer: targetArtistId
        });
      }
    } catch (error) {
      console.error(`Error updating event ${eventId} after artist merge:`, error);
    }
  }
}