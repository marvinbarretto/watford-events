/**
 * @fileoverview UserPreferencesStore - State management for user preferences
 * 
 * RESPONSIBILITIES:
 * - Manage contextual and persistent preferences state
 * - Provide reactive updates when preferences change
 * - Handle authentication state changes
 * - Coordinate with UserPreferencesService for persistence
 * 
 * ARCHITECTURE:
 * - Listens to AuthStore for user changes
 * - Auto-loads preferences when user signs in
 * - Migrates anonymous preferences on authentication
 * - Provides granular update methods for different preference types
 */
import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthStore } from '@auth/data-access/auth.store';
import { UserPreferencesService } from './user-preferences.service';
import { 
  UserPreferences, 
  ContextualPreferences, 
  PersistentPreferences, 
  DEFAULT_CONTEXTUAL_PREFERENCES, 
  DEFAULT_PERSISTENT_PREFERENCES,
  EventCategoryPreferences,
  DistanceUnit,
  EventSortOrder,
  ThemePreference,
  LanguageCode
} from '../utils/user-preferences.types';

@Injectable({ providedIn: 'root' })
export class UserPreferencesStore {
  // 🔧 Dependencies
  private readonly authStore = inject(AuthStore);
  private readonly preferencesService = inject(UserPreferencesService);

  // ✅ Preferences state
  private readonly _contextualPreferences = signal<ContextualPreferences>(DEFAULT_CONTEXTUAL_PREFERENCES);
  private readonly _persistentPreferences = signal<PersistentPreferences>(DEFAULT_PERSISTENT_PREFERENCES);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastSyncTime = signal<Date | null>(null);

  // 📡 Public signals
  readonly contextualPreferences = this._contextualPreferences.asReadonly();
  readonly persistentPreferences = this._persistentPreferences.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastSyncTime = this._lastSyncTime.asReadonly();

  // ✅ Computed values for common preferences
  readonly searchRadius = computed(() => this._contextualPreferences().searchRadius);
  readonly distanceUnit = computed(() => this._contextualPreferences().distanceUnit);
  readonly defaultSortOrder = computed(() => this._contextualPreferences().defaultSortOrder);
  readonly preferredCategories = computed(() => this._contextualPreferences().preferredCategories);
  readonly showPastEvents = computed(() => this._contextualPreferences().showPastEvents);
  
  readonly theme = computed(() => this._persistentPreferences().theme);
  readonly language = computed(() => this._persistentPreferences().language);
  readonly notifications = computed(() => this._persistentPreferences().notifications);
  readonly accessibility = computed(() => this._persistentPreferences().accessibility);
  readonly privacy = computed(() => this._persistentPreferences().privacy);

  // 🔄 Track initialization
  private hasInitialized = false;

  constructor() {
    // ✅ Auto-load preferences when auth state changes
    effect(() => {
      const user = this.authStore.user();
      const authReady = this.authStore.ready();
      
      if (authReady && !this.hasInitialized) {
        this.initializePreferences(user?.uid);
        this.hasInitialized = true;
      } else if (authReady && user?.uid) {
        // User logged in - migrate anonymous preferences
        this.handleUserLogin(user.uid);
      } else if (authReady && !user) {
        // User logged out - load anonymous preferences
        this.handleUserLogout();
      }
    });
  }

  // ===================================
  // INITIALIZATION & LIFECYCLE
  // ===================================

  /**
   * Initialize preferences on app startup
   */
  private async initializePreferences(userId?: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const preferences = await this.preferencesService.loadUserPreferences(userId);
      this._contextualPreferences.set(preferences.contextual);
      this._persistentPreferences.set(preferences.persistent);
      this._lastSyncTime.set(new Date());
      
      console.log('[UserPreferencesStore] ✅ Preferences initialized for user:', userId || 'anonymous');
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to load preferences');
      console.error('[UserPreferencesStore] ❌ Failed to initialize preferences:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Handle user login - migrate anonymous preferences
   */
  private async handleUserLogin(userId: string): Promise<void> {
    try {
      await this.preferencesService.migrateAnonymousPreferences(userId);
      await this.initializePreferences(userId);
    } catch (error) {
      console.error('[UserPreferencesStore] ❌ Failed to handle user login:', error);
    }
  }

  /**
   * Handle user logout - load anonymous preferences
   */
  private async handleUserLogout(): Promise<void> {
    try {
      // Clear any user-specific cached data
      this.preferencesService.clearLocalPreferences();
      await this.initializePreferences();
    } catch (error) {
      console.error('[UserPreferencesStore] ❌ Failed to handle user logout:', error);
    }
  }

  // ===================================
  // CONTEXTUAL PREFERENCES UPDATES
  // ===================================

  /**
   * Update search radius
   */
  async updateSearchRadius(radius: number): Promise<void> {
    const updated = { ...this._contextualPreferences(), searchRadius: radius };
    await this.updateContextualPreferences(updated);
  }

  /**
   * Update distance unit
   */
  async updateDistanceUnit(unit: DistanceUnit): Promise<void> {
    const updated = { ...this._contextualPreferences(), distanceUnit: unit };
    await this.updateContextualPreferences(updated);
  }

  /**
   * Update default sort order
   */
  async updateDefaultSortOrder(order: EventSortOrder): Promise<void> {
    const updated = { ...this._contextualPreferences(), defaultSortOrder: order };
    await this.updateContextualPreferences(updated);
  }

  /**
   * Update preferred event categories
   */
  async updatePreferredCategories(categories: Partial<EventCategoryPreferences>): Promise<void> {
    const currentCategories = this._contextualPreferences().preferredCategories;
    const updatedCategories = { ...currentCategories, ...categories };
    const updated = { ...this._contextualPreferences(), preferredCategories: updatedCategories };
    await this.updateContextualPreferences(updated);
  }

  /**
   * Toggle show past events
   */
  async toggleShowPastEvents(): Promise<void> {
    const updated = { 
      ...this._contextualPreferences(), 
      showPastEvents: !this._contextualPreferences().showPastEvents 
    };
    await this.updateContextualPreferences(updated);
  }

  /**
   * Update complete contextual preferences
   */
  async updateContextualPreferences(preferences: ContextualPreferences): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      // Optimistic update
      this._contextualPreferences.set(preferences);
      
      // Persist changes
      this.preferencesService.saveContextualPreferences(preferences);
      
      console.log('[UserPreferencesStore] ✅ Contextual preferences updated');
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to update contextual preferences');
      console.error('[UserPreferencesStore] ❌ Failed to update contextual preferences:', error);
    } finally {
      this._loading.set(false);
    }
  }

  // ===================================
  // PERSISTENT PREFERENCES UPDATES
  // ===================================

  /**
   * Update theme preference
   */
  async updateTheme(theme: ThemePreference): Promise<void> {
    const updated = { ...this._persistentPreferences(), theme };
    await this.updatePersistentPreferences(updated);
  }

  /**
   * Update language preference
   */
  async updateLanguage(language: LanguageCode): Promise<void> {
    const updated = { ...this._persistentPreferences(), language };
    await this.updatePersistentPreferences(updated);
  }

  /**
   * Update notification preferences
   */
  async updateNotifications(notifications: Partial<typeof DEFAULT_PERSISTENT_PREFERENCES.notifications>): Promise<void> {
    const currentNotifications = this._persistentPreferences().notifications;
    const updatedNotifications = { ...currentNotifications, ...notifications };
    const updated = { ...this._persistentPreferences(), notifications: updatedNotifications };
    await this.updatePersistentPreferences(updated);
  }

  /**
   * Update accessibility preferences
   */
  async updateAccessibility(accessibility: Partial<typeof DEFAULT_PERSISTENT_PREFERENCES.accessibility>): Promise<void> {
    const currentAccessibility = this._persistentPreferences().accessibility;
    const updatedAccessibility = { ...currentAccessibility, ...accessibility };
    const updated = { ...this._persistentPreferences(), accessibility: updatedAccessibility };
    await this.updatePersistentPreferences(updated);
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacy(privacy: Partial<typeof DEFAULT_PERSISTENT_PREFERENCES.privacy>): Promise<void> {
    const currentPrivacy = this._persistentPreferences().privacy;
    const updatedPrivacy = { ...currentPrivacy, ...privacy };
    const updated = { ...this._persistentPreferences(), privacy: updatedPrivacy };
    await this.updatePersistentPreferences(updated);
  }

  /**
   * Update complete persistent preferences
   */
  async updatePersistentPreferences(preferences: PersistentPreferences): Promise<void> {
    const userId = this.authStore.user()?.uid;
    
    this._loading.set(true);
    this._error.set(null);

    try {
      // Optimistic update
      this._persistentPreferences.set(preferences);
      
      // Persist changes
      if (userId) {
        await this.preferencesService.savePersistentPreferences(userId, preferences);
      } else {
        // Anonymous user - cache locally
        this.preferencesService['cachePersistentPreferences'](preferences);
      }
      
      this._lastSyncTime.set(new Date());
      console.log('[UserPreferencesStore] ✅ Persistent preferences updated');
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to update persistent preferences');
      console.error('[UserPreferencesStore] ❌ Failed to update persistent preferences:', error);
    } finally {
      this._loading.set(false);
    }
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  /**
   * Reset all preferences to defaults
   */
  async resetToDefaults(): Promise<void> {
    const userId = this.authStore.user()?.uid;
    
    this._loading.set(true);
    this._error.set(null);

    try {
      const defaultPrefs = await this.preferencesService.resetPreferences(userId);
      this._contextualPreferences.set(defaultPrefs.contextual);
      this._persistentPreferences.set(defaultPrefs.persistent);
      this._lastSyncTime.set(new Date());
      
      console.log('[UserPreferencesStore] ✅ Preferences reset to defaults');
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to reset preferences');
      console.error('[UserPreferencesStore] ❌ Failed to reset preferences:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Get complete preferences object
   */
  getUserPreferences(): UserPreferences {
    const userId = this.authStore.user()?.uid;
    return {
      id: userId || '',
      userId,
      contextual: this._contextualPreferences(),
      persistent: this._persistentPreferences(),
      lastUpdated: this._lastSyncTime() || new Date(),
      version: 1
    };
  }

  /**
   * Check if category is enabled
   */
  isCategoryEnabled(category: keyof EventCategoryPreferences): boolean {
    return this._contextualPreferences().preferredCategories[category];
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Get debug information
   */
  getDebugInfo(): object {
    return {
      contextualPreferences: this._contextualPreferences(),
      persistentPreferences: this._persistentPreferences(),
      loading: this._loading(),
      error: this._error(),
      lastSyncTime: this._lastSyncTime(),
      storageSize: this.preferencesService.getStorageSize()
    };
  }
}