import { Component, input, output, computed } from '@angular/core';
import { Event, EVENT_CATEGORIES } from '../../utils/event.model';
import { convertToDate } from '../../../shared/utils/date-utils';
import { ChipComponent } from '../../../shared/ui/chip/chip.component';
import { HeartButtonComponent } from '../../../shared/ui/heart-button/heart-button.component';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [ChipComponent, HeartButtonComponent],
  template: `
    <div class="event-card" (click)="handleClick()">
      <!-- Event Image -->
      @if (event().imageUrl) {
        <div class="event-image">
          <img [src]="event().imageUrl" [alt]="event().title" />
          @if (event().scannerConfidence) {
            <div class="ai-badge">
              <span class="ai-icon">🤖</span>
              <span>{{ event().scannerConfidence }}%</span>
            </div>
          }
          @if (event().isMockEvent) {
            <div class="mock-badge">
              <span class="mock-icon">🧪</span>
              <span>Mock</span>
            </div>
          }
        </div>
      } @else {
        <div class="event-placeholder">
          <span class="placeholder-icon">📅</span>
          @if (event().isMockEvent) {
            <div class="mock-badge">
              <span class="mock-icon">🧪</span>
              <span>Mock</span>
            </div>
          }
        </div>
      }

      <!-- Event Content -->
      <div class="event-content">
        <div class="event-header">
          <h3 class="event-title">{{ event().title }}</h3>
          <app-chip 
            [text]="statusLabel()" 
            type="ui" 
            variant="status" 
            [status]="event().status"
          />
        </div>

        <div class="event-details">
          <div class="event-date">
            <span class="date-icon">📅</span>
            <span>{{ formattedDate() }}</span>
          </div>
          @if (event().location) {
            <div class="event-location">
              <span class="location-icon">📍</span>
              <span>{{ event().location }}</span>
            </div>
          }
        </div>

        @if (event().description) {
          <p class="event-description">{{ event().description }}</p>
        }

        <!-- Categories and Tags -->
        @if (event().categories?.length || event().tags?.length) {
          <div class="event-tags">
            @if (event().categories?.length) {
              @for (category of event().categories; track category) {
                <app-chip
                  [text]="getCategoryLabel(category)"
                  type="ui"
                  variant="category"
                  (clicked)="onCategoryClicked(category)"
                />
              }
            }
            @if (event().tags?.length) {
              @for (tag of event().tags; track tag) {
                <app-chip
                  [text]="'#' + tag"
                  type="ui"
                  variant="feature"
                  (clicked)="onTagClicked(tag)"
                />
              }
            }
          </div>
        }

        <!-- Event Actions -->
        <div class="event-actions" (click)="$event.stopPropagation()">
          <!-- Heart/Like button for all users -->
          <app-heart-button
            [contentId]="event().id"
            contentType="event"
            [showCount]="true"
            (liked)="onEventLiked($event)"
            (error)="onLikeError($event)"
          />

          <!-- Share button for all users -->
          <button class="action-btn share-btn" (click)="shareEvent()">
            <span>📤</span>
            <span>Share</span>
          </button>

          <!-- Edit/Delete actions only for event owners -->
          @if (showOwnerActions()) {
            <button class="action-btn edit-btn" (click)="editEvent()">
              <span>✏️</span>
              <span>Edit</span>
            </button>

            @if (event().status === 'draft') {
              <button class="action-btn publish-btn" (click)="publishEvent()">
                <span>🚀</span>
                <span>Publish</span>
              </button>
            }

            <button class="action-btn delete-btn" (click)="deleteEvent()">
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-card {
      background: var(--background-lighter);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
    }

    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .event-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ai-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(0,0,0,0.8);
      color: white;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .ai-icon {
      font-size: 14px;
    }

    .mock-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--warning);
      color: var(--background-lighter);
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid var(--warning-hover);
    }

    .mock-icon {
      font-size: 14px;
    }

    .event-placeholder {
      position: relative;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--background-lighter), var(--background-darker));
    }

    .placeholder-icon {
      font-size: 48px;
      opacity: 0.5;
    }

    .event-content {
      padding: 20px;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .event-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.3;
      flex: 1;
      margin-right: 10px;
    }

    .event-details {
      margin-bottom: 15px;
    }

    .event-date, .event-location {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .date-icon, .location-icon {
      font-size: 16px;
    }

    .event-description {
      margin: 0 0 15px 0;
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .event-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 15px;
    }

    .event-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .edit-btn {
      background: var(--secondary);
      color: var(--primary);
    }

    .publish-btn {
      background: var(--success);
      color: var(--background-lighter);
    }

    .share-btn {
      background: var(--info);
      color: var(--background-lighter);
    }

    .delete-btn {
      background: var(--error);
      color: var(--background-lighter);
    }

    .action-btn:hover {
      transform: translateY(-1px);
      filter: brightness(0.9);
    }
  `]
})
export class EventCardComponent {
  // Required inputs
  readonly event = input.required<Event>();
  
  // Optional inputs
  readonly currentUserId = input<string | null>(null);

  // Outputs
  readonly clicked = output<Event>();
  readonly liked = output<{ event: Event; isLiked: boolean }>();
  readonly shareClicked = output<Event>();
  readonly editClicked = output<Event>();
  readonly publishClicked = output<Event>();
  readonly deleteClicked = output<Event>();
  readonly categoryClicked = output<string>();
  readonly tagClicked = output<string>();

  // Computed properties
  readonly eventDate = computed(() => convertToDate(this.event().date));

  readonly formattedDate = computed(() => {
    const eventDate = this.eventDate();
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format date nicely
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };

    const formatted = eventDate.toLocaleDateString('en-US', options);

    // Add relative time info
    if (diffDays === 0) {
      return `${formatted} (Today)`;
    } else if (diffDays === 1) {
      return `${formatted} (Tomorrow)`;
    } else if (diffDays > 0 && diffDays <= 7) {
      return `${formatted} (In ${diffDays} days)`;
    } else if (diffDays < 0 && diffDays >= -7) {
      return `${formatted} (${Math.abs(diffDays)} days ago)`;
    }

    return formatted;
  });

  readonly statusLabel = computed(() => {
    switch (this.event().status) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return this.event().status;
    }
  });

  readonly showOwnerActions = computed(() => {
    return this.currentUserId() && this.event().createdBy === this.currentUserId();
  });

  // Event handlers
  handleClick() {
    this.clicked.emit(this.event());
  }

  shareEvent() {
    this.shareClicked.emit(this.event());
  }

  editEvent() {
    this.editClicked.emit(this.event());
  }

  publishEvent() {
    this.publishClicked.emit(this.event());
  }

  deleteEvent() {
    this.deleteClicked.emit(this.event());
  }

  getCategoryLabel(categoryValue: string): string {
    const category = EVENT_CATEGORIES.find(cat => cat.value === categoryValue);
    return category?.label || categoryValue;
  }

  onCategoryClicked(category: string) {
    this.categoryClicked.emit(category);
  }

  onTagClicked(tag: string) {
    this.tagClicked.emit(tag);
  }

  onEventLiked(isLiked: boolean) {
    this.liked.emit({ event: this.event(), isLiked });
  }

  onLikeError(error: string) {
    console.error('Like error in event card:', error);
    // Could emit an error event or show a toast notification
  }
}