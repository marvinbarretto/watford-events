import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStore } from '../../../events/data-access/event.store';
import { EventService } from '../../../events/data-access/event.service';
import { DebugService } from '../../utils/debug.service';
import { AuthStore } from '../../../auth/data-access/auth.store';
import { CleanupService } from '../../utils/cleanup.service';
import { UserService } from '../../../users/data-access/user.service';
import { environment } from '../../../../environments/environment';
import { EventModel } from '../../../events/utils/event.model';
import { createMockEvent, createMockEvents, createMixedEvents } from '../../../../testing/test-data-factories';

@Component({
  selector: 'app-dev-debug',
  imports: [CommonModule],
  template: `
    <div class="dev-debug admin-debug-panel" [class.expanded]="expanded()">
      <button
        class="dev-debug__toggle admin-toggle"
        (click)="toggleExpanded()"
        [attr.aria-expanded]="expanded()"
        aria-label="Toggle admin debug panel">
        🔑 Admin Debug
      </button>

      @if (expanded()) {
        <div class="dev-debug__panel">
          <!-- Admin Badge -->
          <div class="admin-badge">
            <span class="admin-icon">🔑</span>
            <span class="admin-text">Administrator Debug Panel</span>
          </div>

          <!-- Event Statistics Dashboard -->
          <section class="debug-section">
            <h3>📊 Event Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-label">Total Events</span>
                <span class="stat-value">{{ eventStats().total }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Published</span>
                <span class="stat-value">{{ eventStats().published }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Draft</span>
                <span class="stat-value">{{ eventStats().draft }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Mock Events</span>
                <span class="stat-value text-warning">{{ eventStats().mock }}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Real Events</span>
                <span class="stat-value text-success">{{ eventStats().real }}</span>
              </div>
            </div>
          </section>

          <!-- Event Management Actions -->
          <section class="debug-section">
            <h3>🗂️ Event Management</h3>
            <div class="action-buttons">
              <button
                class="btn btn--danger"
                (click)="deleteMockEvents()"
                [disabled]="deleting() || eventStats().mock === 0">
                @if (deleting()) {
                  <span class="spinner"></span> Batch Deleting...
                } @else {
                  🗑️ Batch Delete Mock Events ({{ eventStats().mock }})
                }
              </button>

              <button
                class="btn btn--secondary"
                (click)="toggleEventFilter()">
                @if (showOnlyMockEvents()) {
                  👁️ Show All Events
                } @else {
                  🔍 Show Only Mock Events
                }
              </button>

              <button
                class="btn btn--success"
                (click)="generateMockEvents()"
                [disabled]="generating()">
                @if (generating()) {
                  <span class="spinner"></span> Generating...
                } @else {
                  ✨ Generate Mock Events
                }
              </button>
            </div>
          </section>

          <!-- System State Monitor -->
          <section class="debug-section">
            <h3>⚙️ System State</h3>
            <div class="system-info">
              <div class="info-row">
                <span class="info-label">Event Store Loading:</span>
                <span class="info-value" [class.status-active]="eventStore.loading()">
                  {{ eventStore.loading() ? '🔄 Yes' : '✅ No' }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Event Store Error:</span>
                <span class="info-value" [class.text-error]="eventStore.error()">
                  {{ eventStore.error() || '✅ None' }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Auth Status:</span>
                <span class="info-value" [class.text-success]="authStore.isAuthenticated()">
                  {{ authStore.isAuthenticated() ? '🔐 Authenticated' : '🔓 Anonymous' }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Debug Level:</span>
                <span class="info-value">{{ debugService.getLevel() }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Environment:</span>
                <span class="info-value">{{ environment.production ? '🚀 Production' : '🛠️ Development' }}</span>
              </div>
            </div>
          </section>

          @if (showOnlyMockEvents() && mockEvents().length > 0) {
            <!-- Mock Events List -->
            <section class="debug-section">
              <h3>🎭 Mock Events ({{ mockEvents().length }})</h3>
              <div class="events-list">
                @for (event of mockEvents(); track event.id) {
                  <div class="event-item">
                    <div class="event-info">
                      <span class="event-title">{{ event.title }}</span>
                      <span class="event-meta">
                        {{ event.status }} • Created: {{ event.createdAt | date:'short' }}
                      </span>
                    </div>
                    <button
                      class="btn btn--small btn--danger"
                      (click)="deleteSingleMockEvent(event.id)"
                      [disabled]="deleting()">
                      🗑️
                    </button>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Debug Actions -->
          <section class="debug-section">
            <h3>🐛 Debug Actions</h3>
            <div class="action-buttons">
              <button
                class="btn btn--secondary"
                (click)="logDebugInfo()">
                📋 Log Debug Info
              </button>

              <button
                class="btn btn--secondary"
                (click)="reloadEvents()">
                🔄 Reload Events
              </button>

              <button
                class="btn btn--secondary"
                (click)="clearEventStoreError()">
                🧹 Clear Store Error
              </button>

              <button
                class="btn btn--secondary"
                (click)="measurePerformance()">
                ⏱️ Measure Performance
              </button>
            </div>
          </section>

          <!-- User Management Actions -->
          <section class="debug-section">
            <h3>👥 User Management</h3>
            <div class="action-buttons">
              <button
                class="btn btn--danger"
                (click)="clearAnonymousUsers()"
                [disabled]="cleaningUsers()">
                @if (cleaningUsers()) {
                  <span class="spinner"></span> Cleaning...
                } @else {
                  🗑️ Clear Anonymous Users
                }
              </button>

              <button
                class="btn btn--warning"
                (click)="clearAllTestUsers()"
                [disabled]="cleaningUsers()">
                @if (cleaningUsers()) {
                  <span class="spinner"></span> Cleaning...
                } @else {
                  ⚠️ Clear All Test Users
                }
              </button>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .dev-debug {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    .dev-debug__toggle {
      background: #2d3748;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    }

    .dev-debug__toggle:hover {
      background: #4a5568;
      transform: translateY(-1px);
    }

    .admin-toggle {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      border: 1px solid #fbbf24;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    }

    .admin-toggle:hover {
      background: linear-gradient(135deg, #b91c1c, #991b1b);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
    }

    .admin-badge {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      padding: 8px 12px;
      margin: -16px -16px 16px -16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }

    .admin-icon {
      font-size: 14px;
    }

    .admin-text {
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dev-debug__panel {
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 8px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      max-height: 80vh;
      overflow-y: auto;
      width: 380px;
    }

    .debug-section {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    .debug-section:last-child {
      border-bottom: none;
    }

    .debug-section h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 10px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--danger {
      background: #dc2626;
      color: white;
    }

    .btn--danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn--secondary {
      background: #6b7280;
      color: white;
    }

    .btn--secondary:hover:not(:disabled) {
      background: #4b5563;
    }

    .btn--success {
      background: #059669;
      color: white;
    }

    .btn--success:hover:not(:disabled) {
      background: #047857;
    }

    .btn--warning {
      background: #d97706;
      color: white;
    }

    .btn--warning:hover:not(:disabled) {
      background: #b45309;
    }

    .btn--small {
      padding: 4px 8px;
      font-size: 10px;
    }

    .system-info {
      font-size: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .info-label {
      color: #64748b;
    }

    .info-value {
      font-weight: 500;
    }

    .status-active {
      color: #059669;
    }

    .text-error {
      color: #dc2626;
    }

    .text-success {
      color: #059669;
    }

    .text-warning {
      color: #d97706;
    }

    .events-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .event-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      margin-bottom: 6px;
      background: #fefefe;
    }

    .event-info {
      flex: 1;
      min-width: 0;
    }

    .event-title {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-meta {
      display: block;
      font-size: 10px;
      color: #64748b;
    }

    .spinner {
      width: 10px;
      height: 10px;
      border: 1px solid transparent;
      border-top: 1px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class DevDebugComponent {
  // Dependencies
  protected readonly eventStore = inject(EventStore);
  private readonly eventService = inject(EventService);
  protected readonly debugService = inject(DebugService);
  protected readonly authStore = inject(AuthStore);
  private readonly cleanupService = inject(CleanupService);
  private readonly userService = inject(UserService);
  protected readonly environment = environment;

  // Component state
  protected readonly expanded = signal(false);
  protected readonly deleting = signal(false);
  protected readonly generating = signal(false);
  protected readonly cleaningUsers = signal(false);
  protected readonly showOnlyMockEvents = signal(false);

  // Computed properties for event statistics
  protected readonly eventStats = computed(() => {
    const events = this.eventStore.userEvents();
    return {
      total: events.length,
      published: events.filter(e => e.status === 'published').length,
      draft: events.filter(e => e.status === 'draft').length,
      mock: events.filter(e => e.isMockEvent === true).length,
      real: events.filter(e => e.isMockEvent !== true).length
    };
  });

  // Computed property for mock events list
  protected readonly mockEvents = computed(() => {
    return this.eventStore.userEvents().filter(e => e.isMockEvent === true);
  });

  protected toggleExpanded(): void {
    this.expanded.update(current => !current);
    this.debugService.standard('[DevDebug] Panel toggled', { expanded: this.expanded() });
  }

  protected toggleEventFilter(): void {
    this.showOnlyMockEvents.update(current => !current);
    this.debugService.standard('[DevDebug] Event filter toggled', {
      showOnlyMockEvents: this.showOnlyMockEvents()
    });
  }

  protected async deleteMockEvents(): Promise<void> {
    const mockEvents = this.mockEvents();

    if (mockEvents.length === 0) {
      this.debugService.warn('[DevDebug] No mock events to delete');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${mockEvents.length} mock events? This cannot be undone.`
    );

    if (!confirmed) {
      this.debugService.standard('[DevDebug] Mock event deletion cancelled by user');
      return;
    }

    this.deleting.set(true);
    this.debugService.standard('[DevDebug] Starting bulk deletion of mock events', {
      count: mockEvents.length,
      eventIds: mockEvents.map(e => e.id)
    });

    try {
      // Use batch delete for cost efficiency (admin-only, no permission checks)
      const result = await this.eventService.deleteMockEventsBatch();

      this.debugService.success(`[DevDebug] Successfully batch deleted all ${result.deleted} mock events`);
      this.debugService.standard(`[DevDebug] Cost savings: 1 write operation vs ${result.deleted} individual writes (${Math.round((1 - 1/result.deleted) * 100)}% savings)`);

      // Reload events to reflect changes
      await this.eventStore.reload();

      alert(`Successfully batch deleted ${result.deleted} mock events.\n\nCost savings: ${Math.round((1 - 1/result.deleted) * 100)}% reduction in Firestore writes!`);
    } catch (error) {
      this.debugService.error('[DevDebug] Failed to batch delete mock events', error);
      alert('Failed to batch delete mock events. Check console for details.');
    } finally {
      this.deleting.set(false);
    }
  }

  protected async deleteSingleMockEvent(eventId: string): Promise<void> {
    const event = this.eventStore.getEventById(eventId);
    if (!event || !event.isMockEvent) {
      this.debugService.warn('[DevDebug] Cannot delete non-mock event', { eventId });
      return;
    }

    const confirmed = confirm(`Delete mock event "${event.title}"?`);
    if (!confirmed) return;

    try {
      // Admin-only: use direct service call (bypasses ownership checks)
      await this.eventService.delete(eventId);
      await this.eventStore.reload(); // Refresh the store
      this.debugService.success(`[DevDebug] Admin deleted mock event: ${event.title}`, { id: eventId });
    } catch (error) {
      this.debugService.error(`[DevDebug] Failed to delete mock event: ${event.title}`, error);
      alert('Failed to delete event. Check console for details.');
    }
  }

  protected logDebugInfo(): void {
    this.debugService.standard('[DevDebug] System debug information:');
    this.debugService.logDebugInfo();

    console.group('🛠️ [DevDebug] Event Store Debug Info');
    console.log('Store State:', this.eventStore.getDebugInfo());
    console.log('Event Statistics:', this.eventStats());
    console.log('Mock Events:', this.mockEvents().map(e => ({ id: e.id, title: e.title, status: e.status })));
    console.groupEnd();

    console.group('🛠️ [DevDebug] Environment & Configuration');
    console.log('Environment:', {
      production: environment.production,
      debugLevel: this.debugService.getLevel(),
      featureFlags: environment.featureFlags
    });
    console.groupEnd();
  }

  protected async reloadEvents(): Promise<void> {
    this.debugService.standard('[DevDebug] Manually reloading events');
    try {
      await this.eventStore.reload();
      this.debugService.success('[DevDebug] Events reloaded successfully');
    } catch (error) {
      this.debugService.error('[DevDebug] Failed to reload events', error);
    }
  }

  protected clearEventStoreError(): void {
    this.eventStore.clearError();
    this.debugService.standard('[DevDebug] Event store error cleared');
  }

  protected async generateMockEvents(): Promise<void> {
    // Admin-only component, no auth check needed

    const eventCount = prompt('How many mock events should I generate?', '5');
    if (!eventCount || isNaN(Number(eventCount))) {
      this.debugService.standard('[DevDebug] Mock event generation cancelled');
      return;
    }

    const count = Math.min(Math.max(1, Number(eventCount)), 20); // Limit between 1-20
    this.generating.set(true);
    this.debugService.standard(`[DevDebug] Generating ${count} mock events`);

    try {
      const mockEventData = createMockEvents(count, (index) => ({
        title: `Generated Mock Event ${index + 1}`,
        description: `This is automatically generated mock event #${index + 1} for testing purposes.`,
        organizer: 'Mock Event Organizer',
        location: index % 2 === 0 ? 'Mock Venue A' : 'Mock Venue B',
        status: index % 3 === 0 ? 'draft' : 'published',
        // Spread events across the next 30 days
        date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000 + Math.random() * 30 * 24 * 60 * 60 * 1000)
      }));

      let createdCount = 0;
      let errorCount = 0;

      for (const mockData of mockEventData) {
        try {
          // Convert MockEvent to EventModel format
          const eventData: Omit<EventModel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'ownerId'> = {
            title: mockData.title,
            description: mockData.description,
            date: mockData.date.toISOString().split('T')[0],
            location: mockData.location,
            attendeeIds: [],
            status: mockData.status as 'draft' | 'published' | 'cancelled',
            eventType: 'single',
            isMockEvent: true,
            organizer: mockData.organizer,
            categories: ['other'], // Default category
            tags: ['mock', 'generated', 'test']
          };

          await this.eventStore.createEvent(eventData);
          createdCount++;
          this.debugService.standard(`[DevDebug] Created mock event: ${mockData.title}`);
        } catch (error) {
          errorCount++;
          this.debugService.error(`[DevDebug] Failed to create mock event: ${mockData.title}`, error);
        }
      }

      this.generating.set(false);

      if (errorCount > 0) {
        this.debugService.warn(`[DevDebug] Mock event generation completed with errors`, {
          created: createdCount,
          errors: errorCount,
          total: count
        });
        alert(`Generated ${createdCount} mock events, but ${errorCount} failed. Check console for details.`);
      } else {
        this.debugService.success(`[DevDebug] Successfully generated ${createdCount} mock events`);
        alert(`Successfully generated ${createdCount} mock events.`);
      }
    } catch (error) {
      this.generating.set(false);
      this.debugService.error('[DevDebug] Failed to generate mock events', error);
      alert('Failed to generate mock events. Check console for details.');
    }
  }

  async measurePerformance(): Promise<void> {
    this.debugService.standard('[DevDebug] Starting performance measurement');

    const measurements = {
      eventStoreReload: 0,
      eventFiltering: 0,
      computedUpdates: 0
    };

    try {
      // Measure event store reload performance
      const reloadStart = performance.now();
      await this.eventStore.reload();
      measurements.eventStoreReload = performance.now() - reloadStart;

      // Measure filtering performance
      const filterStart = performance.now();
      const events = this.eventStore.userEvents();
      const mockEvents = events.filter(e => e.isMockEvent === true);
      const realEvents = events.filter(e => e.isMockEvent !== true);
      measurements.eventFiltering = performance.now() - filterStart;

      // Measure computed property updates
      const computedStart = performance.now();
      const stats = this.eventStats();
      measurements.computedUpdates = performance.now() - computedStart;

      this.debugService.standard('[DevDebug] Performance measurements completed', measurements);

      console.group('⏱️ [DevDebug] Performance Measurements');
      console.log('Event Store Reload:', `${measurements.eventStoreReload.toFixed(1)}ms`);
      console.log('Event Filtering:', `${measurements.eventFiltering.toFixed(1)}ms`);
      console.log('Computed Updates:', `${measurements.computedUpdates.toFixed(1)}ms`);
      console.log('Event Counts:', {
        total: events.length,
        mock: mockEvents.length,
        real: realEvents.length,
        stats
      });
      console.groupEnd();

      alert(`Performance measured:\nReload: ${measurements.eventStoreReload.toFixed(1)}ms\nFiltering: ${measurements.eventFiltering.toFixed(1)}ms\nComputed: ${measurements.computedUpdates.toFixed(1)}ms\n\nCheck console for details.`);
    } catch (error) {
      this.debugService.error('[DevDebug] Performance measurement failed', error);
      alert('Performance measurement failed. Check console for details.');
    }
  }

  protected async clearAnonymousUsers(): Promise<void> {
    // Note: Since we don't store the `isAnonymous` flag in user documents,
    // we'll identify anonymous users by missing or null email addresses
    // and specific display name patterns common to anonymous users

    const confirmed = confirm(
      'This will delete users with null/empty emails or anonymous display names.\n\n' +
      'This action cannot be undone. Continue?'
    );

    if (!confirmed) {
      this.debugService.standard('[DevDebug] Anonymous user cleanup cancelled by user');
      return;
    }

    this.cleaningUsers.set(true);
    this.debugService.standard('[DevDebug] Starting anonymous user cleanup');

    try {
      // Get all users to identify anonymous ones
      const allUsers = await this.userService.getAllUsers();

      // Identify anonymous users by common patterns:
      // 1. Null or empty email
      // 2. Display names like "Anonymous", "Guest", or auto-generated patterns
      const anonymousUsers = allUsers.filter(user =>
        !user.email ||
        user.email.trim() === '' ||
        user.displayName.toLowerCase().includes('anonymous') ||
        user.displayName.toLowerCase().includes('guest') ||
        user.displayName.match(/^(User|Anon)\d+$/i) // Auto-generated patterns
      );

      if (anonymousUsers.length === 0) {
        this.debugService.standard('[DevDebug] No anonymous users found');
        alert('No anonymous users found to delete.');
        return;
      }

      this.debugService.standard(`[DevDebug] Found ${anonymousUsers.length} anonymous users to delete`, {
        userIds: anonymousUsers.map(u => u.uid),
        patterns: anonymousUsers.map(u => ({ uid: u.uid, email: u.email, displayName: u.displayName }))
      });

      // Use cleanup service batch operations for efficiency
      let deletedCount = 0;

      for (const user of anonymousUsers) {
        try {
          await this.userService.deleteUser(user.uid);
          deletedCount++;
          this.debugService.standard(`[DevDebug] Deleted anonymous user: ${user.displayName} (${user.email || 'no email'})`);
        } catch (error) {
          this.debugService.error(`[DevDebug] Failed to delete user ${user.uid}`, error);
        }
      }

      this.debugService.success(`[DevDebug] Anonymous user cleanup completed. Deleted ${deletedCount}/${anonymousUsers.length} users`);
      alert(`Successfully deleted ${deletedCount} anonymous users.\n\nCheck console for details.`);

    } catch (error) {
      this.debugService.error('[DevDebug] Failed to cleanup anonymous users', error);
      alert('Failed to cleanup anonymous users. Check console for details.');
    } finally {
      this.cleaningUsers.set(false);
    }
  }

  protected async clearAllTestUsers(): Promise<void> {
    const confirmed = confirm(
      '⚠️ DANGER: This will delete ALL users from the database.\n\n' +
      'This includes real users, not just test data!\n\n' +
      'This action cannot be undone. Are you absolutely sure?'
    );

    if (!confirmed) {
      this.debugService.standard('[DevDebug] All user cleanup cancelled by user');
      return;
    }

    const doubleConfirm = confirm(
      'FINAL WARNING: You are about to delete ALL USERS.\n\n' +
      'Type YES in the next prompt to confirm.'
    );

    if (!doubleConfirm) {
      this.debugService.standard('[DevDebug] All user cleanup cancelled at double confirmation');
      return;
    }

    const finalConfirm = prompt('Type "YES" to confirm deletion of ALL users:');
    if (finalConfirm !== 'YES') {
      this.debugService.standard('[DevDebug] All user cleanup cancelled - incorrect confirmation');
      return;
    }

    this.cleaningUsers.set(true);
    this.debugService.standard('[DevDebug] Starting complete user data cleanup');

    try {
      const result = await this.cleanupService.clearUserData();

      this.debugService.success('[DevDebug] Complete user cleanup finished', result);

      const totalDeleted = result.users.deletedCount + result.earnedBadges.deletedCount;
      alert(`Successfully deleted all user data:\n\n` +
            `Users: ${result.users.deletedCount}\n` +
            `Earned Badges: ${result.earnedBadges.deletedCount}\n` +
            `Total: ${totalDeleted} documents`);

    } catch (error) {
      this.debugService.error('[DevDebug] Failed to cleanup all users', error);
      alert('Failed to cleanup all users. Check console for details.');
    } finally {
      this.cleaningUsers.set(false);
    }
  }
}
