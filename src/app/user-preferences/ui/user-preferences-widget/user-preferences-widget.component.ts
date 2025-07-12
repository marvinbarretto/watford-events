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

@Component({
  selector: 'app-user-preferences-widget',
  standalone: true,
  imports: [FormsModule],
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
                [value]="sliderValue()"
                (input)="onRadiusChange($event)"
                min="1"
                max="50"
                step="1"
              />
              <div class="radius-labels">
                <span>1{{ unitAbbrev() }}</span>
                <span>50{{ unitAbbrev() }}</span>
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
                Miles
              </button>
              <button
                class="unit-option"
                [class.active]="preferencesStore.distanceUnit() === 'kilometers'"
                (click)="updateDistanceUnit('kilometers')"
              >
                Kilometers
              </button>
            </div>
          </div>

          <!-- Sort Order -->
          <div class="preference-section">
            <label class="section-label">
              <span class="label-icon">🔤</span>
              Default Sort
            </label>
            <select
              class="sort-select"
              [value]="preferencesStore.defaultSortOrder()"
              (change)="onSortOrderChange($event)"
            >
              <option value="date-asc">Date (Earliest First)</option>
              <option value="date-desc">Date (Latest First)</option>
              <option value="distance">Distance</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          <!-- Event Categories -->
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
          <button class="error-dismiss" (click)="preferencesStore.clearError()">×</button>
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
      padding: 16px 20px;
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
      gap: 8px;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
    }

    .title-icon {
      font-size: 18px;
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
      padding: 20px;
      background: var(--background);
    }

    .preference-section {
      margin-bottom: 24px;
    }

    .preference-section:last-child {
      margin-bottom: 0;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 12px;
    }

    .label-icon {
      font-size: 16px;
    }

    /* Radius Controls */
    .radius-controls {
      margin-top: 8px;
    }

    .radius-slider {
      width: 100%;
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      appearance: none;
      cursor: pointer;
    }

    .radius-slider::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .radius-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .radius-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
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
      padding: 8px 16px;
      background: transparent;
      border: none;
      font-size: 14px;
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

    /* Sort Select */
    .sort-select {
      width: 100%;
      padding: 8px 12px;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      color: var(--text);
      cursor: pointer;
    }

    .sort-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
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
      gap: 4px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .category-icon {
      font-size: 14px;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
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
      font-size: 14px;
    }

    /* Error Message */
    .error-message {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--error-background, #fee);
      border-top: 1px solid var(--border);
      color: var(--error-text, #c53030);
      font-size: 14px;
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
        padding: 12px 16px;
      }

      .widget-content {
        padding: 16px;
      }

      .categories-grid {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 6px;
      }

      .quick-actions {
        flex-direction: column;
        gap: 8px;
      }

      .action-btn {
        justify-content: center;
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
    const unit = this.preferencesStore.distanceUnit();
    
    console.log('[UserPreferencesWidget] 📏 Computing display radius:', {
      storedKm: radiusInKm,
      displayUnit: unit
    });
    
    if (unit === 'miles') {
      // Convert km to miles for display
      const miles = Math.round(radiusInKm * 0.621371);
      console.log('[UserPreferencesWidget] 🔄 Display conversion km→miles:', {
        km: radiusInKm,
        miles,
        conversionFactor: 0.621371
      });
      return `${miles} ${miles === 1 ? 'mile' : 'miles'}`;
    }
    
    console.log('[UserPreferencesWidget] ✅ Display km directly:', { km: radiusInKm });
    return `${radiusInKm} ${radiusInKm === 1 ? 'kilometer' : 'kilometers'}`;
  });

  readonly sliderValue = computed(() => {
    const radiusInKm = this.preferencesStore.searchRadius();
    const unit = this.preferencesStore.distanceUnit();
    
    if (unit === 'miles') {
      // Convert km to miles for slider position
      const miles = Math.round(radiusInKm * 0.621371);
      console.log('[UserPreferencesWidget] 🎚️ Slider value (miles):', {
        storedKm: radiusInKm,
        sliderMiles: miles
      });
      return miles;
    }
    
    console.log('[UserPreferencesWidget] 🎚️ Slider value (km):', { sliderKm: radiusInKm });
    return radiusInKm;
  });

  readonly unitAbbrev = computed(() => 
    this.preferencesStore.distanceUnit() === 'miles' ? 'mi' : 'km'
  );

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
    const sliderValue = parseInt(target.value, 10);
    const currentUnit = this.preferencesStore.distanceUnit();
    
    console.log('[UserPreferencesWidget] 🎚️ Radius slider changed:', {
      sliderValue,
      currentUnit,
      timestamp: new Date().toISOString()
    });
    
    // Convert slider value to kilometers for storage
    let radiusInKm: number;
    if (currentUnit === 'miles') {
      // User is thinking in miles, convert to km for storage
      radiusInKm = Math.round(sliderValue * 1.60934);
      console.log('[UserPreferencesWidget] 🔄 Converting miles to km:', {
        milesInput: sliderValue,
        kmStored: radiusInKm,
        conversionFactor: 1.60934
      });
    } else {
      // User is thinking in km, store directly
      radiusInKm = sliderValue;
      console.log('[UserPreferencesWidget] ✅ Storing km directly:', {
        kmInput: sliderValue,
        kmStored: radiusInKm
      });
    }
    
    this.preferencesStore.updateSearchRadius(radiusInKm);
  }

  updateDistanceUnit(unit: DistanceUnit): void {
    const previousUnit = this.preferencesStore.distanceUnit();
    const currentRadius = this.preferencesStore.searchRadius();
    
    console.log('[UserPreferencesWidget] 🔄 Distance unit changing:', {
      from: previousUnit,
      to: unit,
      currentStoredRadiusKm: currentRadius,
      timestamp: new Date().toISOString()
    });
    
    this.preferencesStore.updateDistanceUnit(unit);
    
    // Log the effect of the change
    setTimeout(() => {
      console.log('[UserPreferencesWidget] ✅ Unit change complete:', {
        newUnit: this.preferencesStore.distanceUnit(),
        sliderWillShow: this.sliderValue(),
        displayWillShow: this.displayRadius()
      });
    }, 0);
  }

  onSortOrderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const order = target.value as EventSortOrder;
    this.preferencesStore.updateDefaultSortOrder(order);
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