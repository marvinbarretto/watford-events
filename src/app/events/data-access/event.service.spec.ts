import { TestBed } from '@angular/core/testing';
import { EventService } from './event.service';
import { Event } from '../utils/event.model';
import { MockServices } from '../../../testing/mock-services';
import { firestoreServiceProviders } from '../../../testing/test-providers';
import { of } from 'rxjs';

// Mock event data for testing
const mockEvent: Event = {
  id: 'event-123',
  title: 'Test Event',
  description: 'Test event description',
  date: new Date('2025-08-01'),
  location: 'Test Location',
  createdBy: 'user-123',
  ownerId: 'user-123',
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
  attendeeIds: [],
  status: 'published',
  eventType: 'single',
  isException: false
};

const mockEvents: Event[] = [
  mockEvent,
  {
    ...mockEvent,
    id: 'event-456',
    title: 'Draft Event',
    status: 'draft',
    createdBy: 'user-456'
  },
  {
    ...mockEvent,
    id: 'event-789',
    title: 'Future Event',
    description: 'Future event description',
    date: new Date('2025-06-01'),
    location: 'Another Location',
    createdBy: 'user-789'
  }
];

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        ...firestoreServiceProviders
      ]
    });

    service = TestBed.inject(EventService);
    
    // Spy on the service methods to mock their behavior
    jest.spyOn(service, 'getAll').mockResolvedValue(mockEvents);
    jest.spyOn(service, 'create').mockResolvedValue(undefined);
    jest.spyOn(service, 'update').mockResolvedValue(undefined);
    jest.spyOn(service, 'delete').mockResolvedValue(undefined);
    jest.spyOn(service, 'doc$').mockReturnValue(of(mockEvent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have correct path property', () => {
      expect((service as any).path).toBe('events');
    });
  });

  describe('getEvent', () => {
    it('should get a single event by ID', (done) => {
      const eventId = 'event-123';
      
      const result$ = service.getEvent(eventId);
      
      result$.subscribe(event => {
        expect(event).toEqual(mockEvent);
        expect(service.doc$).toHaveBeenCalledWith(`events/${eventId}`);
        done();
      });
    });

    it('should return undefined for non-existent event', (done) => {
      jest.spyOn(service, 'doc$').mockReturnValue(of(undefined));
      
      const result$ = service.getEvent('non-existent');
      
      result$.subscribe(event => {
        expect(event).toBeUndefined();
        done();
      });
    });
  });

  describe('getUserEvents', () => {
    it('should get events for a specific user', async () => {
      const userId = 'user-123';
      
      const result = await service.getUserEvents(userId);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEvent);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should return empty array for user with no events', async () => {
      jest.spyOn(service, 'getAll').mockResolvedValue([]);
      
      const result = await service.getUserEvents('user-no-events');
      
      expect(result).toEqual([]);
    });

    it('should sort events by creation date (newest first)', async () => {
      const eventsWithDates = [
        { ...mockEvent, id: 'event-1', createdAt: new Date('2024-01-01') },
        { ...mockEvent, id: 'event-2', createdAt: new Date('2024-03-01') },
        { ...mockEvent, id: 'event-3', createdAt: new Date('2024-02-01') }
      ];
      jest.spyOn(service, 'getAll').mockResolvedValue(eventsWithDates);
      
      const result = await service.getUserEvents('user-123');
      
      expect(result[0].id).toBe('event-2'); // March (newest)
      expect(result[1].id).toBe('event-3'); // February
      expect(result[2].id).toBe('event-1'); // January (oldest)
    });
  });

  describe('getPublishedEvents', () => {
    it('should get only published events', async () => {
      const result = await service.getPublishedEvents();
      
      expect(result).toHaveLength(2);
      expect(result.every(event => event.status === 'published')).toBe(true);
      expect(service.getAll).toHaveBeenCalled();
    });

    it('should sort published events by creation date (newest first)', async () => {
      const result = await service.getPublishedEvents();
      
      // Should be sorted by createdAt descending
      expect(result[0].createdAt >= result[1].createdAt).toBe(true);
    });
  });

  describe('createEvent', () => {
    it('should create a new event with auto-generated ID', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New event description',
        date: new Date('2025-02-01'),
        location: 'New Location',
        createdBy: 'user-123',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        attendeeIds: [],
        status: 'draft' as const,
        eventType: 'single' as const,
        isException: false
      };

      const result = await service.createEvent(eventData);
      
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^event_\d+_[a-z0-9]+$/);
      expect(result.title).toBe(eventData.title);
      expect(service.create).toHaveBeenCalledWith(result);
    });

    it('should preserve all provided event data', async () => {
      const eventData = {
        title: 'Detailed Event',
        description: 'Detailed description',
        date: new Date('2025-03-01'),
        location: 'Detailed Location',
        createdBy: 'user-456',
        ownerId: 'user-456',
        createdAt: new Date(),
        updatedAt: new Date(),
        attendeeIds: ['attendee-1', 'attendee-2'],
        status: 'published' as const,
        eventType: 'single' as const,
        isException: false
      };

      const result = await service.createEvent(eventData);
      
      expect(result.title).toBe(eventData.title);
      expect(result.description).toBe(eventData.description);
      expect(result.location).toBe(eventData.location);
      expect(result.attendeeIds).toEqual(eventData.attendeeIds);
      expect(result.status).toBe(eventData.status);
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      const eventId = 'event-123';
      const updates = {
        title: 'Updated Event',
        description: 'Updated description'
      };

      await service.updateEvent(eventId, updates);
      
      expect(service.update).toHaveBeenCalledWith(
        eventId,
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should automatically set updatedAt timestamp', async () => {
      const eventId = 'event-123';
      const updates = { title: 'Updated Event' };

      await service.updateEvent(eventId, updates);
      
      const calledWith = (service.update as jest.Mock).mock.calls[0][1];
      expect(calledWith.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const eventId = 'event-123';
      
      await service.deleteEvent(eventId);
      
      expect(service.delete).toHaveBeenCalledWith(eventId);
    });
  });

  describe('getEventsByLocation', () => {
    it('should get events for a specific location', async () => {
      const location = 'Test Location';
      
      const result = await service.getEventsByLocation(location);
      
      expect(result).toHaveLength(1);
      expect(result[0].location).toBe(location);
      expect(result[0].status).toBe('published');
    });

    it('should only return published events', async () => {
      const result = await service.getEventsByLocation('Test Location');
      
      expect(result.every(event => event.status === 'published')).toBe(true);
    });

    it('should sort events by date (earliest first)', async () => {
      const eventsWithDates = [
        { ...mockEvent, id: 'event-1', date: new Date('2025-03-01') },
        { ...mockEvent, id: 'event-2', date: new Date('2025-01-01') },
        { ...mockEvent, id: 'event-3', date: new Date('2025-02-01') }
      ];
      jest.spyOn(service, 'getAll').mockResolvedValue(eventsWithDates);
      
      const result = await service.getEventsByLocation('Test Location');
      
      expect(result[0].id).toBe('event-2'); // January (earliest)
      expect(result[1].id).toBe('event-3'); // February
      expect(result[2].id).toBe('event-1'); // March (latest)
    });
  });

  describe('getUpcomingEvents', () => {
    it('should get only future published events', async () => {
      // Mock to return only published events including the future one
      const futureEvents = mockEvents.filter(event => event.status === 'published');
      jest.spyOn(service, 'getAll').mockResolvedValue(futureEvents);
      
      const result = await service.getUpcomingEvents();
      
      expect(result).toHaveLength(1); // Only one event passes the future date filter
      expect(result[0].id).toBe('event-123');
      expect(result[0].status).toBe('published');
      expect(new Date(result[0].date) > new Date()).toBe(true);
    });

    it('should sort upcoming events by date (earliest first)', async () => {
      const futureEvents = [
        { ...mockEvent, id: 'event-1', date: new Date('2025-09-01') },
        { ...mockEvent, id: 'event-2', date: new Date('2025-08-01') },
        { ...mockEvent, id: 'event-3', date: new Date('2025-10-01') }
      ];
      jest.spyOn(service, 'getAll').mockResolvedValue(futureEvents);
      
      const result = await service.getUpcomingEvents();
      
      expect(result[0].id).toBe('event-2'); // August (earliest)
      expect(result[1].id).toBe('event-1'); // September
      expect(result[2].id).toBe('event-3'); // October (latest)
    });
  });

  describe('searchEvents', () => {
    it('should search events by title', async () => {
      const searchTerm = 'Test Event';
      
      const result = await service.searchEvents(searchTerm);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Test Event');
    });

    it('should search events by description', async () => {
      const searchTerm = 'description';
      
      const result = await service.searchEvents(searchTerm);
      
      expect(result).toHaveLength(2);
      expect(result.every(event => 
        event.title.toLowerCase().includes(searchTerm) || 
        event.description.toLowerCase().includes(searchTerm)
      )).toBe(true);
    });

    it('should be case insensitive', async () => {
      const searchTerm = 'TEST EVENT';
      
      const result = await service.searchEvents(searchTerm);
      
      expect(result).toHaveLength(1);
      expect(result[0].title.toLowerCase()).toContain('test event');
    });

    it('should only return published events', async () => {
      const result = await service.searchEvents('Event');
      
      expect(result.every(event => event.status === 'published')).toBe(true);
    });

    it('should sort results by creation date (newest first)', async () => {
      const result = await service.searchEvents('Event');
      
      // Should be sorted by createdAt descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].createdAt >= result[i + 1].createdAt).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should handle getAll() errors gracefully', async () => {
      jest.spyOn(service, 'getAll').mockRejectedValue(new Error('Database error'));
      
      await expect(service.getUserEvents('user-123')).rejects.toThrow('Database error');
    });

    it('should handle create() errors gracefully', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(new Error('Create failed'));
      
      const eventData = {
        title: 'Test Event',
        description: 'Test description',
        date: new Date(),
        location: 'Test Location',
        createdBy: 'user-123',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        attendeeIds: [],
        status: 'draft' as const,
        eventType: 'single' as const,
        isException: false
      };

      await expect(service.createEvent(eventData)).rejects.toThrow('Create failed');
    });
  });

  describe('private methods', () => {
    it('should generate unique IDs', () => {
      const id1 = (service as any).generateId();
      const id2 = (service as any).generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^event_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^event_\d+_[a-z0-9]+$/);
    });
  });
});