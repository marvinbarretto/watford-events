import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminStore } from '../../data-access/admin.store';
import { EventService } from '@app/events/data-access/event.service';
import { Event } from '@app/events/utils/event.model';

@Component({
  selector: 'app-admin-event-management',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-event-management.html',
  styleUrl: './admin-event-management.scss'
})
export class AdminEventManagement implements OnInit {
  private readonly adminStore = inject(AdminStore);
  private readonly eventService = inject(EventService);

  // Expose store signals to template
  readonly events = this.adminStore.events;
  readonly eventsLoading = this.adminStore.eventsLoading;
  readonly selectedEvent = this.adminStore.selectedEvent;

  // Component state
  filterStatus: 'all' | 'draft' | 'published' | 'cancelled' = 'all';
  sortBy: 'date' | 'title' | 'status' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  async ngOnInit() {
    await this.loadEvents();
  }

  private async loadEvents() {
    this.adminStore.setEventsLoading(true);
    
    try {
      const events = await this.eventService.getAll();
      this.adminStore.setEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      this.adminStore.setEventsLoading(false);
    }
  }

  get filteredAndSortedEvents(): Event[] {
    let filtered = this.events();
    
    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((event: Event) => event.status === this.filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a: Event, b: Event) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }

  async updateEventStatus(eventId: string, newStatus: 'draft' | 'published' | 'cancelled') {
    try {
      const event = this.events().find((e: Event) => e.id === eventId);
      if (!event) return;

      const updatedEvent = { ...event, status: newStatus, updatedAt: new Date() };
      await this.eventService.updateEvent(eventId, updatedEvent);
      
      // Update store
      this.adminStore.updateEvent(eventId, { status: newStatus, updatedAt: new Date() });
    } catch (error) {
      console.error('Failed to update event status:', error);
    }
  }

  async deleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await this.eventService.deleteEvent(eventId);
      this.adminStore.removeEvent(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }

  selectEvent(event: Event) {
    this.adminStore.setSelectedEvent(event);
  }

  clearSelection() {
    this.adminStore.setSelectedEvent(null);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
