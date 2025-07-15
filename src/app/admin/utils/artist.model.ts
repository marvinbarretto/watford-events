export interface Artist {
  id: string;
  name: string;          // Canonical name
  aliases: string[];     // All name variations
  eventIds: string[];    // Events referencing this artist
  youtubeLink?: string;  // Music integration
  metadata: {
    firstSeen: Date;
    lastUpdated: Date;
    confidence: number;      // Confidence in entity accuracy (0-1)
    mergedFrom?: string[];   // Track merged entities for audit trail
    source: 'manual' | 'llm' | 'scraper' | 'import'; // How this entity was created
  };
}

export interface ArtistCreateRequest {
  name: string;
  aliases?: string[];
  youtubeLink?: string;
  source?: 'manual' | 'llm' | 'scraper' | 'import';
}

export interface ArtistUpdateRequest {
  name?: string;
  aliases?: string[];
  youtubeLink?: string;
}

export interface ArtistMergeRequest {
  targetArtistId: string;
  sourceArtistIds: string[];
  newCanonicalName?: string;
}

export interface UnresolvedArtist {
  name: string;           // The string value from events
  eventCount: number;     // How many events use this string
  eventIds: string[];     // Which events use this string
  suggestedMatches?: {    // Potential existing artists to link to
    artistId: string;
    confidence: number;
    reason: string;       // Why this match was suggested
  }[];
}

export interface ArtistResolutionCandidate {
  artist1: Artist;
  artist2: Artist;
  similarity: number;     // 0-1 similarity score
  reasons: string[];      // Why these might be duplicates
}

// Factory functions for creating entities with defaults
export function createArtist(request: ArtistCreateRequest): Omit<Artist, 'id'> {
  return {
    name: request.name,
    aliases: request.aliases || [],
    eventIds: [],
    youtubeLink: request.youtubeLink,
    metadata: {
      firstSeen: new Date(),
      lastUpdated: new Date(),
      confidence: 1.0,
      source: request.source || 'manual'
    }
  };
}

export function createUnresolvedArtist(
  name: string, 
  eventIds: string[]
): UnresolvedArtist {
  return {
    name,
    eventCount: eventIds.length,
    eventIds,
    suggestedMatches: []
  };
}