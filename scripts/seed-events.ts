/**
 * Seed script to populate the database with realistic event data
 * Run with: npm run seed:events
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
import { Event } from '../src/app/events/utils/event.model';
import { environment } from '../src/environments/environment';

// Use the Firebase config from environment
const firebaseConfig = environment.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock user IDs (simulating different event creators)
const MOCK_USER_IDS = [
  'user_mock_001',
  'user_mock_002',
  'user_mock_003',
  'user_mock_004',
  'user_mock_005'
];

// Watford locations and venues with coordinates
const WATFORD_VENUES = [
  { name: 'Watford Palace Theatre', address: 'Clarendon Road, Watford WD17 1JZ', lat: 51.6560, lng: -0.3950 },
  { name: 'The Horns', address: '103 The Parade, Watford WD17 1LU', lat: 51.6540, lng: -0.3970 },
  { name: 'Vicarage Road Stadium', address: 'Vicarage Road, Watford WD18 0ER', lat: 51.6500, lng: -0.4017 },
  { name: 'Watford Colosseum', address: 'Rickmansworth Road, Watford WD17 3JN', lat: 51.6614, lng: -0.4108 },
  { name: 'Cassiobury Park', address: 'Cassiobury Park Avenue, Watford WD18 7LG', lat: 51.6672, lng: -0.4204 },
  { name: 'Atria Watford', address: '201 The Harlequin, Watford WD17 2TH', lat: 51.6571, lng: -0.3936 },
  { name: 'Watford Museum', address: '194 High Street, Watford WD17 2DT', lat: 51.6563, lng: -0.3947 },
  { name: 'The One Crown', address: '152 High Street, Watford WD17 2EN', lat: 51.6558, lng: -0.3955 },
  { name: 'O\'Neills Watford', address: '141-143 The Parade, Watford WD17 1NA', lat: 51.6545, lng: -0.3965 },
  { name: 'West Herts Sports Club', address: '8 Park Avenue, Watford WD18 7HP', lat: 51.6620, lng: -0.4100 },
  { name: 'Watford Central Library', address: 'Hempstead Road, Watford WD17 3EU', lat: 51.6600, lng: -0.4000 },
  { name: 'The Moon Under Water', address: '44 High Street, Watford WD17 2BS', lat: 51.6565, lng: -0.3942 },
  { name: 'Watford Market', address: 'Charter Place, Watford WD17 1TH', lat: 51.6580, lng: -0.3930 },
  { name: 'Grove Park', address: 'Grove Mill Lane, Watford WD17 3TH', lat: 51.6490, lng: -0.3850 },
  { name: 'Cheslyn House & Gardens', address: 'Nascot Wood Road, Watford WD17 4SJ', lat: 51.6700, lng: -0.4150 }
];

// Event categories and templates
const EVENT_TEMPLATES = [
  // Music & Entertainment
  {
    category: 'music',
    titles: [
      'Live Jazz Night',
      'Acoustic Sessions',
      'Rock Band Showcase',
      'DJ Set: House & Techno',
      'Open Mic Night',
      'Classical Concert',
      'Indie Band Performance',
      'Blues Evening',
      'Folk Music Festival',
      'Electronic Music Night'
    ],
    descriptions: [
      'Join us for an evening of live music and entertainment',
      'Experience the best local talent in an intimate setting',
      'Dance the night away with our featured artists',
      'A night of musical excellence you won\'t want to miss',
      'Featuring both established and emerging artists'
    ]
  },
  // Food & Drink
  {
    category: 'food',
    titles: [
      'Watford Food Festival',
      'Wine Tasting Evening',
      'Street Food Market',
      'Craft Beer Festival',
      'Cooking Masterclass',
      'Farmers Market',
      'International Cuisine Night',
      'BBQ Championship',
      'Cocktail Making Workshop',
      'Cheese & Wine Pairing'
    ],
    descriptions: [
      'Explore diverse flavors from around the world',
      'Sample the finest local and international offerings',
      'Learn from expert chefs and food enthusiasts',
      'A culinary journey through taste and tradition',
      'Discover new favorites and classic combinations'
    ]
  },
  // Sports & Fitness
  {
    category: 'sports',
    titles: [
      'Watford FC Match Day',
      '5K Fun Run',
      'Yoga in the Park',
      'Tennis Tournament',
      'Boxing Training Session',
      'Swimming Gala',
      'Cycling Club Meetup',
      'Fitness Bootcamp',
      'Basketball Tournament',
      'Golf Day'
    ],
    descriptions: [
      'Get active and join our sporting community',
      'Challenge yourself and have fun',
      'All skill levels welcome',
      'Professional coaching available',
      'Build fitness and make friends'
    ]
  },
  // Arts & Culture
  {
    category: 'arts',
    titles: [
      'Art Exhibition Opening',
      'Theatre Performance',
      'Poetry Reading',
      'Photography Workshop',
      'Film Screening',
      'Dance Performance',
      'Creative Writing Class',
      'Sculpture Workshop',
      'Gallery Talk',
      'Cultural Festival'
    ],
    descriptions: [
      'Immerse yourself in creative expression',
      'Explore new perspectives through art',
      'Connect with local artists and creators',
      'Discover the vibrant cultural scene',
      'Be inspired by artistic excellence'
    ]
  },
  // Community & Family
  {
    category: 'community',
    titles: [
      'Community Fair',
      'Charity Fundraiser',
      'Kids Activity Day',
      'Local History Walk',
      'Environmental Cleanup',
      'Book Club Meeting',
      'Seniors Social',
      'Parent & Toddler Group',
      'Neighborhood BBQ',
      'Volunteer Day'
    ],
    descriptions: [
      'Bringing the community together',
      'Fun for the whole family',
      'Make a difference in your local area',
      'Connect with neighbors and make friends',
      'Building a stronger community together'
    ]
  },
  // Business & Professional
  {
    category: 'business',
    titles: [
      'Networking Event',
      'Startup Pitch Night',
      'Business Workshop',
      'Career Fair',
      'Leadership Seminar',
      'Tech Meetup',
      'Entrepreneur Talk',
      'Skills Training',
      'Industry Conference',
      'Professional Development'
    ],
    descriptions: [
      'Expand your professional network',
      'Learn from industry experts',
      'Advance your career goals',
      'Connect with like-minded professionals',
      'Gain valuable insights and skills'
    ]
  }
];

// Helper functions
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateFutureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(randomInt(10, 22), randomInt(0, 59), 0, 0);
  return date;
}

function generatePastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(10, 22), randomInt(0, 59), 0, 0);
  return date;
}

function generateTicketInfo(): string | undefined {
  const ticketTypes = [
    'Free entry',
    'Tickets: £10 advance, £12 on door',
    'Early bird: £15, Regular: £20',
    'Free registration required',
    'Members free, Non-members £5',
    'Adults £25, Children £10',
    'VIP £50, General £20',
    'Donation based entry',
    'Pay what you can',
    undefined
  ];
  return randomItem(ticketTypes);
}

function generateContactInfo(): string | undefined {
  const hasContact = Math.random() > 0.3;
  if (!hasContact) return undefined;
  
  const formats = [
    'info@watfordevents.co.uk',
    'Call: 01923 ' + randomInt(100000, 999999),
    'WhatsApp: 07' + randomInt(100000000, 999999999),
    'Email: contact@example.com',
    'Box office: 01923 ' + randomInt(100000, 999999)
  ];
  return randomItem(formats);
}

function generateWebsite(): string | undefined {
  const hasWebsite = Math.random() > 0.5;
  if (!hasWebsite) return undefined;
  
  const domains = [
    'watfordevents.co.uk',
    'eventbrite.com',
    'facebook.com/events',
    'ticketmaster.co.uk',
    'watfordfc.com',
    'watfordpalacetheatre.co.uk'
  ];
  return `https://www.${randomItem(domains)}/event-${randomInt(1000, 9999)}`;
}

function generateLLMMetadata(): Partial<Event> {
  const hasLLMData = Math.random() > 0.7; // 30% chance of having LLM data
  if (!hasLLMData) return {};
  
  return {
    imageUrl: `https://storage.googleapis.com/watford-events/flyers/flyer_${randomInt(1000, 9999)}.jpg`,
    scannedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000), // 1-30 days ago
    scannerConfidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)), // 0.7-1.0
    rawTextData: 'Raw OCR text extracted from flyer image...',
    llmModel: randomItem(['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']),
    processingTime: randomInt(500, 3000) // milliseconds
  };
}

function generateEvent(index: number): Event {
  const template = randomItem(EVENT_TEMPLATES);
  const venue = randomItem(WATFORD_VENUES);
  const creator = randomItem(MOCK_USER_IDS);
  const title = randomItem(template.titles);
  const description = randomItem(template.descriptions);
  
  // Determine event timing
  const now = new Date();
  let eventDate: Date;
  let status: Event['status'] = 'published';
  
  // 20% past events, 30% current/this week, 50% future
  const timing = Math.random();
  if (timing < 0.2) {
    eventDate = generatePastDate(randomInt(1, 60));
    status = Math.random() > 0.8 ? 'cancelled' : 'published';
  } else if (timing < 0.5) {
    eventDate = generateFutureDate(randomInt(0, 7));
    status = Math.random() > 0.9 ? 'cancelled' : 'published';
  } else {
    eventDate = generateFutureDate(randomInt(8, 90));
    status = Math.random() > 0.85 ? 'draft' : 'published';
  }
  
  const createdAt = new Date(now.getTime() - randomInt(1, 90) * 24 * 60 * 60 * 1000);
  const updatedAt = new Date(createdAt.getTime() + randomInt(0, 7) * 24 * 60 * 60 * 1000);
  
  // Generate attendees
  const attendeeCount = status === 'published' ? randomInt(0, 50) : 0;
  const attendeeIds = Array.from({ length: attendeeCount }, (_, i) => 
    `user_attendee_${index}_${i}`
  );
  
  const event: Event = {
    id: generateEventId(),
    title: `${title} - ${venue.name}`,
    description: `${description} at ${venue.name}. ${
      template.category === 'music' ? 'Doors open 30 minutes before the event.' :
      template.category === 'food' ? 'Dietary requirements can be accommodated.' :
      template.category === 'sports' ? 'Please bring appropriate gear.' :
      template.category === 'arts' ? 'All materials provided.' :
      template.category === 'community' ? 'Everyone welcome!' :
      'Registration recommended.'
    }`,
    date: eventDate,
    location: venue.address,
    lat: venue.lat,
    lng: venue.lng,
    attendeeIds,
    createdAt,
    updatedAt,
    createdBy: creator,
    ownerId: creator,
    status,
    organizer: Math.random() > 0.5 ? venue.name : undefined,
    ticketInfo: generateTicketInfo(),
    contactInfo: generateContactInfo(),
    website: generateWebsite(),
    eventType: 'single', // Seed events are single events
    isException: false,
    isMockEvent: true, // Mark all seeded events as mock events
    ...generateLLMMetadata()
  };
  
  return event;
}

async function clearExistingEvents(): Promise<void> {
  console.log('🗑️  Clearing existing events...');
  const eventsRef = collection(db, 'events');
  const snapshot = await getDocs(eventsRef);
  
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  console.log(`✅ Deleted ${snapshot.size} existing events`);
}

async function seedEvents(count: number = 50, clearFirst: boolean = false): Promise<void> {
  console.log('🌱 Starting event seeding process...');
  console.log(`📊 Will create ${count} events`);
  
  if (clearFirst) {
    await clearExistingEvents();
  }
  
  const events: Event[] = [];
  
  // Generate events
  for (let i = 0; i < count; i++) {
    const event = generateEvent(i);
    events.push(event);
  }
  
  // Sort by date for better organization
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Save to Firestore
  console.log('💾 Saving events to Firestore...');
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventRef = doc(db, 'events', event.id);
    
    // Convert Date objects to Firestore Timestamps and remove undefined fields
    const eventData: any = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: Timestamp.fromDate(event.date),
      location: event.location,
      lat: event.lat,
      lng: event.lng,
      attendeeIds: event.attendeeIds,
      createdAt: Timestamp.fromDate(event.createdAt),
      updatedAt: Timestamp.fromDate(event.updatedAt),
      createdBy: event.createdBy,
      ownerId: event.ownerId,
      status: event.status,
      eventType: event.eventType,
      isMockEvent: event.isMockEvent
    };
    
    // Only add optional fields if they have values
    if (event.scannedAt) {
      eventData.scannedAt = Timestamp.fromDate(event.scannedAt);
    }
    if (event.organizer) {
      eventData.organizer = event.organizer;
    }
    if (event.ticketInfo) {
      eventData.ticketInfo = event.ticketInfo;
    }
    if (event.contactInfo) {
      eventData.contactInfo = event.contactInfo;
    }
    if (event.website) {
      eventData.website = event.website;
    }
    if (event.imageUrl) {
      eventData.imageUrl = event.imageUrl;
    }
    if (event.scannerConfidence) {
      eventData.scannerConfidence = event.scannerConfidence;
    }
    if (event.rawTextData) {
      eventData.rawTextData = event.rawTextData;
    }
    if (event.llmModel) {
      eventData.llmModel = event.llmModel;
    }
    if (event.processingTime) {
      eventData.processingTime = event.processingTime;
    }
    
    await setDoc(eventRef, eventData);
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ Saved ${i + 1}/${events.length} events`);
    }
  }
  
  console.log('🎉 Seeding complete!');
  console.log('\n📈 Summary:');
  console.log(`- Total events created: ${events.length}`);
  console.log(`- Published: ${events.filter(e => e.status === 'published').length}`);
  console.log(`- Draft: ${events.filter(e => e.status === 'draft').length}`);
  console.log(`- Cancelled: ${events.filter(e => e.status === 'cancelled').length}`);
  console.log(`- Mock events: ${events.filter(e => e.isMockEvent).length}`);
  console.log(`- With LLM data: ${events.filter(e => e.llmModel).length}`);
  console.log(`- Past events: ${events.filter(e => e.date < new Date()).length}`);
  console.log(`- Future events: ${events.filter(e => e.date >= new Date()).length}`);
}

// Command line arguments
const args = process.argv.slice(2);
const eventCount = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '50');
const clearFirst = args.includes('--clear');
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No data will be saved');
  console.log('\nSample events that would be created:');
  for (let i = 0; i < 5; i++) {
    const event = generateEvent(i);
    console.log(`\n${i + 1}. ${event.title}`);
    console.log(`   Date: ${event.date.toLocaleString()}`);
    console.log(`   Location: ${event.location}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Mock Event: ${event.isMockEvent ? 'Yes' : 'No'}`);
    console.log(`   Attendees: ${event.attendeeIds.length}`);
  }
  process.exit(0);
}

// Run the seeder
seedEvents(eventCount, clearFirst)
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  });