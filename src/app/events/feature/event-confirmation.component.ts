import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventStore } from '../data-access/event.store';
import { EventModel, EventCategory, EventType, RecurrenceRule, createEventDefaults, EVENT_CATEGORIES, RECURRENCE_FREQUENCIES, DAYS_OF_WEEK } from '../utils/event.model';
import { Venue } from '../../venues/utils/venue.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { EventCardComponent } from '../ui/event-card/event-card.component';
import { AuthService } from '../../auth/data-access/auth.service';

interface EventConfirmationData {
  // Basic event details from form
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location: string;
  venueId?: string;
  categories: EventCategory[];

  // Additional context from creator
  selectedVenue?: Venue | null;
  uploadedFlyer?: string | null;
  inferredEventType?: string | null;
  inferredDuration?: number | null;
}

interface AdditionalEventDetails {
  description: string;
  organizer: string;
  ticketInfo: string;
  contactInfo: string;
  website: string;
  tags: string[];
  additionalCategories: EventCategory[];

  // Event scheduling/recurrence
  eventType: EventType;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[];
  recurrenceEndType: 'never' | 'date' | 'count';
  recurrenceEndDate: string;
  recurrenceOccurrences: number;
}

@Component({
  selector: 'app-event-confirmation',
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, EventCardComponent],
  template: `
    <div class="event-confirmation">
      <!-- Header -->
      <header class="page-header">
        <button class="back-btn" (click)="goBack()" type="button">
          <app-icon name="arrow_back" size="sm" />
          <span class="back-text">Back to Edit</span>
        </button>

        <div class="header-info">
          <h1 class="page-title">Review & Create Event</h1>
          <p class="page-subtitle">Add details and confirm your event</p>
        </div>
      </header>

      <main class="main-content">
        @if (eventData()) {
          <!-- Event Details Section -->
          <section class="event-details-section">
            <h2 class="section-title">Event Details</h2>
            
            <!-- Editable Basic Details -->
            <div class="basic-details-form">
              <div class="form-group">
                <label for="title">Event Title</label>
                <input
                  id="title"
                  type="text"
                  [(ngModel)]="basicDetails().title"
                  class="form-input"
                  placeholder="Event title"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="date">Date</label>
                  <input
                    id="date"
                    type="date"
                    [(ngModel)]="basicDetails().date"
                    class="form-input"
                  />
                </div>
                
                <div class="form-group">
                  <label>
                    <input
                      type="checkbox"
                      [(ngModel)]="basicDetails().isAllDay"
                      (change)="onAllDayToggle()"
                    />
                    All Day Event
                  </label>
                </div>
              </div>

              @if (!basicDetails().isAllDay) {
                <div class="form-row">
                  <div class="form-group">
                    <label for="startTime">Start Time</label>
                    <input
                      id="startTime"
                      type="time"
                      [(ngModel)]="basicDetails().startTime"
                      class="form-input"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="endTime">End Time</label>
                    <input
                      id="endTime"
                      type="time"
                      [(ngModel)]="basicDetails().endTime"
                      class="form-input"
                    />
                  </div>
                </div>
              }

              <div class="form-group">
                <label for="location">Location</label>
                <input
                  id="location"
                  type="text"
                  [(ngModel)]="basicDetails().location"
                  class="form-input"
                  placeholder="Event location"
                />
              </div>
            </div>

            <!-- Event Card Preview -->
            <div class="event-preview">
              <h3 class="preview-title">Preview</h3>
              <app-event-card
                [event]="previewEvent()"
                [currentUserId]="currentUserId()"
              />
            </div>
          </section>

          <!-- Event Schedule Section -->
          <section class="schedule-section">
            <h2 class="section-title">Event Schedule</h2>
            
            <div class="form-group">
              <label>Event Type</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    type="radio"
                    [(ngModel)]="additionalDetails().eventType"
                    value="single"
                    name="eventType"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">One-time event</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    [(ngModel)]="additionalDetails().eventType"
                    value="recurring"
                    name="eventType"
                  />
                  <span class="radio-custom"></span>
                  <span class="radio-label">Recurring event</span>
                </label>
              </div>
            </div>

            @if (additionalDetails().eventType === 'recurring') {
              <div class="recurrence-options">
                <div class="form-row">
                  <div class="form-group">
                    <label for="frequency">Repeats</label>
                    <select
                      id="frequency"
                      [(ngModel)]="additionalDetails().recurrenceFrequency"
                      class="form-input"
                    >
                      @for (freq of recurrenceFrequencies; track freq.value) {
                        <option [value]="freq.value">{{ freq.label }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="interval">Every</label>
                    <input
                      id="interval"
                      type="number"
                      [(ngModel)]="additionalDetails().recurrenceInterval"
                      class="form-input"
                      min="1"
                      max="52"
                    />
                  </div>
                </div>

                @if (additionalDetails().recurrenceFrequency === 'weekly') {
                  <div class="form-group">
                    <label>Days of Week</label>
                    <div class="days-of-week">
                      @for (day of daysOfWeek; track day.value) {
                        <label class="day-checkbox">
                          <input
                            type="checkbox"
                            [value]="day.value"
                            [checked]="additionalDetails().recurrenceDaysOfWeek.includes(day.value)"
                            (change)="onDayOfWeekChange(day.value, $event)"
                          />
                          <span class="day-label">{{ day.short }}</span>
                        </label>
                      }
                    </div>
                  </div>
                }

                <div class="form-group">
                  <label>Ends</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input
                        type="radio"
                        [(ngModel)]="additionalDetails().recurrenceEndType"
                        value="never"
                        name="recurrenceEndType"
                      />
                      <span class="radio-custom"></span>
                      <span class="radio-label">Never</span>
                    </label>
                    <label class="radio-option">
                      <input
                        type="radio"
                        [(ngModel)]="additionalDetails().recurrenceEndType"
                        value="date"
                        name="recurrenceEndType"
                      />
                      <span class="radio-custom"></span>
                      <span class="radio-label">On date</span>
                    </label>
                    <label class="radio-option">
                      <input
                        type="radio"
                        [(ngModel)]="additionalDetails().recurrenceEndType"
                        value="count"
                        name="recurrenceEndType"
                      />
                      <span class="radio-custom"></span>
                      <span class="radio-label">After</span>
                    </label>
                  </div>
                </div>

                @if (additionalDetails().recurrenceEndType === 'date') {
                  <div class="form-group">
                    <label for="endDate">End Date</label>
                    <input
                      id="endDate"
                      type="date"
                      [(ngModel)]="additionalDetails().recurrenceEndDate"
                      class="form-input"
                    />
                  </div>
                }

                @if (additionalDetails().recurrenceEndType === 'count') {
                  <div class="form-group">
                    <label for="occurrences">Number of occurrences</label>
                    <input
                      id="occurrences"
                      type="number"
                      [(ngModel)]="additionalDetails().recurrenceOccurrences"
                      class="form-input"
                      min="1"
                      max="365"
                    />
                  </div>
                }
              </div>
            }
          </section>

          <!-- Additional Details Section -->
          <section class="additional-details-section">
            <h2 class="section-title">Additional Details</h2>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                [(ngModel)]="additionalDetails().description"
                class="form-textarea"
                rows="4"
                placeholder="Tell people about your event..."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="organizer">Organizer</label>
                <input
                  id="organizer"
                  type="text"
                  [(ngModel)]="additionalDetails().organizer"
                  class="form-input"
                  placeholder="Who's organizing this?"
                />
              </div>
              
              <div class="form-group">
                <label for="ticketInfo">Ticket Info</label>
                <input
                  id="ticketInfo"
                  type="text"
                  [(ngModel)]="additionalDetails().ticketInfo"
                  class="form-input"
                  placeholder="Free, £10, etc."
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="contactInfo">Contact Info</label>
                <input
                  id="contactInfo"
                  type="text"
                  [(ngModel)]="additionalDetails().contactInfo"
                  class="form-input"
                  placeholder="Phone, email, etc."
                />
              </div>
              
              <div class="form-group">
                <label for="website">Website</label>
                <input
                  id="website"
                  type="url"
                  [(ngModel)]="additionalDetails().website"
                  class="form-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div class="form-group">
              <label for="tags">Tags (comma-separated)</label>
              <input
                id="tags"
                type="text"
                [value]="additionalDetails().tags.join(', ')"
                (input)="onTagsChange($event)"
                class="form-input"
                placeholder="music, family-friendly, outdoor"
              />
            </div>
          </section>

          <!-- Action Buttons -->
          <section class="action-section">
            <div class="action-buttons">
              <button class="secondary-btn" type="button" (click)="goBack()">
                <app-icon name="arrow_back" size="sm" />
                Back to Edit
              </button>
              <button 
                class="primary-btn" 
                type="button" 
                (click)="createEvent()" 
                [disabled]="isCreating()">
                @if (isCreating()) {
                  <div class="btn-spinner"></div>
                  Creating...
                } @else {
                  <app-icon name="check" size="sm" />
                  Create Event
                }
              </button>
            </div>
          </section>
        } @else {
          <div class="no-data">
            <p>No event data found. Please go back and fill out the form.</p>
            <button class="primary-btn" (click)="goToCreator()">
              <app-icon name="add" size="sm" />
              Go to Event Creator
            </button>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .event-confirmation {
      min-height: 100vh;
      background: var(--background);
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--background-lighter);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .back-btn:hover {
      color: var(--primary);
      background: var(--background);
    }

    .header-info {
      flex: 1;
      text-align: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.875rem;
    }

    /* Main Content */
    .main-content {
      padding: 1.5rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    .section-subtitle {
      color: var(--text-secondary);
      margin: 0 0 1.5rem 0;
      font-size: 0.9rem;
    }

    /* Event Review Section */
    .event-review-section {
      margin-bottom: 2rem;
    }

    .event-preview {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
    }

    .event-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .event-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text);
      margin: 0;
      flex: 1;
    }

    .event-type-badge {
      background: var(--primary);
      color: var(--on-primary);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .meta-icon {
      font-size: 1rem;
      width: 1.25rem;
      text-align: center;
    }

    .meta-text {
      color: var(--text);
      font-size: 0.9rem;
    }

    .category-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .category-tag {
      background: var(--accent);
      color: var(--on-accent);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .flyer-preview {
      margin-top: 1rem;
      border-radius: 8px;
      overflow: hidden;
    }

    .flyer-image {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
    }

    /* Additional Details Form */
    .additional-details-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
    }

    /* Event Schedule Section */
    .event-schedule-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
    }

    .schedule-form {
      margin: 0;
    }

    /* Form Controls */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* Radio Button Styling */
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .radio-option:hover {
      background: var(--background);
    }

    .radio-option input[type="radio"] {
      display: none;
    }

    .radio-custom {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border);
      border-radius: 50%;
      position: relative;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .radio-option input[type="radio"]:checked + .radio-custom {
      border-color: var(--primary);
    }

    .radio-option input[type="radio"]:checked + .radio-custom::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: var(--primary);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .radio-label {
      font-size: 0.9rem;
      color: var(--text);
      font-weight: 500;
    }

    /* Recurrence Options */
    .recurrence-options {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: var(--background);
      border-radius: 8px;
      border: 1px solid var(--border);
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Days of Week */
    .days-of-week {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .day-checkbox {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      padding: 0.5rem 0.75rem;
      border: 2px solid var(--border);
      border-radius: 6px;
      transition: all 0.2s;
      min-width: 45px;
      background: var(--background-lighter);
    }

    .day-checkbox:hover {
      border-color: var(--primary);
      background: var(--background);
    }

    .day-checkbox input[type="checkbox"] {
      display: none;
    }

    .day-checkbox input[type="checkbox"]:checked + .day-label {
      color: var(--on-primary);
      font-weight: 600;
    }

    .day-checkbox:has(input[type="checkbox"]:checked) {
      border-color: var(--primary);
      background: var(--primary);
    }

    .day-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text);
      transition: all 0.2s;
    }

    /* Final Action Section */
    .final-action-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
    }

    .form-field {
      margin-bottom: 1.5rem;
    }

    .field-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .field-input, .field-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 0.9rem;
      background: var(--background);
      color: var(--text);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .field-input:focus, .field-textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .field-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .field-hint {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
    }

    .category-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .category-option:hover {
      background: var(--background);
    }

    .category-label {
      font-size: 0.9rem;
      color: var(--text);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .secondary-btn, .primary-btn {
      flex: 1;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .secondary-btn {
      background: var(--background);
      color: var(--text);
      border: 2px solid var(--border);
    }

    .secondary-btn:hover {
      background: var(--background-lighter);
      border-color: var(--primary);
    }

    .primary-btn {
      background: var(--success);
      color: var(--background);
    }

    .primary-btn:hover {
      background: var(--success-hover);
    }

    .primary-btn:disabled {
      background: var(--border);
      color: var(--text-secondary);
      cursor: not-allowed;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid var(--background);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* No Data */
    .no-data {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }

      .page-header {
        padding: 0.75rem 1rem;
      }

      .back-text {
        display: none;
      }

      .event-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .action-buttons {
        flex-direction: column;
      }

      .category-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .days-of-week {
        justify-content: center;
      }

      .day-checkbox {
        min-width: 40px;
        padding: 0.375rem 0.5rem;
      }

      .day-label {
        font-size: 0.75rem;
      }
    }
  `]
})
export class EventConfirmationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly eventStore = inject(EventStore);
  private readonly authService = inject(AuthService);

  // Event data from navigation state
  readonly eventData = signal<EventConfirmationData | null>(null);
  
  // Basic details that can be edited
  readonly basicDetails = signal<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    location: string;
  }>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    location: ''
  });
  
  // Current user ID for event card
  readonly currentUserId = computed(() => this.authService.user$$()?.uid || null);
  
  // Preview event for EventCardComponent
  readonly previewEvent = computed(() => {
    const basic = this.basicDetails();
    const original = this.eventData();
    
    if (!original) return this.createEmptyEvent();
    
    return {
      id: 'preview',
      title: basic.title || 'Untitled Event',
      description: '',
      date: basic.date || new Date().toISOString().split('T')[0],
      startTime: basic.isAllDay ? undefined : basic.startTime,
      endTime: basic.isAllDay ? undefined : basic.endTime,
      isAllDay: basic.isAllDay,
      location: basic.location || 'Location TBA',
      categories: original.categories || [],
      tags: [],
      status: 'draft' as const,
      eventType: 'single' as EventType,
      attendeeIds: [],
      createdBy: this.currentUserId() || 'unknown',
      ownerId: this.currentUserId() || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: original.uploadedFlyer || undefined,
      isMockEvent: false
    } as EventModel;
  });
  
  private createEmptyEvent(): EventModel {
    return {
      id: 'empty',
      title: 'New Event',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isAllDay: true,
      location: 'Location TBA',
      categories: [],
      tags: [],
      status: 'draft',
      eventType: 'single',
      attendeeIds: [],
      createdBy: this.currentUserId() || 'unknown',
      ownerId: this.currentUserId() || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      isMockEvent: false
    } as EventModel;
  }

  // Additional details form
  readonly additionalDetails = signal<AdditionalEventDetails>({
    description: '',
    organizer: '',
    ticketInfo: '',
    contactInfo: '',
    website: '',
    tags: [],
    additionalCategories: [],

    // Event scheduling defaults
    eventType: 'single',
    recurrenceFrequency: 'weekly',
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [],
    recurrenceEndType: 'never',
    recurrenceEndDate: '',
    recurrenceOccurrences: 1
  });

  // UI state
  readonly isCreating = signal(false);
  readonly showRecurrenceSection = computed(() => this.additionalDetails().eventType === 'recurring');
  tagsInput = '';

  // Constants for templates
  readonly recurrenceFrequencies = RECURRENCE_FREQUENCIES;
  readonly daysOfWeek = DAYS_OF_WEEK;

  // Available categories (excluding already selected ones)
  readonly availableCategories = computed(() => {
    const selected = this.eventData()?.categories || [];
    return EVENT_CATEGORIES.filter(cat => !selected.includes(cat.value));
  });

  ngOnInit() {
    // Get event data from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.eventData) {
      this.eventData.set(state.eventData);
      // Initialize basic details from eventData
      const data = state.eventData;
      this.basicDetails.set({
        title: data.title || '',
        date: data.date || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        isAllDay: data.isAllDay || false,
        location: data.location || ''
      });
    } else {
      // If no data, redirect to creator
      this.goToCreator();
    }
  }
  
  onAllDayToggle() {
    const basic = this.basicDetails();
    this.basicDetails.update(details => ({
      ...details,
      isAllDay: !basic.isAllDay,
      startTime: !basic.isAllDay ? '' : details.startTime,
      endTime: !basic.isAllDay ? '' : details.endTime
    }));
  }
  
  onTagsChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const tags = input.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    this.additionalDetails.update(details => ({
      ...details,
      tags
    }));
  }

  goBack() {
    this.router.navigate(['/events/create']);
  }

  goToCreator() {
    this.router.navigate(['/events/create']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(eventData: EventConfirmationData): string {
    if (eventData.isAllDay) {
      return 'All day';
    }

    if (eventData.startTime) {
      const start = eventData.startTime;
      const end = eventData.endTime;
      return end ? `${start} - ${end}` : `From ${start}`;
    }

    return 'Time TBA';
  }

  getEventTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      music: '🎵',
      quiz: '🧠',
      comedy: '😄',
      theatre: '🎭',
      sports: '⚽',
      food: '🍴',
      other: '📅'
    };
    return icons[type] || '📅';
  }

  getCategoryLabel(category: EventCategory): string {
    const categoryData = EVENT_CATEGORIES.find(cat => cat.value === category);
    return categoryData?.label || category;
  }

  updateTags(event: Event) {
    const input = event.target as HTMLInputElement;
    this.tagsInput = input.value;

    // Parse tags from comma-separated string
    const tags = input.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.additionalDetails.update(details => ({
      ...details,
      tags
    }));
  }

  isCategorySelected(category: EventCategory): boolean {
    return this.additionalDetails().additionalCategories.includes(category);
  }

  toggleCategory(category: EventCategory) {
    this.additionalDetails.update(details => {
      const categories = details.additionalCategories;
      const index = categories.indexOf(category);

      if (index > -1) {
        // Remove category
        return {
          ...details,
          additionalCategories: categories.filter(c => c !== category)
        };
      } else {
        // Add category
        return {
          ...details,
          additionalCategories: [...categories, category]
        };
      }
    });
  }

  // Event scheduling methods
  onEventTypeChange(eventType: EventType) {
    this.additionalDetails.update(details => ({
      ...details,
      eventType
    }));
  }

  onRecurrenceFrequencyChange(frequency: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    this.additionalDetails.update(details => ({
      ...details,
      recurrenceFrequency: frequency,
      // Clear days of week when switching away from weekly
      recurrenceDaysOfWeek: frequency === 'weekly' ? details.recurrenceDaysOfWeek : []
    }));
  }

  onRecurrenceIntervalChange(interval: number) {
    this.additionalDetails.update(details => ({
      ...details,
      recurrenceInterval: interval
    }));
  }

  onDayOfWeekChange(dayValue: number, event: any) {
    const isChecked = event.target.checked;
    this.additionalDetails.update(details => {
      const currentDays = details.recurrenceDaysOfWeek;
      let updatedDays: number[];

      if (isChecked) {
        updatedDays = [...currentDays, dayValue].sort();
      } else {
        updatedDays = currentDays.filter(day => day !== dayValue);
      }

      return {
        ...details,
        recurrenceDaysOfWeek: updatedDays
      };
    });
  }

  isDaySelected(dayValue: number): boolean {
    return this.additionalDetails().recurrenceDaysOfWeek.includes(dayValue);
  }

  onRecurrenceEndTypeChange(endType: 'never' | 'date' | 'count') {
    this.additionalDetails.update(details => ({
      ...details,
      recurrenceEndType: endType
    }));
  }

  onRecurrenceEndDateChange(endDate: string) {
    this.additionalDetails.update(details => ({
      ...details,
      recurrenceEndDate: endDate
    }));
  }

  onRecurrenceOccurrencesChange(occurrences: number) {
    this.additionalDetails.update(details => ({
      ...details,
      recurrenceOccurrences: occurrences
    }));
  }

  async createEvent() {
    const eventData = this.eventData();
    const basicData = this.basicDetails();
    if (!eventData) return;

    this.isCreating.set(true);

    try {
      const additionalData = this.additionalDetails();

      // Combine all categories
      const allCategories = [
        ...eventData.categories,
        ...additionalData.additionalCategories
      ];

      // Build recurrence rule if this is a recurring event
      let recurrenceRule: RecurrenceRule | undefined;
      if (additionalData.eventType === 'recurring') {
        const endCondition: RecurrenceRule['endCondition'] = {
          type: additionalData.recurrenceEndType
        };

        if (additionalData.recurrenceEndType === 'date' && additionalData.recurrenceEndDate) {
          endCondition.endDate = new Date(additionalData.recurrenceEndDate);
        } else if (additionalData.recurrenceEndType === 'count') {
          endCondition.occurrences = additionalData.recurrenceOccurrences || 1;
        }

        recurrenceRule = {
          frequency: additionalData.recurrenceFrequency,
          interval: additionalData.recurrenceInterval || 1,
          daysOfWeek: additionalData.recurrenceFrequency === 'weekly' ? additionalData.recurrenceDaysOfWeek : undefined,
          endCondition,
          exceptions: []
        };
      }

      // Create complete event data using edited basic details
      const completeEventData = {
        // Basic details from editable form (taking precedence)
        title: basicData.title || eventData.title,
        date: basicData.date || eventData.date,
        ...(basicData.startTime && !basicData.isAllDay && { startTime: basicData.startTime }),
        ...(basicData.endTime && !basicData.isAllDay && { endTime: basicData.endTime }),
        isAllDay: basicData.isAllDay,
        location: basicData.location || eventData.location,
        ...(eventData.venueId && { venueId: eventData.venueId }),

        // Additional details from confirmation form
        ...(additionalData.description && { description: additionalData.description }),
        ...(additionalData.organizer && { organizer: additionalData.organizer }),
        ...(additionalData.ticketInfo && { ticketInfo: additionalData.ticketInfo }),
        ...(additionalData.contactInfo && { contactInfo: additionalData.contactInfo }),
        ...(additionalData.website && { website: additionalData.website }),

        // Categories and tags
        categories: allCategories,
        tags: additionalData.tags,

        // Event scheduling
        eventType: additionalData.eventType,
        ...(recurrenceRule && { recurrenceRule }),

        // LLM metadata if available
        ...(eventData.uploadedFlyer && { imageUrl: eventData.uploadedFlyer }),
        ...(eventData.uploadedFlyer && { scannedAt: new Date() }),

        // Merge with defaults
        ...createEventDefaults(),

        // Ensure required fields are properly set
        attendeeIds: [],
        status: 'published' as const // Create as published since user confirmed
      };

      console.log('Creating event with full data:', completeEventData);

      // Create event using EventStore
      const createdEvent = await this.eventStore.createEvent(completeEventData);

      if (createdEvent) {
        console.log('Event created successfully:', createdEvent.id);
        // Navigate to the created event
        this.router.navigate(['/events', createdEvent.id]);
      } else {
        throw new Error('Failed to create event - no event returned');
      }

    } catch (error) {
      console.error('Error creating event:', error);

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('authenticated')) {
        alert('Please log in to create events');
      } else {
        alert('Failed to create event. Please try again.');
      }
    } finally {
      this.isCreating.set(false);
    }
  }
}
