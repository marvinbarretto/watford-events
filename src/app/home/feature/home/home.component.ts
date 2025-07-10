import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EventStore } from '../../../events/data-access/event.store';
import { EventItemComponent } from '../../../events/ui/event-item/event-item.component';
import { EventFilterComponent, FilterOption, EventCounts } from '../../../events/ui/event-filter/event-filter.component';
import { Event } from '../../../events/utils/event.model';
import { convertToDate, getStartOfDay, getEndOfDay, getThisWeekRange, getThisMonthRange } from '../../../shared/utils/date-utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventItemComponent, EventFilterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly eventStore = inject(EventStore);
  protected readonly router = inject(Router);

  // State
  readonly currentFilter = signal<FilterOption>('upcoming');
  readonly searchTerm = signal<string>('');
  readonly expandedEventIds = signal<Set<string>>(new Set());

  // Data from store
  readonly events = this.eventStore.publishedEvents;
  readonly loading = this.eventStore.loading;
  readonly error = this.eventStore.error;

  // Computed values
  readonly filteredEvents = computed(() => {
    const filter = this.currentFilter();
    const search = this.searchTerm().toLowerCase();
    let events = this.events();

    // Apply date filter using proper date conversion
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'upcoming':
        events = events.filter(e => convertToDate(e.date) >= today);
        break;
      case 'today':
        events = events.filter(e => {
          const eventDate = convertToDate(e.date);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      case 'this-week':
        const weekRange = getThisWeekRange();
        events = events.filter(e => {
          const eventDate = convertToDate(e.date);
          return eventDate >= weekRange.start && eventDate <= weekRange.end;
        });
        break;
      case 'this-month':
        const monthRange = getThisMonthRange();
        events = events.filter(e => {
          const eventDate = convertToDate(e.date);
          return eventDate >= monthRange.start && eventDate <= monthRange.end;
        });
        break;
      case 'all':
        // No date filtering
        break;
    }

    // Apply search filter
    if (search) {
      events = events.filter(e =>
        e.title.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search) ||
        e.location?.toLowerCase().includes(search)
      );
    }

    // Sort by date using proper conversion
    return events.sort((a, b) =>
      convertToDate(a.date).getTime() - convertToDate(b.date).getTime()
    );
  });

  readonly featuredEvents = computed(() => {
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    return this.events().filter(e => {
      const eventDate = convertToDate(e.date);
      return eventDate >= today && eventDate < dayAfter;
    });
  });

  readonly eventCounts = computed<EventCounts>(() => {
    const all = this.events();
    const search = this.searchTerm().toLowerCase();
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekRange = getThisWeekRange();
    const monthRange = getThisMonthRange();

    // Apply search filter if present
    let filteredEvents = all;
    if (search) {
      filteredEvents = all.filter(e =>
        e.title.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search) ||
        e.location?.toLowerCase().includes(search)
      );
    }

    return {
      all: filteredEvents.length,
      upcoming: filteredEvents.filter(e => convertToDate(e.date) >= today).length,
      today: filteredEvents.filter(e => {
        const eventDate = convertToDate(e.date);
        return eventDate >= today && eventDate < tomorrow;
      }).length,
      thisWeek: filteredEvents.filter(e => {
        const eventDate = convertToDate(e.date);
        return eventDate >= weekRange.start && eventDate <= weekRange.end;
      }).length,
      thisMonth: filteredEvents.filter(e => {
        const eventDate = convertToDate(e.date);
        return eventDate >= monthRange.start && eventDate <= monthRange.end;
      }).length
    };
  });

  // Methods
  onFilterChanged(filter: FilterOption) {
    this.currentFilter.set(filter);
  }

  onSearchChanged(search: string) {
    this.searchTerm.set(search);
  }

  onEventClicked(event: Event) {
    this.router.navigate(['/events', event.id]);
  }

  addNewEvent() {
    this.router.navigate(['/events/add']);
  }

  toggleEventExpanded(eventId: string) {
    const expanded = new Set(this.expandedEventIds());
    if (expanded.has(eventId)) {
      expanded.delete(eventId);
    } else {
      expanded.add(eventId);
    }
    this.expandedEventIds.set(expanded);
  }

  isEventExpanded(eventId: string): boolean {
    return this.expandedEventIds().has(eventId);
  }

  isEventFeatured(event: Event): boolean {
    return this.featuredEvents().some(e => e.id === event.id);
  }
}
