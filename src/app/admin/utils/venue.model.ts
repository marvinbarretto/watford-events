export interface Venue {
  id: string;
  name: string;          // Canonical name
  aliases: string[];     // All name variations
  eventIds: string[];    // Events using this venue
  address?: string;      // Physical address
  website?: string;      // Venue website
  metadata: {
    firstSeen: Date;
    lastUpdated: Date;
    confidence: number;      // Confidence in entity accuracy (0-1)
    mergedFrom?: string[];   // Track merged entities for audit trail
    source: 'manual' | 'llm' | 'scraper' | 'import'; // How this entity was created
  };
}

export interface VenueCreateRequest {
  name: string;
  aliases?: string[];
  address?: string;
  website?: string;
  source?: 'manual' | 'llm' | 'scraper' | 'import';
}

export interface VenueUpdateRequest {
  name?: string;
  aliases?: string[];
  address?: string;
  website?: string;
}

export interface VenueMergeRequest {
  targetVenueId: string;
  sourceVenueIds: string[];
  newCanonicalName?: string;
}

export interface UnresolvedVenue {
  name: string;           // The string value from events
  eventCount: number;     // How many events use this string
  eventIds: string[];     // Which events use this string
  suggestedMatches?: {    // Potential existing venues to link to
    venueId: string;
    confidence: number;
    reason: string;       // Why this match was suggested
  }[];
}

export interface VenueResolutionCandidate {
  venue1: Venue;
  venue2: Venue;
  similarity: number;     // 0-1 similarity score
  reasons: string[];      // Why these might be duplicates
}

// Factory functions for creating entities with defaults
export function createVenue(request: VenueCreateRequest): Omit<Venue, 'id'> {
  return {
    name: request.name,
    aliases: request.aliases || [],
    eventIds: [],
    address: request.address,
    website: request.website,
    metadata: {
      firstSeen: new Date(),
      lastUpdated: new Date(),
      confidence: 1.0,
      source: request.source || 'manual'
    }
  };
}

export function createUnresolvedVenue(
  name: string, 
  eventIds: string[]
): UnresolvedVenue {
  return {
    name,
    eventCount: eventIds.length,
    eventIds,
    suggestedMatches: []
  };
}