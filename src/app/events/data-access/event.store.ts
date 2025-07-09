/**
 * @fileoverview EventStore - Single source of truth for user's events
 * 
 * RESPONSIBILITIES:
 * - User's events state management (auth-reactive pattern)
 * - Event CRUD operations
 * - Loading states and error handling
 * - Auto-load events when user changes
 * 
 * DATA FLOW IN:
 * - AuthStore.user() changes → triggers loadUserEvents()
 * - Components call createEvent() → optimistically updates events list
 * - Components call updateEvent() → optimistically updates specific event
 * 
 * DATA FLOW OUT:
 * - EventListComponent → reads userEvents from here
 * - All UI components → read event data from here
 * - Navigation → reads hasEvents for conditional routing
 * 
 * @architecture Auth-Reactive Pattern - automatically loads/clears based on auth state
 */
import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EventService } from './event.service';
import { AuthStore } from '../../auth/data-access/auth.store';
import type { Event } from '../utils/event.model';

@Injectable({ providedIn: 'root' })
export class EventStore {
  // 🔧 Dependencies
  private readonly eventService = inject(EventService);
  private readonly authStore = inject(AuthStore);

  // ✅ Events state
  private readonly _userEvents = signal<Event[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentEvent = signal<Event | null>(null);

  // 📡 Public signals
  readonly userEvents = this._userEvents.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentEvent = this._currentEvent.asReadonly();
  
  // ✅ Computed values
  readonly hasEvents = computed(() => this._userEvents().length > 0);
  readonly eventsCount = computed(() => this._userEvents().length);
  readonly draftEvents = computed(() => 
    this._userEvents().filter(event => event.status === 'draft')
  );
  readonly publishedEvents = computed(() => 
    this._userEvents().filter(event => event.status === 'published')
  );
  readonly upcomingEvents = computed(() => 
    this._userEvents().filter(event => {
      const eventDate = new Date(event.date);
      const now = new Date();
      return eventDate > now && event.status === 'published';
    })
  );

  // 🔄 Track auth user changes
  private lastLoadedUserId: string | null = null;

  constructor() {
    // ✅ Listen to auth changes and load user events
    effect(() => {
      const authUser = this.authStore.user();

      if (!authUser) {
        console.log('[EventStore] 🚪 User logged out, clearing events');
        this.reset();
        this.lastLoadedUserId = null;
        return;
      }

      // Only reload if the AUTH USER ID changed
      if (authUser.uid === this.lastLoadedUserId) {
        console.log('[EventStore] ⏭ Auth user unchanged, skipping reload');
        return;
      }

      console.log('[EventStore] 📅 Loading events for user:', authUser.uid);
      this.lastLoadedUserId = authUser.uid;
      this.loadUserEvents(authUser.uid);
    });
  }

  // ===================================
  // PUBLIC LOADING METHODS
  // ===================================

  /**
   * Load events for a specific user ID
   */
  async loadUserEvents(userId: string): Promise<void> {
    if (this._loading()) {
      console.log('[EventStore] Load already in progress, skipping');
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const events = await this.eventService.getUserEvents(userId);
      this._userEvents.set(events || []);
      console.log('[EventStore] ✅ User events loaded:', events?.length || 0);
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to load events');
      console.error('[EventStore] ❌ Load events failed:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Force reload current user events
   */
  async reload(): Promise<void> {
    const authUser = this.authStore.user();
    if (authUser) {
      console.log('[EventStore] 🔄 Reloading events for user:', authUser.uid);
      await this.loadUserEvents(authUser.uid);
    }
  }

  // ===================================
  // EVENT CRUD OPERATIONS
  // ===================================

  /**
   * Create a new event with optimistic updates
   */
  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'ownerId'>): Promise<Event | null> {
    const authUser = this.authStore.user();
    if (!authUser) {
      throw new Error('Must be authenticated to create events');
    }

    this._loading.set(true);
    this._error.set(null);

    // Create full event object
    const newEvent: Omit<Event, 'id'> = {
      ...eventData,
      createdBy: authUser.uid,
      ownerId: authUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      attendeeIds: [],
      status: eventData.status || 'draft'
    };

    try {
      // Create in Firestore
      const createdEvent = await this.eventService.createEvent(newEvent);
      
      if (createdEvent) {
        // ✅ Optimistic update - add to local events list
        const currentEvents = this._userEvents();
        this._userEvents.set([createdEvent, ...currentEvents]);
        
        console.log('[EventStore] ✅ Event created:', createdEvent.id);
        return createdEvent;
      }
      
      return null;
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to create event');
      console.error('[EventStore] ❌ Create event failed:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update an existing event with optimistic updates
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const authUser = this.authStore.user();
    if (!authUser) {
      throw new Error('Must be authenticated to update events');
    }

    this._loading.set(true);
    this._error.set(null);

    // Find current event
    const currentEvents = this._userEvents();
    const eventIndex = currentEvents.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    const currentEvent = currentEvents[eventIndex];
    
    // Check permissions
    if (currentEvent.createdBy !== authUser.uid) {
      throw new Error('Permission denied: not event owner');
    }

    // ✅ Optimistic update
    const updatedEvent = { ...currentEvent, ...updates };
    const updatedEvents = [...currentEvents];
    updatedEvents[eventIndex] = updatedEvent;
    this._userEvents.set(updatedEvents);

    try {
      await this.eventService.updateEvent(eventId, updates);
      console.log('[EventStore] ✅ Event updated:', eventId);
    } catch (error: any) {
      // ❌ Rollback optimistic update
      this._userEvents.set(currentEvents);
      this._error.set(error?.message || 'Failed to update event');
      console.error('[EventStore] ❌ Update event failed:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Delete an event with optimistic updates
   */
  async deleteEvent(eventId: string): Promise<void> {
    const authUser = this.authStore.user();
    if (!authUser) {
      throw new Error('Must be authenticated to delete events');
    }

    this._loading.set(true);
    this._error.set(null);

    // Find current event
    const currentEvents = this._userEvents();
    const eventToDelete = currentEvents.find(e => e.id === eventId);
    
    if (!eventToDelete) {
      throw new Error('Event not found');
    }

    // Check permissions
    if (eventToDelete.createdBy !== authUser.uid) {
      throw new Error('Permission denied: not event owner');
    }

    // ✅ Optimistic update - remove from list
    const updatedEvents = currentEvents.filter(e => e.id !== eventId);
    this._userEvents.set(updatedEvents);

    try {
      await this.eventService.deleteEvent(eventId);
      console.log('[EventStore] ✅ Event deleted:', eventId);
    } catch (error: any) {
      // ❌ Rollback optimistic update
      this._userEvents.set(currentEvents);
      this._error.set(error?.message || 'Failed to delete event');
      console.error('[EventStore] ❌ Delete event failed:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Publish a draft event
   */
  async publishEvent(eventId: string): Promise<void> {
    await this.updateEvent(eventId, { status: 'published' });
  }

  /**
   * Cancel a published event
   */
  async cancelEvent(eventId: string): Promise<void> {
    await this.updateEvent(eventId, { status: 'cancelled' });
  }

  // ===================================
  // SINGLE EVENT MANAGEMENT
  // ===================================

  /**
   * Load a specific event for editing
   */
  async loadEvent(eventId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const event = await firstValueFrom(this.eventService.getEvent(eventId));
      this._currentEvent.set(event || null);
      console.log('[EventStore] ✅ Event loaded:', eventId);
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to load event');
      console.error('[EventStore] ❌ Load event failed:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear current event
   */
  clearCurrentEvent(): void {
    this._currentEvent.set(null);
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  /**
   * Get event by ID from loaded events
   */
  getEventById(eventId: string): Event | null {
    return this._userEvents().find(event => event.id === eventId) || null;
  }

  /**
   * Check if user owns event
   */
  isEventOwner(eventId: string): boolean {
    const authUser = this.authStore.user();
    const event = this.getEventById(eventId);
    return !!(authUser && event && event.createdBy === authUser.uid);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset store state
   */
  reset(): void {
    this._userEvents.set([]);
    this._currentEvent.set(null);
    this._loading.set(false);
    this._error.set(null);
  }

  /**
   * Get debug information
   */
  getDebugInfo(): object {
    return {
      eventsCount: this._userEvents().length,
      loading: this._loading(),
      error: this._error(),
      lastLoadedUserId: this.lastLoadedUserId,
      hasCurrentEvent: !!this._currentEvent(),
    };
  }
}