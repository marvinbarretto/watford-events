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
  capacity?: {
    maxCapacity: number;
    recommendedCapacity: number;
  };
  
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