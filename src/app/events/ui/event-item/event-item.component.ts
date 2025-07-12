import { Component, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Event, EVENT_CATEGORIES } from '../../utils/event.model';
import { convertToDate, getRelativeTime } from '../../../shared/utils/date-utils';
import { ChipComponent } from '../../../shared/ui/chip/chip.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';
import { DistanceUnit } from '../../../user-preferences/utils/user-preferences.types';
import { formatDistance } from '../../../shared/utils/distance.utils';

@Component({
  selector: 'app-event-item',
  standalone: true,
  imports: [DatePipe, ChipComponent, IconComponent, HighlightPipe],
  styleUrl: './event-item.component.scss',
  template: `
    <div
      class="event-item"
      [class.featured]="isFeatured()"
      [class.expanded]="isExpanded()"
      (click)="handleClick()"
    >
      <div class="event-item-main">
        <div class="event-date-box">
          <div class="month">{{ eventDate() | date:'MMM' }}</div>
          <div class="day">{{ eventDate() | date:'d' }}</div>
        </div>

        <div class="event-content">
          <div class="event-header">
            <h3 class="event-title" [innerHTML]="event().title | highlight : searchTerm()"></h3>
            @if (isFeatured()) {
              <app-chip
                text="Featured"
                type="ui"
                variant="feature"
                status="featured"
              />
            }
            <app-chip
              [text]="statusLabel()"
              type="ui"
              variant="status"
              [status]="event().status"
            />
          </div>

          <div class="event-meta">
            @if (event().location) {
              <span class="meta-item">
                <app-icon name="location_on" size="sm" animation="hover-fill" class="icon" />
                {{ event().location }}
              </span>
            }
            @if (userDistance() !== null) {
              <span class="meta-item distance" [class.within-radius]="withinRadius()">
                <app-icon name="near_me" size="sm" animation="hover-fill" class="icon" />
                {{ formatDistance() }}
              </span>
            }
            <span class="meta-item">
              <app-icon name="schedule" size="sm" animation="hover-fill" class="icon" />
              {{ eventDate() | date:'shortTime' }}
            </span>
            @if (relativeTime()) {
              <span class="meta-item highlight">
                {{ relativeTime() }}
              </span>
            }
          </div>

          @if (isExpanded() && event().description) {
            <div class="event-description" [innerHTML]="event().description | highlight : searchTerm()">
            </div>
          }

          @if (isExpanded() && (event().categories?.length || event().tags?.length)) {
            <div class="event-tags">
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
        </div>

        <button
          class="expand-btn"
          (click)="toggleExpand($event)"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-label]="isExpanded() ? 'Collapse' : 'Expand'"
        >
          <app-icon 
            [name]="isExpanded() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" 
            size="sm" 
            animation="hover-weight"
            class="expand-icon"
          />
        </button>
      </div>
    </div>
  `
})
export class EventItemComponent {
  // Inputs
  readonly event = input.required<Event>();
  readonly isFeatured = input<boolean>(false);
  readonly isExpanded = input<boolean>(false);
  readonly searchTerm = input<string>('');
  readonly userDistance = input<number | null>(null);
  readonly distanceUnit = input<DistanceUnit>('kilometers');
  readonly withinRadius = input<boolean>(false);

  // Outputs
  readonly clicked = output<Event>();
  readonly expandToggled = output<void>();

  constructor() {
    // Removed debug logging - date conversion is working correctly
  }

  // Computed values
  readonly eventDate = computed(() => convertToDate(this.event().date));

  readonly statusLabel = computed(() => {
    switch (this.event().status) {
      case 'published': return 'Live';
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
}
