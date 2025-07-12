/**
 * @fileoverview UserWidget - Comprehensive user information display component
 *
 * PURPOSE:
 * - Display all available user context for development and debugging
 * - Show authentication state, location, preferences, and system info
 * - Provide comprehensive visibility into user data across all stores
 *
 * FEATURES:
 * - Authentication and identity information
 * - Real-time location context
 * - User preferences (both contextual and persistent)
 * - System and platform information
 * - Collapsible sections for organization
 * - JSON data dumps for debugging
 */
import { Component, inject, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { AuthStore } from '@auth/data-access/auth.store';
import { UserPreferencesStore } from '../../../user-preferences/data-access/user-preferences.store';
import { LocationService } from '../../data-access/location.service';
import { ThemeStore } from '../../data-access/theme.store';
import { SsrPlatformService } from '../../utils/ssr/ssr-platform.service';

@Component({
  selector: 'app-user-widget',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <div class="user-widget" [class.collapsed]="isCollapsed()">
      <div class="widget-header" (click)="toggleCollapsed()">
        <h3 class="widget-title">
          <span class="title-icon">👤</span>
          User Context
        </h3>
        <div class="widget-controls">
          <span class="data-count">{{ totalDataPoints() }} data points</span>
          <button class="collapse-btn" [class.collapsed]="isCollapsed()">
            {{ isCollapsed() ? '▼' : '▲' }}
          </button>
        </div>
      </div>

      @if (!isCollapsed()) {
        <div class="widget-content">

          <!-- Authentication State -->
          <div class="info-section">
            <h4 class="section-title">
              <span class="section-icon">🔐</span>
              Authentication State
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">User ID:</span>
                <span class="info-value">{{ authStore.uid() || 'None' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ authStore.user()?.email || 'None' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Display Name:</span>
                <span class="info-value">{{ authStore.user()?.displayName || 'None' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Is Authenticated:</span>
                <span class="info-value" [class.status-active]="authStore.isAuthenticated()">
                  {{ authStore.isAuthenticated() ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Is Anonymous:</span>
                <span class="info-value" [class.status-warning]="authStore.isAnonymous()">
                  {{ authStore.isAnonymous() ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Email Verified:</span>
                <span class="info-value" [class.status-active]="authStore.user()?.emailVerified">
                  {{ authStore.user()?.emailVerified ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Role:</span>
                <span class="info-value role-badge">{{ authStore.user()?.role || 'None' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Auth Ready:</span>
                <span class="info-value" [class.status-active]="authStore.ready()">
                  {{ authStore.ready() ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Has Token:</span>
                <span class="info-value" [class.status-active]="!!authStore.token()">
                  {{ !!authStore.token() ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">User Changes:</span>
                <span class="info-value">{{ authStore.userChangeSignal() }}</span>
              </div>
            </div>
          </div>

          <!-- Location Context -->
          <div class="info-section">
            <h4 class="section-title">
              <span class="section-icon">📍</span>
              Location Context
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Current Location:</span>
                <span class="info-value">
                  @if (locationService.location()) {
                    {{ locationService.location()!.lat.toFixed(6) }}, {{ locationService.location()!.lng.toFixed(6) }}
                  } @else {
                    Not available
                  }
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Location Loading:</span>
                <span class="info-value" [class.status-warning]="locationService.loading()">
                  {{ locationService.loading() ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Location Error:</span>
                <span class="info-value error-text">
                  {{ locationService.error() || 'None' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Geolocation API:</span>
                <span class="info-value" [class.status-active]="hasGeolocation()">
                  {{ hasGeolocation() ? 'Available' : 'Not Available' }}
                </span>
              </div>
              @if (!hasGeolocation() || !locationService.location()) {
                <div class="info-item fake-data">
                  <span class="info-label">Demo Location:</span>
                  <span class="info-value hardcoded-data">
                    51.6523, -0.3972 (Watford)
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- User Preferences - Contextual -->
          <div class="info-section">
            <h4 class="section-title">
              <span class="section-icon">⚙️</span>
              Contextual Preferences
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Search Radius (stored):</span>
                <span class="info-value">{{ preferencesStore.searchRadius() }}km</span>
              </div>
              <div class="info-item">
                <span class="info-label">Search Radius (display):</span>
                <span class="info-value">{{ displayRadiusForDebugging() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Distance Unit:</span>
                <span class="info-value">{{ preferencesStore.distanceUnit() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Default Sort:</span>
                <span class="info-value">{{ preferencesStore.defaultSortOrder() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Show Past Events:</span>
                <span class="info-value" [class.status-active]="preferencesStore.showPastEvents()">
                  {{ preferencesStore.showPastEvents() ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Preferred Categories:</span>
                <span class="info-value category-list">
                  {{ enabledCategories() }}
                </span>
              </div>
            </div>
          </div>

          <!-- User Preferences - Persistent -->
          <div class="info-section">
            <h4 class="section-title">
              <span class="section-icon">🎨</span>
              Persistent Preferences
            </h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Theme:</span>
                <span class="info-value">{{ preferencesStore.theme() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Language:</span>
                <span class="info-value">{{ preferencesStore.language() }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email Notifications:</span>
                <span class="info-value" [class.status-active]="preferencesStore.notifications().emailNotifications">
                  {{ preferencesStore.notifications().emailNotifications ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Push Notifications:</span>
                <span class="info-value" [class.status-active]="preferencesStore.notifications().pushNotifications">
                  {{ preferencesStore.notifications().pushNotifications ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Share Location:</span>
                <span class="info-value" [class.status-active]="preferencesStore.privacy().shareLocation">
                  {{ preferencesStore.privacy().shareLocation ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Analytics:</span>
                <span class="info-value" [class.status-active]="preferencesStore.privacy().analytics">
                  {{ preferencesStore.privacy().analytics ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>
          </div>



          <!-- Raw Data (Collapsible) -->
          <div class="info-section">
            <h4 class="section-title" (click)="toggleRawData()">
              <span class="section-icon">📊</span>
              Raw Data
              <span class="expand-icon">{{ showRawData() ? '▲' : '▼' }}</span>
            </h4>
            @if (showRawData()) {
              <div class="raw-data">
                <div class="raw-data-item">
                  <h5>Auth User Object:</h5>
                  <pre class="json-data">{{ authStore.user() | json }}</pre>
                </div>
                <div class="raw-data-item">
                  <h5>Location Data:</h5>
                  <pre class="json-data">{{ locationData() | json }}</pre>
                </div>
                <div class="raw-data-item">
                  <h5>Contextual Preferences:</h5>
                  <pre class="json-data">{{ preferencesStore.contextualPreferences() | json }}</pre>
                </div>
                <div class="raw-data-item">
                  <h5>Persistent Preferences:</h5>
                  <pre class="json-data">{{ preferencesStore.persistentPreferences() | json }}</pre>
                </div>
              </div>
            }
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .user-widget {
      background: var(--background-lightest);
      border: 1px solid var(--info);
      border-radius: 8px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
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
      background: linear-gradient(90deg, var(--background-lightest), var(--background-lighter));
    }

    .widget-header:hover {
      background: linear-gradient(90deg, var(--info-hover), var(--info));
      color: var(--on-primary);
    }

    .widget-header:hover .widget-title,
    .widget-header:hover .data-count,
    .widget-header:hover .collapse-btn {
      color: var(--on-primary);
    }

    .user-widget:not(.collapsed) .widget-header {
      border-bottom-color: var(--info);
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
      gap: 12px;
    }

    .data-count {
      font-size: 12px;
      color: var(--on-info);
      background: var(--info);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--info-hover);
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

    .widget-content {
      padding: 16px;
      background: var(--background);
    }

    .info-section {
      margin-bottom: 16px;
      padding: 12px;
      background: var(--background-lightest);
      border: 1px solid var(--border);
      border-radius: 6px;
      position: relative;
    }

    /* Authentication State - Success tint (real data) */
    .info-section:nth-child(1) {
      background: color-mix(in srgb, var(--success) 8%, var(--background-lighter));
      border-color: color-mix(in srgb, var(--success) 20%, var(--border));
    }

    /* Location Context - Warning tint (may be missing) */
    .info-section:nth-child(2) {
      background: color-mix(in srgb, var(--warning) 8%, var(--background-lighter));
      border-color: color-mix(in srgb, var(--warning) 20%, var(--border));
    }

    /* Contextual Preferences - Accent tint (user controlled) */
    .info-section:nth-child(3) {
      background: color-mix(in srgb, var(--accent) 8%, var(--background-lighter));
      border-color: color-mix(in srgb, var(--accent) 20%, var(--border));
    }

    /* Persistent Preferences - Primary tint (user controlled) */
    .info-section:nth-child(4) {
      background: color-mix(in srgb, var(--primary) 8%, var(--background-lighter));
      border-color: color-mix(in srgb, var(--primary) 20%, var(--border));
    }

    /* User Profile Data - Error tint (fake/missing data) */
    .info-section:nth-child(5) {
      background: color-mix(in srgb, var(--error) 6%, var(--background-lighter));
      border-color: color-mix(in srgb, var(--error) 15%, var(--border));
    }

    /* System Context - Info tint (technical) */
    .info-section:nth-child(6) {
      background: color-mix(in srgb, var(--info) 8%, var(--background-lighter));
      border-color: color-mix(in srgb, var(--info) 20%, var(--border));
    }

    /* Raw Data - Background darkest (debugging only) */
    .info-section:nth-child(7) {
      background: var(--background-darkest);
      border-color: var(--border-strong);
    }

    .info-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
    }

    .section-icon {
      font-size: 14px;
    }

    .expand-icon {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 8px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 12px;
    }

    .info-label {
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 100px;
      font-size: 11px;
    }

    .info-value {
      color: var(--text);
      text-align: right;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 11px;
    }

    .info-value.status-active {
      color: var(--success, #10b981);
      font-weight: 600;
    }

    .info-value.status-warning {
      color: var(--warning, #f59e0b);
      font-weight: 600;
    }

    .error-text {
      color: var(--error, #ef4444);
      font-weight: 500;
    }

    .role-badge {
      background: var(--accent);
      color: var(--on-accent);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .category-list {
      font-size: 11px;
      line-height: 1.3;
    }

    .raw-data {
      margin-top: 8px;
    }

    .raw-data-item {
      margin-bottom: 12px;
    }

    .raw-data-item h5 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .json-data {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 8px;
      font-size: 10px;
      line-height: 1.3;
      overflow-x: auto;
      color: var(--text-secondary);
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    }

    /* Fake/Hardcoded Data Styling */
    .fake-data {
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.1) 2px,
        rgba(255, 255, 255, 0.1) 4px
      );
      border: 1px dashed var(--warning);
      border-radius: 3px;
      padding: 2px 4px;
      position: relative;
    }

    .fake-data::before {
      content: "📝";
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 10px;
      background: var(--warning);
      color: var(--background);
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .hardcoded-data {
      color: var(--warning);
      font-style: italic;
      text-decoration: underline;
      text-decoration-style: dotted;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
      .widget-header {
        padding: 10px 12px;
      }

      .widget-content {
        padding: 12px;
      }

      .info-section {
        padding: 10px;
        margin-bottom: 12px;
      }

      .info-grid {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: 4px 8px;
      }

      .info-value {
        text-align: left;
      }

      .data-count {
        display: none;
      }
    }
  `]
})
export class UserWidgetComponent {
  readonly authStore = inject(AuthStore);
  readonly preferencesStore = inject(UserPreferencesStore);
  readonly locationService = inject(LocationService);
  readonly themeStore = inject(ThemeStore);
  readonly platform = inject(SsrPlatformService);

  // Widget state
  readonly isCollapsed = signal(false);
  readonly showRawData = signal(false);

  // Computed values
  readonly totalDataPoints = computed(() => {
    let count = 0;

    // Auth data points
    if (this.authStore.user()) count += 10;

    // Location data points
    if (this.locationService.location()) count += 2;
    count += 3; // loading, error states, geolocation API

    // Preferences data points
    count += 5; // contextual preferences
    count += 6; // persistent preferences

    // User profile data points (fake)
    count += 5; // fake user store data

    // System data points
    count += 6; // including cache size

    return count;
  });

  readonly enabledCategories = computed(() => {
    const categories = this.preferencesStore.preferredCategories();
    const enabled = Object.entries(categories)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category);

    return enabled.length > 0 ? enabled.join(', ') : 'None selected';
  });

  readonly hasGeolocation = computed(() => {
    return this.platform.isBrowser && 'geolocation' in navigator;
  });

  readonly locationData = computed(() => {
    return {
      location: this.locationService.location(),
      loading: this.locationService.loading(),
      error: this.locationService.error(),
      hasGeolocation: this.hasGeolocation()
    };
  });

  readonly displayRadiusForDebugging = computed(() => {
    const radius = this.preferencesStore.searchRadius();
    const unit = this.preferencesStore.distanceUnit();

    if (unit === 'miles') {
      // Now FIXED: proper conversion for display
      const miles = Math.round(radius * 0.621371);
      return `${miles} miles (converted from ${radius}km)`;
    }

    return `${radius} km`;
  });

  // Event handlers
  toggleCollapsed(): void {
    this.isCollapsed.update(collapsed => !collapsed);
  }

  toggleRawData(): void {
    this.showRawData.update(show => !show);
  }
}
