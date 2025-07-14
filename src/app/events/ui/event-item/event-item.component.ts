import { Component, input, output, computed } from '@angular/core';
import { EventModel, EVENT_CATEGORIES } from '../../utils/event.model';
import { convertToDate, getRelativeTime } from '../../../shared/utils/date-utils';
import { ChipComponent } from '../../../shared/ui/chip/chip.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { DistanceUnit } from '../../../user-preferences/utils/user-preferences.types';
import { formatDistance } from '../../../shared/utils/distance.utils';
import { DateBoxComponent } from '../../../shared/ui/date-box/date-box.component';
import { Venue } from '../../../venues/utils/venue.model';

@Component({
  selector: 'app-event-item',
  imports: [ChipComponent, IconComponent, HighlightPipe, DateBoxComponent],
  styleUrl: './event-item.component.scss',
  template: `
    <article
      class="event-item"
      [class.featured]="isFeatured()"
      [class.expanded]="isExpanded()"
      (click)="handleClick()"
      itemscope
      itemtype="https://schema.org/Event"
      [attr.aria-label]="'Event: ' + event().title"
      role="article"
    >
      <div class="event-item-main">
        <app-date-box [date]="eventDate()" />

        <div class="event-content">
          <div class="event-header">
            <h3 class="event-title" [innerHTML]="event().title | highlight : searchTerm()" itemprop="name"></h3>
            @if (isFeatured()) {
              <app-chip
                text="Featured"
                type="ui"
                variant="feature"
                status="featured"
              />
            }
            @if (event().status !== 'published') {
              <app-chip
                [text]="statusLabel()"
                type="ui"
                variant="status"
                [status]="event().status"
              />
            }
          </div>

          <div class="event-meta">
            @if (locationDisplay()) {
              <span class="meta-item location" [class.has-venue]="locationDisplay()!.hasVenue" itemprop="location">
                <span class="location-icon">{{ locationDisplay()!.icon }}</span>
                <span class="location-text">
                  <span class="location-primary">{{ locationDisplay()!.primary }}</span>
                  @if (locationDisplay()!.secondary) {
                    <span class="location-secondary">{{ locationDisplay()!.secondary }}</span>
                  }
                </span>
              </span>
            }
            @if (userDistance() !== null) {
              <span class="meta-item distance" [class.within-radius]="withinRadius()">
                <app-icon name="near_me" size="sm" animation="hover-fill" class="icon" />
                {{ formatDistance() }}
              </span>
            }
            @if (event().startTime) {
              <span class="meta-item">
                <app-icon name="schedule" size="sm" animation="hover-fill" class="icon" />
                <time [dateTime]="eventDate().toISOString()" itemprop="startDate">
                  {{ event().startTime }}
                </time>
              </span>
            }
            @if (relativeTime()) {
              <span class="meta-item highlight">
                {{ relativeTime() }}
              </span>
            }
          </div>

          @if (event().categories?.length || event().tags?.length) {
            <div
              class="event-tags"
              role="region"
              [attr.aria-label]="'Categories and tags for ' + event().title">
              @if (event().categories?.length) {
                @for (category of event().categories; track category) {
                  <app-chip
                    [text]="getCategoryLabel(category)"
                    type="ui"
                    variant="category"
                  />
                }
              }
              @if (event().tags?.length) {
                @for (tag of event().tags; track tag) {
                  <app-chip
                    [text]="'#' + tag"
                    type="ui"
                    variant="feature"
                  />
                }
              }
            </div>
          }

          @if (isExpanded() && event().description) {
            <div
              class="event-description"
              [innerHTML]="(event().description || '') | highlight : searchTerm()"
              itemprop="description"
              [attr.id]="'event-details-' + event().id"
              role="region"
              [attr.aria-label]="'Description for ' + event().title">
            </div>
          }

          <div class="event-actions" role="group" [attr.aria-label]="'Actions for ' + event().title">
            @if (event().website) {
              <button
                class="action-btn"
                (click)="openWebsite($event)"
                [attr.aria-label]="'Visit website for ' + event().title"
              >
                <app-icon name="open_in_new" size="sm" />
                Website
              </button>
            }
            @if (locationDisplay()) {
              <button
                class="action-btn"
                (click)="getDirections($event)"
                [attr.aria-label]="'Get directions to ' + locationDisplay()!.primary"
              >
                <app-icon name="directions" size="sm" />
                Directions
              </button>
            }
            <button
              class="action-btn"
              (click)="shareEvent($event)"
              [attr.aria-label]="'Share ' + event().title"
            >
              <app-icon name="share" size="sm" />
              Share
            </button>
          </div>
        </div>

        <button
          class="expand-btn"
          (click)="toggleExpand($event)"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-label]="isExpanded() ? 'Collapse event details for ' + event().title : 'Expand event details for ' + event().title"
          [attr.aria-controls]="'event-details-' + event().id"
        >
          <app-icon
            [name]="isExpanded() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
            size="sm"
            animation="hover-weight"
            class="expand-icon"
          />
        </button>
      </div>
    </article>
  `
})
export class EventItemComponent {
  // Inputs
  readonly event = input.required<EventModel>();
  readonly venue = input<Venue | null>(null);
  readonly isFeatured = input<boolean>(false);
  readonly isExpanded = input<boolean>(false);
  readonly searchTerm = input<string>('');
  readonly userDistance = input<number | null>(null);
  readonly distanceUnit = input<DistanceUnit>('kilometers');
  readonly withinRadius = input<boolean>(false);

  // Outputs
  readonly clicked = output<EventModel>();
  readonly expandToggled = output<void>();

  constructor() {
    // Removed debug logging - date conversion is working correctly
  }

  // Computed values
  readonly eventDate = computed(() => convertToDate(this.event().date));

  readonly statusLabel = computed(() => {
    switch (this.event().status) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return this.event().status;
    }
  });

  readonly relativeTime = computed(() => getRelativeTime(this.eventDate()));

  readonly formatDistance = computed(() => {
    const distance = this.userDistance();
    const unit = this.distanceUnit();

    if (distance === null || distance === Infinity) {
      return 'Distance unknown';
    }

    console.log('[EventItemComponent] 📏 Formatting distance:', {
      eventId: this.event().id,
      rawDistance: distance,
      unit,
      withinRadius: this.withinRadius()
    });

    return formatDistance(distance, unit);
  });

  readonly locationDisplay = computed(() => {
    const venue = this.venue();
    const event = this.event();

    if (venue) {
      // Priority: Show venue name + short address
      return {
        primary: venue.name,
        secondary: this.getShortAddress(venue.address),
        icon: this.getVenueIcon(venue.category),
        hasVenue: true
      };
    } else if (event.location) {
      // Fallback: Show custom location text
      return {
        primary: event.location,
        secondary: null,
        icon: '📍',
        hasVenue: false
      };
    }

    return null;
  });

  handleClick() {
    this.clicked.emit(this.event());
  }

  toggleExpand(event: MouseEvent) {
    event.stopPropagation();
    this.expandToggled.emit();
  }

  getCategoryLabel(categoryValue: string): string {
    const category = EVENT_CATEGORIES.find(cat => cat.value === categoryValue);
    return category?.label || categoryValue;
  }

  private getShortAddress(address: string): string {
    // Extract first part of address (usually street + number)
    const parts = address.split(',');
    return parts[0]?.trim() || address;
  }

  private getVenueIcon(category?: string): string {
    switch (category) {
      case 'theatre': return '🎭';
      case 'pub': return '🍺';
      case 'stadium': return '🏟️';
      case 'park': return '🌳';
      case 'hall': return '🏛️';
      case 'museum': return '🏛️';
      case 'restaurant': return '🍽️';
      case 'club': return '🎵';
      case 'community': return '🏘️';
      default: return '📍';
    }
  }

  openWebsite(event: MouseEvent): void {
    event.stopPropagation();
    if (this.event().website) {
      window.open(this.event().website, '_blank', 'noopener');
    }
  }

  getDirections(event: MouseEvent): void {
    event.stopPropagation();
    const venue = this.venue();
    const eventLocation = this.event().location;

    let query = '';
    if (venue) {
      query = `${venue.name}, ${venue.address}`;
    } else if (eventLocation) {
      query = eventLocation;
    }

    if (query) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      window.open(mapsUrl, '_blank', 'noopener');
    }
  }

  shareEvent(event: MouseEvent): void {
    event.stopPropagation();
    const eventData = this.event();

    if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: eventData.title,
        text: `Check out this event: ${eventData.title}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      const shareText = `${eventData.title}\n${eventData.description || ''}\n${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        // Could emit an event here to show a toast notification
        console.log('Event details copied to clipboard');
      }).catch(console.error);
    }
  }
}
