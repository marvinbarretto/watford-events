/**
 * Individual space/room within a venue
 */
export type VenueSpace = {
  id: string;
  name: string;
  
  // Capacity for this specific space
  capacity: {
    maxCapacity: number;
    recommendedCapacity: number;
  };
  
  // Space-specific accessibility
  accessibleEntrance?: boolean;
  stepFreeAccess?: boolean;
  
  // Space-specific amenities
  amenities?: string[]; // e.g. ['Projector', 'Sound System', 'Stage']
  
  // Additional space information
  floorLevel?: string; // e.g. 'Ground Floor', 'First Floor'
  notesForBooking?: string;
};

/**
 * Comprehensive venue model for Watford events
 * Includes accessibility features, facilities, and detailed information
 */
export type Venue = {
  id: string;
  name: string;
  address: string;
  
  // Geographic coordinates
  geo: {
    lat: number;
    lng: number;
  };
  
  // Accessibility features
  accessibleEntrance?: boolean;
  stepFreeAccess?: boolean;
  elevatorAvailable?: boolean;
  
  // Parking information
  parkingInfo?: {
    accessibleSpots: number;
    free: boolean;
    distanceToEntrance: string;
  };
  
  // Toilet facilities
  toilets?: {
    accessibleToilet: boolean;
    genderNeutral: boolean;
    babyChanging: boolean;
  };
  
  // Sensory considerations
  sensoryConsiderations?: {
    quietSpaces: boolean;
    expectedNoiseLevel: 'low' | 'medium' | 'high';
    expectedCrowdSize: 'small' | 'medium' | 'large';
  };
  
  // Language support
  languageSupport?: string[]; // e.g. ['English', 'Polish']
  
  // Visual content
  photos?: string[];
  
  // Additional information
  notesForVisitors?: string;
  
  // Standard metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User UID who created the venue
  ownerId: string;   // Primary owner UID (for permissions)
  
  // Venue status
  status: 'draft' | 'published' | 'archived';
  
  // Optional contact information
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  
  // Capacity information
  // Note: When spaces are defined, this represents total venue capacity
  // Otherwise, it's the capacity of the single space
  capacity?: {
    maxCapacity: number;
    recommendedCapacity: number;
  };
  
  // Spaces/rooms within the venue (for multi-space venues)
  spaces?: VenueSpace[];
  
  // Venue type/category
  category?: 'theatre' | 'pub' | 'stadium' | 'park' | 'hall' | 'museum' | 'restaurant' | 'club' | 'community' | 'other';
  
  // Operating hours
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  
  // Venue features/amenities
  amenities?: string[]; // e.g. ['WiFi', 'Air Conditioning', 'Stage', 'Bar', 'Kitchen']
  
  // Pricing information
  pricing?: {
    hireCost?: number;
    currency?: string;
    pricingNotes?: string;
  };

  // Transport information
  transportInfo?: {
    buses?: string;      // "142, 258 from High Street (5 min walk)"
    trains?: string;     // "Watford Junction 15 min walk, High Street 8 min"
    parking?: string;    // "Free evening parking on Church Road, paid car park opposite"
  };

  // Social engagement
  likeCount?: number;
};

/**
 * Type guard for null safety
 */
export function isVenue(venue: Venue | null): venue is Venue {
  return venue !== null && typeof venue === 'object' && 'id' in venue;
}

/**
 * Create a new venue with default values
 */
export function createVenue(partial: Partial<Venue> & { name: string; address: string; geo: { lat: number; lng: number } }): Venue {
  const now = new Date();
  
  return {
    id: `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    createdBy: partial.createdBy || 'system',
    ownerId: partial.ownerId || partial.createdBy || 'system',
    status: 'draft',
    ...partial
  };
}

/**
 * Venue summary type for list displays
 */
export type VenueSummary = Pick<Venue, 'id' | 'name' | 'address' | 'category' | 'status'>;

/**
 * Venue form data type for creating/editing
 */
export type VenueFormData = Omit<Venue, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'ownerId'>;

/**
 * Calculate total venue capacity from spaces
 */
export function calculateTotalCapacity(venue: Venue): { maxCapacity: number; recommendedCapacity: number } | undefined {
  if (!venue.spaces || venue.spaces.length === 0) {
    return venue.capacity;
  }
  
  return venue.spaces.reduce((total, space) => ({
    maxCapacity: total.maxCapacity + (space.capacity?.maxCapacity || 0),
    recommendedCapacity: total.recommendedCapacity + (space.capacity?.recommendedCapacity || 0)
  }), { maxCapacity: 0, recommendedCapacity: 0 });
}

/**
 * Check if venue has multiple spaces
 */
export function hasMultipleSpaces(venue: Venue): boolean {
  return Boolean(venue.spaces && venue.spaces.length > 1);
}

/**
 * Get primary space (for single-space venues or default space)
 */
export function getPrimarySpace(venue: Venue): VenueSpace | undefined {
  if (venue.spaces && venue.spaces.length > 0) {
    return venue.spaces[0];
  }
  
  // Create a virtual space from venue-level data for backward compatibility
  if (venue.capacity) {
    return {
      id: `${venue.id}_main`,
      name: 'Main Space',
      capacity: venue.capacity,
      accessibleEntrance: venue.accessibleEntrance,
      stepFreeAccess: venue.stepFreeAccess,
      amenities: venue.amenities
    };
  }
  
  return undefined;
}

/**
 * Find a space by ID within a venue
 */
export function findSpaceById(venue: Venue, spaceId: string): VenueSpace | undefined {
  return venue.spaces?.find(space => space.id === spaceId);
}