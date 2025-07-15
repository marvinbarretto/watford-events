import { Injectable, inject } from '@angular/core';
import { 
  calculateSimilarity, 
  findSimilarMatches,
  levenshteinDistance 
} from '@shared/utils/string-similarity.utils';
import { 
  Artist, 
  ArtistResolutionCandidate, 
  UnresolvedArtist 
} from '../utils/artist.model';
import { 
  Venue, 
  VenueResolutionCandidate, 
  UnresolvedVenue 
} from '../utils/venue.model';
import { EventModel } from '../../events/utils/event.model';
import { FirestoreService } from '@shared/data-access/firestore.service';

@Injectable({
  providedIn: 'root'
})
export class EntityResolutionService {
  private readonly firestoreService = inject(FirestoreService);

  /**
   * Find potential artist matches for a given name string
   */
  async findArtistMatches(
    name: string, 
    threshold: number = 0.7
  ): Promise<Array<{ artist: Artist; confidence: number; reason: string }>> {
    const artists = await this.firestoreService.getDocsWhere<Artist>('artists');
    const matches: Array<{ artist: Artist; confidence: number; reason: string }> = [];

    for (const artist of artists) {
      // Check exact name match
      if (artist.name.toLowerCase() === name.toLowerCase()) {
        matches.push({
          artist,
          confidence: 1.0,
          reason: 'Exact name match'
        });
        continue;
      }

      // Check alias matches
      for (const alias of artist.aliases) {
        if (alias.toLowerCase() === name.toLowerCase()) {
          matches.push({
            artist,
            confidence: 0.95,
            reason: 'Exact alias match'
          });
          break;
        }
      }

      // Check fuzzy name similarity
      const nameSimilarity = calculateSimilarity(name, artist.name);
      if (nameSimilarity >= threshold) {
        matches.push({
          artist,
          confidence: nameSimilarity * 0.9, // Slightly lower for fuzzy matches
          reason: `Name similarity: ${(nameSimilarity * 100).toFixed(1)}%`
        });
      }

      // Check fuzzy alias similarity
      for (const alias of artist.aliases) {
        const aliasSimilarity = calculateSimilarity(name, alias);
        if (aliasSimilarity >= threshold) {
          matches.push({
            artist,
            confidence: aliasSimilarity * 0.85, // Lower for alias fuzzy matches
            reason: `Alias similarity: ${(aliasSimilarity * 100).toFixed(1)}%`
          });
          break;
        }
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueMatches = matches.filter((match, index, self) => 
      index === self.findIndex(m => m.artist.id === match.artist.id)
    );

    return uniqueMatches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5 matches
  }

  /**
   * Find potential venue matches for a given name string
   */
  async findVenueMatches(
    name: string, 
    threshold: number = 0.7
  ): Promise<Array<{ venue: Venue; confidence: number; reason: string }>> {
    const venues = await this.firestoreService.getDocsWhere<Venue>('venues-entities');
    const matches: Array<{ venue: Venue; confidence: number; reason: string }> = [];

    for (const venue of venues) {
      // Check exact name match
      if (venue.name.toLowerCase() === name.toLowerCase()) {
        matches.push({
          venue,
          confidence: 1.0,
          reason: 'Exact name match'
        });
        continue;
      }

      // Check alias matches
      for (const alias of venue.aliases) {
        if (alias.toLowerCase() === name.toLowerCase()) {
          matches.push({
            venue,
            confidence: 0.95,
            reason: 'Exact alias match'
          });
          break;
        }
      }

      // Check fuzzy name similarity
      const nameSimilarity = calculateSimilarity(name, venue.name);
      if (nameSimilarity >= threshold) {
        matches.push({
          venue,
          confidence: nameSimilarity * 0.9,
          reason: `Name similarity: ${(nameSimilarity * 100).toFixed(1)}%`
        });
      }

      // Check fuzzy alias similarity
      for (const alias of venue.aliases) {
        const aliasSimilarity = calculateSimilarity(name, alias);
        if (aliasSimilarity >= threshold) {
          matches.push({
            venue,
            confidence: aliasSimilarity * 0.85,
            reason: `Alias similarity: ${(aliasSimilarity * 100).toFixed(1)}%`
          });
          break;
        }
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueMatches = matches.filter((match, index, self) => 
      index === self.findIndex(m => m.venue.id === match.venue.id)
    );

    return uniqueMatches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5 matches
  }

  /**
   * Find duplicate artist candidates that might need merging
   */
  async findDuplicateArtists(threshold: number = 0.8): Promise<ArtistResolutionCandidate[]> {
    const artists = await this.firestoreService.getDocsWhere<Artist>('artists');
    const candidates: ArtistResolutionCandidate[] = [];

    for (let i = 0; i < artists.length; i++) {
      for (let j = i + 1; j < artists.length; j++) {
        const artist1 = artists[i];
        const artist2 = artists[j];
        
        const analysis = this.analyzeArtistSimilarity(artist1, artist2);
        
        if (analysis.similarity >= threshold) {
          candidates.push({
            artist1,
            artist2,
            similarity: analysis.similarity,
            reasons: analysis.reasons
          });
        }
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find duplicate venue candidates that might need merging
   */
  async findDuplicateVenues(threshold: number = 0.8): Promise<VenueResolutionCandidate[]> {
    const venues = await this.firestoreService.getDocsWhere<Venue>('venues-entities');
    const candidates: VenueResolutionCandidate[] = [];

    for (let i = 0; i < venues.length; i++) {
      for (let j = i + 1; j < venues.length; j++) {
        const venue1 = venues[i];
        const venue2 = venues[j];
        
        const analysis = this.analyzeVenueSimilarity(venue1, venue2);
        
        if (analysis.similarity >= threshold) {
          candidates.push({
            venue1,
            venue2,
            similarity: analysis.similarity,
            reasons: analysis.reasons
          });
        }
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Extract unresolved artist names from events
   */
  async findUnresolvedArtists(): Promise<UnresolvedArtist[]> {
    const events = await this.firestoreService.getDocsWhere<EventModel>('events');
    const artists = await this.firestoreService.getDocsWhere<Artist>('artists');
    
    // Get all known artist names and aliases
    const knownNames = new Set<string>();
    artists.forEach(artist => {
      knownNames.add(artist.name.toLowerCase());
      artist.aliases.forEach(alias => knownNames.add(alias.toLowerCase()));
    });

    // Group events by organizer string
    const organizerGroups = new Map<string, string[]>();
    
    events.forEach(event => {
      if (event.organizer) {
        const organizer = event.organizer.trim();
        if (!knownNames.has(organizer.toLowerCase())) {
          if (!organizerGroups.has(organizer)) {
            organizerGroups.set(organizer, []);
          }
          organizerGroups.get(organizer)!.push(event.id);
        }
      }
    });

    // Convert to UnresolvedArtist objects with suggested matches
    const unresolved: UnresolvedArtist[] = [];
    
    for (const [name, eventIds] of organizerGroups.entries()) {
      const matches = await this.findArtistMatches(name, 0.6);
      
      unresolved.push({
        name,
        eventCount: eventIds.length,
        eventIds,
        suggestedMatches: matches.map(match => ({
          artistId: match.artist.id,
          confidence: match.confidence,
          reason: match.reason
        }))
      });
    }

    return unresolved.sort((a, b) => b.eventCount - a.eventCount);
  }

  /**
   * Extract unresolved venue names from events
   */
  async findUnresolvedVenues(): Promise<UnresolvedVenue[]> {
    const events = await this.firestoreService.getDocsWhere<EventModel>('events');
    const venues = await this.firestoreService.getDocsWhere<Venue>('venues-entities');
    
    // Get all known venue names and aliases
    const knownNames = new Set<string>();
    venues.forEach(venue => {
      knownNames.add(venue.name.toLowerCase());
      venue.aliases.forEach(alias => knownNames.add(alias.toLowerCase()));
    });

    // Group events by location string
    const locationGroups = new Map<string, string[]>();
    
    events.forEach(event => {
      if (event.location && !event.venueId) {
        const location = event.location.trim();
        if (!knownNames.has(location.toLowerCase())) {
          if (!locationGroups.has(location)) {
            locationGroups.set(location, []);
          }
          locationGroups.get(location)!.push(event.id);
        }
      }
    });

    // Convert to UnresolvedVenue objects with suggested matches
    const unresolved: UnresolvedVenue[] = [];
    
    for (const [name, eventIds] of locationGroups.entries()) {
      const matches = await this.findVenueMatches(name, 0.6);
      
      unresolved.push({
        name,
        eventCount: eventIds.length,
        eventIds,
        suggestedMatches: matches.map(match => ({
          venueId: match.venue.id,
          confidence: match.confidence,
          reason: match.reason
        }))
      });
    }

    return unresolved.sort((a, b) => b.eventCount - a.eventCount);
  }

  /**
   * Analyze similarity between two artists
   */
  private analyzeArtistSimilarity(artist1: Artist, artist2: Artist): {
    similarity: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let maxSimilarity = 0;

    // Compare names
    const nameSimilarity = calculateSimilarity(artist1.name, artist2.name);
    if (nameSimilarity > maxSimilarity) {
      maxSimilarity = nameSimilarity;
      reasons.push(`Name similarity: ${(nameSimilarity * 100).toFixed(1)}%`);
    }

    // Compare artist1 name with artist2 aliases
    artist2.aliases.forEach(alias => {
      const similarity = calculateSimilarity(artist1.name, alias);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        reasons.push(`Name-alias similarity: ${(similarity * 100).toFixed(1)}%`);
      }
    });

    // Compare artist2 name with artist1 aliases
    artist1.aliases.forEach(alias => {
      const similarity = calculateSimilarity(artist2.name, alias);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        reasons.push(`Alias-name similarity: ${(similarity * 100).toFixed(1)}%`);
      }
    });

    // Compare aliases with aliases
    artist1.aliases.forEach(alias1 => {
      artist2.aliases.forEach(alias2 => {
        const similarity = calculateSimilarity(alias1, alias2);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          reasons.push(`Alias similarity: ${(similarity * 100).toFixed(1)}%`);
        }
      });
    });

    return {
      similarity: maxSimilarity,
      reasons: reasons.slice(0, 3) // Keep top 3 reasons
    };
  }

  /**
   * Analyze similarity between two venues
   */
  private analyzeVenueSimilarity(venue1: Venue, venue2: Venue): {
    similarity: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let maxSimilarity = 0;

    // Compare names
    const nameSimilarity = calculateSimilarity(venue1.name, venue2.name);
    if (nameSimilarity > maxSimilarity) {
      maxSimilarity = nameSimilarity;
      reasons.push(`Name similarity: ${(nameSimilarity * 100).toFixed(1)}%`);
    }

    // Compare addresses if both exist
    if (venue1.address && venue2.address) {
      const addressSimilarity = calculateSimilarity(venue1.address, venue2.address);
      if (addressSimilarity > 0.8) {
        maxSimilarity = Math.max(maxSimilarity, addressSimilarity);
        reasons.push(`Address similarity: ${(addressSimilarity * 100).toFixed(1)}%`);
      }
    }

    // Compare venue1 name with venue2 aliases
    venue2.aliases.forEach(alias => {
      const similarity = calculateSimilarity(venue1.name, alias);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        reasons.push(`Name-alias similarity: ${(similarity * 100).toFixed(1)}%`);
      }
    });

    // Compare venue2 name with venue1 aliases
    venue1.aliases.forEach(alias => {
      const similarity = calculateSimilarity(venue2.name, alias);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        reasons.push(`Alias-name similarity: ${(similarity * 100).toFixed(1)}%`);
      }
    });

    // Compare aliases with aliases
    venue1.aliases.forEach(alias1 => {
      venue2.aliases.forEach(alias2 => {
        const similarity = calculateSimilarity(alias1, alias2);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          reasons.push(`Alias similarity: ${(similarity * 100).toFixed(1)}%`);
        }
      });
    });

    return {
      similarity: maxSimilarity,
      reasons: reasons.slice(0, 3) // Keep top 3 reasons
    };
  }
}