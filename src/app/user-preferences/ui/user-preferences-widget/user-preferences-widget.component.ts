/**
 * @fileoverview UserPreferencesWidget - Contextual preferences adjustment component
 *
 * PURPOSE:
 * - Display and modify contextual preferences (search radius, units, categories, etc.)
 * - Show on home page alongside event filter
 * - Quick access to frequently adjusted settings
 *
 * FEATURES:
 * - Search radius slider with unit conversion display
 * - Distance unit toggle (miles/kilometers)
 * - Event category checkboxes
 * - Sort order selection
 * - Collapsible design for mobile
 */
import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserPreferencesStore } from '../../data-access/user-preferences.store';
import {
  DistanceUnit,
  EventSortOrder,
  EventCategoryPreferences
} from '../../utils/user-preferences.types';
import { convertDistance, formatDistance } from '@shared/utils/distance.utils';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { FeatureFlagPipe } from '@shared/utils/feature-flag.pipe';

@Component({
  selector: 'app-user-preferences-widget',
  imports: [FormsModule, IconComponent, FeatureFlagPipe],
  template: `
    <div class="preferences-widget" [class.collapsed]="isCollapsed()">
      <div class="widget-header" (click)="toggleCollapsed()">
        <h3 class="widget-title">
          <span class="title-icon">⚙️</span>
          Preferences
        </h3>
        <div class="widget-controls">
          @if (preferencesStore.loading()) {
            <span class="loading-indicator">💫</span>
          }
          <button class="collapse-btn" [class.collapsed]="isCollapsed()">
            {{ isCollapsed() ? '▼' : '▲' }}
          </button>
        </div>
      </div>

      @if (!isCollapsed()) {
        <div class="widget-content">
          <!-- Search Radius -->
          <div class="preference-section">
            <label class="section-label">
              <span class="label-icon">📍</span>
              Search Radius: {{ displayRadius() }}
            </label>
            <div class="radius-controls">
              <input
                type="range"
                class="radius-slider"
                [value]="sliderValueInMeters()"
                (input)="onRadiusChange($event)"
                min="0"
                [max]="sliderConfig().maxValue"
                [step]="sliderConfig().step"
              />
              <div class="radius-labels">
                <span>0</span>
                <span>{{ sliderConfig().maxLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Distance Unit -->
          <div class="preference-section">
            <label class="section-label">
              <span class="label-icon">📏</span>
              Distance Unit
            </label>
            <div class="unit-toggle">
              <button
                class="unit-option"
                [class.active]="preferencesStore.distanceUnit() === 'miles'"
                (click)="updateDistanceUnit('miles')"
              >
                <span class="unit-icon">📐</span>
                Miles
              </button>
              <button
                class="unit-option"
                [class.active]="preferencesStore.distanceUnit() === 'kilometers'"
                (click)="updateDistanceUnit('kilometers')"
              >
                <span class="unit-icon">📏</span>
                Km
              </button>
              <button
                class="unit-option"
                [class.active]="preferencesStore.distanceUnit() === 'walking-minutes'"
                (click)="updateDistanceUnit('walking-minutes')"
              >
                <span class="unit-icon">🚶</span>
                Walk
              </button>
            </div>
          </div>

          <!-- Sort Order -->
          <div class="preference-section">
            <label class="section-label">
              <span class="label-icon">🔤</span>
              Sort Events By
            </label>
            <div class="unit-toggle">
              <button
                class="unit-option"
                [class.active]="preferencesStore.defaultSortOrder() === 'distance'"
                (click)="updateSortOrder('distance')"
              >
                <span class="sort-icon">📍</span>
                Near me
              </button>
              <button
                class="unit-option"
                [class.active]="preferencesStore.defaultSortOrder() === 'date-asc'"
                (click)="updateSortOrder('date-asc')"
              >
                <span class="sort-icon">📅</span>
                Soonest
              </button>
            </div>
          </div>


          <!-- Event Categories -->
          @if (('preferredCategories' | featureFlag)) {
            <div class="preference-section">
              <label class="section-label">
                <span class="label-icon">🏷️</span>
                Preferred Categories
              </label>
              <div class="categories-grid">
                @for (category of categoryList(); track category.key) {
                  <label class="category-item">
                    <input
                      type="checkbox"
                      [checked]="category.enabled"
                      (change)="onCategoryToggle(category.key, $event)"
                    />
                    <span class="category-label">
                      <span class="category-icon">{{ category.icon }}</span>
                      {{ category.label }}
                    </span>
                  </label>
                }
              </div>
            </div>
          }

          <!-- Quick Actions -->
          <div class="preference-section">
            <div class="quick-actions">
              <button
                class="action-btn secondary"
                (click)="toggleShowPastEvents()"
                [class.active]="preferencesStore.showPastEvents()"
              >
                <span class="btn-icon">{{ preferencesStore.showPastEvents() ? '✅' : '⚪' }}</span>
                Show Past Events
              </button>

              <button
                class="action-btn secondary"
                (click)="resetToDefaults()"
                [disabled]="preferencesStore.loading()"
              >
                <span class="btn-icon">🔄</span>
                Reset
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Error Display -->
      @if (preferencesStore.error()) {
        <div class="error-message">
          ⚠️ {{ preferencesStore.error() }}
          <button class="error-dismiss" (click)="preferencesStore.clearError()" aria-label="Dismiss error">
            <app-icon name="close" size="xs" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .preferences-widget {
      background: var(--background-lighter);
      border: 1px solid var(--primary);
      border-radius: 8px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.06);
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .widget-header:hover {
      background: linear-gradient(90deg, var(--secondary), var(--secondary-hover));
      color: var(--on-secondary);
    }

    .widget-header:hover .widget-title,
    .widget-header:hover .loading-indicator,
    .widget-header:hover .collapse-btn {
      color: var(--on-secondary);
    }

    .preferences-widget:not(.collapsed) .widget-header {
      border-bottom-color: var(--primary);
    }

    .widget-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .title-icon {
      font-size: 16px;
    }

    .widget-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .loading-indicator {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .collapse-btn {
      background: transparent;
      border: none;
      font-size: 14px;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px;
      transition: all 0.2s ease;
    }

    .collapse-btn:hover {
      color: var(--primary);
      transform: scale(1.1);
    }

    .preferences-widget .collapse-btn:hover {
      color: var(--primary);
    }

    .widget-content {
      padding: 16px;
      background: var(--background);
    }

    .preference-section {
      margin-bottom: 16px;
    }

    .preference-section:last-child {
      margin-bottom: 0;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 10px;
    }

    .label-icon {
      font-size: 14px;
    }

    /* Radius Controls */
    .radius-controls {
      margin-top: 6px;
    }

    .radius-slider {
      width: 100%;
      height: 5px;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      appearance: none;
      cursor: pointer;
    }

    .radius-slider::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .radius-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .radius-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 3px;
    }

    /* Unit Toggle */
    .unit-toggle {
      display: flex;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }

    .unit-option {
      flex: 1;
      padding: 6px 12px;
      background: transparent;
      border: none;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .unit-option:hover {
      background: var(--background-lighter-hover, var(--background-lighter));
      color: var(--text);
    }

    .unit-option.active {
      background: var(--primary);
      color: var(--on-primary);
    }

    .sort-icon {
      font-size: 12px;
      margin-right: 4px;
    }


    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 6px;
      margin-top: 6px;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
    }

    .category-item:hover {
      border-color: var(--primary);
      background: var(--background-lighter-hover, var(--background-lighter));
    }

    .category-item input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }

    .category-label {
      display: flex;
      align-items: center;
      gap: 3px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .category-icon {
      font-size: 12px;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--primary);
    }

    .action-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--on-primary);
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 12px;
    }

    /* Error Message */
    .error-message {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--error-background, #fee);
      border-top: 1px solid var(--border);
      color: var(--error-text, #c53030);
      font-size: 13px;
    }

    .error-dismiss {
      background: transparent;
      border: none;
      font-size: 18px;
      color: var(--error-text, #c53030);
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
      .widget-header {
        padding: 10px 12px;
      }

      .widget-content {
        padding: 12px;
      }

      .preference-section {
        margin-bottom: 12px;
      }

      .categories-grid {
        grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
        gap: 4px;
      }

      .quick-actions {
        flex-direction: column;
        gap: 6px;
      }

      .action-btn {
        justify-content: center;
        padding: 5px 8px;
      }
    }
  `]
})
export class UserPreferencesWidgetComponent {
  readonly preferencesStore = inject(UserPreferencesStore);

  // Widget state
  readonly isCollapsed = signal(false);

  // Computed values
  readonly displayRadius = computed(() => {
    const radiusInKm = this.preferencesStore.searchRadius();
    if (radiusInKm === 0) {
      return 'No limit';
    }
    const unit = this.preferencesStore.distanceUnit();
    const convertedRadius = convertDistance(radiusInKm, unit);
    return formatDistance(convertedRadius, unit);
  });

  readonly sliderValue = computed(() => {
    return this.preferencesStore.searchRadius();
  });

  readonly sliderValueInMeters = computed(() => {
    return this.preferencesStore.searchRadius() * 1000;
  });

  readonly unitAbbrev = computed(() => {
    const unit = this.preferencesStore.distanceUnit();
    switch (unit) {
      case 'miles': return 'mi';
      case 'walking-minutes': return 'min walk';
      case 'kilometers':
      default: return 'km';
    }
  });

  readonly sliderConfig = computed(() => {
    const unit = this.preferencesStore.distanceUnit();
    switch (unit) {
      case 'miles':
        return {
          maxValue: 5000, // Still in meters for slider
          maxLabel: '3.1mi', // 5km = ~3.1 miles
          step: 250
        };
      case 'walking-minutes':
        return {
          maxValue: 5000, // Still in meters for slider
          maxLabel: '60 min', // 5km = ~60 min walk
          step: 250
        };
      case 'kilometers':
      default:
        return {
          maxValue: 5000, // 5km in meters
          maxLabel: '5km',
          step: 250
        };
    }
  });

  readonly categoryList = computed(() => {
    const categories = this.preferencesStore.preferredCategories();
    return [
      { key: 'music' as keyof EventCategoryPreferences, label: 'Music', icon: '🎵', enabled: categories.music },
      { key: 'sports' as keyof EventCategoryPreferences, label: 'Sports', icon: '⚽', enabled: categories.sports },
      { key: 'arts' as keyof EventCategoryPreferences, label: 'Arts', icon: '🎨', enabled: categories.arts },
      { key: 'food' as keyof EventCategoryPreferences, label: 'Food', icon: '🍽️', enabled: categories.food },
      { key: 'family' as keyof EventCategoryPreferences, label: 'Family', icon: '👨‍👩‍👧‍👦', enabled: categories.family },
      { key: 'business' as keyof EventCategoryPreferences, label: 'Business', icon: '💼', enabled: categories.business },
      { key: 'community' as keyof EventCategoryPreferences, label: 'Community', icon: '🏘️', enabled: categories.community },
      { key: 'education' as keyof EventCategoryPreferences, label: 'Education', icon: '📚', enabled: categories.education },
      { key: 'entertainment' as keyof EventCategoryPreferences, label: 'Entertainment', icon: '🎭', enabled: categories.entertainment },
      { key: 'health' as keyof EventCategoryPreferences, label: 'Health', icon: '⚕️', enabled: categories.health },
    ];
  });

  // Event handlers
  toggleCollapsed(): void {
    this.isCollapsed.update(collapsed => !collapsed);
  }

  onRadiusChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const radiusInMeters = parseInt(target.value, 10);
    const radiusInKm = radiusInMeters / 1000;
    this.preferencesStore.updateSearchRadius(radiusInKm);
  }


  updateSortOrder(order: EventSortOrder): void {
    this.preferencesStore.updateDefaultSortOrder(order);
  }

  updateDistanceUnit(unit: DistanceUnit): void {
    this.preferencesStore.updateDistanceUnit(unit);
  }

  onCategoryToggle(category: keyof EventCategoryPreferences, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.preferencesStore.updatePreferredCategories({
      [category]: target.checked
    });
  }

  toggleShowPastEvents(): void {
    this.preferencesStore.toggleShowPastEvents();
  }

  resetToDefaults(): void {
    if (confirm('Reset all preferences to defaults? This cannot be undone.')) {
      this.preferencesStore.resetToDefaults();
    }
  }
}
