import { Component, input, output, computed } from '@angular/core';
import { Venue } from '../../utils/venue.model';
import { ChipComponent, ChipStatus } from '../../../shared/ui/chip/chip.component';

@Component({
  selector: 'app-venue-card-rect',
  standalone: true,
  imports: [ChipComponent],
  template: `
    <div class="venue-card-rect" (click)="handleClick()">
      <!-- Venue Header -->
      <div class="venue-header">
        <div class="venue-icon">
          <span class="icon">{{ categoryIcon() }}</span>
        </div>
        <div class="venue-status">
          <app-chip 
            [text]="statusLabel()" 
            type="ui" 
            variant="status" 
            [status]="chipStatus()"
          />
        </div>
      </div>

      <!-- Venue Content -->
      <div class="venue-content">
        <h3 class="venue-name">{{ venue().name }}</h3>
        
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

          @if (venue().capacity) {
            <div class="venue-capacity">
              <span class="capacity-icon">👥</span>
              <span>Max {{ venue().capacity!.maxCapacity }} people</span>
            </div>
          }
        </div>

        @if (accessibilityFeatures().length > 0) {
          <div class="accessibility-section">
            <h4 class="accessibility-title">Accessibility Features</h4>
            <div class="accessibility-features">
              @for (feature of accessibilityFeatures(); track feature) {
                <span class="accessibility-badge">{{ feature }}</span>
              }
            </div>
          </div>
        }

        @if (venue().amenities && venue().amenities!.length > 0) {
          <div class="amenities-section">
            <h4 class="amenities-title">Amenities</h4>
            <div class="amenities-list">
              @for (amenity of venue().amenities!.slice(0, 4); track amenity) {
                <span class="amenity-badge">{{ amenity }}</span>
              }
              @if (venue().amenities!.length > 4) {
                <span class="amenity-badge more">+{{ venue().amenities!.length - 4 }} more</span>
              }
            </div>
          </div>
        }

        @if (venue().contactInfo) {
          <div class="contact-info">
            @if (venue().contactInfo!.phone) {
              <div class="contact-item">
                <span class="contact-icon">📞</span>
                <span>{{ venue().contactInfo!.phone }}</span>
              </div>
            }
            @if (venue().contactInfo!.website) {
              <div class="contact-item">
                <span class="contact-icon">🌐</span>
                <span>Website</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Venue Actions -->
      <div class="venue-actions" (click)="$event.stopPropagation()">
        <button class="action-btn view-btn" (click)="viewVenue()">
          <span>👁️</span>
          <span>View Details</span>
        </button>
        <button class="action-btn directions-btn" (click)="getDirections()">
          <span>🧭</span>
          <span>Get Directions</span>
        </button>
        @if (venue().contactInfo?.website) {
          <button class="action-btn website-btn" (click)="visitWebsite()">
            <span>🌐</span>
            <span>Website</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .venue-card-rect {
      background: var(--color-background-lighter);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .venue-card-rect:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      border-color: var(--color-primary);
    }

    .venue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1rem 0.5rem;
      background: linear-gradient(135deg, var(--color-background-lighter), var(--color-background-darker));
    }

    .venue-icon {
      width: 48px;
      height: 48px;
      background: var(--color-background-lighter);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .icon {
      font-size: 24px;
    }

    .venue-content {
      padding: 0.5rem 1rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .venue-name {
      margin: 0 0 1rem 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text);
      line-height: 1.3;
    }

    .venue-details {
      margin-bottom: 1rem;
    }

    .venue-address, .venue-category, .venue-capacity {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .address-icon, .category-icon, .capacity-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .accessibility-section, .amenities-section {
      margin-bottom: 1rem;
    }

    .accessibility-title, .amenities-title {
      margin: 0 0 0.5rem 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .accessibility-features, .amenities-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .accessibility-badge, .amenity-badge {
      background: var(--color-background-darker);
      color: var(--color-text-secondary);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid var(--color-border);
    }

    .accessibility-badge {
      background: var(--color-success)25;
      color: var(--color-success);
      border-color: var(--color-success);
    }

    .amenity-badge.more {
      background: var(--color-accent)25;
      color: var(--color-accent);
      border-color: var(--color-accent);
    }

    .contact-info {
      margin-bottom: 1rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--color-text-muted);
      margin-bottom: 4px;
    }

    .contact-icon {
      font-size: 14px;
    }

    .venue-actions {
      padding: 1rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: auto;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
      justify-content: center;
      min-width: 0;
    }

    .view-btn {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .directions-btn {
      background: var(--color-accent);
      color: var(--color-on-accent);
    }

    .website-btn {
      background: var(--color-secondary);
      color: var(--color-on-secondary);
    }

    .action-btn:hover {
      transform: translateY(-1px);
      filter: brightness(0.9);
    }

    @media (max-width: 768px) {
      .venue-actions {
        flex-direction: column;
      }
      
      .action-btn {
        justify-content: center;
      }
    }
  `]
})
export class VenueCardRectComponent {
  // Required inputs
  readonly venue = input.required<Venue>();

  // Outputs
  readonly clicked = output<Venue>();
  readonly viewClicked = output<Venue>();
  readonly directionsClicked = output<Venue>();
  readonly websiteClicked = output<Venue>();

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

  readonly accessibilityFeatures = computed(() => {
    const venue = this.venue();
    const features: string[] = [];
    
    if (venue.accessibleEntrance) features.push('Accessible Entrance');
    if (venue.stepFreeAccess) features.push('Step-free Access');
    if (venue.elevatorAvailable) features.push('Elevator');
    if (venue.toilets?.accessibleToilet) features.push('Accessible Toilets');
    if (venue.toilets?.babyChanging) features.push('Baby Changing');
    if (venue.toilets?.genderNeutral) features.push('Gender Neutral Toilets');
    
    return features;
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

  visitWebsite() {
    this.websiteClicked.emit(this.venue());
  }
}