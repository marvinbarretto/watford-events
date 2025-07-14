import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { EventStore } from '../data-access/event.store';
import { EventModel, EventType, RecurrenceRule, RECURRENCE_FREQUENCIES, DAYS_OF_WEEK } from '../utils/event.model';
import { VenueLookupService } from '../../shared/data-access/venue-lookup.service';
import { TypeaheadComponent, TypeaheadOption } from '../../shared/ui/typeahead/typeahead.component';
import { Venue } from '../../venues/utils/venue.model';

@Component({
  selector: 'app-add-event',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, TypeaheadComponent],
  template: `
    <div class="add-event-container">
      <!-- Header -->
      <div class="header">
        <button class="back-btn" (click)="goBack()">
          <span class="back-arrow">←</span>
          <span>Back</span>
        </button>
        <h1>Add New Event</h1>
      </div>

      <!-- Alternative Method Links -->
      <div class="alternative-method">
        <p>Want an easier way? Try our smart input methods!</p>
        <div class="smart-options">
          <button class="smart-btn primary" (click)="useNaturalLanguage()">
            💬 Just describe your event
          </button>
          <div class="scanner-options">
            <button class="scanner-btn" (click)="useCameraInstead()">
              📸 Use Camera
            </button>
            <button class="scanner-btn" (click)="uploadPhotoInstead()">
              📂 Upload Photo
            </button>
          </div>
        </div>
        <input
          #fileInput
          type="file"
          accept="image/*"
          style="display: none"
          (change)="onFileSelected($event)"
        />
      </div>

      <!-- Manual Form -->
      <form [formGroup]="eventForm" (ngSubmit)="saveEvent()">
        <!-- Essential Fields Section -->
        <section class="form-section essential">
          <h2>Event Details</h2>

          <!-- Title -->
          <div class="form-group">
            <label for="title">Event Title *</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              class="form-control large"
              placeholder="What's the event called?"
            />
            @if (eventForm.get('title')?.invalid && eventForm.get('title')?.touched) {
              <div class="error-message">Event title is required</div>
            }
          </div>

          <!-- Date & Time Row -->
          <div class="form-row">
            <div class="form-group">
              <label for="date">Date *</label>
              <input
                id="date"
                type="date"
                formControlName="date"
                class="form-control large"
              />
              @if (eventForm.get('date')?.invalid && eventForm.get('date')?.touched) {
                <div class="error-message">Date is required</div>
              }
            </div>

            <div class="form-group">
              <label for="time">Time *</label>
              <input
                id="time"
                type="time"
                formControlName="time"
                class="form-control large"
              />
              @if (eventForm.get('time')?.invalid && eventForm.get('time')?.touched) {
                <div class="error-message">Time is required</div>
              }
            </div>
          </div>

          <!-- Location -->
          <div class="form-group">
            <label for="location">Location *</label>
            <div class="location-input-container">
              <!-- Venue Selection -->
              <app-typeahead
                formControlName="venue"
                placeholder="Search for a venue or enter custom location"
                [inputClass]="'form-control large'"
                [searchFunction]="searchVenues"
                [displayFunction]="displayVenue"
                [compareFunction]="compareVenues"
                (selectedOption)="onVenueSelected($event)"
              />

              <!-- Custom Location Input (shows when no venue selected) -->
              @if (!selectedVenue()) {
                <input
                  type="text"
                  formControlName="location"
                  class="form-control large custom-location"
                  placeholder="Or enter a custom location"
                />
              }
            </div>

            @if (selectedVenue()) {
              <div class="selected-venue-info">
                <strong>{{ selectedVenue()?.name }}</strong>
                <div class="venue-details">{{ selectedVenue()?.address }}</div>
                <button type="button" class="btn-clear-venue" (click)="clearVenue()">
                  Use custom location instead
                </button>
              </div>
            }

            @if (getLocationError()) {
              <div class="error-message">{{ getLocationError() }}</div>
            }
          </div>
        </section>

        <!-- Event Type & Recurrence Section -->
        <section class="form-section recurrence">
          <h2>Event Schedule</h2>

          <!-- Event Type Selection -->
          <div class="form-group">
            <label>Event Type *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input
                  type="radio"
                  formControlName="eventType"
                  value="single"
                  name="eventType"
                />
                <span class="radio-custom"></span>
                <span class="radio-label">One-time event</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  formControlName="eventType"
                  value="recurring"
                  name="eventType"
                />
                <span class="radio-custom"></span>
                <span class="radio-label">Recurring event</span>
              </label>
            </div>
          </div>

          <!-- Recurrence Options (shown when recurring is selected) -->
          @if (showRecurrenceSection()) {
            <div class="recurrence-options">
              <!-- Frequency and Interval -->
              <div class="form-row">
                <div class="form-group">
                  <label for="recurrenceFrequency">Repeats</label>
                  <select
                    id="recurrenceFrequency"
                    formControlName="recurrenceFrequency"
                    class="form-control"
                  >
                    @for (freq of recurrenceFrequencies; track freq.value) {
                      <option [value]="freq.value">{{ freq.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="recurrenceInterval">Every</label>
                  <input
                    id="recurrenceInterval"
                    type="number"
                    formControlName="recurrenceInterval"
                    class="form-control"
                    min="1"
                    max="52"
                  />
                </div>
              </div>

              <!-- Days of Week (for weekly recurrence) -->
              @if (eventForm.get('recurrenceFrequency')?.value === 'weekly') {
                <div class="form-group">
                  <label>Days of Week</label>
                  <div class="days-of-week">
                    @for (day of daysOfWeek; track day.value) {
                      <label class="day-checkbox">
                        <input
                          type="checkbox"
                          [value]="day.value"
                          (change)="onDayOfWeekChange(day.value, $event)"
                        />
                        <span class="day-label">{{ day.short }}</span>
                      </label>
                    }
                  </div>
                </div>
              }

              <!-- End Condition -->
              <div class="form-group">
                <label>Ends</label>
                <div class="radio-group">
                  <label class="radio-option">
                    <input
                      type="radio"
                      formControlName="recurrenceEndType"
                      value="never"
                      name="recurrenceEndType"
                    />
                    <span class="radio-custom"></span>
                    <span class="radio-label">Never</span>
                  </label>
                  <label class="radio-option">
                    <input
                      type="radio"
                      formControlName="recurrenceEndType"
                      value="date"
                      name="recurrenceEndType"
                    />
                    <span class="radio-custom"></span>
                    <span class="radio-label">On date</span>
                  </label>
                  <label class="radio-option">
                    <input
                      type="radio"
                      formControlName="recurrenceEndType"
                      value="count"
                      name="recurrenceEndType"
                    />
                    <span class="radio-custom"></span>
                    <span class="radio-label">After</span>
                  </label>
                </div>
              </div>

              <!-- End Date (shown when "On date" is selected) -->
              @if (eventForm.get('recurrenceEndType')?.value === 'date') {
                <div class="form-group">
                  <label for="recurrenceEndDate">End Date</label>
                  <input
                    id="recurrenceEndDate"
                    type="date"
                    formControlName="recurrenceEndDate"
                    class="form-control"
                  />
                </div>
              }

              <!-- Occurrence Count (shown when "After" is selected) -->
              @if (eventForm.get('recurrenceEndType')?.value === 'count') {
                <div class="form-group">
                  <label for="recurrenceOccurrences">Number of occurrences</label>
                  <input
                    id="recurrenceOccurrences"
                    type="number"
                    formControlName="recurrenceOccurrences"
                    class="form-control"
                    min="1"
                    max="365"
                  />
                </div>
              }
            </div>
          }
        </section>

        <!-- Optional Details Section -->
        <section class="form-section optional">
          <button
            type="button"
            class="section-toggle"
            (click)="toggleOptionalSection()"
          >
            <span>More Details</span>
            <span class="toggle-icon">{{ showOptionalSection() ? '−' : '+' }}</span>
          </button>

          @if (showOptionalSection()) {
            <div class="optional-fields">
              <!-- Description -->
              <div class="form-group">
                <label for="description">Description</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-control"
                  rows="3"
                  placeholder="Tell people about your event..."
                ></textarea>
              </div>

              <!-- Organizer -->
              <div class="form-group">
                <label for="organizer">Organizer</label>
                <input
                  id="organizer"
                  type="text"
                  formControlName="organizer"
                  class="form-control"
                  placeholder="Who's organizing this event?"
                />
              </div>

              <!-- Ticket Info -->
              <div class="form-group">
                <label for="ticketInfo">Ticket Information</label>
                <input
                  id="ticketInfo"
                  type="text"
                  formControlName="ticketInfo"
                  class="form-control"
                  placeholder="Free, £10, tickets from..."
                />
              </div>

              <!-- Contact Info -->
              <div class="form-group">
                <label for="contactInfo">Contact Information</label>
                <input
                  id="contactInfo"
                  type="text"
                  formControlName="contactInfo"
                  class="form-control"
                  placeholder="Phone, email, or contact details"
                />
              </div>

              <!-- Website -->
              <div class="form-group">
                <label for="website">Website/Social Media</label>
                <input
                  id="website"
                  type="text"
                  formControlName="website"
                  class="form-control"
                  placeholder="Website or social media links"
                />
              </div>
            </div>
          }
        </section>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="saveDraft()" [disabled]="isSaving()">
            Save as Draft
          </button>
          <button type="submit" class="btn-primary" [disabled]="!canPublish() || isSaving()">
            {{ isSaving() ? 'Publishing...' : 'Publish Event' }}
          </button>
        </div>
      </form>

      <!-- Error Display -->
      @if (error()) {
        <div class="error-banner">
          <p>{{ error() }}</p>
          <button class="dismiss-btn" (click)="clearError()">Dismiss</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .add-event-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      background: var(--background);
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      font-size: 16px;
      color: var(--primary);
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .back-btn:hover {
      background: var(--background-lighter);
    }

    .back-arrow {
      font-size: 20px;
    }

    .header h1 {
      margin: 0;
      color: var(--text);
      font-size: 24px;
      font-weight: 600;
    }

    /* Alternative Method */
    .alternative-method {
      background: var(--secondary);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }

    .alternative-method p {
      margin: 0 0 15px 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .smart-options {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .smart-btn {
      background: var(--primary);
      color: var(--on-primary);
      border: none;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
    }

    .smart-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .scanner-options {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .scanner-btn {
      background: var(--background-lighter);
      color: var(--text);
      border: 2px solid var(--border);
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
      max-width: 140px;
    }

    .scanner-btn:hover {
      border-color: var(--primary);
      background: var(--background);
      transform: translateY(-1px);
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 30px;
    }

    .form-section.essential {
      background: var(--background);
      padding: 0;
    }

    .form-section.recurrence {
      background: var(--background-lighter);
      border-radius: 8px;
      padding: 20px;
      border: 2px solid var(--border);
    }

    .form-section.optional {
      background: var(--background-lighter);
      border-radius: 8px;
      padding: 20px;
    }

    .form-section h2 {
      margin: 0 0 20px 0;
      color: var(--text);
      font-size: 18px;
      font-weight: 600;
    }

    /* Section Toggle */
    .section-toggle {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: none;
      border: none;
      padding: 0 0 20px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
    }

    .toggle-icon {
      font-size: 20px;
      color: var(--primary);
    }

    .optional-fields {
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--text);
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid var(--border);
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
      background: var(--background);
      color: var(--text);
    }

    .form-control.large {
      padding: 16px;
      font-size: 16px;
      font-weight: 500;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-control::placeholder {
      color: var(--text-secondary);
    }

    /* Radio Buttons */
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .radio-option:hover {
      background: var(--background-lighter);
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
      font-size: 14px;
      color: var(--text);
      font-weight: 500;
    }

    /* Recurrence Options */
    .recurrence-options {
      margin-top: 20px;
      padding: 20px;
      background: var(--background);
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    /* Days of Week */
    .days-of-week {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .day-checkbox {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      padding: 8px 12px;
      border: 2px solid var(--border);
      border-radius: 6px;
      transition: all 0.2s;
      min-width: 45px;
    }

    .day-checkbox:hover {
      border-color: var(--primary);
      background: var(--background-lighter);
    }

    .day-checkbox input[type="checkbox"] {
      display: none;
    }

    .day-checkbox input[type="checkbox"]:checked + .day-label {
      color: var(--primary);
      font-weight: 600;
    }

    .day-checkbox:has(input[type="checkbox"]:checked) {
      border-color: var(--primary);
      background: var(--primary);
    }

    .day-checkbox:has(input[type="checkbox"]:checked) .day-label {
      color: var(--on-primary);
    }

    .day-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      transition: all 0.2s;
    }

    /* Location Input */
    .location-input-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .custom-location {
      margin-top: 5px;
    }

    .selected-venue-info {
      padding: 12px;
      background: var(--secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-top: 8px;
    }

    .selected-venue-info strong {
      display: block;
      color: var(--text);
      margin-bottom: 4px;
    }

    .venue-details {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 8px;
    }

    .btn-clear-venue {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      text-decoration: underline;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 15px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid var(--border);
    }

    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 16px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 50px;
    }

    .btn-primary {
      background: var(--primary);
      color: var(--on-primary);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--secondary);
      color: var(--text);
      border: 2px solid var(--border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--background-lighter);
    }

    .btn-primary:disabled, .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Error Handling */
    .error-message {
      margin-top: 5px;
      color: var(--error);
      font-size: 14px;
      font-weight: 500;
    }

    .error-banner {
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--error-background);
      color: var(--error);
      padding: 15px 20px;
      border-radius: 6px;
      border: 1px solid var(--error);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      z-index: 2000;
      max-width: 90%;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .dismiss-btn {
      background: none;
      border: none;
      color: var(--error);
      text-decoration: underline;
      cursor: pointer;
      font-size: 14px;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .add-event-container {
        padding: 15px;
      }

      .header {
        margin-bottom: 20px;
      }

      .header h1 {
        font-size: 20px;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .form-actions {
        flex-direction: column;
        gap: 10px;
      }

      .alternative-method {
        padding: 15px;
        margin-bottom: 20px;
      }

      .scanner-options {
        flex-direction: column;
        gap: 8px;
      }

      .scanner-btn {
        max-width: none;
      }
    }

    @media (max-width: 480px) {
      .add-event-container {
        padding: 12px;
      }

      .form-control.large {
        padding: 14px;
      }
    }
  `]
})
export class AddEventComponent implements OnInit {
  // Services
  private eventStore = inject(EventStore);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private venueLookupService = inject(VenueLookupService);

  // State
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly showOptionalSection = signal(false);
  readonly selectedVenue = signal<Venue | null>(null);
  readonly showRecurrenceSection = signal(false);

  // Constants for templates
  readonly recurrenceFrequencies = RECURRENCE_FREQUENCIES;
  readonly daysOfWeek = DAYS_OF_WEEK;

  // Form
  eventForm: FormGroup;

  // Venue typeahead functions
  searchVenues = (query: string) => this.venueLookupService.searchVenues(query);
  displayVenue = (venue: Venue) => this.venueLookupService.displayVenue(venue);
  compareVenues = (a: Venue, b: Venue) => this.venueLookupService.compareVenues(a, b);

  constructor() {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      venue: [null],
      location: [''],
      organizer: [''],
      ticketInfo: [''],
      contactInfo: [''],
      website: [''],

      // Event type and recurrence
      eventType: ['single', Validators.required],
      recurrenceFrequency: ['weekly'],
      recurrenceInterval: [1, [Validators.min(1)]],
      recurrenceDaysOfWeek: [[]],
      recurrenceEndType: ['never'],
      recurrenceEndDate: [''],
      recurrenceOccurrences: [1, [Validators.min(1)]]
    });

    // Watch for event type changes to show/hide recurrence section
    this.eventForm.get('eventType')?.valueChanges.subscribe(value => {
      this.showRecurrenceSection.set(value === 'recurring');
    });
  }

  ngOnInit() {
    // Check for pre-filled data from navigation state
    const navigation = this.router.getCurrentNavigation();
    const prefillData = navigation?.extras?.state?.['prefillData'];

    if (prefillData) {
      console.log('[AddEvent] Pre-filling form with data:', prefillData);
      this.prefillFormFromData(prefillData);
    } else {
      // Set smart defaults
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      this.eventForm.patchValue({
        date: tomorrow.toISOString().split('T')[0],
        time: '19:00' // Default to 7 PM
      });
    }
  }

  private prefillFormFromData(data: any) {
    // Extract date and time from datetime string
    let dateValue = '';
    let timeValue = '';

    if (data.date) {
      try {
        const dateTime = new Date(data.date);
        dateValue = dateTime.toISOString().split('T')[0];
        timeValue = dateTime.toTimeString().slice(0, 5);
      } catch (e) {
        console.warn('Failed to parse date:', data.date);
      }
    }

    // Update the form with parsed data
    this.eventForm.patchValue({
      title: data.title || '',
      description: data.description || '',
      date: dateValue,
      time: timeValue,
      location: data.location || '',
      organizer: data.organizer || '',
      ticketInfo: data.ticketInfo || '',
      contactInfo: data.contactInfo || '',
      website: data.website || ''
    });

    // Handle categories and other complex fields
    if (data.categories && data.categories.length > 0) {
      // Categories would need to be handled in the UI if form supported them
      console.log('Categories to apply:', data.categories);
    }

    // Open optional section if we have optional data
    const hasOptionalData = data.organizer || data.ticketInfo || data.contactInfo || data.website;
    if (hasOptionalData) {
      this.showOptionalSection.set(true);
    }
  }

  // Methods
  toggleOptionalSection() {
    this.showOptionalSection.set(!this.showOptionalSection());
  }

  onVenueSelected(option: TypeaheadOption<Venue>) {
    this.selectedVenue.set(option.value);
    this.eventForm.patchValue({
      venue: option.value,
      location: ''
    });
  }

  clearVenue() {
    this.selectedVenue.set(null);
    this.eventForm.patchValue({
      venue: null,
      location: ''
    });
  }

  onDayOfWeekChange(dayValue: number, event: any) {
    const isChecked = event.target.checked;
    const currentDays = this.eventForm.get('recurrenceDaysOfWeek')?.value || [];

    let updatedDays: number[];
    if (isChecked) {
      updatedDays = [...currentDays, dayValue].sort();
    } else {
      updatedDays = currentDays.filter((day: number) => day !== dayValue);
    }

    this.eventForm.patchValue({ recurrenceDaysOfWeek: updatedDays });
  }

  getLocationError(): string | null {
    const hasVenue = this.selectedVenue() !== null;
    const hasLocation = this.eventForm.get('location')?.value?.trim();
    const locationTouched = this.eventForm.get('location')?.touched;
    const venueTouched = this.eventForm.get('venue')?.touched;

    if ((locationTouched || venueTouched) && !hasVenue && !hasLocation) {
      return 'Please select a venue or enter a custom location';
    }
    return null;
  }

  canPublish(): boolean {
    const hasVenue = this.selectedVenue() !== null;
    const hasLocation = this.eventForm.get('location')?.value?.trim();
    return this.eventForm.valid && (hasVenue || hasLocation);
  }

  async saveDraft() {
    await this.saveEventWithStatus('draft');
  }

  async saveEvent() {
    await this.saveEventWithStatus('published');
  }

  private async saveEventWithStatus(status: 'draft' | 'published') {
    if (!this.canPublish() && status === 'published') {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue = this.eventForm.value;

      // Combine date and time into a single Date object
      let eventDateTime: Date;
      if (formValue.date && formValue.time) {
        eventDateTime = new Date(`${formValue.date}T${formValue.time}`);
      } else if (formValue.date) {
        eventDateTime = new Date(formValue.date);
      } else {
        eventDateTime = new Date();
      }

      // Determine location data based on venue selection
      const selectedVenue = this.selectedVenue();
      const locationData = selectedVenue ? {
        location: selectedVenue.name,
        venueId: selectedVenue.id
      } : {
        location: formValue.location,
        venueId: undefined
      };

      // Build recurrence rule if this is a recurring event
      let recurrenceRule: RecurrenceRule | undefined;
      if (formValue.eventType === 'recurring') {
        const endCondition: RecurrenceRule['endCondition'] = {
          type: formValue.recurrenceEndType
        };

        if (formValue.recurrenceEndType === 'date' && formValue.recurrenceEndDate) {
          endCondition.endDate = new Date(formValue.recurrenceEndDate);
        } else if (formValue.recurrenceEndType === 'count') {
          endCondition.occurrences = formValue.recurrenceOccurrences || 1;
        }

        recurrenceRule = {
          frequency: formValue.recurrenceFrequency,
          interval: formValue.recurrenceInterval || 1,
          daysOfWeek: formValue.recurrenceFrequency === 'weekly' ? formValue.recurrenceDaysOfWeek : undefined,
          endCondition,
          exceptions: []
        };
      }

      const eventData = {
        title: formValue.title,
        description: formValue.description,
        date: eventDateTime.toISOString().split('T')[0],
        ...locationData,
        organizer: formValue.organizer,
        ticketInfo: formValue.ticketInfo,
        contactInfo: formValue.contactInfo,
        website: formValue.website,
        status,
        attendeeIds: [],
        eventType: formValue.eventType as EventType,
        recurrenceRule,
        isException: false
      };

      const savedEvent = await this.eventStore.createEvent(eventData);
      if (savedEvent) {
        this.router.navigate(['/events']);
      }
    } catch (error: any) {
      console.error('Save event failed:', error);
      this.error.set(error.message || 'Failed to save event');
    } finally {
      this.isSaving.set(false);
    }
  }

  // Navigation
  goBack() {
    this.router.navigate(['/events']);
  }

  useNaturalLanguage() {
    this.router.navigate(['/events/add/natural']);
  }

  useCameraInstead() {
    this.router.navigate(['/events/add/camera']);
  }

  uploadPhotoInstead() {
    // Trigger the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Navigate to camera component with the selected file
      // The camera component should handle both camera capture and file upload
      this.router.navigate(['/events/add/camera'], {
        state: { uploadedFile: file }
      });
    }
  }

  clearError() {
    this.error.set(null);
  }
}
