import { Component, input, output, computed } from '@angular/core';
import { Venue } from '../../utils/venue.model';
import { ChipComponent, ChipStatus } from '../../../shared/ui/chip/chip.component';

@Component({
  selector: 'app-venue-card-slim',
  imports: [ChipComponent],
  template: `
    <div class="venue-card-slim" (click)="handleClick()">
      <!-- Venue Icon/Image -->
      <div class="venue-icon">
        <span class="icon">{{ categoryIcon() }}</span>
        @if (isAccessible()) {
          <div class="accessibility-indicator">♿</div>
        }
      </div>

      <!-- Venue Content -->
      <div class="venue-content">
        <div class="venue-header">
          <h3 class="venue-name">{{ venue().name }}</h3>
          <app-chip
            [text]="statusLabel()"
            type="ui"
            variant="status"
            [status]="chipStatus()"
          />
        </div>

        <div class="venue-details">
          <div class="venue-address">
            <span class="address-icon">📍</span>
            <span>{{ venue().address }}</span>
          </div>
          @if (venue().category) {
            <div class="venue-category">
              <span class="category-icon">🏢</span>
              <span>{{ categoryDisplay() }}</span>
            </div>
          }
        </div>

        @if (accessibilityFeatures().length > 0) {
          <div class="accessibility-features">
            <span class="features-label">Accessibility:</span>
            <span class="features-list">{{ accessibilityFeatures().join(', ') }}</span>
          </div>
        }

        @if (hasTransportInfo()) {
          <div class="transport-info">
            <span class="transport-label">Transport:</span>
            <span class="transport-details">{{ transportSummary() }}</span>
          </div>
        }
      </div>

      <!-- Venue Actions -->
      <div class="venue-actions" (click)="$event.stopPropagation()">
        <button class="action-btn view-btn" (click)="viewVenue()">
          <span>👁️</span>
          <span>View</span>
        </button>
        <button class="action-btn directions-btn" (click)="getDirections()">
          <span>🧭</span>
          <span>Directions</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .venue-card-slim {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--background-lighter);
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--border);
    }

    .venue-card-slim:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      border-color: var(--primary);
    }

    .venue-icon {
      position: relative;
      width: 48px;
      height: 48px;
      background: var(--background-darker);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon {
      font-size: 24px;
    }

    .accessibility-indicator {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      background: var(--success);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--on-primary);
    }

    .venue-content {
      flex: 1;
      min-width: 0;
    }

    .venue-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }

    .venue-name {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.3;
      flex: 1;
    }

    .venue-details {
      margin-bottom: 0.5rem;
    }

    .venue-address, .venue-category {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 2px;
    }

    .address-icon, .category-icon {
      font-size: 14px;
    }

    .accessibility-features, .transport-info {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .features-label, .transport-label {
      font-weight: 500;
    }

    .features-list, .transport-details {
      margin-left: 4px;
    }

    .venue-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .view-btn {
      background: var(--secondary);
      color: var(--on-secondary);
    }

    .directions-btn {
      background: var(--accent);
      color: var(--on-accent);
    }

    .action-btn:hover {
      transform: translateY(-1px);
      filter: brightness(0.9);
    }

    @media (max-width: 768px) {
      .venue-card-slim {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }

      .venue-header {
        flex-direction: column;
        gap: 0.5rem;
      }

      .venue-actions {
        justify-content: center;
        margin-top: 0.5rem;
      }
    }
  `]
})
export class VenueCardSlimComponent {
  // Required inputs
  readonly venue = input.required<Venue>();

  // Outputs
  readonly clicked = output<Venue>();
  readonly viewClicked = output<Venue>();
  readonly directionsClicked = output<Venue>();

  // Computed properties
  readonly categoryIcon = computed(() => {
    switch (this.venue().category) {
      case 'theatre': return '🎭';
      case 'pub': return '🍺';
      case 'stadium': return '🏟️';
      case 'park': return '🌳';
      case 'hall': return '🏛️';
      case 'museum': return '🏛️';
      case 'restaurant': return '🍽️';
      case 'club': return '🎵';
      case 'community': return '🏘️';
      default: return '🏢';
    }
  });

  readonly categoryDisplay = computed(() => {
    const categoryMap: Record<string, string> = {
      'theatre': 'Theatre',
      'pub': 'Pub/Bar',
      'stadium': 'Stadium',
      'park': 'Park',
      'hall': 'Hall',
      'museum': 'Museum',
      'restaurant': 'Restaurant',
      'club': 'Club',
      'community': 'Community Center',
      'other': 'Other'
    };
    return categoryMap[this.venue().category || 'other'] || 'Other';
  });

  readonly statusLabel = computed(() => {
    switch (this.venue().status) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'archived': return 'Archived';
      default: return this.venue().status;
    }
  });

  readonly chipStatus = computed((): ChipStatus => {
    switch (this.venue().status) {
      case 'published': return 'published';
      case 'draft': return 'draft';
      case 'archived': return 'cancelled'; // Map archived to cancelled for chip styling
      default: return 'draft';
    }
  });

  readonly isAccessible = computed(() => {
    const venue = this.venue();
    return !!(
      venue.accessibleEntrance ||
      venue.stepFreeAccess ||
      venue.elevatorAvailable ||
      venue.toilets?.accessibleToilet
    );
  });

  readonly accessibilityFeatures = computed(() => {
    const venue = this.venue();
    const features: string[] = [];

    if (venue.accessibleEntrance) features.push('Accessible Entrance');
    if (venue.stepFreeAccess) features.push('Step-free Access');
    if (venue.elevatorAvailable) features.push('Elevator');
    if (venue.toilets?.accessibleToilet) features.push('Accessible Toilets');

    return features;
  });

  readonly hasTransportInfo = computed(() => {
    const transport = this.venue().transportInfo;
    return transport && (transport.buses || transport.trains || transport.parking);
  });

  readonly transportSummary = computed(() => {
    const transport = this.venue().transportInfo;
    if (!transport) return '';

    const items: string[] = [];
    if (transport.buses) items.push(`🚌 ${transport.buses}`);
    if (transport.trains) items.push(`🚂 ${transport.trains}`);
    if (transport.parking) items.push(`🚗 ${transport.parking}`);

    return items.join(' • ');
  });

  // Event handlers
  handleClick() {
    this.clicked.emit(this.venue());
  }

  viewVenue() {
    this.viewClicked.emit(this.venue());
  }

  getDirections() {
    this.directionsClicked.emit(this.venue());
  }
}
