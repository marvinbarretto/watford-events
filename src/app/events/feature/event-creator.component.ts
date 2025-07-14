import { Component, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '@shared/data-access/base.component';
import { LLMService } from '@shared/data-access/llm.service';
import { EventInferenceService } from '../data-access/event-inference.service';
import { VenueLookupService } from '@shared/data-access/venue-lookup.service';
import { TypeaheadComponent, TypeaheadOption } from '@shared/ui/typeahead/typeahead.component';
import { VenueSelectComponent } from '@shared/ui/venue-select/venue-select.component';
import { EventData, EventExtractionResult } from '@shared/utils/event-extraction-types';
import { EventModel, EventCategory, createEventDefaults } from '../utils/event.model';
import { Venue } from '../../venues/utils/venue.model';
import { AuthService } from '../../auth/data-access/auth.service';
import { EventStore } from '../data-access/event.store';
import { IconComponent } from '@shared/ui/icon/icon.component';

interface SimpleEventForm {
  title: string;
  location: string;
  venueId?: string;
  date: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-event-creator',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, VenueSelectComponent, IconComponent],
  template: `
    <div class="event-creator">
      <!-- Header -->
      <header class="page-header">
        <button class="back-btn" (click)="goBack()" type="button">
          <app-icon name="arrow_back" size="sm" />
          <span class="back-text">Back</span>
        </button>

        <div class="header-info">
          <h1 class="page-title">{{ pageTitle() }}</h1>
          <p class="page-subtitle">Quick and simple event creation</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">

        <!-- Flyer Upload Section -->
        <section class="flyer-upload-section">
          <button class="upload-flyer-btn"
                  [class.processing]="isProcessing()"
                  (click)="handleFlyerUpload()"
                  type="button">
            @if (isProcessing()) {
              <div class="btn-spinner"></div>
              <span>Scanning flyer...</span>
            } @else if (uploadedFlyer()) {
              <span class="btn-icon">✅</span>
              <span>Flyer scanned successfully!</span>
            } @else {
              <span class="btn-icon">📸</span>
              <span>Upload Flyer</span>
            }
          </button>

          @if (uploadedFlyer()) {
            <div class="flyer-preview">
              <img [src]="uploadedFlyer()" alt="Uploaded flyer">
              <button class="remove-flyer-btn" (click)="removeFlyer()" type="button" aria-label="Remove flyer">
                <app-icon name="close" size="sm" />
              </button>
            </div>
          }

          <input #fileInput
                 type="file"
                 accept="image/*"
                 capture="environment"
                 (change)="onFileSelected($event)"
                 style="display: none;">
        </section>

        <!-- Event Form -->
        <section class="event-form-section">
          <form class="event-form" [formGroup]="eventForm" (ngSubmit)="proceedToConfirmation()">

            <!-- Question 1: What's it called? -->
            <div class="form-field">
              <label class="field-label">What's it called?</label>
              <input class="field-input"
                     [class.field-error]="titleError"
                     [class.llm-populated]="llmPopulatedFields().has('title')"
                     type="text"
                     formControlName="title"
                     placeholder="e.g., Jazz Night at The Globe">


              @if (inferredEventType()) {
                <div class="inference-hint">
                  <span class="hint-icon">{{ getEventTypeIcon(inferredEventType()!) }}</span>
                  <span class="hint-text">Looks like a {{ inferredEventType() }} event</span>
                </div>
              }
            </div>

            <!-- Question 2: Where is it? -->
            <div class="form-field">
              <label class="field-label">Where is it?</label>

              <app-venue-select
                formControlName="venue"
                [hasError]="locationError"
                [isLlmPopulated]="llmPopulatedFields().has('location')"
                (venueSelected)="onVenueSelectedFromComponent($event)"
                (locationChanged)="onLocationChanged($event)"
                (venueCleared)="onVenueCleared()"
              ></app-venue-select>
            </div>

            <!-- Question 3: When is it? -->
            <div class="form-field">
              <label class="field-label">When is it?</label>
              <input class="field-input"
                     [class.field-error]="dateError"
                     [class.llm-populated]="llmPopulatedFields().has('date')"
                     type="date"
                     formControlName="date">


              <!-- Smart date suggestions -->
              @if (!eventForm.get('date')?.value) {
                <div class="date-suggestions">
                  <button class="date-suggestion-btn"
                          (click)="selectDateSuggestion('today')"
                          type="button">
                    Today
                  </button>
                  <button class="date-suggestion-btn"
                          (click)="selectDateSuggestion('tomorrow')"
                          type="button">
                    Tomorrow
                  </button>
                  <button class="date-suggestion-btn"
                          (click)="selectDateSuggestion('this-friday')"
                          type="button">
                    This {{ getUpcomingDayName('friday') }}
                  </button>
                  <button class="date-suggestion-btn"
                          (click)="selectDateSuggestion('this-saturday')"
                          type="button">
                    This {{ getUpcomingDayName('saturday') }}
                  </button>
                </div>
              }

              @if (eventForm.get('date')?.value) {
                <div class="time-selection-group">
                  <label class="time-group-label">What time?</label>
                  <div class="time-row">
                  <div class="time-slot-container">
                    @if (showStartTimeInput()) {
                      <label class="time-slot-label">Start time</label>
                      <input class="time-slot time-input"
                             [class.field-error]="timeError"
                             [class.llm-populated]="llmPopulatedFields().has('startTime')"
                             type="time"
                             formControlName="startTime"
                             placeholder="Start time"
                             #startTimeInput>
                    } @else {
                      <button class="time-slot time-slot-btn"
                              [class.field-error]="timeError"
                              (click)="selectStartTime()"
                              type="button">
                        Start time?
                      </button>
                    }
                  </div>

                  <!-- Right slot: All day, End time button, or End time input -->
                  <div class="time-slot-container">
                    @if (eventForm.get('isAllDay')?.value) {
                      <div class="time-slot all-day-indicator">
                        <span class="all-day-text">All day</span>
                      </div>
                    } @else if (showEndTimeInput()) {
                      <label class="time-slot-label">End time</label>
                      <input class="time-slot time-input"
                             [class.field-error]="endTimeError"
                             type="time"
                             formControlName="endTime"
                             placeholder="End time"
                             #endTimeInput>
                    } @else if (showStartTimeInput() && eventForm.get('startTime')?.value) {
                      <button class="time-slot time-slot-btn end-time-btn"
                              (click)="toggleEndTime()"
                              type="button">
                        + End time?
                      </button>
                    } @else {
                      <button class="time-slot time-slot-btn"
                              [class.field-error]="timeError"
                              (click)="selectAllDay()"
                              type="button">
                        All day
                      </button>
                    }
                  </div>
                </div>
                </div>

              }
            </div>

            <!-- Continue Button -->
            <button class="create-event-btn"
                    type="submit">
              Continue
            </button>

          </form>
        </section>


      </main>
    </div>
  `,
  styles: [`
    .event-creator {
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

    /* Removed experiment badge */

    /* Main Content */
    .main-content {
      padding: 1.5rem;
      max-width: 500px;
      margin: 0 auto;
    }

    /* Flyer Upload Section */
    .flyer-upload-section {
      margin-bottom: 2rem;
    }

    .upload-flyer-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: var(--primary);
      color: var(--on-primary);
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 56px; /* 44px minimum + padding */
    }

    .upload-flyer-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .upload-flyer-btn.processing {
      background: var(--accent);
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 1.25rem;
    }

    .btn-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid var(--on-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .flyer-preview {
      position: relative;
      margin-top: 1rem;
      border-radius: 8px;
      overflow: hidden;
    }

    .flyer-preview img {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: 8px;
    }

    .remove-flyer-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Event Form */
    .event-form-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
    }

    .form-field {
      margin-bottom: 1.5rem;
    }

    .form-field:last-child {
      margin-bottom: 0;
    }

    .field-label {
      display: block;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.75rem;
    }

    .field-input {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      background: var(--background);
      color: var(--text);
      transition: border-color 0.2s, background 0.3s;
      min-height: 56px; /* Ensures 44px minimum touch target */
      box-sizing: border-box;
      position: relative;
    }

    .field-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .field-input::placeholder {
      color: var(--text-secondary);
    }

    .field-input.field-error {
      border-color: var(--error);
    }

    .field-input.field-error:focus {
      border-color: var(--error);
      box-shadow: 0 0 0 2px rgba(var(--error-rgb), 0.2);
    }

    /* Inference Hint */
    .inference-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--success);
      color: var(--background);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .hint-icon {
      font-size: 1rem;
    }

    /* Error styling is handled by .field-error class on inputs */

    /* LLM Populated Fields */
    .field-input.llm-populated,
    .time-input.llm-populated {
      background: var(--primary-lighter, rgba(99, 102, 241, 0.08));
      border-color: var(--primary);
      position: relative;
      animation: llmGlow 0.5s ease-out;
    }

    @keyframes llmGlow {
      0% {
        background: var(--primary-lighter, rgba(99, 102, 241, 0.15));
        box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
      }
      100% {
        background: var(--primary-lighter, rgba(99, 102, 241, 0.08));
        box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
      }
    }

    .field-input.llm-populated::after,
    .time-input.llm-populated::after {
      content: '✨';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      opacity: 0.7;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-50%) scale(0.8); }
      to { opacity: 0.7; transform: translateY(-50%) scale(1); }
    }

    /* Date Suggestions */
    .date-suggestions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }

    .date-suggestion-btn {
      padding: 0.5rem 1rem;
      background: var(--background);
      border: 2px solid var(--border);
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      min-height: 44px; /* Ensure minimum touch target */
    }

    .date-suggestion-btn:hover {
      border-color: var(--primary);
      background: var(--background-lightest);
      color: var(--primary);
      transform: translateY(-1px);
    }

    /* Venue Select Component Styles (component handles its own styling) */

    /* Time Selection Group */
    .time-selection-group {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--background);
      border-radius: 12px;
      border: 1px solid var(--border);
      transition: all 0.2s;
    }

    .time-selection-group:hover {
      border-color: var(--primary-lighter, rgba(99, 102, 241, 0.3));
    }

    .time-group-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
    }

    /* Time Row - 2 Column Layout */
    .time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      min-height: 72px; /* Increased to accommodate labels */
    }

    .time-slot-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-height: 72px;
    }

    .time-slot-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin: 0;
      padding: 0 0.5rem;
      line-height: 1;
      opacity: 0;
      transform: translateY(-4px);
      transition: all 0.2s ease;
    }

    .time-slot-container:has(.time-input) .time-slot-label {
      opacity: 1;
      transform: translateY(0);
    }

    .time-slot {
      min-height: 56px;
      max-height: 56px; /* Enforce consistent height */
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      flex: 1;
    }

    /* Time Slot Buttons */
    .time-slot-btn {
      background: var(--background-lighter);
      border: 2px solid var(--border);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      padding: 0.875rem 1rem;
      width: 100%;
      height: 56px; /* Fixed height */
      transition: all 0.2s;
    }

    .time-slot-btn:hover {
      border-color: var(--primary);
      background: var(--background-lightest);
      transform: translateY(-1px);
    }

    .time-slot-btn.field-error {
      border-color: var(--error);
    }

    .time-slot-btn.field-error:hover {
      border-color: var(--error);
    }

    .end-time-btn {
      border-style: dashed;
      color: var(--text-secondary);
    }

    .end-time-btn:hover {
      border-style: solid;
      color: var(--primary);
    }

    /* Time Slot Inputs */
    .time-input {
      padding: 0.875rem 1rem;
      border: 2px solid var(--border);
      background: var(--background);
      color: var(--text);
      font-size: 0.875rem;
      font-weight: 500;
      text-align: center;
      width: 100%;
      height: 56px; /* Fixed height to match buttons */
      transform: scale(1);
      opacity: 1;
    }

    .time-input:focus {
      outline: none;
      border-color: var(--primary);
      background: var(--background-lightest);
      transform: scale(1.02);
    }

    /* All Day Indicator */
    .all-day-indicator {
      background: var(--primary);
      border: 2px solid var(--primary);
      color: var(--on-primary);
      width: 100%;
      height: 56px; /* Fixed height to match other elements */
      transition: all 0.2s;
    }

    .all-day-indicator:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    .all-day-text {
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* Create Button */
    .create-event-btn {
      width: 100%;
      padding: 1rem 1.5rem;
      background: var(--success);
      color: var(--background);
      border: none;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 56px;
      margin-top: 1rem;
    }

    .create-event-btn:hover {
      background: var(--success-hover);
      transform: translateY(-1px);
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

      .page-title {
        font-size: 1.25rem;
      }

      .field-input {
        padding: 1rem;
        font-size: 16px; /* Prevents zoom on iOS */
      }

      .time-row {
        gap: 0.5rem;
      }

      .time-row {
        min-height: 68px;
      }

      .time-slot-container {
        min-height: 68px;
      }

      .time-slot {
        min-height: 52px;
        max-height: 52px;
      }

      .time-slot-btn, .time-input {
        font-size: 0.8rem;
        padding: 0.75rem 0.5rem;
        height: 52px;
      }

      .time-slot-label {
        font-size: 0.7rem;
      }

      /* Date suggestions mobile */
      .date-suggestions {
        gap: 0.375rem;
      }

      .date-suggestion-btn {
        padding: 0.375rem 0.75rem;
        font-size: 0.8rem;
        min-height: 40px;
      }
    }
  `]
})
export class EventCreatorComponent extends BaseComponent implements OnDestroy {
  // Services
  protected readonly llmService = inject(LLMService);
  protected readonly inferenceService = inject(EventInferenceService);
  protected readonly venueLookupService = inject(VenueLookupService);
  protected readonly authService = inject(AuthService);
  protected readonly eventStore = inject(EventStore);
  private readonly fb = inject(FormBuilder);

  // Reactive Form
  eventForm!: FormGroup;

  // Form state (keeping for compatibility with existing code)
  readonly formData = signal<SimpleEventForm>({
    title: '',
    location: '',
    venueId: undefined,
    date: '',
    isAllDay: false,
    startTime: '',
    endTime: ''
  });

  // Upload state
  readonly isProcessing = signal(false);
  readonly uploadedFlyer = signal<string | null>(null);

  // Smart suggestions
  readonly inferredEventType = signal<string | null>(null);
  readonly inferredDuration = signal<number | null>(null);
  readonly inferredCategories = signal<EventCategory[]>([]);
  readonly selectedVenue = signal<Venue | null>(null);

  // Venue inference
  readonly inferredVenueMatch = signal<Venue | null>(null);
  readonly venueInferenceType = signal<'close-match' | 'new-venue' | null>(null);
  readonly venueInferenceMessage = signal<string>('');

  // UI state
  readonly showStartTimeInput = signal(false);
  readonly showEndTimeInput = signal(false);
  readonly submitAttempted = signal(false);
  readonly llmPopulatedFields = signal<Set<string>>(new Set());


  // Venue typeahead functions
  readonly venueSearchFunction = (query: string) => this.venueLookupService.searchVenues(query);
  readonly venueDisplayFunction = (venue: Venue) => this.venueLookupService.displayVenue(venue);
  readonly venueCompareFunction = (a: Venue, b: Venue) => this.venueLookupService.compareVenues(a, b);

  // Computed values - simplified for streamlined layout
  // showStartTimeInput and showEndTimeInput are used directly in template

  readonly showSmartSuggestions = computed(() => {
    return !!(this.inferredDuration() || this.inferredCategories().length > 0);
  });

  readonly showVenueInference = computed(() => {
    return !!(this.venueInferenceType() && this.venueInferenceMessage() && !this.selectedVenue());
  });

  // Dynamic page title based on event name
  readonly pageTitle = computed(() => {
    const title = this.eventForm?.get('title')?.value;
    if (title && title.trim()) {
      // Truncate long titles
      const truncated = title.length > 30 ? title.substring(0, 27) + '...' : title;
      return `Creating: ${truncated}`;
    }
    return 'Create Event';
  });

  // Reactive form error getters
  get titleError() {
    const control = this.eventForm.get('title');
    return control?.invalid && (control?.dirty || this.submitAttempted());
  }

  get titleErrorMessage() {
    const control = this.eventForm.get('title');
    if (control?.hasError('required')) return 'Please enter an event title';
    if (control?.hasError('minlength')) return 'Event title must be at least 3 characters';
    return '';
  }

  get locationError(): boolean {
    const control = this.eventForm.get('location');
    return !!(control?.invalid && (control?.dirty || this.submitAttempted()));
  }

  get locationErrorMessage() {
    const control = this.eventForm.get('location');
    if (control?.hasError('required')) return 'Please enter an event location';
    return '';
  }

  get dateError() {
    const control = this.eventForm.get('date');
    return control?.invalid && (control?.dirty || this.submitAttempted());
  }

  get dateErrorMessage() {
    const control = this.eventForm.get('date');
    if (control?.hasError('required')) return 'Please select an event date';
    if (control?.hasError('dateInPast')) return 'Event date cannot be in the past';
    return '';
  }

  get timeError() {
    const isAllDay = this.eventForm.get('isAllDay')?.value;
    const startTime = this.eventForm.get('startTime')?.value;
    const startTimeControl = this.eventForm.get('startTime');

    return !isAllDay && !startTime && (startTimeControl?.dirty || this.submitAttempted());
  }

  get timeErrorMessage() {
    return 'Please select a start time or choose all day';
  }

  get endTimeError() {
    const control = this.eventForm.get('endTime');
    return control?.invalid && (control?.dirty || this.submitAttempted());
  }

  get endTimeErrorMessage() {
    const control = this.eventForm.get('endTime');
    if (control?.hasError('endTimeBeforeStart')) return 'End time must be after start time';
    return '';
  }

  // Custom Validators
  private dateNotInPastValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate < today ? { dateInPast: true } : null;
  }

  private endTimeAfterStartValidator(control: AbstractControl): ValidationErrors | null {
    const parent = control.parent;
    if (!parent) return null;

    const startTime = parent.get('startTime')?.value;
    const endTime = control.value;

    if (!startTime || !endTime) return null;

    const startDate = new Date(`2000-01-01T${startTime}`);
    const endDate = new Date(`2000-01-01T${endTime}`);

    return endDate <= startDate ? { endTimeBeforeStart: true } : null;
  }

  // Lifecycle
  protected override onInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    // Subscriptions automatically cleaned up by BaseComponent's takeUntilDestroyed
  }

  private initializeForm(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      location: ['', Validators.required],
      venueId: [''],
      venue: [null], // New venue control for VenueSelectComponent
      date: ['', [Validators.required, this.dateNotInPastValidator]],
      isAllDay: [false],
      startTime: [''],
      endTime: ['', this.endTimeAfterStartValidator]
    });
  }

  private setupFormSubscriptions(): void {
    // Title changes for inference
    this.eventForm.get('title')?.valueChanges
      .pipe(this.untilDestroyed)
      .subscribe(title => {
        if (title && typeof title === 'string' && title.length > 3) {
          this.runInference(title);
        }
      });

    // Location changes for venue clearing
    this.eventForm.get('location')?.valueChanges
      .pipe(this.untilDestroyed)
      .subscribe(location => {
        // Clear selected venue if user is typing a custom location
        if (this.selectedVenue() && typeof location === 'string' && location !== this.selectedVenue()!.name) {
          this.selectedVenue.set(null);
        }
      });

    // Sync reactive form with signal (for compatibility)
    this.eventForm.valueChanges
      .pipe(this.untilDestroyed)
      .subscribe(value => {
        if (value && typeof value === 'object') {
          this.formData.set({
            title: (value as any).title || '',
            location: (value as any).location || '',
            venueId: (value as any).venueId || undefined,
            date: (value as any).date || '',
            isAllDay: (value as any).isAllDay || false,
            startTime: (value as any).startTime || '',
            endTime: (value as any).endTime || ''
          });
        }
      });
  }

  // Navigation
  goBack() {
    this.onlyOnBrowser(() => {
      const window = this.platform.getWindow();
      window?.history.back();
    });
  }

  // Flyer upload
  handleFlyerUpload() {
    this.onlyOnBrowser(() => {
      const document = this.platform.getDocument();
      const fileInput = document?.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput?.click();
    });
  }

  async onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      await this.processFlyer(input.files[0]);
    }
  }

  async processFlyer(file: File) {
    if (!file.type.startsWith('image/')) {
      this.showError('Please select an image file');
      return;
    }

    this.isProcessing.set(true);

    try {
      // Create preview URL (SSR-safe)
      const imageUrl = this.onlyOnBrowser(() => {
        const window = this.platform.getWindow();
        return window && 'URL' in window ? (window as any).URL.createObjectURL(file) : undefined;
      });

      if (imageUrl) {
        this.uploadedFlyer.set(imageUrl);
      }

      // Extract data with LLM
      const result = await this.llmService.extractEventFromImage(file);

      if (result.success && result.eventData) {
        const data = result.eventData;

        console.log('🔍 LLM Extracted Data:', {
          title: data.title,
          location: data.location,
          originalDate: data.date,
          parsedDate: data.parsedDate,
          parsedStartTime: data.parsedStartTime,
          parsedEndTime: data.parsedEndTime,
          parsedIsAllDay: data.parsedIsAllDay,
          venueId: data.venueId,
          rawResult: result
        });

        const patchValues = {
          title: data.title || '',
          location: data.location || '',
          venueId: data.venueId || '',
          date: data.parsedDate || '',
          isAllDay: data.parsedIsAllDay || false,
          startTime: data.parsedStartTime || '',
          endTime: data.parsedEndTime || ''
        };

        console.log('📝 Patching form with values:', patchValues);
        
        // Patch the form
        this.eventForm.patchValue(patchValues);

        // If we have a venue ID, we need to set the venue control with the proper object
        if (data.venueId && result.matchedVenue) {
          this.selectedVenue.set(result.matchedVenue);
          this.eventForm.patchValue({
            venue: {
              venue: result.matchedVenue,
              location: result.matchedVenue.name,
              venueId: result.matchedVenue.id
            }
          });
        }

        // Track which fields were populated by LLM
        const populatedFields = new Set<string>();
        if (patchValues.title) populatedFields.add('title');
        if (patchValues.location) populatedFields.add('location');
        if (patchValues.date) populatedFields.add('date');
        if (patchValues.startTime) populatedFields.add('startTime');
        if (patchValues.endTime) populatedFields.add('endTime');
        this.llmPopulatedFields.set(populatedFields);

        // Clear LLM populated fields after animation
        setTimeout(() => {
          this.llmPopulatedFields.set(new Set());
        }, 2000);

        console.log('📋 Form values after patch:', this.eventForm.value);
        console.log('✅ Form valid?', this.eventForm.valid);
        console.log('❌ Form errors:', this.eventForm.errors);
        
        // Log individual field states
        Object.keys(this.eventForm.controls).forEach(key => {
          const control = this.eventForm.get(key);
          console.log(`📌 Field "${key}":`, {
            value: control?.value,
            valid: control?.valid,
            errors: control?.errors,
            touched: control?.touched,
            dirty: control?.dirty
          });
        });

        // Show start time if we extracted a time
        if (data.parsedStartTime) {
          this.showStartTimeInput.set(true);
        }

        // Run inference on the extracted title
        this.runInference(data.title);

        // Always proceed to confirmation with extraction results
        // Proceed immediately to confirmation
        console.log('⏰ Proceeding to confirmation with LLM data');
        this.proceedToConfirmationWithLLMData(result);
      }
    } catch (error) {
      console.error('Error processing flyer:', error);
      this.showError('Error processing the flyer. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  removeFlyer() {
    const flyerUrl = this.uploadedFlyer();
    if (flyerUrl) {
      this.onlyOnBrowser(() => {
        const window = this.platform.getWindow();
        if (window && 'URL' in window) {
          (window as any).URL.revokeObjectURL(flyerUrl);
        }
      });
    }
    this.uploadedFlyer.set(null);
  }


  // New methods for VenueSelectComponent
  onVenueSelectedFromComponent(venue: Venue) {
    console.log('🏢 Venue selected from component:', venue);
    
    this.selectedVenue.set(venue);
    this.eventForm.patchValue({
      location: venue.name,
      venueId: venue.id
    });
  }

  onLocationChanged(location: string) {
    console.log('🔍 Location changed:', location);
    
    this.eventForm.patchValue({
      location: location,
      venueId: this.selectedVenue()?.id || undefined
    });
  }

  onVenueCleared() {
    console.log('🗑️ Venue cleared');
    
    this.selectedVenue.set(null);
    this.eventForm.patchValue({
      location: '',
      venueId: undefined
    });
  }

  // Keep the old methods for backward compatibility
  onVenueSelected(option: TypeaheadOption<Venue>) {
    console.log('🏢 Venue selected:', option);

    const venue = option.value;
    this.selectedVenue.set(venue);
    this.clearVenueInference(); // Clear inference when venue is selected

    this.eventForm.patchValue({
      location: venue.name,
      venueId: venue.id
    });
  }

  onLocationSearchChanged(query: string) {
    console.log('🔍 Location search changed:', query);

    // Update form data with the typed location
    this.eventForm.patchValue({
      location: query,
      venueId: undefined // Clear venue ID when typing custom location
    });

    // Clear selected venue if user is typing a custom location
    if (this.selectedVenue() && query !== this.selectedVenue()!.name) {
      this.selectedVenue.set(null);
    }

    // Trigger venue inference for unrecognized venues
    this.runVenueInference(query);
  }

  clearVenue() {
    this.selectedVenue.set(null);
    this.clearVenueInference();
    this.eventForm.patchValue({
      location: '',
      venueId: undefined
    });
  }

  private clearVenueInference() {
    this.inferredVenueMatch.set(null);
    this.venueInferenceType.set(null);
    this.venueInferenceMessage.set('');
  }


  // Time option handlers - streamlined
  selectStartTime() {
    this.showStartTimeInput.set(true);
    this.showEndTimeInput.set(false);
    this.eventForm.patchValue({
      isAllDay: false,
      endTime: '' // Clear end time when switching to start time
    });

    // Auto-focus and trigger time picker in next tick (SSR-safe)
    this.onlyOnBrowser(() => {
      setTimeout(() => {
        const document = this.platform.getDocument();
        const startTimeInput = document?.querySelector('input[formControlName="startTime"]') as HTMLInputElement;
        if (startTimeInput) {
          startTimeInput.focus();
          startTimeInput.click(); // Trigger native time picker
        }
      }, 0);
    });
  }

  selectAllDay() {
    this.showStartTimeInput.set(false);
    this.showEndTimeInput.set(false);
    this.eventForm.patchValue({
      isAllDay: true,
      startTime: '',
      endTime: ''
    });
  }



  toggleEndTime() {
    if (this.showEndTimeInput()) {
      // Hide end time input and clear value
      this.showEndTimeInput.set(false);
      this.eventForm.patchValue({ endTime: '' });
    } else {
      // Show end time input
      this.showEndTimeInput.set(true);

      // Auto-focus and trigger time picker in next tick (SSR-safe)
      this.onlyOnBrowser(() => {
        setTimeout(() => {
          const document = this.platform.getDocument();
          const endTimeInput = document?.querySelector('input[formControlName="endTime"]') as HTMLInputElement;
          if (endTimeInput) {
            endTimeInput.focus();
            endTimeInput.click(); // Trigger native time picker
          }
        }, 0);
      });
    }
  }

  // Smart suggestions
  runInference(title: string) {
    const inference = this.inferenceService.inferFromEventName(title);

    this.inferredEventType.set(this.getEventTypeFromCategories(inference.categories));
    this.inferredDuration.set(inference.defaultDuration);
    this.inferredCategories.set(inference.categories);
  }

  private async runVenueInference(query: string) {
    // Clear previous inference
    this.clearVenueInference();

    // Skip inference if query is too short or if venue is already selected
    if (!query || query.length < 3 || this.selectedVenue()) {
      return;
    }

    try {
      const analysis = await this.venueLookupService.analyzeVenueInput(query);
      
      if (analysis.type === 'close-match' && analysis.venue) {
        this.inferredVenueMatch.set(analysis.venue);
        this.venueInferenceType.set('close-match');
        this.venueInferenceMessage.set(analysis.message);
      } else if (analysis.type === 'new-venue' && analysis.message) {
        this.inferredVenueMatch.set(null);
        this.venueInferenceType.set('new-venue');
        this.venueInferenceMessage.set(analysis.message);
      }
      // For exact matches, we don't show inference as the venue should appear in typeahead
    } catch (error) {
      console.error('Error running venue inference:', error);
      this.clearVenueInference();
    }
  }


  // Navigate to confirmation page
  proceedToConfirmation() {
    console.log('🎯 proceedToConfirmation called (regular submission)');
    console.log('📊 Form state before validation:', {
      value: this.eventForm.value,
      valid: this.eventForm.valid
    });

    // Set submit attempted flag to show validation errors
    this.submitAttempted.set(true);

    // Check for time validation (not handled by reactive forms directly)
    const isAllDay = this.eventForm.get('isAllDay')?.value;
    const startTime = this.eventForm.get('startTime')?.value;

    console.log('⏰ Time validation:', { isAllDay, startTime, willFailTimeCheck: !isAllDay && !startTime });

    if (!isAllDay && !startTime) {
      console.log('❌ Failed time validation - no start time and not all day');
      // Time validation error will be shown via submitAttempted flag
      return;
    }

    // Only proceed if form is valid
    if (!this.eventForm.valid) {
      console.log('❌ Form invalid, not proceeding');
      return;
    }

    console.log('✅ All validation passed, proceeding to confirmation');

    const formData = this.eventForm.value;

    // Prepare event data for confirmation page
    const eventData = {
      // From form
      title: formData.title.trim(),
      date: formData.date,
      // Only include time fields if they have values (avoid undefined)
      ...(formData.startTime && { startTime: formData.startTime }),
      ...(formData.endTime && { endTime: formData.endTime }),
      isAllDay: formData.isAllDay,
      location: formData.location.trim(),
      // Only include venueId if it has a value
      ...(formData.venueId && { venueId: formData.venueId }),

      // From inference
      categories: this.inferredCategories(),

      // Additional context for confirmation page
      selectedVenue: this.selectedVenue(),
      uploadedFlyer: this.uploadedFlyer(),
      inferredEventType: this.inferredEventType(),
      inferredDuration: this.inferredDuration()
    };

    console.log('Proceeding to confirmation with data:', eventData);

    // Navigate to confirmation page with event data
    this.router.navigate(['/events/create/confirm'], {
      state: { eventData }
    });
  }

  // Utility methods
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

  getEventTypeFromCategories(categories: EventCategory[]): string | null {
    if (categories.length === 0) return null;
    return categories[0]; // Use the first category as the primary type
  }

  getVenueInferenceIcon(): string {
    const type = this.venueInferenceType();
    switch (type) {
      case 'close-match':
        return '📍';
      case 'new-venue':
        return '🏢';
      default:
        return '📍';
    }
  }

  getCategoryLabel(category: EventCategory): string {
    const labels: Record<EventCategory, string> = {
      music: 'Music',
      sports: 'Sports',
      arts: 'Arts',
      community: 'Community',
      education: 'Education',
      food: 'Food',
      nightlife: 'Nightlife',
      theatre: 'Theatre',
      comedy: 'Comedy',
      family: 'Family',
      business: 'Business',
      charity: 'Charity',
      outdoor: 'Outdoor',
      other: 'Other'
    };
    return labels[category] || category;
  }

  // Venue selection utilities removed - now handled by TypeaheadComponent and VenueLookupService

  extractDateFromString(dateString: string): string {
    console.log('📅 extractDateFromString called with:', dateString);
    if (!dateString) {
      console.log('  ❌ Empty dateString, returning empty string');
      return '';
    }
    try {
      const date = new Date(dateString);
      const result = date.toISOString().split('T')[0];
      console.log('  ✅ Extracted date:', result);
      return result;
    } catch (error) {
      console.log('  ❌ Error parsing date:', error);
      return '';
    }
  }

  extractTimeFromString(dateString: string): string {
    console.log('⏰ extractTimeFromString called with:', dateString);
    if (!dateString) {
      console.log('  ❌ Empty dateString, returning empty string');
      return '';
    }
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const result = `${hours}:${minutes}`;
      console.log('  ✅ Extracted time:', result);
      return result;
    } catch (error) {
      console.log('  ❌ Error parsing time:', error);
      return '';
    }
  }

  // Date suggestion methods
  selectDateSuggestion(suggestion: 'today' | 'tomorrow' | 'this-friday' | 'this-saturday') {
    const date = this.getDateForSuggestion(suggestion);
    this.eventForm.patchValue({ date });
  }

  private getDateForSuggestion(suggestion: 'today' | 'tomorrow' | 'this-friday' | 'this-saturday'): string {
    const today = new Date();

    switch (suggestion) {
      case 'today':
        return today.toISOString().split('T')[0];

      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];

      case 'this-friday':
        return this.getNextDayOfWeek(today, 5).toISOString().split('T')[0]; // Friday = 5

      case 'this-saturday':
        return this.getNextDayOfWeek(today, 6).toISOString().split('T')[0]; // Saturday = 6

      default:
        return today.toISOString().split('T')[0];
    }
  }

  private getNextDayOfWeek(date: Date, targetDay: number): Date {
    const result = new Date(date);
    const currentDay = result.getDay();

    // Calculate days until target day
    let daysUntilTarget = targetDay - currentDay;

    // If target day is today or has passed this week, get next week's occurrence
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }

    result.setDate(result.getDate() + daysUntilTarget);
    return result;
  }

  getUpcomingDayName(day: 'friday' | 'saturday'): string {
    const today = new Date();
    const targetDay = day === 'friday' ? 5 : 6;
    const nextOccurrence = this.getNextDayOfWeek(today, targetDay);

    // Check if it's this week or next week
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)

    const nextOccurrenceWeekStart = new Date(nextOccurrence);
    nextOccurrenceWeekStart.setDate(nextOccurrence.getDate() - nextOccurrence.getDay());

    const isThisWeek = currentWeekStart.getTime() === nextOccurrenceWeekStart.getTime();

    return isThisWeek ? day.charAt(0).toUpperCase() + day.slice(1) : `${day.charAt(0).toUpperCase() + day.slice(1)}`;
  }

  // Helper method to get human-readable error messages for a field
  private getFieldErrorMessages(fieldName: string, control: AbstractControl): string[] {
    const messages: string[] = [];
    const errors = control.errors;
    
    if (!errors) return messages;

    switch (fieldName) {
      case 'title':
        if (errors['required']) messages.push('Title is required');
        if (errors['minlength']) messages.push(`Title must be at least ${errors['minlength'].requiredLength} characters`);
        break;
      case 'location':
        if (errors['required']) messages.push('Location is required');
        break;
      case 'date':
        if (errors['required']) messages.push('Date is required');
        if (errors['dateInPast']) messages.push('Date cannot be in the past');
        break;
      case 'startTime':
        if (errors['required']) messages.push('Start time is required');
        break;
      case 'endTime':
        if (errors['endTimeBeforeStart']) messages.push('End time must be after start time');
        break;
      default:
        messages.push(`${fieldName} is invalid`);
    }

    return messages;
  }

  // Auto-proceed helper methods
  private proceedToConfirmationWithLLMData(extractionResult: EventExtractionResult) {
    console.log('🚀 proceedToConfirmationWithLLMData called');
    console.log('📊 Current form state:', {
      value: this.eventForm.value,
      valid: this.eventForm.valid,
      errors: this.eventForm.errors
    });

    // Log individual field validation states
    console.log('🔍 Field validation states:');
    Object.keys(this.eventForm.controls).forEach(key => {
      const control = this.eventForm.get(key);
      console.log(`  ${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        validators: control?.hasError('required') ? 'has required error' : 'no required error'
      });
    });

    // Check time validation separately
    const isAllDay = this.eventForm.get('isAllDay')?.value;
    const startTime = this.eventForm.get('startTime')?.value;
    console.log('⏰ Time validation check:', { isAllDay, startTime, needsTime: !isAllDay && !startTime });

    // Validate form first
    if (!this.eventForm.valid) {
      console.log('❌ Form not valid, not auto-proceeding');
      
      // Detailed validation error breakdown
      const invalidFields: string[] = [];
      const fieldErrors: Record<string, any> = {};
      
      Object.keys(this.eventForm.controls).forEach(fieldName => {
        const control = this.eventForm.get(fieldName);
        if (control && control.invalid) {
          invalidFields.push(fieldName);
          fieldErrors[fieldName] = {
            errors: control.errors,
            value: control.value,
            errorMessages: this.getFieldErrorMessages(fieldName, control)
          };
        }
      });

      // Check time validation separately (custom validation)
      if (!isAllDay && !startTime) {
        invalidFields.push('time');
        fieldErrors['time'] = {
          error: 'timeRequired',
          message: 'Either select a start time or mark as all day event'
        };
      }

      console.log('📝 Form validation details:', {
        invalidFieldCount: invalidFields.length,
        invalidFields: invalidFields,
        fieldErrors: fieldErrors,
        formErrors: this.eventForm.errors,
        isValid: this.eventForm.valid
      });

      console.log('❗ Validation failures:');
      invalidFields.forEach(field => {
        console.log(`  - ${field}: ${JSON.stringify(fieldErrors[field])}`);
      });

      return;
    }

    const formData = this.eventForm.value;
    const data = extractionResult.eventData;

    // Guard against null data
    if (!data) {
      console.log('❌ No event data extracted, not auto-proceeding');
      return;
    }

    console.log('✅ Form is valid, proceeding with navigation');

    // Prepare enhanced event data with LLM extraction results
    const eventData = {
      // From form (basic details)
      title: formData.title.trim(),
      date: formData.date,
      ...(formData.startTime && { startTime: formData.startTime }),
      ...(formData.endTime && { endTime: formData.endTime }),
      isAllDay: formData.isAllDay,
      location: formData.location.trim(),
      ...(formData.venueId && { venueId: formData.venueId }),

      // From LLM extraction (additional details)
      ...(data.description && data.description !== 'Not found' && { description: data.description }),
      ...(data.organizer && data.organizer !== 'Not found' && { organizer: data.organizer }),
      ...(data.ticketInfo && data.ticketInfo !== 'Not found' && { ticketInfo: data.ticketInfo }),
      ...(data.contactInfo && data.contactInfo !== 'Not found' && { contactInfo: data.contactInfo }),
      ...(data.website && data.website !== 'Not found' && { website: data.website }),
      ...(data.tags && data.tags.length > 0 && { tags: data.tags }),

      // Categories from inference
      categories: this.inferredCategories(),

      // LLM metadata
      llmExtracted: true,
      extractionConfidence: extractionResult.confidence,
      
      // Additional context for confirmation page
      selectedVenue: this.selectedVenue(),
      uploadedFlyer: this.uploadedFlyer(),
      inferredEventType: this.inferredEventType(),
      inferredDuration: this.inferredDuration()
    };

    console.log('Auto-proceeding to confirmation with enhanced data:', eventData);

    // Navigate to confirmation page with enhanced event data
    this.router.navigate(['/events/create/confirm'], {
      state: { eventData }
    });
  }
}
