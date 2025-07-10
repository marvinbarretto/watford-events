import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { EventStore } from '../data-access/event.store';
import { AuthStore } from '../../auth/data-access/auth.store';
import { Event } from '../utils/event.model';
import { toDate, formatTimestamp } from '../../shared/utils/timestamp.utils';
import { ChipComponent } from '../../shared/ui/chip/chip.component';

@Component({
  selector: 'app-event-detail',
  imports: [RouterModule, ChipComponent],
  template: `
    <div class="event-detail-container">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading event details...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <div class="error-icon">❌</div>
          <h2>Event Not Found</h2>
          <p>{{ error() }}</p>
          <button class="back-btn" (click)="goBack()">← Back to Events</button>
        </div>
      }

      <!-- Event Detail -->
      @if (event() && !loading() && !error()) {
        <div class="event-content">
          
          <!-- Hero Section -->
          <div class="event-hero">
            @if (event()?.imageUrl) {
              <div class="hero-image">
                <img [src]="event()!.imageUrl" [alt]="event()!.title" />
                <div class="hero-overlay">
                  <div class="hero-actions">
                    <button class="action-btn back-btn" (click)="goBack()">
                      <span>←</span>
                      <span>Back</span>
                    </button>
                    @if (canEdit()) {
                      <button class="action-btn edit-btn" (click)="editEvent()">
                        <span>✏️</span>
                        <span>Edit</span>
                      </button>
                    }
                    <button class="action-btn share-btn" (click)="shareEvent()">
                      <span>📤</span>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="hero-placeholder">
                <span class="placeholder-icon">📅</span>
                <div class="hero-actions">
                  <button class="action-btn back-btn" (click)="goBack()">
                    <span>←</span>
                    <span>Back</span>
                  </button>
                  @if (canEdit()) {
                    <button class="action-btn edit-btn" (click)="editEvent()">
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                  }
                  <button class="action-btn share-btn" (click)="shareEvent()">
                    <span>📤</span>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Event Header -->
          <div class="event-header">
            <div class="title-section">
              <h1 class="event-title">{{ event()!.title }}</h1>
              <app-chip
                [text]="getStatusLabel(event()!.status)"
                type="ui"
                variant="status"
                [status]="event()!.status"
              />
            </div>
            
            @if (event()?.scannedAt) {
              <app-chip
                [text]="'AI-Generated' + (event()?.scannerConfidence ? ' (' + event()?.scannerConfidence + '%)' : '')"
                type="ui"
                variant="confidence"
                icon="🤖"
              />
            }
          </div>

          <!-- Event Details Grid -->
          <div class="event-details-grid">
            
            <!-- Core Information Section -->
            <div class="info-section">
              <h3 class="section-title">Event Details</h3>
              
              <div class="info-item">
                <span class="info-icon">📅</span>
                <div class="info-content">
                  <span class="info-label">Date & Time</span>
                  <span class="info-value">{{ getSafeDateDisplay(event()!.date) }}</span>
                </div>
              </div>

              @if (event()?.location) {
                <div class="info-item">
                  <span class="info-icon">📍</span>
                  <div class="info-content">
                    <span class="info-label">Location</span>
                    <span class="info-value">{{ event()!.location }}</span>
                  </div>
                </div>
              }

              @if (event()?.description) {
                <div class="info-item description-item">
                  <span class="info-icon">📝</span>
                  <div class="info-content">
                    <span class="info-label">Description</span>
                    <p class="info-value description-text">{{ event()!.description }}</p>
                  </div>
                </div>
              }

              @if (event()?.organizer) {
                <div class="info-item">
                  <span class="info-icon">👤</span>
                  <div class="info-content">
                    <span class="info-label">Organizer</span>
                    <span class="info-value">{{ event()!.organizer }}</span>
                  </div>
                </div>
              }

              @if (event()?.ticketInfo) {
                <div class="info-item">
                  <span class="info-icon">🎫</span>
                  <div class="info-content">
                    <span class="info-label">Ticket Information</span>
                    <span class="info-value">{{ event()!.ticketInfo }}</span>
                  </div>
                </div>
              }

              @if (event()?.contactInfo) {
                <div class="info-item">
                  <span class="info-icon">📞</span>
                  <div class="info-content">
                    <span class="info-label">Contact</span>
                    <span class="info-value">{{ event()!.contactInfo }}</span>
                  </div>
                </div>
              }

              @if (event()?.website) {
                <div class="info-item">
                  <span class="info-icon">🌐</span>
                  <div class="info-content">
                    <span class="info-label">Website</span>
                    <a [href]="event()!.website" target="_blank" class="info-value website-link">
                      {{ event()!.website }}
                    </a>
                  </div>
                </div>
              }
            </div>

            <!-- AI Processing Section -->
            @if (event()?.scannedAt) {
              <div class="ai-section">
                <h3 class="section-title">AI Processing Details</h3>
                
                <div class="ai-stats">
                  @if (event()?.scannerConfidence) {
                    <div class="ai-stat">
                      <span class="ai-stat-label">Confidence Score</span>
                      <div class="confidence-bar">
                        <div class="confidence-fill" [style.width.%]="event()!.scannerConfidence"></div>
                        <span class="confidence-text">{{ event()!.scannerConfidence }}%</span>
                      </div>
                    </div>
                  }

                  @if (event()?.processingTime) {
                    <div class="ai-stat">
                      <span class="ai-stat-label">Processing Time</span>
                      <span class="ai-stat-value">{{ event()!.processingTime }}ms</span>
                    </div>
                  }

                  @if (event()?.llmModel) {
                    <div class="ai-stat">
                      <span class="ai-stat-label">AI Model</span>
                      <span class="ai-stat-value">{{ event()!.llmModel }}</span>
                    </div>
                  }

                  <div class="ai-stat">
                    <span class="ai-stat-label">Scanned At</span>
                    <span class="ai-stat-value">{{ getSafeDateDisplay(event()!.scannedAt!) }}</span>
                  </div>
                </div>

                @if (event()?.rawTextData) {
                  <div class="raw-text-section">
                    <button class="toggle-btn" (click)="toggleRawText()">
                      <span>{{ showRawText() ? '▼' : '▶' }}</span>
                      <span>Raw Extracted Text</span>
                    </button>
                    @if (showRawText()) {
                      <div class="raw-text-content">
                        <pre>{{ event()!.rawTextData }}</pre>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Social Section -->
            <div class="social-section">
              <h3 class="section-title">Event Engagement</h3>
              
              <div class="social-stats">
                <div class="social-stat">
                  <span class="social-stat-number">{{ attendeeCount() }}</span>
                  <span class="social-stat-label">Attendees</span>
                </div>
                <div class="social-stat">
                  <span class="social-stat-number">{{ daysUntilEvent() || 0 }}</span>
                  <span class="social-stat-label">{{ getDaysLabel() }}</span>
                </div>
              </div>

              <div class="social-actions">
                @if (event()?.status === 'published') {
                  <button class="rsvp-btn" (click)="toggleRsvp()">
                    <span>{{ isAttending() ? '✓' : '📅' }}</span>
                    <span>{{ isAttending() ? 'Attending' : 'RSVP' }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Meta Information -->
            <div class="meta-section">
              <h3 class="section-title">Event Information</h3>
              
              <div class="meta-item">
                <span class="meta-label">Created</span>
                <span class="meta-value">{{ getSafeDateDisplay(event()!.createdAt) }}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Last Updated</span>
                <span class="meta-value">{{ getSafeDateDisplay(event()!.updatedAt) }}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Event ID</span>
                <span class="meta-value event-id">{{ event()!.id }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .event-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }

    /* Loading and Error States */
    .loading-state, .error-state {
      text-align: center;
      padding: 60px 20px;
      min-height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .error-state h2 {
      color: #dc3545;
      margin-bottom: 10px;
    }

    .back-btn {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #0056b3;
    }

    /* Hero Section */
    .event-hero {
      position: relative;
      height: 400px;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 30px;
    }

    .hero-image {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .hero-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .placeholder-icon {
      font-size: 80px;
      opacity: 0.3;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%);
    }

    .hero-actions {
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-2px);
    }

    .edit-btn {
      background: rgba(0, 123, 255, 0.9);
      color: white;
    }

    .edit-btn:hover {
      background: rgba(0, 123, 255, 1);
    }

    .share-btn {
      background: rgba(40, 167, 69, 0.9);
      color: white;
    }

    .share-btn:hover {
      background: rgba(40, 167, 69, 1);
    }

    /* Event Header */
    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding: 0 20px;
    }

    .title-section {
      flex: 1;
    }

    .event-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: #333;
      line-height: 1.2;
    }


    /* Event Details Grid */
    .event-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      padding: 0 20px;
    }

    .info-section, .ai-section, .social-section, .meta-section {
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: #333;
      border-bottom: 2px solid #f1f3f4;
      padding-bottom: 10px;
    }

    /* Info Items */
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-item.description-item {
      align-items: flex-start;
    }

    .info-icon {
      font-size: 20px;
      width: 24px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-content {
      flex: 1;
    }

    .info-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 16px;
      color: #333;
      line-height: 1.5;
    }

    .description-text {
      margin: 0;
      white-space: pre-wrap;
    }

    .website-link {
      color: #007bff;
      text-decoration: none;
    }

    .website-link:hover {
      text-decoration: underline;
    }

    /* AI Section */
    .ai-stats {
      space-y: 15px;
    }

    .ai-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .ai-stat-label {
      font-weight: 600;
      color: #666;
    }

    .ai-stat-value {
      font-weight: 700;
      color: #333;
    }

    .confidence-bar {
      position: relative;
      width: 120px;
      height: 20px;
      background: #f1f3f4;
      border-radius: 10px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%);
      transition: width 0.3s ease;
    }

    .confidence-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .raw-text-section {
      margin-top: 20px;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 600;
      color: #007bff;
      cursor: pointer;
    }

    .raw-text-content {
      margin-top: 10px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .raw-text-content pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 12px;
      color: #666;
    }

    /* Social Section */
    .social-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .social-stat {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .social-stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #007bff;
      margin-bottom: 5px;
    }

    .social-stat-label {
      font-size: 14px;
      color: #666;
    }

    .social-actions {
      display: flex;
      gap: 10px;
    }

    .rsvp-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
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

    .rsvp-btn:hover {
      background: #1e7e34;
      transform: translateY(-2px);
    }

    /* Meta Section */
    .meta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f1f3f4;
    }

    .meta-label {
      font-weight: 600;
      color: #666;
    }

    .meta-value {
      color: #333;
    }

    .event-id {
      font-family: monospace;
      font-size: 14px;
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .event-detail-container {
        padding: 10px;
      }

      .event-hero {
        height: 300px;
        margin-bottom: 20px;
      }

      .hero-actions {
        top: 10px;
        right: 10px;
        gap: 5px;
      }

      .action-btn {
        padding: 6px 12px;
        font-size: 12px;
      }

      .action-btn span:last-child {
        display: none;
      }

      .event-header {
        flex-direction: column;
        gap: 15px;
        padding: 0 10px;
      }

      .event-title {
        font-size: 2rem;
      }

      .event-details-grid {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 0 10px;
      }

      .info-section, .ai-section, .social-section, .meta-section {
        padding: 20px;
      }

      .social-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EventDetailComponent implements OnInit {
  // Services
  private eventStore = inject(EventStore);
  private authStore = inject(AuthStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Signals
  readonly event = signal<Event | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showRawText = signal(false);

  // Auth
  readonly user = this.authStore.user;

  // Computed values
  readonly canEdit = computed(() => {
    const currentUser = this.user();
    const currentEvent = this.event();
    return currentUser && currentEvent && 
           (currentEvent.createdBy === currentUser.uid || currentEvent.ownerId === currentUser.uid);
  });

  readonly attendeeCount = computed(() => {
    const attendeeIds = this.event()?.attendeeIds;
    return Array.isArray(attendeeIds) ? attendeeIds.length : 0;
  });

  readonly isAttending = computed(() => {
    const currentUser = this.user();
    const currentEvent = this.event();
    return currentUser && currentEvent && 
           currentEvent.attendeeIds.includes(currentUser.uid);
  });

  readonly daysUntilEvent = computed(() => {
    const currentEvent = this.event();
    if (!currentEvent) return 0;
    
    const now = new Date();
    const eventDate = toDate(currentEvent.date);
    if (!eventDate) return 0;
    
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  });

  ngOnInit() {
    this.loadEvent();
  }

  private async loadEvent() {
    try {
      this.loading.set(true);
      this.error.set(null);
      
      // Get the ID parameter (could be an actual ID or a slug)
      const idOrSlug = this.route.snapshot.paramMap.get('id');
      
      if (!idOrSlug) {
        this.error.set('Event identifier is required');
        return;
      }

      console.log('[EventDetail] 🔍 Looking for event with identifier:', idOrSlug);

      let event: Event | null = null;
      
      // First try as an ID (most common case for existing events)
      if (idOrSlug.startsWith('event_')) {
        console.log('[EventDetail] 🆔 Treating as event ID');
        event = await this.eventStore.fetchEventById(idOrSlug);
      } else {
        // Try as a slug first, fallback to ID
        console.log('[EventDetail] 🏷️ Treating as potential slug');
        event = await this.eventStore.fetchEventBySlug(idOrSlug);
        if (!event) {
          console.log('[EventDetail] 🆔 Slug not found, trying as ID');
          event = await this.eventStore.fetchEventById(idOrSlug);
        }
      }

      if (event) {
        console.log('[EventDetail] 📋 Event loaded successfully:');
        console.log('[EventDetail] 🆔 Event ID:', event.id);
        console.log('[EventDetail] 📝 Event Title:', event.title);
        console.log('[EventDetail] 🏷️ Event Slug:', event.slug || 'NO SLUG');
        console.log('[EventDetail] 📊 Event Status:', event.status);
        console.log('[EventDetail] 🧪 Is Mock Event:', event.isMockEvent || false);
        console.log('[EventDetail] 📅 Event date field:', event.date);
        console.log('[EventDetail] 📅 Event date type:', typeof event.date);
        console.log('[EventDetail] 🕒 Event createdAt field:', event.createdAt);
        console.log('[EventDetail] 🕒 Event createdAt type:', typeof event.createdAt);
        console.log('[EventDetail] 🕒 Event updatedAt field:', event.updatedAt);
        console.log('[EventDetail] 🕒 Event updatedAt type:', typeof event.updatedAt);
        if (event.scannedAt) {
          console.log('[EventDetail] 🤖 Event scannedAt field:', event.scannedAt);
          console.log('[EventDetail] 🤖 Event scannedAt type:', typeof event.scannedAt);
        }
        console.log('[EventDetail] 🔍 Full Raw Event Data (JSON):');
        console.log(JSON.stringify(event, null, 2));
        this.event.set(event);
      } else {
        this.error.set('Event not found');
      }
    } catch (err) {
      this.error.set('Failed to load event details');
      console.error('Error loading event:', err);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  editEvent() {
    const currentEvent = this.event();
    if (currentEvent) {
      // TODO: Navigate to edit page
      console.log('Edit event:', currentEvent.id);
    }
  }

  shareEvent() {
    const currentEvent = this.event();
    if (!currentEvent) return;

    if (navigator.share) {
      navigator.share({
        title: currentEvent.title,
        text: currentEvent.description,
        url: window.location.href
      });
    } else {
      // Fallback: Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  }

  toggleRawText() {
    this.showRawText.set(!this.showRawText());
  }

  async toggleRsvp() {
    const currentEvent = this.event();
    const currentUser = this.user();
    
    if (!currentEvent || !currentUser) return;

    try {
      if (this.isAttending()) {
        await this.eventStore.removeAttendee(currentEvent.id, currentUser.uid);
      } else {
        await this.eventStore.addAttendee(currentEvent.id, currentUser.uid);
      }
      
      // Reload event to get updated attendee list
      await this.loadEvent();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  }

  getSafeDateDisplay(timestamp: unknown): string {
    const date = toDate(timestamp);
    if (!date) {
      // During development, show raw data for debugging
      if (timestamp) {
        console.warn('[EventDetail] Invalid timestamp:', timestamp);
        return `Invalid Date (Raw: ${JSON.stringify(timestamp)})`;
      }
      return 'No date available';
    }
    
    return this.formatEventDate(date);
  }

  getDaysLabel(): string {
    const days = this.daysUntilEvent();
    if (days === 0) return 'Today';
    if (days === 1) return 'Day Left';
    if (days > 1) return 'Days Left';
    if (days === -1) return 'Day Ago';
    return 'Days Ago';
  }

  formatEventDate(date: Date): string {
    const eventDate = date;
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };

    const formatted = eventDate.toLocaleDateString('en-US', options);

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