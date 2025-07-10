import { Component, signal, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TypeaheadComponent, TypeaheadOption } from '../../shared/ui/typeahead/typeahead.component';
import { VenueLookupService } from '../../shared/data-access/venue-lookup.service';
import { Venue } from '../../venues/utils/venue.model';
import { ChipComponent } from '../../shared/ui/chip/chip.component';

import { EventStore } from '../data-access/event.store';
import { Event } from '../utils/event.model';
import { EventExtractionResult } from '../../shared/utils/event-extraction-types';
import { parseEventDateTime, isLikelyDateTime } from '../utils/date-time-parser.util';

@Component({
  selector: 'app-event-form',
  imports: [ReactiveFormsModule, TypeaheadComponent, ChipComponent],
  template: `
    <div class="event-form-container">
      <!-- Extraction Result Summary -->
      @if (extractionResult?.success) {
        <div class="extraction-summary">
          <h2>Event Information Extracted!!!</h2>
          <p class="confidence">Overall Confidence: {{ extractionResult?.confidence?.overall || 0 }}%</p>

          <!-- Debug JSON -->
          <details class="debug-json">
            <summary>Debug: LLM Response JSON</summary>
            <pre>{{ getDebugJson() }}</pre>
          </details>
        </div>
      } @else if (extractionResult) {
        <div class="extraction-error">
          <h2>Manual Entry Required</h2>
          <p>{{ extractionResult.error || 'Could not extract data from image' }}</p>

          <!-- Debug JSON -->
          <details class="debug-json">
            <summary>Debug: LLM Response JSON</summary>
            <pre>{{ getDebugJson() }}</pre>
          </details>
        </div>
      }

      <!-- Event Form -->
      <form [formGroup]="eventForm" (ngSubmit)="saveEvent()">
        <!-- Title -->
        <div class="form-group">
          <label for="title">Event Title *</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="form-control"
            [class.auto-filled]="isAutoFilled('title')"
            placeholder="Enter event title"
          />
          @if (getConfidence('title') > 0) {
            <app-chip
              [text]="getConfidence('title') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('title') < 70"
            />
          }
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-control"
            [class.auto-filled]="isAutoFilled('description')"
            rows="3"
            placeholder="Enter event description"
          ></textarea>
          @if (getConfidence('description') > 0) {
            <app-chip
              [text]="getConfidence('description') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('description') < 70"
            />
          }
        </div>

        <!-- Date -->
        <div class="form-group">
          <label for="date">Event Date *</label>
          <input
            id="date"
            type="date"
            formControlName="date"
            class="form-control"
            [class.auto-filled]="isAutoFilled('date')"
          />
          @if (getConfidence('date') > 0) {
            <app-chip
              [text]="getConfidence('date') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('date') < 70"
            />
          }
        </div>

        <!-- Time -->
        <div class="form-group">
          <label for="time">Event Time *</label>
          <input
            id="time"
            type="time"
            formControlName="time"
            class="form-control"
            [class.auto-filled]="isAutoFilled('time')"
          />
          @if (getConfidence('time') > 0) {
            <app-chip
              [text]="getConfidence('time') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('time') < 70"
            />
          }
        </div>

        <!-- Location -->
        <div class="form-group">
          <label for="location">Location *</label>
          <div class="location-input-container">
            <!-- Venue Selection -->
            <app-typeahead
              formControlName="venue"
              placeholder="Search for a venue or enter custom location"
              [inputClass]="'form-control' + (isAutoFilled('venue') ? ' auto-filled' : '')"
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
                class="form-control custom-location"
                [class.auto-filled]="isAutoFilled('location')"
                placeholder="Or enter a custom location"
              />
            }
          </div>
          
          @if (getConfidence('location') > 0) {
            <app-chip
              [text]="getConfidence('location') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('location') < 70"
            />
          }
          
          @if (selectedVenue()) {
            <div class="selected-venue-info">
              <strong>{{ selectedVenue()?.name }}</strong>
              <div class="venue-details">{{ selectedVenue()?.address }}</div>
              <button type="button" class="btn-clear-venue" (click)="clearVenue()">
                Use custom location instead
              </button>
            </div>
          }
        </div>

        <!-- Organizer -->
        <div class="form-group">
          <label for="organizer">Organizer</label>
          <input
            id="organizer"
            type="text"
            formControlName="organizer"
            class="form-control"
            [class.auto-filled]="isAutoFilled('organizer')"
            placeholder="Event organizer"
          />
          @if (getConfidence('organizer') > 0) {
            <app-chip
              [text]="getConfidence('organizer') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('organizer') < 70"
            />
          }
        </div>

        <!-- Ticket Info -->
        <div class="form-group">
          <label for="ticketInfo">Ticket Information</label>
          <input
            id="ticketInfo"
            type="text"
            formControlName="ticketInfo"
            class="form-control"
            [class.auto-filled]="isAutoFilled('ticketInfo')"
            placeholder="Ticket prices and purchase info"
          />
          @if (getConfidence('ticketInfo') > 0) {
            <app-chip
              [text]="getConfidence('ticketInfo') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('ticketInfo') < 70"
            />
          }
        </div>

        <!-- Contact Info -->
        <div class="form-group">
          <label for="contactInfo">Contact Information</label>
          <input
            id="contactInfo"
            type="text"
            formControlName="contactInfo"
            class="form-control"
            [class.auto-filled]="isAutoFilled('contactInfo')"
            placeholder="Phone, email, or contact details"
          />
          @if (getConfidence('contactInfo') > 0) {
            <app-chip
              [text]="getConfidence('contactInfo') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('contactInfo') < 70"
            />
          }
        </div>

        <!-- Website -->
        <div class="form-group">
          <label for="website">Website/Social Media</label>
          <input
            id="website"
            type="text"
            formControlName="website"
            class="form-control"
            [class.auto-filled]="isAutoFilled('website')"
            placeholder="Website or social media links"
          />
          @if (getConfidence('website') > 0) {
            <app-chip
              [text]="getConfidence('website') + '% confident'"
              type="ui"
              variant="confidence"
              [lowConfidence]="getConfidence('website') < 70"
            />
          }
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="saveDraft()" [disabled]="isSaving()">
            Save as Draft
          </button>
          <button type="submit" class="btn-primary" [disabled]="!eventForm.valid || isSaving()">
            {{ isSaving() ? 'Publishing...' : 'Publish Event' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .event-form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Extraction Summary */
    .extraction-summary, .extraction-error {
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
      text-align: center;
    }

    .extraction-summary {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    .extraction-error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .confidence {
      font-weight: 600;
      margin: 10px 0 0 0;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    .form-control.auto-filled {
      background: #e7f3ff;
      border-color: #007bff;
    }


    /* Location Input Container */
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
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      margin-top: 8px;
    }

    .selected-venue-info strong {
      display: block;
      color: #333;
      margin-bottom: 4px;
    }

    .venue-details {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .btn-clear-venue {
      background: none;
      border: none;
      color: #007bff;
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      text-decoration: underline;
    }

    .btn-clear-venue:hover {
      color: #0056b3;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: space-between;
      margin-top: 30px;
    }

    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 15px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }

    .btn-primary:disabled, .btn-secondary:disabled {
      background: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
    }

    /* Debug JSON */
    .debug-json {
      margin-top: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
    }

    .debug-json summary {
      padding: 10px;
      cursor: pointer;
      font-weight: 600;
      background: #e9ecef;
      border-radius: 4px 4px 0 0;
    }

    .debug-json pre {
      margin: 0;
      padding: 15px;
      background: #ffffff;
      border: none;
      border-radius: 0 0 4px 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      overflow-x: auto;
      white-space: pre-wrap;
      color: #333;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .event-form-container {
        padding: 15px;
      }

      .form-actions {
        flex-direction: column;
      }

      .debug-json pre {
        font-size: 11px;
      }
    }
  `]
})
export class EventFormComponent implements OnInit {
  @Input() extractionResult: EventExtractionResult | null = null;
  @Input() capturedImage: string | null = null;

  @Output() eventSaved = new EventEmitter<Event>();
  @Output() error = new EventEmitter<string>();

  // Services
  private eventStore = inject(EventStore);
  private fb = inject(FormBuilder);
  private venueLookupService = inject(VenueLookupService);

  // State
  readonly isSaving = signal(false);
  readonly selectedVenue = signal<Venue | null>(null);

  // Form
  eventForm: FormGroup;
  private autoFilledFields: Set<string> = new Set();

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
      venue: [null], // Venue selection
      location: [''], // Custom location fallback
      organizer: [''],
      ticketInfo: [''],
      contactInfo: [''],
      website: ['']
    });
  }

  ngOnInit() {
    // Pre-fill form if extraction result is available
    if (this.extractionResult && this.extractionResult.success) {
      this.preFillForm(this.extractionResult);
    }
  }

  private preFillForm(result: EventExtractionResult) {
    if (!result.eventData) return;

    const fieldsToFill = [
      'title', 'description', 'location', 'organizer',
      'ticketInfo', 'contactInfo', 'website'
    ];

    fieldsToFill.forEach(field => {
      const value = result.eventData![field as keyof typeof result.eventData];
      const confidence = result.confidence[field as keyof typeof result.confidence];

      if (value && value !== 'Not found' && confidence > 0) {
        this.eventForm.patchValue({ [field]: value });
        this.autoFilledFields.add(field);
      }
    });

    // Handle date field specially (convert to separate date and time fields)
    if (result.eventData.date && isLikelyDateTime(result.eventData.date)) {
      console.log('🔍 [EventForm] Raw date from LLM:', result.eventData.date);
      const parsedDateTime = parseEventDateTime(result.eventData.date);
      console.log('🔍 [EventForm] Parsed date/time:', parsedDateTime);

      if (parsedDateTime) {
        this.eventForm.patchValue({
          date: parsedDateTime.date,
          time: parsedDateTime.time
        });
        this.autoFilledFields.add('date');
        this.autoFilledFields.add('time');
        console.log('✅ [EventForm] Date/time fields updated successfully');
      } else {
        console.log('❌ [EventForm] Failed to parse date/time');
      }
    }
  }


  isAutoFilled(field: string): boolean {
    return this.autoFilledFields.has(field);
  }

  getConfidence(field: string): number {
    if (!this.extractionResult?.confidence) return 0;

    // Both date and time fields use the same confidence from the 'date' extraction
    if (field === 'time') {
      return this.extractionResult.confidence.date || 0;
    }

    return this.extractionResult.confidence[field as keyof typeof this.extractionResult.confidence] || 0;
  }

  getDebugJson(): string {
    if (!this.extractionResult) return 'No extraction result available';

    return JSON.stringify({
      success: this.extractionResult.success,
      eventData: this.extractionResult.eventData,
      confidence: this.extractionResult.confidence,
      error: this.extractionResult.error,
      rawText: this.extractionResult.rawText
    }, null, 2);
  }

  onVenueSelected(option: TypeaheadOption<Venue>) {
    this.selectedVenue.set(option.value);
    this.eventForm.patchValue({ 
      venue: option.value,
      location: '' // Clear custom location when venue is selected
    });
  }

  clearVenue() {
    this.selectedVenue.set(null);
    this.eventForm.patchValue({ 
      venue: null,
      location: '' // Reset location field for manual entry
    });
  }

  async saveDraft() {
    await this.saveEventWithStatus('draft');
  }

  async saveEvent() {
    await this.saveEventWithStatus('published');
  }

  private async saveEventWithStatus(status: 'draft' | 'published') {
    // Custom validation for location - either venue or custom location is required
    const hasVenue = this.selectedVenue() !== null;
    const hasLocation = this.eventForm.get('location')?.value?.trim();
    
    if (status === 'published' && !hasVenue && !hasLocation) {
      this.error.emit('Please select a venue or enter a custom location');
      return;
    }
    
    if (!this.eventForm.valid && status === 'published') {
      this.error.emit('Please fill in all required fields');
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
        location: selectedVenue.name, // Use venue name as location
        venueId: selectedVenue.id
      } : {
        location: formValue.location, // Use custom location text
        venueId: undefined
      };

      const eventData = {
        title: formValue.title,
        description: formValue.description,
        date: eventDateTime,
        ...locationData,
        organizer: formValue.organizer,
        ticketInfo: formValue.ticketInfo,
        contactInfo: formValue.contactInfo,
        website: formValue.website,
        status,
        attendeeIds: [],

        // LLM metadata
        imageUrl: this.capturedImage || undefined,
        scannedAt: new Date(),
        scannerConfidence: this.extractionResult?.confidence?.overall,
        rawTextData: this.extractionResult?.rawText,
        llmModel: 'gemini-1.5-flash',
        processingTime: 0 // TODO: Add actual processing time tracking
      };

      const savedEvent = await this.eventStore.createEvent(eventData);
      if (savedEvent) {
        this.eventSaved.emit(savedEvent);
      }
    } catch (error: any) {
      console.error('Save event failed:', error);
      this.error.emit(error.message || 'Failed to save event');
    } finally {
      this.isSaving.set(false);
    }
  }
}
