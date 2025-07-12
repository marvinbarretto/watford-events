/**
 * @fileoverview UserPreferencesService - Persistence layer for user preferences
 * 
 * RESPONSIBILITIES:
 * - Save/load contextual preferences to localStorage
 * - Save/load persistent preferences to Firestore (user-specific)
 * - Handle preference migrations and defaults
 * - Sync preferences across devices for authenticated users
 * 
 * STORAGE STRATEGY:
 * - Contextual preferences: localStorage (session-specific)
 * - Persistent preferences: Firestore + localStorage cache (user-specific)
 * - Anonymous users: localStorage only
 * - Authenticated users: Firestore + localStorage cache
 */
import { Injectable } from '@angular/core';
import { FirestoreCrudService } from '@shared/data-access/firestore-crud.service';
import { 
  UserPreferences, 
  ContextualPreferences, 
  PersistentPreferences, 
  DEFAULT_CONTEXTUAL_PREFERENCES, 
  DEFAULT_PERSISTENT_PREFERENCES,
  DEFAULT_USER_PREFERENCES
} from '../utils/user-preferences.types';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService extends FirestoreCrudService<UserPreferences> {
  protected path = 'user-preferences';

  private readonly STORAGE_KEYS = {
    contextual: 'watford-events-contextual-prefs',
    persistent: 'watford-events-persistent-prefs',
  } as const;

  // ===================================
  // CONTEXTUAL PREFERENCES (localStorage)
  // ===================================

  /**
   * Load contextual preferences from localStorage
   */
  loadContextualPreferences(): ContextualPreferences {
    if (this.platform.isServer) {
      return DEFAULT_CONTEXTUAL_PREFERENCES;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.contextual);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new preference additions
        return { ...DEFAULT_CONTEXTUAL_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('[UserPreferencesService] Failed to load contextual preferences:', error);
    }

    return DEFAULT_CONTEXTUAL_PREFERENCES;
  }

  /**
   * Save contextual preferences to localStorage
   */
  saveContextualPreferences(preferences: ContextualPreferences): void {
    if (this.platform.isServer) return;

    try {
      localStorage.setItem(this.STORAGE_KEYS.contextual, JSON.stringify(preferences));
    } catch (error) {
      console.error('[UserPreferencesService] Failed to save contextual preferences:', error);
    }
  }

  // ===================================
  // PERSISTENT PREFERENCES (Firestore + cache)
  // ===================================

  /**
   * Load persistent preferences for authenticated user
   */
  async loadPersistentPreferences(userId: string): Promise<PersistentPreferences> {
    try {
      // Try Firestore first using FirestoreCrudService method
      const doc = await this.getById(userId);
      
      if (doc?.persistent) {
        // Cache in localStorage
        this.cachePersistentPreferences(doc.persistent);
        return { ...DEFAULT_PERSISTENT_PREFERENCES, ...doc.persistent };
      }
    } catch (error) {
      console.warn('[UserPreferencesService] Failed to load from Firestore, using cache:', error);
    }

    // Fallback to localStorage cache
    return this.loadCachedPersistentPreferences();
  }

  /**
   * Save persistent preferences for authenticated user
   */
  async savePersistentPreferences(userId: string, preferences: PersistentPreferences): Promise<void> {
    try {
      const userPrefs: UserPreferences = {
        id: userId,
        userId,
        contextual: DEFAULT_CONTEXTUAL_PREFERENCES, // Will be merged with existing if document exists
        persistent: preferences,
        lastUpdated: new Date(),
        version: 1
      };

      // Check if document exists to merge contextual preferences
      const existing = await this.getById(userId);
      if (existing) {
        userPrefs.contextual = existing.contextual;
      }

      await this.update(userId, userPrefs);
      
      // Update cache
      this.cachePersistentPreferences(preferences);
    } catch (error) {
      console.error('[UserPreferencesService] Failed to save persistent preferences:', error);
      // Still cache locally even if Firestore fails
      this.cachePersistentPreferences(preferences);
      throw error;
    }
  }

  /**
   * Load persistent preferences from localStorage cache
   */
  private loadCachedPersistentPreferences(): PersistentPreferences {
    if (this.platform.isServer) {
      return DEFAULT_PERSISTENT_PREFERENCES;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.persistent);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PERSISTENT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('[UserPreferencesService] Failed to load cached persistent preferences:', error);
    }

    return DEFAULT_PERSISTENT_PREFERENCES;
  }

  /**
   * Cache persistent preferences to localStorage
   */
  private cachePersistentPreferences(preferences: PersistentPreferences): void {
    if (this.platform.isServer) return;

    try {
      localStorage.setItem(this.STORAGE_KEYS.persistent, JSON.stringify(preferences));
    } catch (error) {
      console.error('[UserPreferencesService] Failed to cache persistent preferences:', error);
    }
  }

  // ===================================
  // COMPLETE PREFERENCES MANAGEMENT
  // ===================================

  /**
   * Load complete user preferences
   */
  async loadUserPreferences(userId?: string): Promise<UserPreferences> {
    const contextual = this.loadContextualPreferences();
    
    let persistent: PersistentPreferences;
    if (userId) {
      persistent = await this.loadPersistentPreferences(userId);
    } else {
      persistent = this.loadCachedPersistentPreferences();
    }

    return {
      id: userId || '',
      userId,
      contextual,
      persistent,
      lastUpdated: new Date(),
      version: 1
    };
  }

  /**
   * Save complete user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    // Always save contextual to localStorage
    this.saveContextualPreferences(preferences.contextual);

    // Save persistent based on authentication
    if (preferences.userId) {
      // Create full document with id for FirestoreCrudService
      const docToSave: UserPreferences = {
        ...preferences,
        id: preferences.userId
      };
      
      await this.update(preferences.userId, docToSave);
    } else {
      // Anonymous user - cache persistent preferences locally
      this.cachePersistentPreferences(preferences.persistent);
    }
  }

  // ===================================
  // MIGRATION & CLEANUP
  // ===================================

  /**
   * Migrate preferences when user logs in
   */
  async migrateAnonymousPreferences(userId: string): Promise<void> {
    try {
      // Load current anonymous preferences
      const contextual = this.loadContextualPreferences();
      const persistent = this.loadCachedPersistentPreferences();

      // Try to load existing user preferences
      const existingPersistent = await this.loadPersistentPreferences(userId);

      // Merge preferences (prioritize existing user preferences)
      const mergedPersistent = { ...persistent, ...existingPersistent };

      // Save merged preferences to user account
      const userPrefs: UserPreferences = {
        id: userId,
        userId,
        contextual,
        persistent: mergedPersistent,
        lastUpdated: new Date(),
        version: 1
      };

      await this.saveUserPreferences(userPrefs);
    } catch (error) {
      console.error('[UserPreferencesService] Failed to migrate anonymous preferences:', error);
    }
  }

  /**
   * Clear all local preferences (logout)
   */
  clearLocalPreferences(): void {
    if (this.platform.isServer) return;

    try {
      localStorage.removeItem(this.STORAGE_KEYS.contextual);
      localStorage.removeItem(this.STORAGE_KEYS.persistent);
    } catch (error) {
      console.error('[UserPreferencesService] Failed to clear local preferences:', error);
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(userId?: string): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
      id: userId || '',
      userId,
      ...DEFAULT_USER_PREFERENCES
    };

    await this.saveUserPreferences(defaultPrefs);
    return defaultPrefs;
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  /**
   * Check if preferences exist for user
   */
  async hasUserPreferences(userId: string): Promise<boolean> {
    try {
      return await this.existsById(userId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get preferences storage size (debugging)
   */
  getStorageSize(): { contextual: number; persistent: number } {
    if (this.platform.isServer) {
      return { contextual: 0, persistent: 0 };
    }

    const contextual = localStorage.getItem(this.STORAGE_KEYS.contextual)?.length || 0;
    const persistent = localStorage.getItem(this.STORAGE_KEYS.persistent)?.length || 0;

    return { contextual, persistent };
  }
}