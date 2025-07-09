import { Component, signal, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { EventStore } from '../data-access/event.store';
import { Event } from '../utils/event.model';
import { EventExtractionResult } from '../../shared/utils/event-extraction-types';
import { parseEventDateTime, isLikelyDateTime } from '../utils/date-time-parser.util';

@Component({
  selector: 'app-event-form',
  imports: [ReactiveFormsModule],
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('title') < 70">
              {{ getConfidence('title') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('description') < 70">
              {{ getConfidence('description') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('date') < 70">
              {{ getConfidence('date') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('time') < 70">
              {{ getConfidence('time') }}% confident
            </span>
          }
        </div>

        <!-- Location -->
        <div class="form-group">
          <label for="location">Location *</label>
          <input
            id="location"
            type="text"
            formControlName="location"
            class="form-control"
            [class.auto-filled]="isAutoFilled('location')"
            placeholder="Enter event location"
          />
          @if (getConfidence('location') > 0) {
            <span class="confidence-badge" [class.low-confidence]="getConfidence('location') < 70">
              {{ getConfidence('location') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('organizer') < 70">
              {{ getConfidence('organizer') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('ticketInfo') < 70">
              {{ getConfidence('ticketInfo') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('contactInfo') < 70">
              {{ getConfidence('contactInfo') }}% confident
            </span>
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
            <span class="confidence-badge" [class.low-confidence]="getConfidence('website') < 70">
              {{ getConfidence('website') }}% confident
            </span>
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

    .confidence-badge {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 8px;
      background: #28a745;
      color: white;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .confidence-badge.low-confidence {
      background: #ffc107;
      color: #212529;
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

  // State
  readonly isSaving = signal(false);

  // Form
  eventForm: FormGroup;
  private autoFilledFields: Set<string> = new Set();

  constructor() {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', Validators.required],
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

  async saveDraft() {
    await this.saveEventWithStatus('draft');
  }

  async saveEvent() {
    await this.saveEventWithStatus('published');
  }

  private async saveEventWithStatus(status: 'draft' | 'published') {
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

      const eventData = {
        title: formValue.title,
        description: formValue.description,
        date: eventDateTime,
        location: formValue.location,
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
