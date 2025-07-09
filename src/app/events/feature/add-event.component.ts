import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CameraService } from '../../shared/data-access/camera.service';
import { LLMService } from '../../shared/data-access/llm.service';
import { EventStore } from '../data-access/event.store';
import { EventExtractionResult } from '../../shared/utils/event-extraction-types';

@Component({
  selector: 'app-add-event',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="add-event-container">
      <div class="header">
        <button class="back-btn" (click)="goBack()">
          <span class="back-arrow">←</span>
          <span>Back</span>
        </button>
        <h1>Add New Event</h1>
      </div>

      <!-- Camera Section -->
      @if (currentStep() === 'camera') {
        <div class="camera-section">
          <div class="camera-container">
            <video 
              #videoElement
              class="camera-preview"
              autoplay 
              playsinline 
              muted
            ></video>
            
            @if (cameraError()) {
              <div class="camera-error">
                <p>{{ cameraError() }}</p>
                <button class="retry-btn" (click)="initializeCamera()">Try Again</button>
              </div>
            }
          </div>

          <div class="camera-controls">
            @if (hasMultipleCameras()) {
              <button 
                class="switch-camera-btn"
                (click)="switchCamera()"
                [disabled]="!cameraReady() || isProcessing()"
                title="Switch camera"
              >
                <span class="switch-icon">🔄</span>
                <span>{{ usingRearCamera() ? 'Rear' : 'Front' }}</span>
              </button>
            }
            
            <button 
              class="capture-btn"
              (click)="capturePhoto()"
              [disabled]="!cameraReady() || isProcessing()"
            >
              <span class="camera-icon">📸</span>
              <span>{{ isProcessing() ? 'Processing...' : 'Capture Flyer' }}</span>
            </button>
          </div>

          @if (capturedImage()) {
            <div class="captured-preview">
              <img [src]="capturedImage()" alt="Captured flyer" />
              <div class="preview-actions">
                <button class="retake-btn" (click)="retakePhoto()">Retake</button>
                <button class="process-btn" (click)="processWithLLM()" [disabled]="isProcessing()">
                  {{ isProcessing() ? 'Analyzing...' : 'Extract Event Data' }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Processing Section -->
      @if (currentStep() === 'processing') {
        <div class="processing-section">
          <div class="spinner"></div>
          <h2>Analyzing your flyer...</h2>
          <p>Our AI is extracting event information from your image</p>
        </div>
      }

      <!-- Form Section -->
      @if (currentStep() === 'form') {
        <div class="form-section">
          @if (extractionResult()?.success) {
            <div class="extraction-summary">
              <h2>Event Information Extracted</h2>
              <p class="confidence">Overall Confidence: {{ extractionResult()?.confidence?.overall || 0 }}%</p>
            </div>
          } @else {
            <div class="extraction-error">
              <h2>Manual Entry Required</h2>
              <p>{{ extractionResult()?.error || 'Could not extract data from image' }}</p>
            </div>
          }

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
      }

      <!-- Error Display -->
      @if (error()) {
        <div class="error-message">
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
    }

    .header {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      gap: 20px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      font-size: 16px;
      color: #007bff;
      cursor: pointer;
      padding: 8px;
    }

    .back-arrow {
      font-size: 20px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    /* Camera Styles */
    .camera-section {
      text-align: center;
    }

    .camera-container {
      position: relative;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
    }

    .camera-preview {
      width: 100%;
      height: 400px;
      object-fit: cover;
    }

    .camera-error {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0,0,0,0.8);
      color: white;
      text-align: center;
      padding: 20px;
    }

    .retry-btn {
      margin-top: 10px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .camera-controls {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    .switch-camera-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .switch-camera-btn:hover:not(:disabled) {
      background: #545b62;
    }

    .switch-camera-btn:disabled {
      background: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
    }

    .switch-icon {
      font-size: 16px;
    }

    .capture-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 200px;
      height: 60px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .capture-btn:hover:not(:disabled) {
      background: #0056b3;
      transform: scale(1.05);
    }

    .capture-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
    }

    .camera-icon {
      font-size: 24px;
    }

    .captured-preview {
      margin-top: 20px;
      text-align: center;
    }

    .captured-preview img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      margin-bottom: 15px;
    }

    .preview-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .retake-btn, .process-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .retake-btn {
      background: #6c757d;
      color: white;
    }

    .process-btn {
      background: #28a745;
      color: white;
    }

    /* Processing Styles */
    .processing-section {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 6px solid #f3f3f3;
      border-top: 6px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 30px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Form Styles */
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

    /* Error Styles */
    .error-message {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f8d7da;
      color: #721c24;
      padding: 15px 20px;
      border-radius: 6px;
      border: 1px solid #f5c6cb;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 90%;
    }

    .dismiss-btn {
      margin-left: 15px;
      background: none;
      border: none;
      color: #721c24;
      text-decoration: underline;
      cursor: pointer;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .add-event-container {
        padding: 15px;
      }
      
      .camera-preview {
        height: 300px;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .capture-btn {
        width: 100%;
        max-width: 250px;
      }
    }
  `]
})
export class AddEventComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Services
  private cameraService = inject(CameraService);
  private llmService = inject(LLMService);
  private eventStore = inject(EventStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // State signals
  readonly currentStep = signal<'camera' | 'processing' | 'form'>('camera');
  readonly cameraReady = signal(false);
  readonly cameraError = signal<string | null>(null);
  readonly capturedImage = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly extractionResult = signal<EventExtractionResult | null>(null);
  readonly usingRearCamera = signal(true);
  readonly hasMultipleCameras = signal(false);

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

  async ngOnInit() {
    await this.checkCameraOptions();
    await this.initializeCamera();
  }

  private async checkCameraOptions() {
    try {
      const cameras = await this.cameraService.getAvailableCameras();
      this.hasMultipleCameras.set(cameras.length > 1);
    } catch (error) {
      console.error('Failed to check camera options:', error);
      this.hasMultipleCameras.set(false);
    }
  }

  ngOnDestroy() {
    this.cameraService.releaseCamera();
  }

  async initializeCamera(useRearCamera: boolean = true) {
    try {
      this.cameraError.set(null);
      this.cameraReady.set(false);
      
      // Try to get the requested camera
      let stream: MediaStream;
      try {
        if (useRearCamera) {
          stream = await this.cameraService.requestRearCamera();
          this.usingRearCamera.set(true);
          console.log('✅ Using rear-facing camera for flyer scanning');
        } else {
          stream = await this.cameraService.requestFrontCamera();
          this.usingRearCamera.set(false);
          console.log('✅ Using front-facing camera');
        }
      } catch (error) {
        console.log('⚠️ Requested camera not available, falling back to default camera');
        // Fallback to any available camera if specific camera fails
        stream = await this.cameraService.requestCamera();
        this.usingRearCamera.set(true); // Assume rear camera as default
      }
      
      if (this.videoElement?.nativeElement) {
        this.cameraService.attachToVideoElement(this.videoElement.nativeElement, stream);
        this.cameraReady.set(true);
      }
    } catch (error: any) {
      console.error('Camera initialization failed:', error);
      this.cameraError.set(error.message || 'Failed to access camera');
      this.cameraReady.set(false);
    }
  }

  async switchCamera() {
    const useRear = !this.usingRearCamera();
    await this.initializeCamera(useRear);
  }

  async capturePhoto() {
    if (!this.videoElement?.nativeElement) return;

    try {
      const video = this.videoElement.nativeElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      this.capturedImage.set(dataUrl);
    } catch (error: any) {
      console.error('Photo capture failed:', error);
      this.error.set('Failed to capture photo');
    }
  }

  retakePhoto() {
    this.capturedImage.set(null);
    this.extractionResult.set(null);
    this.currentStep.set('camera');
  }

  async processWithLLM() {
    const imageDataUrl = this.capturedImage();
    if (!imageDataUrl) return;

    this.isProcessing.set(true);
    this.currentStep.set('processing');

    try {
      // Convert data URL to File object
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'flyer.jpg', { type: 'image/jpeg' });

      // Process with LLM
      const result = await this.llmService.extractEventFromImage(file);
      this.extractionResult.set(result);

      // Pre-fill form if extraction was successful
      if (result.success && result.eventData) {
        this.preFillForm(result);
      }

      this.currentStep.set('form');
    } catch (error: any) {
      console.error('LLM processing failed:', error);
      this.error.set('Failed to process image');
      this.currentStep.set('form'); // Allow manual entry
    } finally {
      this.isProcessing.set(false);
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
    if (result.eventData.date && result.eventData.date !== 'Not found') {
      const parsedDateTime = this.parseEventDateTime(result.eventData.date);
      if (parsedDateTime) {
        this.eventForm.patchValue({ 
          date: parsedDateTime.date,
          time: parsedDateTime.time
        });
        this.autoFilledFields.add('date');
        this.autoFilledFields.add('time');
      }
    }
  }

  private parseEventDateTime(dateString: string): { date: string; time: string } | null {
    try {
      // Handle common natural language date formats
      let normalizedDate = dateString.toLowerCase()
        .replace(/(\d+)(st|nd|rd|th)/g, '$1') // Remove ordinal suffixes
        .replace(/sunday|monday|tuesday|wednesday|thursday|friday|saturday/g, '') // Remove day names
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Try to parse common formats
      let date: Date | null = null;
      
      // Format: "20 July 2025, 3 PM" or "20 July 2025 3 PM"
      const match1 = normalizedDate.match(/(\d{1,2})\s+(\w+)\s+(\d{4})[,\s]+(\d{1,2})\s*(pm|am)/i);
      if (match1) {
        const [, day, month, year, hour, ampm] = match1;
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = monthNames.findIndex(m => m.startsWith(month.toLowerCase()));
        
        if (monthIndex !== -1) {
          let hour24 = parseInt(hour);
          if (ampm.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
          if (ampm.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
          
          date = new Date(parseInt(year), monthIndex, parseInt(day), hour24, 0);
        }
      }
      
      // Format: "July 20 2025 3 PM" or "July 20, 2025 3 PM"
      const match2 = normalizedDate.match(/(\w+)\s+(\d{1,2})[,\s]+(\d{4})[,\s]+(\d{1,2})\s*(pm|am)/i);
      if (!date && match2) {
        const [, month, day, year, hour, ampm] = match2;
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = monthNames.findIndex(m => m.startsWith(month.toLowerCase()));
        
        if (monthIndex !== -1) {
          let hour24 = parseInt(hour);
          if (ampm.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
          if (ampm.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
          
          date = new Date(parseInt(year), monthIndex, parseInt(day), hour24, 0);
        }
      }
      
      // Fallback to native Date parsing
      if (!date) {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return null;
        }
      }
      
      // Convert to separate date and time formats
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
      };
    } catch {
      return null;
    }
  }

  isAutoFilled(field: string): boolean {
    return this.autoFilledFields.has(field);
  }

  getConfidence(field: string): number {
    const result = this.extractionResult();
    if (!result?.confidence) return 0;
    
    // Both date and time fields use the same confidence from the 'date' extraction
    if (field === 'time') {
      return result.confidence.date || 0;
    }
    
    return result.confidence[field as keyof typeof result.confidence] || 0;
  }

  async saveDraft() {
    await this.saveEventWithStatus('draft');
  }

  async saveEvent() {
    await this.saveEventWithStatus('published');
  }

  private async saveEventWithStatus(status: 'draft' | 'published') {
    if (!this.eventForm.valid && status === 'published') {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const formValue = this.eventForm.value;
      const result = this.extractionResult();
      
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
        imageUrl: this.capturedImage() || undefined,
        scannedAt: new Date(),
        scannerConfidence: result?.confidence?.overall,
        rawTextData: result?.rawText,
        llmModel: 'gemini-1.5-flash',
        processingTime: 0 // TODO: Add actual processing time tracking
      };

      await this.eventStore.createEvent(eventData);
      
      // Navigate back to events list
      this.router.navigate(['/events']);
    } catch (error: any) {
      console.error('Save event failed:', error);
      this.error.set(error.message || 'Failed to save event');
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  clearError() {
    this.error.set(null);
  }
}