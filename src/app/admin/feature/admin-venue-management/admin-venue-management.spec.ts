import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminVenueManagement } from './admin-venue-management';
import { AdminStore } from '../../data-access/admin.store';
import { VenueService } from '@app/venues/data-access/venue.service';
import { signal } from '@angular/core';
import { Venue } from '@app/venues/utils/venue.model';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AdminVenueManagement', () => {
  let component: AdminVenueManagement;
  let fixture: ComponentFixture<AdminVenueManagement>;
  let mockAdminStore: jest.Mocked<AdminStore>;
  let mockVenueService: jest.Mocked<VenueService>;

  const mockVenues: Venue[] = [
    {
      id: 'venue1',
      name: 'Test Venue 1',
      address: '123 Test Street',
      geo: { lat: 51.6565, lng: -0.3959 },
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
      ownerId: 'user1',
      category: 'theatre',
      accessibleEntrance: true
    },
    {
      id: 'venue2',
      name: 'Test Venue 2',
      address: '456 Test Avenue',
      geo: { lat: 51.6600, lng: -0.4000 },
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user2',
      ownerId: 'user2',
      category: 'pub'
    }
  ];

  beforeEach(async () => {
    const adminStoreSpy = {
      setVenuesLoading: jest.fn(),
      setVenues: jest.fn(),
      setSelectedVenue: jest.fn(),
      updateVenue: jest.fn(),
      removeVenue: jest.fn(),
      venues: signal(mockVenues),
      venuesLoading: signal(false),
      selectedVenue: signal(null)
    } as jest.Mocked<AdminStore>;

    const venueServiceSpy = {
      getAll: jest.fn(),
      updateVenue: jest.fn(),
      deleteVenue: jest.fn()
    } as jest.Mocked<VenueService>;

    await TestBed.configureTestingModule({
      imports: [AdminVenueManagement],
      providers: [
        { provide: AdminStore, useValue: adminStoreSpy },
        { provide: VenueService, useValue: venueServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: { params: {}, queryParams: {} }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminVenueManagement);
    component = fixture.componentInstance;
    mockAdminStore = TestBed.inject(AdminStore) as jest.Mocked<AdminStore>;
    mockVenueService = TestBed.inject(VenueService) as jest.Mocked<VenueService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load venues on init', async () => {
    mockVenueService.getAll.mockResolvedValue(mockVenues);
    
    await component.ngOnInit();
    
    expect(mockAdminStore.setVenuesLoading).toHaveBeenCalledWith(true);
    expect(mockVenueService.getAll).toHaveBeenCalled();
    expect(mockAdminStore.setVenues).toHaveBeenCalledWith(mockVenues);
    expect(mockAdminStore.setVenuesLoading).toHaveBeenCalledWith(false);
  });

  it('should filter venues by status', () => {
    component.filterStatus = 'published';
    
    const filtered = component.filteredAndSortedVenues;
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('published');
  });

  it('should filter venues by category', () => {
    component.filterCategory = 'theatre';
    
    const filtered = component.filteredAndSortedVenues;
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].category).toBe('theatre');
  });

  it('should filter accessible venues only', () => {
    component.showOnlyAccessible = true;
    
    const filtered = component.filteredAndSortedVenues;
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].accessibleEntrance).toBe(true);
  });

  it('should sort venues by name', () => {
    component.sortBy = 'name';
    component.sortOrder = 'asc';
    
    const sorted = component.filteredAndSortedVenues;
    
    expect(sorted[0].name).toBe('Test Venue 1');
    expect(sorted[1].name).toBe('Test Venue 2');
  });

  it('should update venue status', async () => {
    const venueId = 'venue1';
    const newStatus = 'archived';
    
    mockVenueService.updateVenue.mockResolvedValue(undefined);
    
    await component.updateVenueStatus(venueId, newStatus);
    
    expect(mockVenueService.updateVenue).toHaveBeenCalledWith(venueId, { status: newStatus });
    expect(mockAdminStore.updateVenue).toHaveBeenCalledWith(venueId, expect.objectContaining({ status: newStatus }));
  });

  it('should delete venue after confirmation', async () => {
    const venueId = 'venue1';
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockVenueService.deleteVenue.mockResolvedValue(undefined);
    
    await component.deleteVenue(venueId);
    
    expect(mockVenueService.deleteVenue).toHaveBeenCalledWith(venueId);
    expect(mockAdminStore.removeVenue).toHaveBeenCalledWith(venueId);
  });

  it('should not delete venue if not confirmed', async () => {
    const venueId = 'venue1';
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    
    await component.deleteVenue(venueId);
    
    expect(mockVenueService.deleteVenue).not.toHaveBeenCalled();
    expect(mockAdminStore.removeVenue).not.toHaveBeenCalled();
  });

  it('should select venue', () => {
    const venue = mockVenues[0];
    
    component.selectVenue(venue);
    
    expect(mockAdminStore.setSelectedVenue).toHaveBeenCalledWith(venue);
  });

  it('should clear venue selection', () => {
    component.clearSelection();
    
    expect(mockAdminStore.setSelectedVenue).toHaveBeenCalledWith(null);
  });

  it('should identify accessible venues', () => {
    const accessibleVenue = mockVenues[0];
    const nonAccessibleVenue = mockVenues[1];
    
    expect(component.isAccessible(accessibleVenue)).toBe(true);
    expect(component.isAccessible(nonAccessibleVenue)).toBe(false);
  });

  it('should get status color', () => {
    expect(component.getStatusColor('published')).toBe('success');
    expect(component.getStatusColor('draft')).toBe('warning');
    expect(component.getStatusColor('archived')).toBe('medium');
  });

  it('should get category display name', () => {
    expect(component.getCategoryDisplay('theatre')).toBe('Theatre');
    expect(component.getCategoryDisplay('pub')).toBe('Pub/Bar');
    expect(component.getCategoryDisplay(undefined)).toBe('Other');
  });

  it('should format coordinates', () => {
    const geo = { lat: 51.6565, lng: -0.3959 };
    const formatted = component.formatCoordinates(geo);
    
    expect(formatted).toBe('51.656500, -0.395900');
  });

  it('should get accessibility features', () => {
    const venue = {
      ...mockVenues[0],
      accessibleEntrance: true,
      stepFreeAccess: true,
      toilets: {
        accessibleToilet: true,
        babyChanging: true,
        genderNeutral: false
      }
    };
    
    const features = component.getAccessibilityFeatures(venue);
    
    expect(features).toContain('Accessible Entrance');
    expect(features).toContain('Step-free Access');
    expect(features).toContain('Accessible Toilets');
    expect(features).toContain('Baby Changing');
    expect(features).not.toContain('Gender Neutral Toilets');
  });
});