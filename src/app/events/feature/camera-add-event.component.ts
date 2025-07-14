import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { LLMService } from '../../shared/data-access/llm.service';
import { EventExtractionResult } from '../../shared/utils/event-extraction-types';
import { EventModel } from '../utils/event.model';
import { FullScreenCameraComponent } from './camera/full-screen-camera.component';
import { EventFormComponent } from './event-form.component';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-camera-add-event',
  imports: [CommonModule, RouterModule, FullScreenCameraComponent, EventFormComponent, IconComponent],
  template: `
    <!-- Full Screen Camera Step -->
    @if (currentStep() === 'camera') {
      <app-full-screen-camera
        [showAlignmentGuide]="true"
        [isProcessing]="isProcessing()"
        (photoTaken)="onPhotoTaken($event)"
        (backClicked)="goBack()"
        (error)="onCameraError($event)"
      />
    }

    <!-- Processing Step -->
    @if (currentStep() === 'processing') {
      <div class="processing-overlay">
        <div class="processing-content">
          <div class="spinner"></div>
          <h2>Analyzing your flyer...</h2>
          <p>Our AI is extracting event information from your image</p>
        </div>
      </div>
    }

    <!-- Form Step -->
    @if (currentStep() === 'form') {
      <div class="form-container">
        <div class="header">
          <button class="back-btn" (click)="goBack()">
            <app-icon name="arrow_back" size="sm" />
            <span>Back</span>
          </button>
          <h1>Add New Event</h1>
        </div>

        <!-- Alternative Method Link -->
        <div class="alternative-method">
          <p>Prefer manual entry?</p>
          <button class="manual-btn" (click)="useManualInstead()">
            ✏️ Enter Manually Instead
          </button>
        </div>

        <app-event-form
          [extractionResult]="extractionResult()"
          [capturedImage]="capturedImage()"
          (eventSaved)="onEventSaved($event)"
          (error)="onFormError($event)"
        />
      </div>
    }

    <!-- Error Display -->
    @if (error()) {
      <div class="error-message">
        <p>{{ error() }}</p>
        <button class="dismiss-btn" (click)="clearError()">Dismiss</button>
      </div>
    }
  `,
  styles: [`
    /* Processing Overlay */
    .processing-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .processing-content {
      text-align: center;
      color: white;
      padding: 40px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 6px solid rgba(255, 255, 255, 0.3);
      border-top: 6px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 30px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .processing-content h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .processing-content p {
      margin: 0;
      font-size: 16px;
      opacity: 0.8;
    }

    /* Form Container */
    .form-container {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: white;
      border-bottom: 1px solid #e9ecef;
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
      font-size: 24px;
    }

    /* Alternative Method */
    .alternative-method {
      background: #e7f3ff;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      margin: 0 20px 20px 20px;
    }

    .alternative-method p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
    }

    .manual-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .manual-btn:hover {
      background: #545b62;
      transform: translateY(-1px);
    }

    /* Error Display */
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
      z-index: 2000;
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
      .header {
        padding: 15px;
      }

      .processing-content {
        padding: 20px;
      }

      .processing-content h2 {
        font-size: 20px;
      }
    }
  `]
})
export class CameraAddEventComponent {
  // Services
  private llmService = inject(LLMService);
  private router = inject(Router);

  // State signals
  readonly currentStep = signal<'camera' | 'processing' | 'form'>('camera');
  readonly capturedImage = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);
  readonly extractionResult = signal<EventExtractionResult | null>(null);

  // Event handlers for camera component
  onPhotoTaken(dataUrl: string) {
    console.log('Photo captured, processing with LLM...');
    this.capturedImage.set(dataUrl);
    this.processWithLLM(dataUrl);
  }

  onCameraError(errorMessage: string) {
    this.error.set(errorMessage);
  }

  // LLM processing
  async processWithLLM(imageDataUrl: string) {
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

      // Move to form step
      this.currentStep.set('form');
    } catch (error: any) {
      console.error('LLM processing failed:', error);
      this.error.set('Failed to process image');
      this.currentStep.set('form'); // Allow manual entry
    } finally {
      this.isProcessing.set(false);
    }
  }

  // Event handlers for form component
  onEventSaved(event: EventModel) {
    console.log('Event saved successfully:', event.id);
    this.router.navigate(['/events']);
  }

  onFormError(errorMessage: string) {
    this.error.set(errorMessage);
  }

  // Navigation
  goBack() {
    this.router.navigate(['/events']);
  }

  useManualInstead() {
    this.router.navigate(['/events/add']);
  }

  clearError() {
    this.error.set(null);
  }
}
