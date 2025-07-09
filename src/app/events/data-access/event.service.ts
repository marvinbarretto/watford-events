import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '../../shared/data-access/firestore-crud.service';
import { Event } from '../utils/event.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService extends FirestoreCrudService<Event> {
  protected path = 'events';

  /**
   * Get a single event by ID
   */
  getEvent(eventId: string): Observable<Event | undefined> {
    return this.doc$<Event>(`events/${eventId}`);
  }

  /**
   * Get all events for a specific user
   */
  async getUserEvents(userId: string): Promise<Event[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => event.createdBy === userId)
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get all published events (public feed)
   */
  async getPublishedEvents(): Promise<Event[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => event.status === 'published')
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Create a new event with auto-generated ID
   */
  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    const id = this.generateId();
    const event: Event = {
      id,
      ...eventData
    };
    await this.create(event);
    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, data: Partial<Event>): Promise<void> {
    await this.update(eventId, {
      ...data,
      updatedAt: new Date()
    });
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.delete(eventId);
  }

  /**
   * Get events by location (for discovery)
   */
  async getEventsByLocation(location: string): Promise<Event[]> {
    const allEvents = await this.getAll();
    return allEvents.filter(event => 
      event.location === location && event.status === 'published'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    const allEvents = await this.getAll();
    return allEvents.filter(event => 
      new Date(event.date) >= now && event.status === 'published'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Search events by title or description
   */
  async searchEvents(searchTerm: string): Promise<Event[]> {
    const allEvents = await this.getAll();
    const term = searchTerm.toLowerCase();
    return allEvents.filter(event => 
      event.status === 'published' && (
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term)
      )
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Generate a unique ID for new events
   */
  private generateId(): string {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}