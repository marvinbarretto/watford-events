/**
 * @fileoverview SettingsComponent - Comprehensive user settings management page
 * 
 * PURPOSE:
 * - Complete interface for managing persistent preferences
 * - Organized into sections: General, Notifications, Accessibility, Privacy
 * - Accessible only to authenticated users
 * 
 * FEATURES:
 * - Theme selection with preview
 * - Language preference
 * - Notification preferences with granular controls
 * - Accessibility options
 * - Privacy controls
 * - Account management actions
 */
import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '@auth/data-access/auth.store';
import { UserPreferencesStore } from '../data-access/user-preferences.store';
import { 
  ThemePreference, 
  LanguageCode 
} from '../utils/user-preferences.types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="settings-container">
      <header class="settings-header">
        <button class="back-btn" (click)="goBack()">
          <span class="back-icon">←</span>
          Back
        </button>
        <h1 class="page-title">Settings</h1>
        <div class="header-actions">
          @if (preferencesStore.loading()) {
            <span class="loading-indicator">💫 Saving...</span>
          }
        </div>
      </header>

      @if (preferencesStore.error()) {
        <div class="error-banner">
          ⚠️ {{ preferencesStore.error() }}
          <button class="error-dismiss" (click)="preferencesStore.clearError()">×</button>
        </div>
      }

      <div class="settings-content">
        <!-- General Settings -->
        <section class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">⚙️</span>
            General
          </h2>
          
          <div class="setting-group">
            <label class="setting-label">
              <span class="label-text">
                <span class="label-icon">🌍</span>
                Language
              </span>
              <select 
                class="setting-select"
                [value]="preferencesStore.language()"
                (change)="onLanguageChange($event)"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">
              <span class="label-text">
                <span class="label-icon">🎨</span>
                Theme
              </span>
              <div class="theme-options">
                @for (theme of themeOptions(); track theme.value) {
                  <button
                    class="theme-option"
                    [class.active]="preferencesStore.theme() === theme.value"
                    (click)="updateTheme(theme.value)"
                  >
                    <span class="theme-icon">{{ theme.icon }}</span>
                    <span class="theme-label">{{ theme.label }}</span>
                  </button>
                }
              </div>
            </label>
          </div>
        </section>

        <!-- Notification Settings -->
        <section class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">🔔</span>
            Notifications
          </h2>
          
          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="notifications().emailNotifications"
                (change)="updateNotification('emailNotifications', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">📧</span>
                <span class="label-content">
                  <span class="label-text">Email Notifications</span>
                  <span class="label-description">Receive event updates via email</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="notifications().pushNotifications"
                (change)="updateNotification('pushNotifications', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">📱</span>
                <span class="label-content">
                  <span class="label-text">Push Notifications</span>
                  <span class="label-description">Browser push notifications</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="notifications().eventReminders"
                (change)="updateNotification('eventReminders', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">⏰</span>
                <span class="label-content">
                  <span class="label-text">Event Reminders</span>
                  <span class="label-description">Reminders before events start</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="notifications().newEventAlerts"
                (change)="updateNotification('newEventAlerts', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">🆕</span>
                <span class="label-content">
                  <span class="label-text">New Event Alerts</span>
                  <span class="label-description">Alerts when new events are posted</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="notifications().weeklyDigest"
                (change)="updateNotification('weeklyDigest', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">📊</span>
                <span class="label-content">
                  <span class="label-text">Weekly Digest</span>
                  <span class="label-description">Weekly summary of upcoming events</span>
                </span>
              </span>
            </label>
          </div>
        </section>

        <!-- Accessibility Settings -->
        <section class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">♿</span>
            Accessibility
          </h2>
          
          <div class="setting-group">
            <label class="setting-label">
              <span class="label-text">
                <span class="label-icon">🔤</span>
                Font Size
              </span>
              <div class="font-size-control">
                <input
                  type="range"
                  class="font-size-slider"
                  [value]="accessibility().fontSize"
                  (input)="onFontSizeChange($event)"
                  min="12"
                  max="24"
                  step="1"
                />
                <span class="font-size-value">{{ accessibility().fontSize }}px</span>
              </div>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="accessibility().highContrast"
                (change)="updateAccessibility('highContrast', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">🔆</span>
                <span class="label-content">
                  <span class="label-text">High Contrast</span>
                  <span class="label-description">Increase contrast for better visibility</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="accessibility().reduceMotion"
                (change)="updateAccessibility('reduceMotion', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">🎭</span>
                <span class="label-content">
                  <span class="label-text">Reduce Motion</span>
                  <span class="label-description">Minimize animations and transitions</span>
                </span>
              </span>
            </label>
          </div>
        </section>

        <!-- Privacy Settings -->
        <section class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">🔒</span>
            Privacy
          </h2>
          
          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="privacy().shareLocation"
                (change)="updatePrivacy('shareLocation', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">📍</span>
                <span class="label-content">
                  <span class="label-text">Share Location</span>
                  <span class="label-description">Allow location access for better event recommendations</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="privacy().analytics"
                (change)="updatePrivacy('analytics', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">📈</span>
                <span class="label-content">
                  <span class="label-text">Analytics</span>
                  <span class="label-description">Help improve the app with usage analytics</span>
                </span>
              </span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                [checked]="privacy().personalizedRecommendations"
                (change)="updatePrivacy('personalizedRecommendations', $event)"
              />
              <span class="checkbox-label">
                <span class="label-icon">💡</span>
                <span class="label-content">
                  <span class="label-text">Personalized Recommendations</span>
                  <span class="label-description">Use your activity to suggest relevant events</span>
                </span>
              </span>
            </label>
          </div>
        </section>

        <!-- Account Actions -->
        <section class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">👤</span>
            Account
          </h2>
          
          <div class="setting-group">
            <div class="account-actions">
              <button
                class="action-btn secondary"
                (click)="resetAllSettings()"
                [disabled]="preferencesStore.loading()"
              >
                <span class="btn-icon">🔄</span>
                Reset All Settings
              </button>
              
              <button
                class="action-btn secondary"
                (click)="exportSettings()"
                [disabled]="preferencesStore.loading()"
              >
                <span class="btn-icon">📤</span>
                Export Settings
              </button>
              
              <button
                class="action-btn danger"
                (click)="logout()"
              >
                <span class="btn-icon">🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: var(--background);
      min-height: 100vh;
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 16px;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .back-btn:hover {
      background: var(--background-lighter);
      color: var(--text);
    }

    .back-icon {
      font-size: 18px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .loading-indicator {
      font-size: 14px;
      color: var(--text-secondary);
      animation: pulse 1.5s infinite;
    }

    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--error-background, #fee);
      border: 1px solid var(--error-border, #fbb);
      border-radius: 8px;
      color: var(--error-text, #c53030);
      margin-bottom: 24px;
    }

    .error-dismiss {
      background: transparent;
      border: none;
      font-size: 18px;
      color: var(--error-text, #c53030);
      cursor: pointer;
      padding: 0;
    }

    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .settings-section {
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 24px 0;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .section-icon {
      font-size: 22px;
    }

    .setting-group {
      margin-bottom: 20px;
    }

    .setting-group:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .label-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: var(--text);
    }

    .label-icon {
      font-size: 18px;
    }

    .setting-select {
      padding: 8px 12px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      color: var(--text);
      cursor: pointer;
      min-width: 120px;
    }

    .setting-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    /* Theme Options */
    .theme-options {
      display: flex;
      gap: 8px;
    }

    .theme-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 80px;
    }

    .theme-option:hover {
      border-color: var(--primary);
    }

    .theme-option.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--on-primary);
    }

    .theme-icon {
      font-size: 20px;
    }

    .theme-label {
      font-size: 12px;
      font-weight: 500;
    }

    /* Checkbox Settings */
    .setting-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
    }

    .setting-checkbox input[type="checkbox"] {
      margin-top: 2px;
      cursor: pointer;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex: 1;
    }

    .label-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--text);
    }

    .label-description {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    /* Font Size Control */
    .font-size-control {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .font-size-slider {
      flex: 1;
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      appearance: none;
      cursor: pointer;
    }

    .font-size-slider::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .font-size-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .font-size-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 40px;
      text-align: center;
    }

    /* Account Actions */
    .account-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn.secondary {
      background: var(--background);
      color: var(--text-secondary);
    }

    .action-btn.secondary:hover:not(:disabled) {
      background: var(--background-lighter);
      border-color: var(--primary);
      color: var(--primary);
    }

    .action-btn.danger {
      background: var(--error-background, #fee);
      border-color: var(--error-border, #fbb);
      color: var(--error-text, #c53030);
    }

    .action-btn.danger:hover {
      background: var(--error-text, #c53030);
      color: white;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 16px;
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
      .settings-container {
        padding: 16px;
      }

      .settings-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .page-title {
        font-size: 24px;
      }

      .settings-section {
        padding: 20px 16px;
      }

      .setting-label {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .theme-options {
        flex-wrap: wrap;
        justify-content: flex-start;
      }

      .font-size-control {
        width: 100%;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class SettingsComponent {
  readonly authStore = inject(AuthStore);
  readonly preferencesStore = inject(UserPreferencesStore);
  readonly router = inject(Router);

  // Computed values for easier access
  readonly notifications = this.preferencesStore.notifications;
  readonly accessibility = this.preferencesStore.accessibility;
  readonly privacy = this.preferencesStore.privacy;

  readonly themeOptions = signal([
    { value: 'light' as ThemePreference, label: 'Light', icon: '☀️' },
    { value: 'dark' as ThemePreference, label: 'Dark', icon: '🌙' },
    { value: 'system' as ThemePreference, label: 'System', icon: '💻' }
  ]);

  // Event handlers
  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const language = target.value as LanguageCode;
    this.preferencesStore.updateLanguage(language);
  }

  updateTheme(theme: ThemePreference): void {
    this.preferencesStore.updateTheme(theme);
  }

  updateNotification(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.preferencesStore.updateNotifications({
      [key]: target.checked
    });
  }

  onFontSizeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const fontSize = parseInt(target.value, 10);
    this.preferencesStore.updateAccessibility({ fontSize });
  }

  updateAccessibility(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.preferencesStore.updateAccessibility({
      [key]: target.checked
    });
  }

  updatePrivacy(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.preferencesStore.updatePrivacy({
      [key]: target.checked
    });
  }

  resetAllSettings(): void {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      this.preferencesStore.resetToDefaults();
    }
  }

  exportSettings(): void {
    const settings = this.preferencesStore.getUserPreferences();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'watford-events-settings.json';
    link.click();
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authStore.logout();
      this.router.navigate(['/']);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}