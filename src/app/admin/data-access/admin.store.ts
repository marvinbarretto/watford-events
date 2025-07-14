import { Injectable, signal, computed, inject } from '@angular/core';
import { EventModel } from '@app/events/utils/event.model';
import { User } from '@users/utils/user.model';
import { Venue } from '@app/venues/utils/venue.model';

@Injectable({ providedIn: 'root' })
export class AdminStore {
  // ===== EVENT MANAGEMENT STATE =====
  
  // Private signals for event management
  private readonly _events = signal<EventModel[]>([]);
  private readonly _selectedEvent = signal<EventModel | null>(null);
  private readonly _eventsLoading = signal(false);
  
  // Public readonly signals
  readonly events = this._events.asReadonly();
  readonly selectedEvent = this._selectedEvent.asReadonly();
  readonly eventsLoading = this._eventsLoading.asReadonly();
  
  // ===== USER MANAGEMENT STATE =====
  
  // Private signals for user management
  private readonly _users = signal<User[]>([]);
  private readonly _selectedUser = signal<User | null>(null);
  private readonly _usersLoading = signal(false);
  
  // Public readonly signals
  readonly users = this._users.asReadonly();
  readonly selectedUser = this._selectedUser.asReadonly();
  readonly usersLoading = this._usersLoading.asReadonly();
  
  // ===== VENUE MANAGEMENT STATE =====
  
  // Private signals for venue management
  private readonly _venues = signal<Venue[]>([]);
  private readonly _selectedVenue = signal<Venue | null>(null);
  private readonly _venuesLoading = signal(false);
  
  // Public readonly signals
  readonly venues = this._venues.asReadonly();
  readonly selectedVenue = this._selectedVenue.asReadonly();
  readonly venuesLoading = this._venuesLoading.asReadonly();
  
  // ===== DASHBOARD STATS STATE =====
  
  // Private signals for dashboard stats
  private readonly _totalEvents = signal(0);
  private readonly _totalUsers = signal(0);
  private readonly _totalVenues = signal(0);
  private readonly _pendingEvents = signal(0);
  
  // Public readonly signals
  readonly totalEvents = this._totalEvents.asReadonly();
  readonly totalUsers = this._totalUsers.asReadonly();
  readonly totalVenues = this._totalVenues.asReadonly();
  readonly pendingEvents = this._pendingEvents.asReadonly();
  
  // ===== COMPUTED VALUES =====
  
  // Dashboard computed values
  readonly dashboardStats = computed(() => ({
    totalEvents: this._totalEvents(),
    totalUsers: this._totalUsers(),
    totalVenues: this._totalVenues(),
    pendingEvents: this._pendingEvents(),
    approvedEvents: this._totalEvents() - this._pendingEvents(),
  }));
  
  // Event management computed values
  readonly hasEvents = computed(() => this._events().length > 0);
  readonly hasSelectedEvent = computed(() => !!this._selectedEvent());
  
  // User management computed values
  readonly hasUsers = computed(() => this._users().length > 0);
  readonly hasSelectedUser = computed(() => !!this._selectedUser());
  
  // Venue management computed values
  readonly hasVenues = computed(() => this._venues().length > 0);
  readonly hasSelectedVenue = computed(() => !!this._selectedVenue());
  
  // ===== EVENT MANAGEMENT METHODS =====
  
  setEvents(events: EventModel[]) {
    this._events.set(events);
    this._totalEvents.set(events.length);
    this._pendingEvents.set(events.filter((e: EventModel) => e.status === 'draft').length);
  }
  
  setSelectedEvent(event: EventModel | null) {
    this._selectedEvent.set(event);
  }
  
  setEventsLoading(loading: boolean) {
    this._eventsLoading.set(loading);
  }
  
  updateEvent(eventId: string, updates: Partial<EventModel>) {
    const currentEvents = this._events();
    const updatedEvents = currentEvents.map((event: EventModel) => 
      event.id === eventId ? { ...event, ...updates } : event
    );
    this._events.set(updatedEvents);
    
    // Update stats
    this._totalEvents.set(updatedEvents.length);
    this._pendingEvents.set(updatedEvents.filter((e: EventModel) => e.status === 'draft').length);
  }
  
  removeEvent(eventId: string) {
    const currentEvents = this._events();
    const updatedEvents = currentEvents.filter((event: EventModel) => event.id !== eventId);
    this._events.set(updatedEvents);
    
    // Update stats
    this._totalEvents.set(updatedEvents.length);
    this._pendingEvents.set(updatedEvents.filter((e: EventModel) => e.status === 'draft').length);
  }
  
  // ===== USER MANAGEMENT METHODS =====
  
  setUsers(users: User[]) {
    this._users.set(users);
    this._totalUsers.set(users.length);
  }
  
  setSelectedUser(user: User | null) {
    this._selectedUser.set(user);
  }
  
  setUsersLoading(loading: boolean) {
    this._usersLoading.set(loading);
  }
  
  updateUser(userId: string, updates: Partial<User>) {
    const currentUsers = this._users();
    const updatedUsers = currentUsers.map((user: User) => 
      user.uid === userId ? { ...user, ...updates } : user
    );
    this._users.set(updatedUsers);
    
    // Update stats
    this._totalUsers.set(updatedUsers.length);
  }
  
  // ===== VENUE MANAGEMENT METHODS =====
  
  setVenues(venues: Venue[]) {
    this._venues.set(venues);
    this._totalVenues.set(venues.length);
  }
  
  setSelectedVenue(venue: Venue | null) {
    this._selectedVenue.set(venue);
  }
  
  setVenuesLoading(loading: boolean) {
    this._venuesLoading.set(loading);
  }
  
  updateVenue(venueId: string, updates: Partial<Venue>) {
    const currentVenues = this._venues();
    const updatedVenues = currentVenues.map((venue: Venue) => 
      venue.id === venueId ? { ...venue, ...updates } : venue
    );
    this._venues.set(updatedVenues);
    
    // Update stats
    this._totalVenues.set(updatedVenues.length);
  }
  
  removeVenue(venueId: string) {
    const currentVenues = this._venues().filter((venue: Venue) => venue.id !== venueId);
    this._venues.set(currentVenues);
    
    // Update stats
    this._totalVenues.set(currentVenues.length);
  }
  
  // ===== DASHBOARD METHODS =====
  
  refreshDashboardStats() {
    const events = this._events();
    const users = this._users();
    const venues = this._venues();
    
    this._totalEvents.set(events.length);
    this._totalUsers.set(users.length);
    this._totalVenues.set(venues.length);
    this._pendingEvents.set(events.filter((e: EventModel) => e.status === 'draft').length);
  }
}