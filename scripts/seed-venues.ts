/**
 * Seed script to populate the database with realistic venue data for Watford
 * Run with: npm run seed:venues
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { Venue, VenueSpace } from '../src/app/venues/utils/venue.model';
import { environment } from '../src/environments/environment';

// Use the Firebase config from environment
const firebaseConfig = environment.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock user IDs (simulating different venue creators)
const MOCK_USER_IDS = [
  'user_mock_001',
  'user_mock_002',
  'user_mock_003',
  'user_admin_001',
  'user_admin_002'
];

// Comprehensive Watford venues with realistic data
const WATFORD_VENUES_DATA = [
  // Theatres & Performance Venues
  {
    name: 'Watford Palace Theatre',
    address: 'Clarendon Road, Watford WD17 1JZ',
    geo: { lat: 51.6555, lng: -0.3967 },
    category: 'theatre' as const,
    capacity: { maxCapacity: 680, recommendedCapacity: 650 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    elevatorAvailable: true,
    parkingInfo: { accessibleSpots: 15, free: false, distanceToEntrance: '50m' },
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'medium' as const, 
      expectedCrowdSize: 'large' as const 
    },
    amenities: ['Air Conditioning', 'Bar', 'Cloakroom', 'WiFi', 'Stage', 'Sound System'],
    contactInfo: {
      phone: '01923 225671',
      email: 'boxoffice@watfordpalacetheatre.co.uk',
      website: 'https://www.watfordpalacetheatre.co.uk'
    },
    operatingHours: {
      'Monday': { open: '10:00', close: '18:00' },
      'Tuesday': { open: '10:00', close: '18:00' },
      'Wednesday': { open: '10:00', close: '18:00' },
      'Thursday': { open: '10:00', close: '22:00' },
      'Friday': { open: '10:00', close: '22:00' },
      'Saturday': { open: '10:00', close: '22:00' },
      'Sunday': { open: '12:00', close: '18:00' }
    },
    transportInfo: {
      buses: 'Multiple bus routes stop on Clarendon Road including 142, 258, 318 (2 min walk)',
      trains: 'Watford High Street station 6 min walk, Watford Junction 12 min walk',
      parking: 'On-street parking evenings and weekends. Atria car park nearby (£3 after 6pm)'
    },
    notesForVisitors: 'Historic theatre with excellent acoustics. Box office opens 1 hour before performances.'
  },
  {
    name: 'Watford Colosseum',
    address: 'Rickmansworth Road, Watford WD17 3JN',
    geo: { lat: 51.6576, lng: -0.4089 },
    category: 'theatre' as const,
    capacity: { maxCapacity: 1340, recommendedCapacity: 1300 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    elevatorAvailable: true,
    parkingInfo: { accessibleSpots: 25, free: false, distanceToEntrance: '30m' },
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: false, 
      expectedNoiseLevel: 'high' as const, 
      expectedCrowdSize: 'large' as const 
    },
    amenities: ['Air Conditioning', 'Multiple Bars', 'Cloakroom', 'WiFi', 'Large Stage', 'Professional Sound System'],
    contactInfo: {
      phone: '0300 300 8222',
      email: 'info@watfordcolosseum.co.uk',
      website: 'https://www.watfordcolosseum.co.uk'
    },
    transportInfo: {
      buses: 'Bus 142 stops directly outside, buses 258, 318 stop at nearby Rickmansworth Road',
      trains: 'Watford Metropolitan station 8 min walk, Watford Junction 15 min walk',
      parking: 'Large car park on site (£5 evening). Free street parking on surrounding roads after 6pm'
    },
    notesForVisitors: 'Major entertainment venue hosting touring productions, concerts, and comedy shows.'
  },

  // Sports Venues
  {
    name: 'Vicarage Road Stadium',
    address: 'Vicarage Road, Watford WD18 0ER',
    geo: { lat: 51.6499, lng: -0.4016 },
    category: 'stadium' as const,
    capacity: { maxCapacity: 22220, recommendedCapacity: 22000 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    elevatorAvailable: true,
    parkingInfo: { accessibleSpots: 50, free: false, distanceToEntrance: '200m' },
    toilets: { accessibleToilet: true, genderNeutral: false, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: false, 
      expectedNoiseLevel: 'high' as const, 
      expectedCrowdSize: 'large' as const 
    },
    amenities: ['Concourse Bars', 'Food Outlets', 'Fan Shop', 'WiFi', 'Big Screens'],
    contactInfo: {
      phone: '01923 496000',
      email: 'enquiries@watfordfc.com',
      website: 'https://www.watfordfc.com'
    },
    transportInfo: {
      buses: 'Special match day shuttle buses, regular service 142 from town center (15 min walk)',
      trains: 'Watford High Street 12 min walk. Extra services on match days. Avoid Watford Junction (25 min walk)',
      parking: 'Limited stadium parking £10. Residential parking restrictions on match days. Park & ride from town center recommended'
    },
    notesForVisitors: 'Home of Watford FC. Match day events and stadium tours available.'
  },
  {
    name: 'West Herts Sports Club',
    address: '8 Park Avenue, Watford WD18 7HP',
    geo: { lat: 51.6492, lng: -0.3845 },
    category: 'club' as const,
    capacity: { maxCapacity: 200, recommendedCapacity: 180 },
    accessibleEntrance: false,
    stepFreeAccess: false,
    parkingInfo: { accessibleSpots: 3, free: true, distanceToEntrance: '20m' },
    toilets: { accessibleToilet: false, genderNeutral: false, babyChanging: false },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'small' as const 
    },
    amenities: ['Bar', 'Changing Rooms', 'Equipment Storage', 'Outdoor Courts'],
    contactInfo: {
      phone: '01923 224225',
      email: 'info@westhertssports.co.uk'
    },
    notesForVisitors: 'Multi-sport club with tennis, squash, and fitness facilities.'
  },

  // Parks & Outdoor Venues
  {
    name: 'Cassiobury Park',
    address: 'Cassiobury Park Avenue, Watford WD18 7LG',
    geo: { lat: 51.6612, lng: -0.4123 },
    category: 'park' as const,
    accessibleEntrance: true,
    stepFreeAccess: true,
    parkingInfo: { accessibleSpots: 20, free: true, distanceToEntrance: '50m' },
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'medium' as const 
    },
    amenities: ['Playground', 'Cafe', 'Nature Centre', 'Walking Trails', 'Paddling Pool'],
    contactInfo: {
      phone: '01923 278312',
      email: 'parks@watford.gov.uk'
    },
    operatingHours: {
      'Monday': { open: '07:00', close: '20:00' },
      'Tuesday': { open: '07:00', close: '20:00' },
      'Wednesday': { open: '07:00', close: '20:00' },
      'Thursday': { open: '07:00', close: '20:00' },
      'Friday': { open: '07:00', close: '20:00' },
      'Saturday': { open: '07:00', close: '20:00' },
      'Sunday': { open: '07:00', close: '20:00' }
    },
    transportInfo: {
      buses: 'Multiple routes including 142, 320 stop at Cassiobury Park Avenue entrance',
      trains: 'Watford Metropolitan station 10 min walk via station approach. Watford Junction 20 min walk',
      parking: 'Free car park at main entrance. Can get busy on weekends and during events'
    },
    notesForVisitors: '190-acre park perfect for outdoor events, festivals, and family gatherings.'
  },
  {
    name: 'Grove Park',
    address: 'Grove Mill Lane, Watford WD17 3TH',
    geo: { lat: 51.6445, lng: -0.3812 },
    category: 'park' as const,
    accessibleEntrance: true,
    stepFreeAccess: true,
    parkingInfo: { accessibleSpots: 8, free: true, distanceToEntrance: '30m' },
    toilets: { accessibleToilet: true, genderNeutral: false, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'small' as const 
    },
    amenities: ['Playground', 'Basketball Court', 'Open Grass Areas', 'Benches'],
    notesForVisitors: 'Peaceful park ideal for small community events and outdoor activities.'
  },

  // Pubs & Social Venues
  {
    name: 'The Horns',
    address: '103 The Parade, Watford WD17 1LU',
    geo: { lat: 51.6565, lng: -0.3956 },
    category: 'pub' as const,
    capacity: { maxCapacity: 120, recommendedCapacity: 100 },
    accessibleEntrance: false,
    stepFreeAccess: false,
    toilets: { accessibleToilet: false, genderNeutral: false, babyChanging: false },
    sensoryConsiderations: { 
      quietSpaces: false, 
      expectedNoiseLevel: 'medium' as const, 
      expectedCrowdSize: 'medium' as const 
    },
    amenities: ['Bar', 'Food Service', 'Beer Garden', 'Pool Table', 'Live Music Stage'],
    contactInfo: {
      phone: '01923 220142'
    },
    operatingHours: {
      'Monday': { open: '12:00', close: '23:00' },
      'Tuesday': { open: '12:00', close: '23:00' },
      'Wednesday': { open: '12:00', close: '23:00' },
      'Thursday': { open: '12:00', close: '23:00' },
      'Friday': { open: '12:00', close: '24:00' },
      'Saturday': { open: '12:00', close: '24:00' },
      'Sunday': { open: '12:00', close: '22:30' }
    },
    transportInfo: {
      buses: 'Central location - all town center buses stop nearby on High Street or The Parade',
      trains: 'Watford High Street station 3 min walk, Watford Junction 8 min walk',
      parking: 'Limited on-street parking. Use nearby multi-story car parks. Free after 6pm weekdays'
    },
    notesForVisitors: 'Traditional pub with regular live music nights and quiz evenings.'
  },
  {
    name: 'The One Crown',
    address: '152 High Street, Watford WD17 2EN',
    geo: { lat: 51.6572, lng: -0.3945 },
    category: 'pub' as const,
    capacity: { maxCapacity: 80, recommendedCapacity: 70 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    toilets: { accessibleToilet: true, genderNeutral: false, babyChanging: false },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'small' as const 
    },
    amenities: ['Bar', 'Restaurant', 'WiFi', 'Outdoor Seating'],
    contactInfo: {
      phone: '01923 237751'
    },
    notesForVisitors: 'Historic pub in town centre, perfect for intimate events and meetings.'
  },
  {
    name: 'The Moon Under Water',
    address: '44 High Street, Watford WD17 2BS',
    geo: { lat: 51.6581, lng: -0.3941 },
    category: 'pub' as const,
    capacity: { maxCapacity: 200, recommendedCapacity: 180 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    elevatorAvailable: true,
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: false, 
      expectedNoiseLevel: 'medium' as const, 
      expectedCrowdSize: 'medium' as const 
    },
    amenities: ['Bar', 'Food Service', 'WiFi', 'Multiple Floors', 'Beer Garden'],
    contactInfo: {
      phone: '01923 230090'
    },
    notesForVisitors: 'Large Wetherspoons pub with multiple areas for different event sizes.'
  },

  // Community & Cultural Venues
  {
    name: 'Pump House Theatre & Arts Centre',
    address: 'Local Board Road, North Watford, Watford WD17 2JP',
    geo: { lat: 51.6634, lng: -0.3892 },
    category: 'theatre' as const,
    capacity: { maxCapacity: 194, recommendedCapacity: 180 }, // Total capacity
    spaces: [
      {
        id: 'pump_house_main_stage',
        name: 'Main Stage',
        capacity: { maxCapacity: 124, recommendedCapacity: 120 },
        accessibleEntrance: true,
        stepFreeAccess: true,
        amenities: ['Stage', 'Lighting Rig', 'Sound System', 'Backstage Area', 'Dressing Rooms'],
        floorLevel: 'Ground Floor',
        notesForBooking: 'Professional theatre space with full technical facilities. Flexible seating arrangement possible.'
      },
      {
        id: 'pump_house_colne_river',
        name: 'Colne River Room',
        capacity: { maxCapacity: 40, recommendedCapacity: 35 },
        accessibleEntrance: true,
        stepFreeAccess: true,
        amenities: ['Projector', 'Screen', 'WiFi', 'Whiteboard'],
        floorLevel: 'First Floor',
        notesForBooking: 'Versatile meeting/workshop space. Can be set up theatre-style or cabaret-style.'
      },
      {
        id: 'pump_house_charles_room',
        name: 'Charles Room',
        capacity: { maxCapacity: 30, recommendedCapacity: 25 },
        accessibleEntrance: true,
        stepFreeAccess: true,
        amenities: ['Natural Light', 'WiFi', 'Flip Chart'],
        floorLevel: 'First Floor',
        notesForBooking: 'Intimate space ideal for small meetings, rehearsals, or workshops.'
      }
    ] as VenueSpace[],
    accessibleEntrance: true,
    stepFreeAccess: true,
    parkingInfo: { accessibleSpots: 8, free: true, distanceToEntrance: '30m' },
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'medium' as const, 
      expectedCrowdSize: 'medium' as const 
    },
    amenities: ['Bar', 'Kitchen', 'WiFi', 'Art Studios', 'Workshop Spaces'],
    contactInfo: {
      phone: '01923 258042',
      email: 'info@pumphousetheatre.co.uk',
      website: 'https://www.pumphousetheatre.co.uk'
    },
    operatingHours: {
      'Monday': { open: '09:00', close: '22:00' },
      'Tuesday': { open: '09:00', close: '22:00' },
      'Wednesday': { open: '09:00', close: '22:00' },
      'Thursday': { open: '09:00', close: '22:00' },
      'Friday': { open: '09:00', close: '22:00' },
      'Saturday': { open: '09:00', close: '22:00' },
      'Sunday': { open: '10:00', close: '18:00' }
    },
    transportInfo: {
      buses: 'Bus 142 stops on Local Board Road (1 min walk). Regular services to town center',
      trains: 'Watford North station 8 min walk, Watford Junction 15 min walk',
      parking: 'Free on-site parking available. Additional street parking on surrounding roads'
    },
    notesForVisitors: 'Community arts venue with theatre and gallery spaces. Home to local theatre groups and art exhibitions.'
  },
  {
    name: 'Watford Central Library',
    address: 'Hempstead Road, Watford WD17 3EU',
    geo: { lat: 51.6545, lng: -0.3923 },
    category: 'community' as const,
    capacity: { maxCapacity: 100, recommendedCapacity: 80 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    elevatorAvailable: true,
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'small' as const 
    },
    amenities: ['WiFi', 'Meeting Rooms', 'Presentation Equipment', 'Kitchen Facilities'],
    contactInfo: {
      phone: '01923 471480',
      email: 'library@watford.gov.uk',
      website: 'https://www.watford.gov.uk/libraries'
    },
    operatingHours: {
      'Monday': { open: '09:00', close: '17:00' },
      'Tuesday': { open: '09:00', close: '20:00' },
      'Wednesday': { open: '09:00', close: '17:00' },
      'Thursday': { open: '09:00', close: '20:00' },
      'Friday': { open: '09:00', close: '17:00' },
      'Saturday': { open: '09:00', close: '17:00' },
      'Sunday': { open: '11:00', close: '16:00' }
    },
    notesForVisitors: 'Modern library with excellent meeting facilities and community spaces.'
  },
  {
    name: 'Watford Museum',
    address: '194 High Street, Watford WD17 2DT',
    geo: { lat: 51.6578, lng: -0.3934 },
    category: 'museum' as const,
    capacity: { maxCapacity: 60, recommendedCapacity: 50 },
    accessibleEntrance: true,
    stepFreeAccess: false,
    toilets: { accessibleToilet: false, genderNeutral: false, babyChanging: false },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'small' as const 
    },
    amenities: ['Exhibition Space', 'Educational Resources', 'Meeting Room'],
    contactInfo: {
      phone: '01923 232297',
      email: 'museum@watford.gov.uk'
    },
    operatingHours: {
      'Tuesday': { open: '10:00', close: '17:00' },
      'Wednesday': { open: '10:00', close: '17:00' },
      'Thursday': { open: '10:00', close: '17:00' },
      'Friday': { open: '10:00', close: '17:00' },
      'Saturday': { open: '10:00', close: '17:00' }
    },
    notesForVisitors: 'Historic venue ideal for cultural events and educational workshops.'
  },
  {
    name: 'Cheslyn House & Gardens',
    address: 'Nascot Wood Road, Watford WD17 4SJ',
    geo: { lat: 51.6423, lng: -0.3734 },
    category: 'hall' as const,
    capacity: { maxCapacity: 270, recommendedCapacity: 220 }, // Total capacity
    spaces: [
      {
        id: 'cheslyn_main_hall',
        name: 'Main Hall',
        capacity: { maxCapacity: 150, recommendedCapacity: 120 },
        accessibleEntrance: true,
        stepFreeAccess: true,
        amenities: ['Stage Area', 'Sound System', 'Tables and Chairs'],
        floorLevel: 'Ground Floor',
        notesForBooking: 'Ideal for wedding receptions, parties, and large gatherings.'
      },
      {
        id: 'cheslyn_lounge',
        name: 'Lounge',
        capacity: { maxCapacity: 60, recommendedCapacity: 50 },
        accessibleEntrance: true,
        stepFreeAccess: true,
        amenities: ['Comfortable Seating', 'Tea/Coffee Facilities', 'TV/Display'],
        floorLevel: 'Ground Floor',
        notesForBooking: 'Cozy space for meetings, workshops, or small gatherings.'
      },
      {
        id: 'cheslyn_garden_room',
        name: 'Garden Room',
        capacity: { maxCapacity: 60, recommendedCapacity: 50 },
        accessibleEntrance: true,
        stepFreeAccess: true,
        amenities: ['Garden Views', 'Natural Light', 'Direct Garden Access'],
        floorLevel: 'Ground Floor',
        notesForBooking: 'Beautiful room with garden views, perfect for daytime events.'
      }
    ] as VenueSpace[],
    accessibleEntrance: true,
    stepFreeAccess: true,
    parkingInfo: { accessibleSpots: 12, free: true, distanceToEntrance: '20m' },
    toilets: { accessibleToilet: true, genderNeutral: false, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: true, 
      expectedNoiseLevel: 'low' as const, 
      expectedCrowdSize: 'medium' as const 
    },
    amenities: ['Gardens', 'Kitchen Facilities', 'Parking', 'Historic Building'],
    contactInfo: {
      phone: '01923 673364',
      email: 'cheslyn@watford.gov.uk'
    },
    pricing: {
      hireCost: 150,
      currency: 'GBP',
      pricingNotes: 'Per half day. Full day rates available.'
    },
    notesForVisitors: 'Beautiful historic house with gardens, perfect for weddings and special events.'
  },

  // Shopping & Commercial Venues
  {
    name: 'Atria Watford',
    address: '201 The Harlequin, Watford WD17 2TH',
    geo: { lat: 51.6553, lng: -0.3958 },
    category: 'hall' as const,
    capacity: { maxCapacity: 300, recommendedCapacity: 250 },
    accessibleEntrance: true,
    stepFreeAccess: true,
    elevatorAvailable: true,
    toilets: { accessibleToilet: true, genderNeutral: true, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: false, 
      expectedNoiseLevel: 'medium' as const, 
      expectedCrowdSize: 'large' as const 
    },
    amenities: ['Air Conditioning', 'Sound System', 'Presentation Equipment', 'Catering Kitchen'],
    contactInfo: {
      phone: '01923 250250',
      website: 'https://www.atriawatford.com'
    },
    notesForVisitors: 'Modern event space in shopping centre, ideal for exhibitions and conferences.'
  },
  {
    name: 'Watford Market',
    address: 'Charter Place, Watford WD17 1TH',
    geo: { lat: 51.6561, lng: -0.3952 },
    category: 'other' as const,
    accessibleEntrance: true,
    stepFreeAccess: true,
    toilets: { accessibleToilet: true, genderNeutral: false, babyChanging: true },
    sensoryConsiderations: { 
      quietSpaces: false, 
      expectedNoiseLevel: 'medium' as const, 
      expectedCrowdSize: 'medium' as const 
    },
    amenities: ['Market Stalls', 'Food Vendors', 'Open Air Space'],
    operatingHours: {
      'Tuesday': { open: '09:00', close: '16:00' },
      'Wednesday': { open: '09:00', close: '16:00' },
      'Thursday': { open: '09:00', close: '16:00' },
      'Friday': { open: '09:00', close: '16:00' },
      'Saturday': { open: '09:00', close: '16:00' }
    },
    notesForVisitors: 'Traditional market space perfect for craft fairs and community markets.'
  }
];

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateVenueId(): string {
  return `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateLanguageSupport(): string[] | undefined {
  const hasLanguageSupport = Math.random() > 0.7; // 30% chance
  if (!hasLanguageSupport) return undefined;
  
  const languages = ['English', 'Polish', 'Urdu', 'Hindi', 'Italian', 'Spanish', 'French'];
  const supportedLanguages = ['English']; // Always include English
  
  // Add 1-3 additional languages
  const additionalCount = Math.floor(Math.random() * 3) + 1;
  const availableLanguages = languages.filter(lang => lang !== 'English');
  
  for (let i = 0; i < additionalCount && availableLanguages.length > 0; i++) {
    const langIndex = Math.floor(Math.random() * availableLanguages.length);
    supportedLanguages.push(availableLanguages.splice(langIndex, 1)[0]);
  }
  
  return supportedLanguages;
}

function generatePhotos(): string[] | undefined {
  const hasPhotos = Math.random() > 0.6; // 40% chance
  if (!hasPhotos) return undefined;
  
  const photoCount = Math.floor(Math.random() * 4) + 1; // 1-4 photos
  return Array.from({ length: photoCount }, (_, i) => 
    `https://storage.googleapis.com/watford-venues/photos/${generateVenueId()}_${i + 1}.jpg`
  );
}

function generateSpaceId(venueId: string, spaceName: string): string {
  return `${venueId}_${spaceName.toLowerCase().replace(/\s+/g, '_')}`;
}

function createVenue(venueData: any, index: number): Venue {
  const creator = randomItem(MOCK_USER_IDS);
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date within last year
  const updatedAt = new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Updated within 30 days of creation
  
  // Determine status - mostly published with some drafts
  let status: Venue['status'] = 'published';
  if (Math.random() > 0.9) status = 'draft';
  if (Math.random() > 0.95) status = 'archived';
  
  const venueId = generateVenueId();
  
  // Process spaces if they exist, ensuring they have proper IDs
  let spaces: VenueSpace[] | undefined = undefined;
  if (venueData.spaces && venueData.spaces.length > 0) {
    spaces = venueData.spaces.map((space: VenueSpace) => ({
      ...space,
      id: space.id || generateSpaceId(venueId, space.name)
    }));
  }
  
  const venue: Venue = {
    id: venueId,
    name: venueData.name,
    address: venueData.address,
    geo: venueData.geo,
    category: venueData.category,
    createdAt,
    updatedAt,
    createdBy: creator,
    ownerId: creator,
    status,
    
    // Optional fields with fallbacks
    accessibleEntrance: venueData.accessibleEntrance,
    stepFreeAccess: venueData.stepFreeAccess,
    elevatorAvailable: venueData.elevatorAvailable,
    parkingInfo: venueData.parkingInfo,
    toilets: venueData.toilets,
    sensoryConsiderations: venueData.sensoryConsiderations,
    languageSupport: generateLanguageSupport(),
    photos: generatePhotos(),
    notesForVisitors: venueData.notesForVisitors,
    contactInfo: venueData.contactInfo,
    capacity: venueData.capacity,
    operatingHours: venueData.operatingHours,
    amenities: venueData.amenities,
    pricing: venueData.pricing,
    spaces: spaces
  };
  
  return venue;
}

async function clearExistingVenues(): Promise<void> {
  console.log('🗑️  Clearing existing venues...');
  const venuesRef = collection(db, 'venues');
  const snapshot = await getDocs(venuesRef);
  
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  console.log(`✅ Deleted ${snapshot.size} existing venues`);
}

async function seedVenues(clearFirst: boolean = false): Promise<void> {
  console.log('🏢 Starting venue seeding process...');
  console.log(`📊 Will create ${WATFORD_VENUES_DATA.length} venues`);
  
  if (clearFirst) {
    await clearExistingVenues();
  }
  
  const venues: Venue[] = [];
  
  // Generate venues from our data
  for (let i = 0; i < WATFORD_VENUES_DATA.length; i++) {
    const venue = createVenue(WATFORD_VENUES_DATA[i], i);
    venues.push(venue);
  }
  
  // Save to Firestore
  console.log('💾 Saving venues to Firestore...');
  
  for (let i = 0; i < venues.length; i++) {
    const venue = venues[i];
    const venueRef = doc(db, 'venues', venue.id);
    
    // Convert Date objects to Firestore Timestamps and remove undefined fields
    const venueData: any = {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      geo: venue.geo,
      createdAt: Timestamp.fromDate(venue.createdAt),
      updatedAt: Timestamp.fromDate(venue.updatedAt),
      createdBy: venue.createdBy,
      ownerId: venue.ownerId,
      status: venue.status
    };
    
    // Only add optional fields if they have values
    if (venue.category) venueData.category = venue.category;
    if (venue.accessibleEntrance !== undefined) venueData.accessibleEntrance = venue.accessibleEntrance;
    if (venue.stepFreeAccess !== undefined) venueData.stepFreeAccess = venue.stepFreeAccess;
    if (venue.elevatorAvailable !== undefined) venueData.elevatorAvailable = venue.elevatorAvailable;
    if (venue.parkingInfo) venueData.parkingInfo = venue.parkingInfo;
    if (venue.toilets) venueData.toilets = venue.toilets;
    if (venue.sensoryConsiderations) venueData.sensoryConsiderations = venue.sensoryConsiderations;
    if (venue.languageSupport) venueData.languageSupport = venue.languageSupport;
    if (venue.photos) venueData.photos = venue.photos;
    if (venue.notesForVisitors) venueData.notesForVisitors = venue.notesForVisitors;
    if (venue.contactInfo) venueData.contactInfo = venue.contactInfo;
    if (venue.capacity) venueData.capacity = venue.capacity;
    if (venue.operatingHours) venueData.operatingHours = venue.operatingHours;
    if (venue.amenities) venueData.amenities = venue.amenities;
    if (venue.pricing) venueData.pricing = venue.pricing;
    if (venue.spaces) venueData.spaces = venue.spaces;
    if (venue.transportInfo) venueData.transportInfo = venue.transportInfo;
    
    await setDoc(venueRef, venueData);
    
    if ((i + 1) % 5 === 0) {
      console.log(`✅ Saved ${i + 1}/${venues.length} venues`);
    }
  }
  
  console.log('🎉 Venue seeding complete!');
  console.log('\n📈 Summary:');
  console.log(`- Total venues created: ${venues.length}`);
  console.log(`- Published: ${venues.filter(v => v.status === 'published').length}`);
  console.log(`- Draft: ${venues.filter(v => v.status === 'draft').length}`);
  console.log(`- Archived: ${venues.filter(v => v.status === 'archived').length}`);
  console.log(`- Multi-space venues: ${venues.filter(v => v.spaces && v.spaces.length > 1).length}`);
  console.log(`- Single-space venues: ${venues.filter(v => !v.spaces || v.spaces.length <= 1).length}`);
  console.log(`- Total spaces: ${venues.reduce((total, v) => total + (v.spaces?.length || 1), 0)}`);
  console.log(`- Accessible entrance: ${venues.filter(v => v.accessibleEntrance).length}`);
  console.log(`- Step-free access: ${venues.filter(v => v.stepFreeAccess).length}`);
  console.log(`- With parking: ${venues.filter(v => v.parkingInfo).length}`);
  console.log(`- With operating hours: ${venues.filter(v => v.operatingHours).length}`);
  console.log(`- With contact info: ${venues.filter(v => v.contactInfo).length}`);
  
  // Category breakdown
  const categories = venues.reduce((acc, venue) => {
    const cat = venue.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n🏷️  By Category:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`- ${category}: ${count}`);
  });
}

// Command line arguments
const args = process.argv.slice(2);
const clearFirst = args.includes('--clear');
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No data will be saved');
  console.log('\nSample venues that would be created:');
  
  // Show a mix of single and multi-space venues
  const sampleIndices = [0, 9, 13]; // Palace Theatre, Pump House, Cheslyn House
  
  sampleIndices.forEach((index, i) => {
    if (index < WATFORD_VENUES_DATA.length) {
      const venue = createVenue(WATFORD_VENUES_DATA[index], index);
      console.log(`\n${i + 1}. ${venue.name}`);
      console.log(`   Address: ${venue.address}`);
      console.log(`   Category: ${venue.category}`);
      console.log(`   Status: ${venue.status}`);
      console.log(`   Accessible: ${venue.accessibleEntrance ? 'Yes' : 'No'}`);
      console.log(`   Total Capacity: ${venue.capacity?.maxCapacity || 'Not specified'}`);
      if (venue.spaces && venue.spaces.length > 0) {
        console.log(`   Spaces (${venue.spaces.length}):`);
        venue.spaces.forEach(space => {
          console.log(`     - ${space.name}: ${space.capacity.maxCapacity} capacity`);
        });
      } else {
        console.log(`   Spaces: Single space venue`);
      }
    }
  });
  
  process.exit(0);
}

// Run the seeder
seedVenues(clearFirst)
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding venues:', error);
    process.exit(1);
  });