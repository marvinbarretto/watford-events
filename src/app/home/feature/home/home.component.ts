import { Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '../../../shared/data-access/base.component';
import { EventStore } from '../../../events/data-access/event.store';
import { EventItemComponent } from '../../../events/ui/event-item/event-item.component';
import { EventFilterComponent, FilterOption, EventCounts } from '../../../events/ui/event-filter/event-filter.component';
import { UserPreferencesWidgetComponent } from '../../../user-preferences/ui/user-preferences-widget/user-preferences-widget.component';
import { EventModel } from '../../../events/utils/event.model';
import { convertToDate, getStartOfDay, getEndOfDay, getThisWeekRange, getThisMonthRange } from '../../../shared/utils/date-utils';
import { calculateDistanceBetweenPoints, convertDistance, isWithinRadius } from '../../../shared/utils/distance.utils';
import { LocationService } from '../../../shared/data-access/location.service';
import { UserPreferencesStore } from '../../../user-preferences/data-access/user-preferences.store';
import { VenueStore } from '../../../venues/data-access/venue.store';

@Component({
  selector: 'app-home',
  imports: [EventItemComponent, EventFilterComponent, UserPreferencesWidgetComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent extends BaseComponent {
  protected readonly eventStore = inject(EventStore);
  private readonly venueStore = inject(VenueStore);
  private readonly locationService = inject(LocationService);
  private readonly preferencesStore = inject(UserPreferencesStore);

  // State
  readonly currentFilter = signal<FilterOption>('upcoming');
  readonly searchTerm = signal<string>('');
  readonly expandedEventIds = signal<Set<string>>(new Set());


  // Data from store
  readonly events = this.eventStore.publishedEvents;
  // Use store's loading and error states instead of BaseComponent's
  readonly storeLoading = this.eventStore.loading;
  readonly storeError = this.eventStore.error;

  // Calculate event distances using real venue coordinates
  readonly eventDistances = computed(() => {
    const events = this.events();
    const userLocation = this.locationService.location();
    const userUnit = this.preferencesStore.distanceUnit();
    const searchRadiusKm = this.preferencesStore.searchRadius();
    const venues = this.venueStore.venues();

    if (!userLocation || events.length === 0) {
      console.log('[HomeComponent] 📍 No user location or events for distance calculation:', {
        hasLocation: !!userLocation,
        eventsCount: events.length
      });
      return new Map<string, { distanceInUserUnit: number; withinRadius: boolean }>();
    }

    console.log('[HomeComponent] 📊 Calculating distances for events:', {
      eventsCount: events.length,
      venuesCount: venues.length,
      userLocation,
      userUnit,
      searchRadiusKm
    });

    const distanceMap = new Map<string, { distanceInUserUnit: number; withinRadius: boolean }>();

    // Calculate distances using real venue coordinates
    events.forEach(event => {
      if (!event.venueId) {
        console.log('[HomeComponent] ⚠️ Event missing venueId:', event.id);
        return;
      }

      // Find the venue for this event
      const venue = venues.find(v => v.id === event.venueId);
      if (!venue || !venue.geo) {
        console.log('[HomeComponent] ⚠️ Venue not found or missing coordinates:', {
          eventId: event.id,
          venueId: event.venueId,
          hasVenue: !!venue,
          hasGeo: !!(venue?.geo)
        });
        return;
      }

      const distanceKm = calculateDistanceBetweenPoints(
        userLocation,
        { lat: venue.geo.lat, lng: venue.geo.lng }
      );

      const distanceInUserUnit = convertDistance(distanceKm, userUnit);
      const withinRadius = isWithinRadius(distanceKm, searchRadiusKm);

      console.log('[HomeComponent] 📍 Event distance calculated:', {
        eventId: event.id,
        venueName: venue.name,
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

    // Apply date filter
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('[HomeComponent] 🔍 Filtering events:', {
      filter,
      totalEvents: events.length,
      today: today.toISOString(),
      todayLocal: today.toLocaleDateString()
    });

    // Apply filter-based filtering
    switch (filter) {
        case 'upcoming':
          console.log('[HomeComponent] 📅 Testing upcoming filter...');
          events = events.filter(e => {
            const originalDate = e.date;
            const convertedDate = convertToDate(e.date);
            const isUpcoming = convertedDate >= today;
            console.log(`[HomeComponent] Event "${e.title}":`, {
              originalDate,
              convertedDate: convertedDate.toISOString(),
              convertedLocal: convertedDate.toLocaleDateString(),
              today: today.toISOString(),
              isUpcoming,
              status: e.status
            });
            return isUpcoming;
          });
          console.log('[HomeComponent] ✅ Upcoming events after filter:', events.length);
          break;
        case 'today':
          events = events.filter(e => {
            const eventDate = convertToDate(e.date);
            return eventDate >= today && eventDate < tomorrow;
          });
          break;
        case 'tomorrow':
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          events = events.filter(e => {
            const eventDate = convertToDate(e.date);
            return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
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

    // Apply radius filter - only show events within user's search radius
    const userLocation = this.locationService.location();
    const searchRadiusKm = this.preferencesStore.searchRadius();
    console.log('[HomeComponent] 📍 Radius filtering:', {
      hasUserLocation: !!userLocation,
      eventsBeforeRadius: events.length,
      userLocation,
      searchRadiusKm
    });
    
    if (userLocation && searchRadiusKm > 0) {
      const eventDistances = this.eventDistances();
      console.log('[HomeComponent] 📏 Distance data:', {
        distanceMapSize: eventDistances.size,
        eventIds: events.map(e => e.id),
        distanceEntries: Array.from(eventDistances.entries())
      });
      
      events = events.filter(event => {
        const distanceData = eventDistances.get(event.id);
        const withinRadius = distanceData ? distanceData.withinRadius : true;
        console.log(`[HomeComponent] Event "${event.title}" radius check:`, {
          hasDistanceData: !!distanceData,
          withinRadius,
          distanceData
        });
        return withinRadius; // Include events without distance data
      });
      
      console.log('[HomeComponent] 📍 Events after radius filter:', events.length);
    } else if (!userLocation) {
      console.log('[HomeComponent] 📍 No user location - skipping radius filter');
    } else {
      console.log('[HomeComponent] 📍 Search radius is 0 - skipping radius filter (showing all events)');
    }

    // Sort based on user preference
    const sortOrder = this.preferencesStore.defaultSortOrder();
    const eventDistances = this.eventDistances();

    return events.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return convertToDate(b.date).getTime() - convertToDate(a.date).getTime();

        case 'distance':
          const distanceA = eventDistances.get(a.id)?.distanceInUserUnit ?? Infinity;
          const distanceB = eventDistances.get(b.id)?.distanceInUserUnit ?? Infinity;

          // If both have no distance, sort by date
          if (distanceA === Infinity && distanceB === Infinity) {
            return convertToDate(a.date).getTime() - convertToDate(b.date).getTime();
          }

          return distanceA - distanceB;

        case 'alphabetical':
          return a.title.localeCompare(b.title);

        case 'date-asc':
        default:
          return convertToDate(a.date).getTime() - convertToDate(b.date).getTime();
      }
    });
  });

  readonly featuredEvents = computed<EventModel[]>(() => {
    // No featured events for now - all events display as normal
    return [];
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
      tomorrow: filteredEvents.filter(e => {
        const eventDate = convertToDate(e.date);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        return eventDate >= tomorrow && eventDate < dayAfterTomorrow;
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

  onEventClicked(event: EventModel) {
    this.router.navigate(['/events', event.id]);
  }

  addNewEvent() {
    this.router.navigate(['/events/create']);
  }

  createEvent() {
    this.router.navigate(['/events/create']);
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

  isEventFeatured(event: EventModel): boolean {
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

  getEventVenue(eventId: string) {
    const event = this.events().find(e => e.id === eventId);
    if (!event?.venueId) return null;

    const venues = this.venueStore.venues();
    return venues.find(v => v.id === event.venueId) || null;
  }
}
