import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { EventStore } from '../data-access/event.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { Event } from '../utils/event.model';

@Component({
  selector: 'app-event-list',
  imports: [RouterModule],
  template: `
    <div class="event-list-container">
      <div class="header">
        <h1>Watford Events</h1>
        @if (user()) {
          <button class="add-event-btn" (click)="addEvent()">
            <span class="plus-icon">+</span>
            <span>Add Event</span>
          </button>
        } @else {
          <button class="login-btn" (click)="goToLogin()">
            <span>Login to Add Events</span>
          </button>
        }
      </div>

      <!-- User Info -->
      @if (user()) {
        <div class="user-info">
          <p>Welcome back, {{ user()?.displayName || 'User' }}!</p>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading your events...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="retry()">Try Again</button>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && !error() && events().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h2>No events found</h2>
          <p>No events are currently published. Check back later for upcoming events!</p>
          @if (user()) {
            <button class="create-first-btn" (click)="addEvent()">
              <span class="camera-icon">📸</span>
              <span>Create Your First Event</span>
            </button>
          } @else {
            <button class="login-btn" (click)="goToLogin()">
              <span>Login to Add Events</span>
            </button>
          }
        </div>
      }

      <!-- Events List -->
      @if (!loading() && events().length > 0) {
        <div class="events-content">
          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-number">{{ totalEvents() }}</span>
              <span class="stat-label">Total Events</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ realEventsCount() }}</span>
              <span class="stat-label">Real Events</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ mockEventsCount() }}</span>
              <span class="stat-label">Mock Events</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ upcomingCount() }}</span>
              <span class="stat-label">Upcoming</span>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button
              class="filter-tab"
              [class.active]="currentFilter() === 'all'"
              (click)="setFilter('all')"
            >
              All Events ({{ totalEvents() }})
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter() === 'this-week'"
              (click)="setFilter('this-week')"
            >
              This Week
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter() === 'last-week'"
              (click)="setFilter('last-week')"
            >
              Last Week
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter() === 'this-month'"
              (click)="setFilter('this-month')"
            >
              This Month
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter() === 'last-month'"
              (click)="setFilter('last-month')"
            >
              Last Month
            </button>
            <button
              class="filter-tab"
              [class.active]="currentFilter() === 'upcoming'"
              (click)="setFilter('upcoming')"
            >
              Upcoming ({{ upcomingCount() }})
            </button>
          </div>

          <!-- Mock Filter Row -->
          <div class="mock-filter-row">
            <span class="filter-label">Event Type:</span>
            <div class="mock-filter-tabs">
              <button
                class="mock-filter-tab"
                [class.active]="mockFilter() === 'all'"
                (click)="setMockFilter('all')"
              >
                All Events
              </button>
              <button
                class="mock-filter-tab"
                [class.active]="mockFilter() === 'real'"
                (click)="setMockFilter('real')"
              >
                Real Only ({{ realEventsCount() }})
              </button>
              <button
                class="mock-filter-tab"
                [class.active]="mockFilter() === 'mock'"
                (click)="setMockFilter('mock')"
              >
                Mock Only ({{ mockEventsCount() }})
              </button>
            </div>
          </div>

          <!-- Events Grid -->
          <div class="events-grid">
            @for (event of filteredEvents(); track event.id) {
              <div class="event-card" (click)="viewEvent(event)">
                <!-- Event Image -->
                @if (event.imageUrl) {
                  <div class="event-image">
                    <img [src]="event.imageUrl" [alt]="event.title" />
                    @if (event.scannerConfidence) {
                      <div class="ai-badge">
                        <span class="ai-icon">🤖</span>
                        <span>{{ event.scannerConfidence }}%</span>
                      </div>
                    }
                    @if (event.isMockEvent) {
                      <div class="mock-badge">
                        <span class="mock-icon">🧪</span>
                        <span>Mock</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="event-placeholder">
                    <span class="placeholder-icon">📅</span>
                    @if (event.isMockEvent) {
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
                    <h3 class="event-title">{{ event.title }}</h3>
                    <span class="status-badge" [class]="'status-' + event.status">
                      {{ getStatusLabel(event.status) }}
                    </span>
                  </div>

                  <div class="event-details">
                    <div class="event-date">
                      <span class="date-icon">📅</span>
                      <span>{{ formatDate(event.date) }}</span>
                    </div>
                    @if (event.location) {
                      <div class="event-location">
                        <span class="location-icon">📍</span>
                        <span>{{ event.location }}</span>
                      </div>
                    }
                  </div>

                  @if (event.description) {
                    <p class="event-description">{{ event.description }}</p>
                  }

                  <!-- Event Actions -->
                  <div class="event-actions" (click)="$event.stopPropagation()">
                    <!-- Share button for all users -->
                    <button class="action-btn share-btn" (click)="shareEvent(event)">
                      <span>📤</span>
                      <span>Share</span>
                    </button>

                    <!-- Edit/Delete actions only for event owners -->
                    @if (user() && event.createdBy === user()?.uid) {
                      <button class="action-btn edit-btn" (click)="editEvent(event)">
                        <span>✏️</span>
                        <span>Edit</span>
                      </button>

                      @if (event.status === 'draft') {
                        <button class="action-btn publish-btn" (click)="publishEvent(event)">
                          <span>🚀</span>
                          <span>Publish</span>
                        </button>
                      }

                      <button class="action-btn delete-btn" (click)="deleteEvent(event)">
                        <span>🗑️</span>
                        <span>Delete</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .event-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .add-event-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .add-event-btn:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .login-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .login-btn:hover {
      background: #1e7e34;
      transform: translateY(-2px);
    }

    .plus-icon {
      font-size: 20px;
      font-weight: bold;
    }

    .user-info {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #495057;
    }

    /* Loading and Error States */
    .loading-state, .error-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .retry-btn {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .empty-state h2 {
      color: #333;
      margin-bottom: 10px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 30px;
    }

    .create-first-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 15px 30px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .create-first-btn:hover {
      background: #1e7e34;
      transform: translateY(-2px);
    }

    .camera-icon {
      font-size: 20px;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      overflow-x: auto;
      padding-bottom: 5px;
    }

    .filter-tab {
      padding: 8px 16px;
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .filter-tab:hover {
      border-color: #007bff;
    }

    .filter-tab.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    /* Mock Filter Row */
    .mock-filter-row {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 30px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .filter-label {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .mock-filter-tabs {
      display: flex;
      gap: 8px;
    }

    .mock-filter-tab {
      padding: 6px 12px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 16px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .mock-filter-tab:hover {
      border-color: #007bff;
    }

    .mock-filter-tab.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    /* Events Grid */
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .event-card {
      background: white;
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
      background: rgba(255, 193, 7, 0.95);
      color: #333;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(255, 193, 7, 0.7);
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
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
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
      color: #333;
      line-height: 1.3;
      flex: 1;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }

    .status-badge.status-published {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.status-draft {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.status-cancelled {
      background: #f8d7da;
      color: #721c24;
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
      color: #666;
    }

    .date-icon, .location-icon {
      font-size: 16px;
    }

    .event-description {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
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
      background: #e7f3ff;
      color: #007bff;
    }

    .publish-btn {
      background: #d4edda;
      color: #155724;
    }

    .share-btn {
      background: #cce5ff;
      color: #0066cc;
    }

    .delete-btn {
      background: #f8d7da;
      color: #721c24;
    }

    .action-btn:hover {
      transform: translateY(-1px);
      filter: brightness(0.9);
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .event-list-container {
        padding: 15px;
      }

      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }

      .events-grid {
        grid-template-columns: 1fr;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filter-tabs {
        justify-content: center;
      }
    }
  `]
})
export class EventListComponent {
  // Services
  private eventStore = inject(EventStore);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  // Signals from stores
  readonly events = this.eventStore.userEvents;
  readonly loading = this.eventStore.loading;
  readonly error = this.eventStore.error;
  readonly user = this.authStore.user;

  constructor() {
    // Log events when they change
    effect(() => {
      const currentEvents = this.events();
      if (currentEvents.length > 0) {
        console.log('[EventList] 📊 Events loaded:', currentEvents.length);
        
        const eventsWithSlugs = currentEvents.filter(e => e.slug);
        const eventsWithoutSlugs = currentEvents.filter(e => !e.slug);
        const mockEvents = currentEvents.filter(e => e.isMockEvent);
        const realEvents = currentEvents.filter(e => !e.isMockEvent);
        
        console.log('[EventList] 🏷️ Events with slugs:', eventsWithSlugs.length);
        console.log('[EventList] 🚫 Events without slugs:', eventsWithoutSlugs.length);
        console.log('[EventList] 🧪 Mock events:', mockEvents.length);
        console.log('[EventList] 🎯 Real events:', realEvents.length);
        
        // Show first few events as samples
        const sampleSize = Math.min(3, currentEvents.length);
        console.log(`[EventList] 📋 Sample of first ${sampleSize} events:`);
        for (let i = 0; i < sampleSize; i++) {
          const event = currentEvents[i];
          console.log(`[EventList] ${i + 1}. ${event.title}`);
          console.log(`   🆔 ID: ${event.id}`);
          console.log(`   🏷️ Slug: ${event.slug || 'NO SLUG'}`);
          console.log(`   📊 Status: ${event.status}`);
          console.log(`   🧪 Mock: ${event.isMockEvent || false}`);
          console.log(`   📅 Date: ${event.date} (${typeof event.date})`);
        }
        
        if (eventsWithSlugs.length > 0) {
          console.log('[EventList] 🎉 Sample events WITH slugs:');
          eventsWithSlugs.slice(0, 3).forEach((event, i) => {
            console.log(`   ${i + 1}. "${event.title}" → slug: "${event.slug}"`);
          });
        }
        
        if (eventsWithoutSlugs.length > 0) {
          console.log('[EventList] ⚠️ Sample events WITHOUT slugs:');
          eventsWithoutSlugs.slice(0, 3).forEach((event, i) => {
            console.log(`   ${i + 1}. "${event.title}" → ID: "${event.id}"`);
          });
        }
      }
    });
  }

  // Local state
  readonly currentFilter = signal<'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'upcoming'>('all');
  readonly mockFilter = signal<'all' | 'real' | 'mock'>('all');

  // Date range computation functions
  private getWeekRange(date: Date): { start: Date; end: Date } {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek, end: endOfWeek };
  }

  private getMonthRange(date: Date): { start: Date; end: Date } {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return { start: startOfMonth, end: endOfMonth };
  }

  private isEventInDateRange(event: Event, range: { start: Date; end: Date }): boolean {
    const eventDate = new Date(event.date);
    return eventDate >= range.start && eventDate <= range.end;
  }

  // Computed values
  readonly totalEvents = computed(() => this.events().length);
  readonly realEventsCount = computed(() => this.events().filter(e => !e.isMockEvent).length);
  readonly mockEventsCount = computed(() => this.events().filter(e => e.isMockEvent).length);
  readonly thisWeekCount = computed(() => {
    const thisWeekRange = this.getWeekRange(new Date());
    return this.events().filter(e => this.isEventInDateRange(e, thisWeekRange)).length;
  });
  readonly thisMonthCount = computed(() => {
    const thisMonthRange = this.getMonthRange(new Date());
    return this.events().filter(e => this.isEventInDateRange(e, thisMonthRange)).length;
  });
  readonly upcomingCount = computed(() => {
    const now = new Date();
    return this.events().filter(e => {
      const eventDate = new Date(e.date);
      return eventDate > now;
    }).length;
  });

  readonly filteredEvents = computed(() => {
    const filter = this.currentFilter();
    const mockFilter = this.mockFilter();
    let allEvents = this.events();

    // Apply mock filter first
    switch (mockFilter) {
      case 'real':
        allEvents = allEvents.filter(e => !e.isMockEvent);
        break;
      case 'mock':
        allEvents = allEvents.filter(e => e.isMockEvent);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply date filter
    switch (filter) {
      case 'this-week':
        const thisWeekRange = this.getWeekRange(new Date());
        return allEvents.filter(e => this.isEventInDateRange(e, thisWeekRange));
      case 'last-week':
        const lastWeekRange = this.getWeekRange(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        return allEvents.filter(e => this.isEventInDateRange(e, lastWeekRange));
      case 'this-month':
        const thisMonthRange = this.getMonthRange(new Date());
        return allEvents.filter(e => this.isEventInDateRange(e, thisMonthRange));
      case 'last-month':
        const lastMonthRange = this.getMonthRange(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
        return allEvents.filter(e => this.isEventInDateRange(e, lastMonthRange));
      case 'upcoming':
        const now = new Date();
        return allEvents.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate > now;
        });
      default:
        return allEvents;
    }
  });

  setFilter(filter: 'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'upcoming') {
    console.log('[EventList] 🔍 Filter changed to:', filter);
    this.currentFilter.set(filter);
    
    // Log the filtered results
    const filtered = this.filteredEvents();
    console.log('[EventList] 📋 Filtered events count:', filtered.length);
    console.log('[EventList] 🎯 Filtered events:', filtered.map(e => ({
      title: e.title,
      date: e.date,
      isMockEvent: e.isMockEvent
    })));
  }

  setMockFilter(filter: 'all' | 'real' | 'mock') {
    console.log('[EventList] 🧪 Mock filter changed to:', filter);
    this.mockFilter.set(filter);
    
    // Log the filtered results
    const filtered = this.filteredEvents();
    console.log('[EventList] 📋 Filtered events count:', filtered.length);
    console.log('[EventList] 🎯 Filtered events:', filtered.map(e => ({
      title: e.title,
      date: e.date,
      isMockEvent: e.isMockEvent
    })));
  }

  addEvent() {
    this.router.navigate(['/events/add']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  viewEvent(event: Event) {
    // Use the simple /events/:id route
    this.router.navigate(['/events', event.id]);
  }

  editEvent(event: Event) {
    // TODO: Navigate to edit event page
    console.log('Edit event:', event.id);
  }

  async publishEvent(event: Event) {
    try {
      await this.eventStore.publishEvent(event.id);
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }

  shareEvent(event: Event) {
    // TODO: Implement sharing functionality
    console.log('Share event:', event.id);

    // Basic web share API if available
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.origin + '/events/' + event.id
      });
    }
  }

  async deleteEvent(event: Event) {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        await this.eventStore.deleteEvent(event.id);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  }

  retry() {
    this.eventStore.reload();
  }

  formatDate(date: Date): string {
    const eventDate = new Date(date);
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
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
}
