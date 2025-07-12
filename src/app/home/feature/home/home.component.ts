import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EventStore } from '../../../events/data-access/event.store';
import { EventItemComponent } from '../../../events/ui/event-item/event-item.component';
import { EventFilterComponent, FilterOption, EventCounts } from '../../../events/ui/event-filter/event-filter.component';
import { UserPreferencesWidgetComponent } from '../../../user-preferences/ui/user-preferences-widget/user-preferences-widget.component';
import { UserWidgetComponent } from '../../../shared/ui/user-widget/user-widget.component';
import { Event } from '../../../events/utils/event.model';
import { convertToDate, getStartOfDay, getEndOfDay, getThisWeekRange, getThisMonthRange } from '../../../shared/utils/date-utils';
import { calculateDistanceBetweenPoints, convertDistance, isWithinRadius } from '../../../shared/utils/distance.utils';
import { VenueService } from '../../../venues/data-access/venue.service';
import { LocationService } from '../../../shared/data-access/location.service';
import { UserPreferencesStore } from '../../../user-preferences/data-access/user-preferences.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventItemComponent, EventFilterComponent, UserPreferencesWidgetComponent, UserWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly eventStore = inject(EventStore);
  protected readonly router = inject(Router);
  private readonly venueService = inject(VenueService);
  private readonly locationService = inject(LocationService);
  private readonly preferencesStore = inject(UserPreferencesStore);

  // State
  readonly currentFilter = signal<FilterOption>('upcoming');
  readonly searchTerm = signal<string>('');
  readonly expandedEventIds = signal<Set<string>>(new Set());

  // Data from store
  readonly events = this.eventStore.publishedEvents;
  readonly loading = this.eventStore.loading;
  readonly error = this.eventStore.error;

  // Simple distance calculations using venues
  readonly eventDistances = computed(() => {
    const events = this.events();
    const userLocation = this.locationService.location();
    const userUnit = this.preferencesStore.distanceUnit();
    const searchRadiusKm = this.preferencesStore.searchRadius();
    
    if (!userLocation || events.length === 0) {
      console.log('[HomeComponent] 📍 No user location or events for distance calculation:', {
        hasLocation: !!userLocation,
        eventsCount: events.length
      });
      return new Map<string, { distanceInUserUnit: number; withinRadius: boolean }>();
    }

    console.log('[HomeComponent] 📊 Calculating distances for events:', {
      eventsCount: events.length,
      userLocation,
      userUnit,
      searchRadiusKm
    });

    const distanceMap = new Map<string, { distanceInUserUnit: number; withinRadius: boolean }>();
    
    // For now, add demo coordinates for testing
    // TODO: Replace with actual venue lookup
    events.forEach(event => {
      if (!event.venueId) {
        console.log('[HomeComponent] ⚠️ Event missing venueId:', event.id);
        return;
      }
      
      // Demo coordinates (Watford area) - TODO: get from venue
      const demoLat = 51.6560 + (Math.random() - 0.5) * 0.02; // ±1km variation
      const demoLng = -0.3950 + (Math.random() - 0.5) * 0.02;
      
      const distanceKm = calculateDistanceBetweenPoints(
        userLocation,
        { lat: demoLat, lng: demoLng }
      );
      
      const distanceInUserUnit = convertDistance(distanceKm, userUnit);
      const withinRadius = isWithinRadius(distanceKm, searchRadiusKm);
      
      console.log('[HomeComponent] 📍 Event distance calculated:', {
        eventId: event.id,
        distanceKm: distanceKm.toFixed(2),
        distanceInUserUnit: distanceInUserUnit.toFixed(2),
        unit: userUnit,
        withinRadius
      });
      
      distanceMap.set(event.id, { distanceInUserUnit, withinRadius });
    });

    return distanceMap;
  });

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
    // TODO: Replace with proper featured event logic (manual selection, popularity, etc.)
    // For now, randomly select up to 3 upcoming events
    const upcomingEvents = this.events().filter(e => convertToDate(e.date) >= getStartOfDay(new Date()));
    const shuffled = [...upcomingEvents].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
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

  // Distance helper methods
  getEventDistance(eventId: string): number | null {
    const distanceData = this.eventDistances().get(eventId);
    return distanceData ? distanceData.distanceInUserUnit : null;
  }

  isEventWithinRadius(eventId: string): boolean {
    const distanceData = this.eventDistances().get(eventId);
    return distanceData ? distanceData.withinRadius : false;
  }

  getDistanceUnit() {
    return this.preferencesStore.distanceUnit();
  }
}
