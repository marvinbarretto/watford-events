import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LLMService } from '@shared/data-access/llm.service';
import { EventInferenceService } from '../data-access/event-inference.service';
import { VenueLookupService } from '@shared/data-access/venue-lookup.service';
import { TypeaheadComponent, TypeaheadOption } from '@shared/ui/typeahead/typeahead.component';
import { EventData } from '@shared/utils/event-extraction-types';
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
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TypeaheadComponent, IconComponent],
  template: `
    <div class="event-creator">
      <!-- Header -->
      <header class="page-header">
        <button class="back-btn" (click)="goBack()" type="button">
          <span class="back-icon">←</span>
          <span class="back-text">Back</span>
        </button>
        
        <div class="header-info">
          <h1 class="page-title">Create Event</h1>
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
              <span>Flyer scanned - details filled in</span>
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
          <form class="event-form" (ngSubmit)="proceedToConfirmation()">
            
            <!-- Question 1: What's it called? -->
            <div class="form-field">
              <label class="field-label">What's it called?</label>
              <input class="field-input" 
                     type="text"
                     name="title"
                     [(ngModel)]="formData().title"
                     (input)="onTitleChange($event)"
                     placeholder="e.g., Jazz Night at The Globe"
                     required>
              
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
              
              <!-- Show typeahead when no venue selected -->
              @if (!selectedVenue()) {
                <app-typeahead
                  class="venue-typeahead"
                  [placeholder]="'e.g., The Globe Theatre, Watford'"
                  [searchFunction]="venueSearchFunction"
                  [displayFunction]="venueDisplayFunction"
                  [compareFunction]="venueCompareFunction"
                  [debounceTime]="300"
                  [minSearchLength]="2"
                  [ariaLabel]="'Search for venue or enter custom location'"
                  (selectedOption)="onVenueSelected($event)"
                  (searchChanged)="onLocationSearchChanged($event)"
                  inputClass="field-input"
                  name="location"
                  #venueTypeahead
                ></app-typeahead>
              }
              
              <!-- Show venue tag when venue selected -->
              @if (selectedVenue()) {
                <div class="venue-tag">
                  <span class="venue-icon">📍</span>
                  <span class="venue-details">
                    <span class="venue-name">{{ selectedVenue()!.name }}</span>
                    <span class="venue-address">{{ selectedVenue()!.address }}</span>
                  </span>
                  <button class="remove-venue-btn" (click)="clearVenue()" type="button" aria-label="Clear venue">
                    <app-icon name="close" size="xs" />
                  </button>
                </div>
              }
            </div>

            <!-- Question 3: When is it? -->
            <div class="form-field">
              <label class="field-label">When is it?</label>
              <input class="field-input" 
                     type="date"
                     name="date"
                     [(ngModel)]="formData().date"
                     (change)="onDateChange($event)"
                     required>
              
              <!-- Smart date suggestions -->
              @if (!formData().date) {
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
              
              @if (formData().date) {
                <div class="time-row">
                  <!-- Left slot: Start time button or input -->
                  <div class="time-slot-container">
                    @if (showStartTimeInput()) {
                      <label class="time-slot-label">Start time</label>
                      <input class="time-slot time-input" 
                             type="time"
                             name="startTime"
                             [(ngModel)]="formData().startTime"
                             (input)="onStartTimeChange($event)"
                             placeholder="Start time"
                             #startTimeInput
                             required>
                    } @else {
                      <button class="time-slot time-slot-btn" 
                              (click)="selectStartTime()"
                              type="button">
                        Start time?
                      </button>
                    }
                  </div>
                  
                  <!-- Right slot: All day, End time button, or End time input -->
                  <div class="time-slot-container">
                    @if (formData().isAllDay) {
                      <div class="time-slot all-day-indicator">
                        <span class="all-day-text">All day</span>
                      </div>
                    } @else if (showEndTimeInput()) {
                      <label class="time-slot-label">End time</label>
                      <input class="time-slot time-input" 
                             type="time"
                             name="endTime"
                             [(ngModel)]="formData().endTime"
                             (input)="onEndTimeChange($event)"
                             placeholder="End time"
                             #endTimeInput>
                    } @else if (showStartTimeInput() && formData().startTime) {
                      <button class="time-slot time-slot-btn end-time-btn" 
                              (click)="toggleEndTime()"
                              type="button">
                        + End time?
                      </button>
                    } @else {
                      <button class="time-slot time-slot-btn" 
                              (click)="selectAllDay()"
                              type="button">
                        All day
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Continue Button -->
            <button class="create-event-btn" 
                    [disabled]="!canCreateEvent()"
                    type="submit">
              Continue
            </button>
            
          </form>
        </section>

        <!-- Smart Suggestions Section -->
        @if (showSmartSuggestions()) {
          <section class="smart-suggestions">
            <h3 class="suggestions-title">Smart suggestions</h3>
            <div class="suggestions-grid">
              
              @if (inferredDuration()) {
                <div class="suggestion-item">
                  <span class="suggestion-label">Duration</span>
                  <span class="suggestion-value">{{ inferredDuration() }} hours</span>
                </div>
              }
              
              @if (inferredCategories().length > 0) {
                <div class="suggestion-item">
                  <span class="suggestion-label">Categories</span>
                  <div class="category-chips">
                    @for (category of inferredCategories(); track category) {
                      <span class="category-chip">{{ getCategoryLabel(category) }}</span>
                    }
                  </div>
                </div>
              }
              
            </div>
          </section>
        }

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
      transition: border-color 0.2s;
      min-height: 56px; /* Ensures 44px minimum touch target */
      box-sizing: border-box;
    }

    .field-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .field-input::placeholder {
      color: var(--text-secondary);
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

    /* Venue Typeahead Integration */
    .venue-typeahead {
      width: 100%;
    }

    .venue-typeahead input {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      background: var(--background);
      color: var(--text);
      transition: border-color 0.2s;
      min-height: 56px;
      box-sizing: border-box;
    }

    .venue-typeahead input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .venue-typeahead input::placeholder {
      color: var(--text-secondary);
    }

    /* Selected Venue Display - replaces input field */
    .venue-tag {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: var(--primary);
      color: var(--on-primary);
      border-radius: 12px;
      border: 2px solid var(--primary);
      min-height: 56px;
      box-sizing: border-box;
      position: relative;
      transition: all 0.2s;
    }

    .venue-tag:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    .venue-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .venue-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .venue-name {
      font-weight: 600;
      font-size: 0.875rem;
      line-height: 1.2;
    }

    .venue-address {
      font-size: 0.75rem;
      opacity: 0.9;
      line-height: 1.2;
    }

    .remove-venue-btn {
      background: none;
      border: none;
      color: var(--on-primary);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s;
      line-height: 1;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .remove-venue-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Time Row - 2 Column Layout */
    .time-row {
      margin-top: 0.75rem;
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
      background: var(--background);
      border: 2px solid var(--border);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
      padding: 0.875rem 1rem;
      width: 100%;
      height: 56px; /* Fixed height */
    }

    .time-slot-btn:hover {
      border-color: var(--primary);
      background: var(--background-lightest);
      transform: translateY(-1px);
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
      background: var(--success);
      border: 2px solid var(--success);
      color: var(--background);
      width: 100%;
      height: 56px; /* Fixed height to match other elements */
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

    .create-event-btn:disabled {
      background: var(--border);
      color: var(--text-secondary);
      cursor: not-allowed;
      transform: none;
    }

    /* Smart Suggestions */
    .smart-suggestions {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--background-lighter);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .suggestions-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 1rem 0;
    }

    .suggestions-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .suggestion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--background);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .suggestion-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .suggestion-value {
      font-size: 0.875rem;
      color: var(--text);
      font-weight: 600;
    }

    .category-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .category-chip {
      background: var(--primary);
      color: var(--on-primary);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
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
export class EventCreatorComponent {
  // Services
  protected readonly llmService = inject(LLMService);
  protected readonly inferenceService = inject(EventInferenceService);
  protected readonly venueLookupService = inject(VenueLookupService);
  protected readonly authService = inject(AuthService);
  protected readonly eventStore = inject(EventStore);
  protected readonly router = inject(Router);

  // Form state
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

  // UI state
  readonly showStartTimeInput = signal(false);
  readonly showEndTimeInput = signal(false);
  
  // Venue typeahead functions
  readonly venueSearchFunction = (query: string) => this.venueLookupService.searchVenues(query);
  readonly venueDisplayFunction = (venue: Venue) => this.venueLookupService.displayVenue(venue);
  readonly venueCompareFunction = (a: Venue, b: Venue) => this.venueLookupService.compareVenues(a, b);

  // Computed values - simplified for streamlined layout
  // showStartTimeInput and showEndTimeInput are used directly in template

  readonly showSmartSuggestions = computed(() => {
    return !!(this.inferredDuration() || this.inferredCategories().length > 0);
  });

  readonly canCreateEvent = computed(() => {
    const data = this.formData();
    const hasTime = data.isAllDay || data.startTime;
    return !!(data.title?.trim() && data.location?.trim() && data.date && hasTime);
  });

  // Navigation
  goBack() {
    window.history.back();
  }

  // Flyer upload
  handleFlyerUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      await this.processFlyer(input.files[0]);
    }
  }

  async processFlyer(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    this.isProcessing.set(true);
    
    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      this.uploadedFlyer.set(imageUrl);

      // Extract data with LLM
      const result = await this.llmService.extractEventFromImage(file);
      
      if (result.success && result.eventData) {
        const data = result.eventData;
        
        // Fill in the form
        const extractedTime = this.extractTimeFromString(data.date);
        this.formData.set({
          title: data.title || '',
          location: data.location || '',
          date: this.extractDateFromString(data.date),
          isAllDay: false,
          startTime: extractedTime,
          endTime: ''
        });

        // Show start time if we extracted a time
        if (extractedTime) {
          this.showStartTimeInput.set(true);
        }

        // Run inference on the extracted title
        this.runInference(data.title);
      }
    } catch (error) {
      console.error('Error processing flyer:', error);
      alert('Error processing the flyer. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  removeFlyer() {
    if (this.uploadedFlyer()) {
      URL.revokeObjectURL(this.uploadedFlyer()!);
    }
    this.uploadedFlyer.set(null);
  }

  // Form handlers
  onTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const title = input.value;
    
    this.formData.update(data => ({ ...data, title }));
    
    // Run inference on title change
    if (title.length > 3) {
      this.runInference(title);
    }
  }

  onVenueSelected(option: TypeaheadOption<Venue>) {
    console.log('🏢 Venue selected:', option);
    
    const venue = option.value;
    this.selectedVenue.set(venue);
    
    this.formData.update(data => ({ 
      ...data, 
      location: venue.name,
      venueId: venue.id
    }));
  }
  
  onLocationSearchChanged(query: string) {
    console.log('🔍 Location search changed:', query);
    
    // Update form data with the typed location
    this.formData.update(data => ({ 
      ...data, 
      location: query,
      venueId: undefined // Clear venue ID when typing custom location
    }));
    
    // Clear selected venue if user is typing a custom location
    if (this.selectedVenue() && query !== this.selectedVenue()!.name) {
      this.selectedVenue.set(null);
    }
  }
  
  clearVenue() {
    this.selectedVenue.set(null);
    this.formData.update(data => ({ 
      ...data, 
      location: '',
      venueId: undefined
    }));
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const newDate = input.value;
    
    console.log('📅 Date changed:', {
      newDate,
      previousDate: this.formData().date,
      timestamp: new Date().toISOString()
    });
    
    this.formData.update(data => ({ ...data, date: newDate }));
    
    // Log signal state after update
    console.log('📅 Signal updated:', {
      formData: this.formData(),
      shouldShowTimeRow: !!this.formData().date,
      timeRowCondition: `formData().date = ${this.formData().date}`
    });
  }

  // Time option handlers - streamlined
  selectStartTime() {
    this.showStartTimeInput.set(true);
    this.showEndTimeInput.set(false);
    this.formData.update(data => ({ 
      ...data, 
      isAllDay: false,
      endTime: '' // Clear end time when switching to start time
    }));
    
    // Auto-focus and trigger time picker in next tick
    setTimeout(() => {
      const startTimeInput = document.querySelector('input[name="startTime"]') as HTMLInputElement;
      if (startTimeInput) {
        startTimeInput.focus();
        startTimeInput.click(); // Trigger native time picker
      }
    }, 0);
  }

  selectAllDay() {
    this.showStartTimeInput.set(false);
    this.showEndTimeInput.set(false);
    this.formData.update(data => ({ 
      ...data, 
      isAllDay: true, 
      startTime: '', 
      endTime: '' 
    }));
  }

  onStartTimeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formData.update(data => ({ ...data, startTime: input.value }));
  }

  onEndTimeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formData.update(data => ({ ...data, endTime: input.value }));
  }

  toggleEndTime() {
    if (this.showEndTimeInput()) {
      // Hide end time input and clear value
      this.showEndTimeInput.set(false);
      this.formData.update(data => ({ ...data, endTime: '' }));
    } else {
      // Show end time input
      this.showEndTimeInput.set(true);
      
      // Auto-focus and trigger time picker in next tick
      setTimeout(() => {
        const endTimeInput = document.querySelector('input[name="endTime"]') as HTMLInputElement;
        if (endTimeInput) {
          endTimeInput.focus();
          endTimeInput.click(); // Trigger native time picker
        }
      }, 0);
    }
  }

  // Smart suggestions
  runInference(title: string) {
    const inference = this.inferenceService.inferFromEventName(title);
    
    this.inferredEventType.set(this.getEventTypeFromCategories(inference.categories));
    this.inferredDuration.set(inference.defaultDuration);
    this.inferredCategories.set(inference.categories);
  }

  // Navigate to confirmation page
  proceedToConfirmation() {
    if (!this.canCreateEvent()) return;
    
    const formData = this.formData();
    
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
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  extractTimeFromString(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  // Date suggestion methods
  selectDateSuggestion(suggestion: 'today' | 'tomorrow' | 'this-friday' | 'this-saturday') {
    const date = this.getDateForSuggestion(suggestion);
    this.formData.update(data => ({ ...data, date }));
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
}