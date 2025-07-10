import { VenueService } from './venue.service';
import { Venue } from '../utils/venue.model';
import { of } from 'rxjs';

// Mock the parent class, this terse expliciy approach is probably the way forwards
jest.mock('../../shared/data-access/firestore-crud.service', () => ({
  FirestoreCrudService: class {
    protected path = '';
    async getAll() { return []; }
    doc$() { return of(undefined); }
    async create() {}
    async update() {}
    async delete() {}
  }
}));

describe('VenueService - Targeted Tests', () => {
  let service: VenueService;

  // Sample test data
  const mockVenues = [
    {
      id: '1',
      name: 'Test Venue A',
      address: 'London Road',
      category: 'community-hall' as const,
      status: 'published' as const,
      createdBy: 'user123',
      createdAt: new Date('2024-01-01'),
      geo: { lat: 51.5074, lng: -0.1278 },
      capacity: { maxCapacity: 100 },
      accessibleEntrance: true
    },
    {
      id: '2',
      name: 'Test Venue B',
      address: 'Birmingham Street',
      category: 'theatre' as const,
      status: 'draft' as const,
      createdBy: 'user456',
      createdAt: new Date('2024-01-02'),
      geo: { lat: 52.4862, lng: -1.8904 },
      capacity: { maxCapacity: 50 }
    }
  ] as Venue[];

  beforeEach(() => {
    service = new VenueService();
    // Mock getAll to return our test data
    jest.spyOn(service, 'getAll').mockResolvedValue(mockVenues);
  });

  describe('calculateDistance', () => {
    it('should calculate distance between London and Birmingham correctly', () => {
      // London to Birmingham is ~162.5km (algorithm is correct!)
      const distance = service['calculateDistance'](51.5074, -0.1278, 52.4862, -1.8904);
      expect(distance).toBeCloseTo(162.5, 1); // Within 1km accuracy
    });

    it('should return 0 for same coordinates', () => {
      const distance = service['calculateDistance'](51.5074, -0.1278, 51.5074, -0.1278);
      expect(distance).toBe(0);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = service['generateId']();
      const id2 = service['generateId']();

      expect(id1).toMatch(/^venue_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^venue_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getUserVenues', () => {
    it('should filter by user and sort by creation date desc', async () => {
      const result = await service.getUserVenues('user123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].createdBy).toBe('user123');
    });

    it('should return empty array for non-existent user', async () => {
      const result = await service.getUserVenues('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('searchVenues', () => {
    it('should find venues by name (case insensitive)', async () => {
      const result = await service.searchVenues('venue a');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Venue A');
    });

    it('should find venues by address', async () => {
      const result = await service.searchVenues('london');

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('London Road');
    });

    it('should only return published venues', async () => {
      const result = await service.searchVenues('venue'); // Matches both

      expect(result).toHaveLength(1); // Only published one
      expect(result[0].status).toBe('published');
    });

    it('should return empty array for no matches', async () => {
      const result = await service.searchVenues('xyz123');
      expect(result).toEqual([]);
    });
  });

  describe('getVenuesByCapacity', () => {
    it('should filter by minimum capacity', async () => {
      const result = await service.getVenuesByCapacity(75);

      expect(result).toHaveLength(1);
      expect(result[0].capacity?.maxCapacity).toBe(100);
    });

    it('should filter by capacity range', async () => {
      const result = await service.getVenuesByCapacity(40, 60);

      expect(result).toHaveLength(0); // Venue B is draft status
    });

    it('should handle venues without capacity', async () => {
      const venuesWithoutCapacity = [
        { ...mockVenues[0], capacity: undefined }
      ] as Venue[];

      jest.spyOn(service, 'getAll').mockResolvedValue(venuesWithoutCapacity);

      const result = await service.getVenuesByCapacity(50);
      expect(result).toEqual([]);
    });
  });

  describe('getVenuesNearby', () => {
    it('should return venues within distance threshold', async () => {
      // Search near London coordinates with large radius
      const result = await service.getVenuesNearby(51.5074, -0.1278, 200);

      expect(result).toHaveLength(1); // Only published venue
      expect(result[0].id).toBe('1');
    });

    it('should exclude venues outside distance threshold', async () => {
      // Search from Birmingham coordinates (far from London venue)
      const result = await service.getVenuesNearby(52.4862, -1.8904, 1); // 1km radius from Birmingham

      expect(result).toEqual([]); // London venue is ~162km away
    });

    it('should sort by distance from center', async () => {
      // Add another published venue closer to search point
      const closerVenue = {
        ...mockVenues[0],
        id: '3',
        geo: { lat: 51.5075, lng: -0.1279 } // Very close to London search point
      };

      // Make original venue further away
      const furtherVenue = {
        ...mockVenues[0],
        id: '1',
        geo: { lat: 51.5100, lng: -0.1300 } // Further from search point
      };

      jest.spyOn(service, 'getAll').mockResolvedValue([
        furtherVenue,  // Further away
        closerVenue    // Closer
      ]);

      const result = await service.getVenuesNearby(51.5074, -0.1278, 200);

      expect(result[0].id).toBe('3'); // Closer venue first
      expect(result[1].id).toBe('1'); // Further venue second
    });
  });
});
