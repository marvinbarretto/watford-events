import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventStore } from '../data-access/event.store';
import { EventModel, EventCategory, EventType, RecurrenceRule, createEventDefaults, EVENT_CATEGORIES, RECURRENCE_FREQUENCIES, DAYS_OF_WEEK } from '../utils/event.model';
import { Venue } from '../../venues/utils/venue.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { EventCardComponent } from '../ui/event-card/event-card.component';
import { CheckboxButtonComponent } from '@shared/ui/checkbox-button/checkbox-button.component';
import { AuthService } from '../../auth/data-access/auth.service';
import { generateSlug, createFallbackSlug } from '@shared/utils/slug.utils';
import { PlatformNotificationService } from '@shared/data-access/platform-notification.service';

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

  // LLM extracted additional details
  description?: string;
  organizer?: string;
  ticketInfo?: string;
  contactInfo?: string;
  website?: string;
  tags?: string[];

  // LLM metadata
  llmExtracted?: boolean;
  extractionConfidence?: any;

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
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IconComponent, EventCardComponent, CheckboxButtonComponent],
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
          <!-- Event Preview -->
          <section class="preview-section">
            <details class="event-preview-disclosure" open>
              <summary class="preview-summary">
                <app-icon name="visibility" size="sm" />
                <span>Preview Event</span>
                <app-icon name="expand_more" size="sm" class="expand-icon" />
              </summary>
              <div class="preview-content">
                <app-event-card
                  [event]="previewEvent()"
                  [currentUserId]="currentUserId()"
                  [isAdmin]="true"
                  displayMode="card"
                  (editClicked)="editEvent($event)"
                  (deleteClicked)="deleteEvent($event)"
                />
              </div>
            </details>
          </section>

          <!-- Event Details Section -->
          <section class="event-details-section">
            <h2 class="section-title">Event Details</h2>
            
            <!-- Editable Basic Details -->
            <form [formGroup]="basicDetailsForm" class="basic-details-form">
              <div class="form-group">
                <label for="title">Event Title *</label>
                <input
                  id="title"
                  type="text"
                  formControlName="title"
                  class="form-input"
                  [class.llm-populated]="isLLMPopulated('title')"
                  placeholder="Event title"
                />
                @if (basicDetailsForm.get('title')?.invalid && basicDetailsForm.get('title')?.touched) {
                  <div class="error-message">Event title is required</div>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="date">Date *</label>
                  <input
                    id="date"
                    type="date"
                    formControlName="date"
                    class="form-input"
                    [class.llm-populated]="isLLMPopulated('date')"
                  />
                  @if (basicDetailsForm.get('date')?.invalid && basicDetailsForm.get('date')?.touched) {
                    <div class="error-message">Date is required</div>
                  }
                </div>
                
                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      formControlName="isAllDay"
                      (change)="onAllDayToggle()"
                    />
                    <span class="checkbox-text">All Day Event</span>
                  </label>
                </div>
              </div>

              @if (!basicDetailsForm.get('isAllDay')?.value) {
                <div class="form-row">
                  <div class="form-group">
                    <label for="startTime">Start Time</label>
                    <input
                      id="startTime"
                      type="time"
                      formControlName="startTime"
                      class="form-input"
                      [class.llm-populated]="isLLMPopulated('startTime')"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="endTime">End Time</label>
                    <input
                      id="endTime"
                      type="time"
                      formControlName="endTime"
                      class="form-input"
                      [class.llm-populated]="isLLMPopulated('endTime')"
                    />
                  </div>
                </div>
              }

              <div class="form-group">
                <label for="location">Location *</label>
                <input
                  id="location"
                  type="text"
                  formControlName="location"
                  class="form-input"
                  [class.llm-populated]="isLLMPopulated('location')"
                  placeholder="Event location"
                />
                @if (basicDetailsForm.get('location')?.invalid && basicDetailsForm.get('location')?.touched) {
                  <div class="error-message">Location is required</div>
                }
              </div>

            </form>

          </section>

          <!-- Event Schedule Section -->
          <section class="schedule-section">
            <h2 class="section-title">Event Schedule</h2>
            
            <form [formGroup]="scheduleForm">
              <div class="form-group">
                <label>Event Type</label>
                <div class="radio-group">
                  <label class="radio-option">
                    <input
                      type="radio"
                      formControlName="eventType"
                      value="single"
                    />
                    <span class="radio-custom"></span>
                    <span class="radio-label">One-time event</span>
                  </label>
                  <label class="radio-option">
                    <input
                      type="radio"
                      formControlName="eventType"
                      value="recurring"
                    />
                    <span class="radio-custom"></span>
                    <span class="radio-label">Recurring event</span>
                  </label>
                </div>
              </div>

              @if (scheduleForm.get('eventType')?.value === 'recurring') {
                <div class="recurrence-options">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="frequency">Repeats</label>
                      <select
                        id="frequency"
                        formControlName="recurrenceFrequency"
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
                        formControlName="recurrenceInterval"
                        class="form-input"
                        min="1"
                        max="52"
                      />
                    </div>
                  </div>

                  @if (scheduleForm.get('recurrenceFrequency')?.value === 'weekly') {
                    <div class="form-group">
                      <label>Days of Week</label>
                      <div class="checkbox-buttons-inline">
                        @for (day of daysOfWeek; track day.value; let i = $index) {
                          <app-checkbox-button
                            [label]="day.short"
                            [value]="day.value"
                            [checked]="isDaySelected(i)"
                            (checkedChange)="onDayToggle(i, $event)"
                          />
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
                          formControlName="recurrenceEndType"
                          value="never"
                        />
                        <span class="radio-custom"></span>
                        <span class="radio-label">Never</span>
                      </label>
                      <label class="radio-option">
                        <input
                          type="radio"
                          formControlName="recurrenceEndType"
                          value="date"
                        />
                        <span class="radio-custom"></span>
                        <span class="radio-label">On date</span>
                      </label>
                      <label class="radio-option">
                        <input
                          type="radio"
                          formControlName="recurrenceEndType"
                          value="count"
                        />
                        <span class="radio-custom"></span>
                        <span class="radio-label">After</span>
                      </label>
                    </div>
                  </div>

                  @if (scheduleForm.get('recurrenceEndType')?.value === 'date') {
                    <div class="form-group">
                      <label for="endDate">End Date</label>
                      <input
                        id="endDate"
                        type="date"
                        formControlName="recurrenceEndDate"
                        class="form-input"
                      />
                    </div>
                  }

                  @if (scheduleForm.get('recurrenceEndType')?.value === 'count') {
                    <div class="form-group">
                      <label for="occurrences">Number of occurrences</label>
                      <input
                        id="occurrences"
                        type="number"
                        formControlName="recurrenceOccurrences"
                        class="form-input"
                        min="1"
                        max="365"
                      />
                    </div>
                  }
                </div>
              }
            </form>
          </section>

          <!-- Additional Details Section -->
          <section class="additional-details-section">
            <h2 class="section-title">Additional Details</h2>
            
            <form [formGroup]="additionalDetailsForm">
              <div class="form-group">
                <label for="description">Description</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-textarea"
                  [class.llm-populated]="isLLMPopulated('description')"
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
                    formControlName="organizer"
                    class="form-input"
                    [class.llm-populated]="isLLMPopulated('organizer')"
                    placeholder="Who's organizing this?"
                  />
                </div>
                
                <div class="form-group">
                  <label for="ticketInfo">Ticket Info</label>
                  <input
                    id="ticketInfo"
                    type="text"
                    formControlName="ticketInfo"
                    class="form-input"
                    [class.llm-populated]="isLLMPopulated('ticketInfo')"
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
                    formControlName="contactInfo"
                    class="form-input"
                    [class.llm-populated]="isLLMPopulated('contactInfo')"
                    placeholder="Phone, email, etc."
                  />
                </div>
                
                <div class="form-group">
                  <label for="website">Website</label>
                  <input
                    id="website"
                    type="url"
                    formControlName="website"
                    class="form-input"
                    [class.llm-populated]="isLLMPopulated('website')"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="accessibility">Accessibility Info</label>
                  <input
                    id="accessibility"
                    type="text"
                    formControlName="accessibility"
                    class="form-input"
                    placeholder="Wheelchair accessible, hearing loop, etc."
                  />
                </div>
                
                <div class="form-group">
                  <label for="ageRestriction">Age Restriction</label>
                  <select
                    id="ageRestriction"
                    formControlName="ageRestriction"
                    class="form-input"
                  >
                    <option value="">No restriction</option>
                    <option value="all-ages">All ages</option>
                    <option value="family-friendly">Family friendly</option>
                    <option value="18+">18+</option>
                    <option value="21+">21+</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="tags">Tags (comma-separated)</label>
                <input
                  id="tags"
                  type="text"
                  formControlName="tags"
                  class="form-input"
                  [class.llm-populated]="isLLMPopulated('tags')"
                  placeholder="music, family-friendly, outdoor"
                />
              </div>

              <div class="form-group">
                <label for="capacity">Expected Capacity</label>
                <input
                  id="capacity"
                  type="number"
                  formControlName="capacity"
                  class="form-input"
                  placeholder="How many people do you expect?"
                  min="1"
                />
              </div>
            </form>
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
                [disabled]="isCreating() || !isFormValid()">
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

    /* Form Validation Styles */
    .error-message {
      color: var(--error);
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .form-input.invalid {
      border-color: var(--error);
    }

    .form-input:invalid:focus {
      border-color: var(--error);
      box-shadow: 0 0 0 2px rgba(var(--error-rgb), 0.1);
    }

    /* Checkbox Styling */
    .checkbox-group {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .checkbox-label:hover {
      background: var(--background);
    }

    .checkbox-text {
      font-size: 0.9rem;
      color: var(--text);
      font-weight: 500;
    }

    /* CheckboxButton Layout Classes */
    .checkbox-buttons-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-buttons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .checkbox-buttons-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: flex-start;
    }

    /* Event Preview Disclosure */
    .preview-section {
      margin-bottom: 2rem;
    }

    .event-preview-disclosure {
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      background: var(--background-lighter);
    }

    .preview-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      cursor: pointer;
      background: var(--background-lighter);
      border: none;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      transition: all 0.2s;
      list-style: none;
    }

    .preview-summary:hover {
      background: var(--background);
    }

    .expand-icon {
      margin-left: auto;
      transition: transform 0.2s;
    }

    .event-preview-disclosure[open] .expand-icon {
      transform: rotate(180deg);
    }

    .preview-content {
      padding: 0 1.5rem 1.5rem 1.5rem;
      background: var(--background);
      border-top: 1px solid var(--border);
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

    /* Section Styling */
    .event-details-section,
    .schedule-section,
    .additional-details-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
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


    /* Final Action Section */
    .final-action-section {
      background: var(--background-lighter);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border);
    }

    /* Enhanced Form Styling */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 0.9rem;
      background: var(--background);
      color: var(--text);
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
      font-family: inherit;
    }

    .form-input::placeholder,
    .form-textarea::placeholder {
      color: var(--text-secondary);
      opacity: 0.7;
    }

    /* LLM Populated Fields Styling */
    .form-input.llm-populated,
    .form-textarea.llm-populated {
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.08), rgba(79, 70, 229, 0.08));
      border-color: rgba(147, 51, 234, 0.3);
      position: relative;
      animation: llmGlow 0.6s ease-out;
    }

    .form-input.llm-populated::after,
    .form-textarea.llm-populated::after {
      content: '✨';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      opacity: 0.6;
      pointer-events: none;
      animation: fadeIn 0.4s ease-out;
    }

    .form-textarea.llm-populated::after {
      top: 16px;
      transform: none;
    }

    @keyframes llmGlow {
      0% {
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(79, 70, 229, 0.15));
        box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
      }
      100% {
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.08), rgba(79, 70, 229, 0.08));
        box-shadow: 0 0 0 8px rgba(147, 51, 234, 0);
      }
    }

    @keyframes fadeIn {
      from { 
        opacity: 0; 
        transform: translateY(-50%) scale(0.8); 
      }
      to { 
        opacity: 0.6; 
        transform: translateY(-50%) scale(1); 
      }
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
      opacity: 0.6;
    }

    .primary-btn:disabled:hover {
      background: var(--border);
      transform: none;
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

      .checkbox-buttons-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .preview-summary {
        padding: 0.875rem 1rem;
        font-size: 0.9rem;
      }

      .preview-content {
        padding: 0 1rem 1rem 1rem;
      }

      .checkbox-buttons-inline {
        justify-content: center;
      }

      /* Mobile extraction overlay */
      .extraction-banner {
        padding: 1rem;
        gap: 0.75rem;
      }

      .banner-title {
        font-size: 1.125rem;
      }

      .banner-subtitle {
        font-size: 0.8rem;
      }

      .extraction-details {
        padding: 1rem;
      }

      .extraction-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .extraction-item {
        padding: 0.75rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .item-label {
        min-width: unset;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .item-value {
        font-size: 0.9rem;
      }
    }
  `]
})
export class EventConfirmationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly eventStore = inject(EventStore);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(PlatformNotificationService);

  // Event data from navigation state
  readonly eventData = signal<EventConfirmationData | null>(null);
  
  // Track which fields were populated by LLM
  readonly llmPopulatedFields = signal<Set<string>>(new Set());
  
  // Unified Reactive Form
  readonly eventForm: FormGroup;

  constructor() {
    this.eventForm = this.fb.group({
      basicDetails: this.fb.group({
        title: ['', Validators.required],
        date: ['', Validators.required],
        startTime: [''],
        endTime: [''],
        isAllDay: [false],
        location: ['', Validators.required],
        categories: this.fb.array([])
      }),
      schedule: this.fb.group({
        eventType: ['single'],
        recurrenceFrequency: ['weekly'],
        recurrenceInterval: [1, [Validators.min(1), Validators.max(52)]],
        recurrenceDaysOfWeek: this.fb.array(this.daysOfWeek.map(() => false)),
        recurrenceEndType: ['never'],
        recurrenceEndDate: [''],
        recurrenceOccurrences: [1, [Validators.min(1), Validators.max(365)]]
      }),
      additionalDetails: this.fb.group({
        description: [''],
        organizer: [''],
        ticketInfo: [''],
        contactInfo: [''],
        website: [''],
        accessibility: [''],
        ageRestriction: [''],
        capacity: [null, Validators.min(1)],
        tags: ['']
      })
    });
  }
  
  // Current user ID for event card
  readonly currentUserId = computed(() => this.authService.user$$()?.uid || null);
  
  // Convenience getters for form groups
  get basicDetailsForm() { return this.eventForm.get('basicDetails') as FormGroup; }
  get scheduleForm() { return this.eventForm.get('schedule') as FormGroup; }
  get additionalDetailsForm() { return this.eventForm.get('additionalDetails') as FormGroup; }

  // Preview event for EventCardComponent
  readonly previewEvent = computed(() => {
    const formValue = this.eventForm.value;
    const basicValues = formValue.basicDetails;
    const scheduleValues = formValue.schedule;
    const additionalValues = formValue.additionalDetails;
    const original = this.eventData();
    
    if (!original) return this.createEmptyEvent();
    
    // Parse tags from comma-separated string
    const tags = additionalValues.tags ? 
      additionalValues.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
    
    return {
      id: 'preview',
      title: basicValues.title || 'Untitled Event',
      description: additionalValues.description || '',
      date: basicValues.date || new Date().toISOString().split('T')[0],
      startTime: basicValues.isAllDay ? undefined : basicValues.startTime,
      endTime: basicValues.isAllDay ? undefined : basicValues.endTime,
      isAllDay: basicValues.isAllDay,
      location: basicValues.location || 'Location TBA',
      categories: this.getSelectedCategories(),
      tags,
      status: 'draft' as const,
      eventType: scheduleValues.eventType as EventType,
      attendeeIds: [],
      createdBy: this.currentUserId() || 'unknown',
      ownerId: this.currentUserId() || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: original.uploadedFlyer || undefined,
      organizer: additionalValues.organizer,
      ticketInfo: additionalValues.ticketInfo,
      contactInfo: additionalValues.contactInfo,
      website: additionalValues.website,
      accessibility: additionalValues.accessibility,
      ageRestriction: additionalValues.ageRestriction,
      capacity: additionalValues.capacity,
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


  // UI state
  readonly isCreating = signal(false);
  readonly showRecurrenceSection = computed(() => this.additionalDetailsForm.value.eventType === 'recurring');
  tagsInput = '';

  // Constants for templates
  readonly recurrenceFrequencies = RECURRENCE_FREQUENCIES;
  readonly daysOfWeek = DAYS_OF_WEEK;
  readonly eventCategories = EVENT_CATEGORIES;

  // Form validation
  readonly isFormValid = computed(() => {
    return this.eventForm.valid;
  });

  readonly basicDetailsValid = computed(() => this.basicDetailsForm.valid);
  readonly scheduleValid = computed(() => this.scheduleForm.valid);
  readonly additionalDetailsValid = computed(() => this.additionalDetailsForm.valid);

  ngOnInit() {
    
    // Get event data from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.eventData) {
      this.eventData.set(state.eventData);
      // Initialize forms from eventData
      const data = state.eventData;
      
      this.basicDetailsForm.patchValue({
        title: data.title || '',
        date: data.date || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        isAllDay: data.isAllDay || false,
        location: data.location || ''
      });

      // Track which basic fields were populated by LLM
      const llmFields = new Set<string>();
      if (data.llmExtracted) {
        if (data.title) llmFields.add('title');
        if (data.date) llmFields.add('date');
        if (data.startTime) llmFields.add('startTime');
        if (data.endTime) llmFields.add('endTime');
        if (data.location) llmFields.add('location');
      }

      // Set categories
      if (data.categories?.length) {
        this.setCategoriesFromData(data.categories);
      }

      // Populate additional details if they were extracted by LLM
      if (data.llmExtracted) {
        this.additionalDetailsForm.patchValue({
          description: data.description || '',
          organizer: data.organizer || '',
          ticketInfo: data.ticketInfo || '',
          contactInfo: data.contactInfo || '',
          website: data.website || '',
          tags: data.tags ? data.tags.join(', ') : ''
        });

        // Track additional fields populated by LLM
        if (data.description) llmFields.add('description');
        if (data.organizer) llmFields.add('organizer');
        if (data.ticketInfo) llmFields.add('ticketInfo');
        if (data.contactInfo) llmFields.add('contactInfo');
        if (data.website) llmFields.add('website');
        if (data.tags?.length) llmFields.add('tags');
      }

      // Set the LLM populated fields
      this.llmPopulatedFields.set(llmFields);
      
      // Set up form listeners to remove highlighting when user interacts
      this.setupFormListeners();
      
      // Hide debug banner after successful setup
      // Event data loaded successfully
    } else {
      // Wait a bit in case state is still loading, then redirect
      setTimeout(() => {
        const retryState = history.state;
        if (retryState?.eventData) {
          this.ngOnInit(); // Retry initialization
        } else {
          setTimeout(() => {
            this.goToCreator();
          }, 1000);
        }
      }, 500);
    }
  }
  
  onAllDayToggle() {
    const isAllDay = this.basicDetailsForm.get('isAllDay')?.value;
    if (isAllDay) {
      this.basicDetailsForm.patchValue({
        startTime: '',
        endTime: ''
      });
    }
  }
  
  // Category management
  getSelectedCategories(): EventCategory[] {
    const categoriesArray = this.basicDetailsForm.get('categories') as FormArray;
    return this.eventCategories
      .filter((_, index) => categoriesArray.at(index)?.value)
      .map(cat => cat.value);
  }

  isBasicCategorySelected(category: EventCategory): boolean {
    const categoriesArray = this.basicDetailsForm.get('categories') as FormArray;
    const index = this.eventCategories.findIndex(cat => cat.value === category);
    return index >= 0 ? categoriesArray.at(index)?.value || false : false;
  }

  onBasicCategoryChange(category: EventCategory, isSelected: boolean) {
    const categoriesArray = this.basicDetailsForm.get('categories') as FormArray;
    const index = this.eventCategories.findIndex(cat => cat.value === category);
    
    if (index >= 0) {
      categoriesArray.at(index)?.setValue(isSelected);
    }
  }

  // Days of week management for schedule
  isDaySelected(dayIndex: number): boolean {
    const daysArray = this.scheduleForm.get('recurrenceDaysOfWeek') as FormArray;
    return daysArray.at(dayIndex)?.value || false;
  }

  onDayToggle(dayIndex: number, isSelected: boolean) {
    const daysArray = this.scheduleForm.get('recurrenceDaysOfWeek') as FormArray;
    daysArray.at(dayIndex)?.setValue(isSelected);
  }

  private setCategoriesFromData(categories: EventCategory[]) {
    const categoriesArray = this.basicDetailsForm.get('categories') as FormArray;
    categoriesArray.clear();
    
    this.eventCategories.forEach(cat => {
      const isSelected = categories.includes(cat.value);
      categoriesArray.push(this.fb.control(isSelected));
    });
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




  async createEvent() {
    const eventData = this.eventData();
    if (!eventData || !this.isFormValid()) return;

    this.isCreating.set(true);

    try {
      const formValue = this.eventForm.value;
      const basicValues = formValue.basicDetails;
      const scheduleValues = formValue.schedule;
      const additionalValues = formValue.additionalDetails;

      // Parse tags from comma-separated string
      const tags = additionalValues.tags ? 
        additionalValues.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];

      // Get selected categories
      const selectedCategories = this.getSelectedCategories();

      // Build recurrence rule if this is a recurring event
      let recurrenceRule: RecurrenceRule | undefined;
      if (scheduleValues.eventType === 'recurring') {
        const endCondition: RecurrenceRule['endCondition'] = {
          type: scheduleValues.recurrenceEndType
        };

        if (scheduleValues.recurrenceEndType === 'date' && scheduleValues.recurrenceEndDate) {
          endCondition.endDate = new Date(scheduleValues.recurrenceEndDate);
        } else if (scheduleValues.recurrenceEndType === 'count') {
          endCondition.occurrences = scheduleValues.recurrenceOccurrences || 1;
        }

        // Get selected days of week for weekly recurrence
        const selectedDays = scheduleValues.recurrenceDaysOfWeek
          .map((selected: boolean, index: number) => selected ? this.daysOfWeek[index].value : null)
          .filter((day: number | null) => day !== null);

        recurrenceRule = {
          frequency: scheduleValues.recurrenceFrequency,
          interval: scheduleValues.recurrenceInterval || 1,
          daysOfWeek: scheduleValues.recurrenceFrequency === 'weekly' ? selectedDays : undefined,
          endCondition,
          exceptions: []
        };
      }

      // Generate slug from event title
      const slug = generateSlug(basicValues.title);
      console.log('Generated slug:', slug);

      // Create complete event data
      const completeEventData = {
        // Basic details from form
        title: basicValues.title,
        slug: slug, // Add slug for SEO-friendly URLs
        date: basicValues.date,
        ...(basicValues.startTime && !basicValues.isAllDay && { startTime: basicValues.startTime }),
        ...(basicValues.endTime && !basicValues.isAllDay && { endTime: basicValues.endTime }),
        isAllDay: basicValues.isAllDay,
        location: basicValues.location,
        ...(eventData.venueId && { venueId: eventData.venueId }),

        // Additional details from form
        ...(additionalValues.description && { description: additionalValues.description }),
        ...(additionalValues.organizer && { organizer: additionalValues.organizer }),
        ...(additionalValues.ticketInfo && { ticketInfo: additionalValues.ticketInfo }),
        ...(additionalValues.contactInfo && { contactInfo: additionalValues.contactInfo }),
        ...(additionalValues.website && { website: additionalValues.website }),
        ...(additionalValues.accessibility && { accessibility: additionalValues.accessibility }),
        ...(additionalValues.ageRestriction && { ageRestriction: additionalValues.ageRestriction }),
        ...(additionalValues.capacity && { capacity: additionalValues.capacity }),

        // Categories and tags
        categories: selectedCategories,
        tags,

        // Event scheduling
        eventType: scheduleValues.eventType,
        ...(recurrenceRule && { recurrenceRule }),

        // LLM metadata if available
        ...(eventData.uploadedFlyer && { imageUrl: eventData.uploadedFlyer }),
        ...(eventData.uploadedFlyer && { scannedAt: new Date() }),

        // Merge with defaults
        ...createEventDefaults(),

        // Ensure required fields are properly set
        attendeeIds: [],
        status: 'published' as const
      };

      console.log('Creating event with full data:', completeEventData);

      // Create event using EventStore
      const createdEvent = await this.eventStore.createEvent(completeEventData);

      if (createdEvent) {
        console.log('Event created successfully:', createdEvent.id);
        
        // Show success notification
        await this.notificationService.showSuccess(
          `Event "${createdEvent.title}" created successfully!`,
          { 
            title: 'Success',
            timeout: 4000,
            description: 'Your event is now live and visible to others.'
          }
        );
        
        // Navigate to homepage
        this.router.navigate(['/']);
      } else {
        throw new Error('Failed to create event - no event returned');
      }

    } catch (error) {
      console.error('Error creating event:', error);

      // Show error notification using the platform service
      if (error instanceof Error && error.message.includes('authenticated')) {
        await this.notificationService.showError(
          'Please log in to create events',
          { title: 'Authentication Required' }
        );
      } else {
        await this.notificationService.showError(
          'Failed to create event. Please try again.',
          { 
            title: 'Error', 
            description: error instanceof Error ? error.message : 'Unknown error occurred'
          }
        );
      }
    } finally {
      this.isCreating.set(false);
    }
  }

  // Setup form listeners to remove LLM highlighting when user interacts
  private setupFormListeners() {
    // Listen to basic details form changes
    Object.keys(this.basicDetailsForm.controls).forEach(fieldName => {
      const control = this.basicDetailsForm.get(fieldName);
      if (control) {
        control.valueChanges.subscribe(() => {
          this.removeLLMHighlight(fieldName);
        });
      }
    });

    // Listen to additional details form changes
    Object.keys(this.additionalDetailsForm.controls).forEach(fieldName => {
      const control = this.additionalDetailsForm.get(fieldName);
      if (control) {
        control.valueChanges.subscribe(() => {
          this.removeLLMHighlight(fieldName);
        });
      }
    });
  }

  private removeLLMHighlight(fieldName: string) {
    const currentFields = this.llmPopulatedFields();
    if (currentFields.has(fieldName)) {
      const newFields = new Set(currentFields);
      newFields.delete(fieldName);
      this.llmPopulatedFields.set(newFields);
    }
  }

  // Helper method to check if a field is LLM populated
  isLLMPopulated(fieldName: string): boolean {
    return this.llmPopulatedFields().has(fieldName);
  }

  // Extraction overlay methods

  getExtractionSummary() {
    const data = this.eventData();
    return {
      title: data?.title && data.title !== 'Not found' ? data.title : null,
      date: data?.date && data.date !== 'Not found' ? data.date : null,
      location: data?.location && data.location !== 'Not found' ? data.location : null,
      organizer: data?.organizer && data.organizer !== 'Not found' ? data.organizer : null,
      ticketInfo: data?.ticketInfo && data.ticketInfo !== 'Not found' ? data.ticketInfo : null,
      description: data?.description && data.description !== 'Not found' ? data.description : null,
    };
  }

  getOverallConfidence(): number {
    const data = this.eventData();
    return data?.extractionConfidence?.overall || 0;
  }

  // Event card interaction handlers
  editEvent(event: EventModel): void {
    // Placeholder for edit functionality - could navigate to edit page
    console.log('Edit event:', event);
    // Could implement actual edit navigation if needed
  }

  deleteEvent(event: EventModel): void {
    // Placeholder for delete functionality - could show confirmation dialog
    console.log('Delete event:', event);
    // Could implement actual delete functionality if needed
  }
}
