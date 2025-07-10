import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LLMService } from '../../shared/data-access/llm.service';
import { EventExtractionResult } from '../../shared/utils/event-extraction-types';

@Component({
  selector: 'app-flyer-parser',
  template: `
    <div class="flyer-parser-container">
      <div class="header">
        <h1>Flyer Parser</h1>
        <p>Upload an event flyer to extract event information</p>
      </div>

      <!-- File Upload Section -->
      <div class="upload-section">
        <input
          type="file"
          accept="image/*"
          (change)="onFileSelected($event)"
          [disabled]="isProcessing()"
          class="file-input"
          id="flyer-file"
        />
        <label for="flyer-file" class="file-label" [class.disabled]="isProcessing()">
          <span class="upload-icon">📸</span>
          <span>{{ isProcessing() ? 'Processing...' : 'Choose Image' }}</span>
        </label>
      </div>

      <!-- Image Preview -->
      @if (selectedImageUrl()) {
        <div class="image-preview">
          <img [src]="selectedImageUrl()" alt="Selected flyer" />
        </div>
      }

      <!-- Loading State -->
      @if (isProcessing()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Analyzing flyer with AI...</p>
        </div>
      }

      <!-- Results Section -->
      @if (extractionResult()) {
        <div class="results-section">
          @if (extractionResult()?.success) {
            <div class="success-results">
              <h2>Extracted Event Information</h2>
              <div class="overall-confidence">
                Overall Confidence: {{ extractionResult()?.confidence?.overall || 0 }}%
                <div class="confidence-bar">
                  <div class="confidence-fill" [style.width.%]="extractionResult()?.confidence?.overall || 0"></div>
                </div>
              </div>

              <div class="event-fields">
                <!-- Title -->
                <div class="field">
                  <label>Title</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.title || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.title || 0) < 50">
                      {{ extractionResult()?.confidence?.title || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Description -->
                <div class="field">
                  <label>Description</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.description || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.description || 0) < 50">
                      {{ extractionResult()?.confidence?.description || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Date -->
                <div class="field">
                  <label>Date</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.date || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.date || 0) < 50">
                      {{ extractionResult()?.confidence?.date || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Location -->
                <div class="field">
                  <label>Location</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.location || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.location || 0) < 50">
                      {{ extractionResult()?.confidence?.location || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Organizer -->
                <div class="field">
                  <label>Organizer</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.organizer || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.organizer || 0) < 50">
                      {{ extractionResult()?.confidence?.organizer || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Ticket Info -->
                <div class="field">
                  <label>Ticket Info</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.ticketInfo || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.ticketInfo || 0) < 50">
                      {{ extractionResult()?.confidence?.ticketInfo || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Contact Info -->
                <div class="field">
                  <label>Contact Info</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.contactInfo || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.contactInfo || 0) < 50">
                      {{ extractionResult()?.confidence?.contactInfo || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Website -->
                <div class="field">
                  <label>Website</label>
                  <div class="field-content">
                    <span class="field-value">{{ extractionResult()?.eventData?.website || 'Not found' }}</span>
                    <span class="confidence-score" [class.low-confidence]="(extractionResult()?.confidence?.website || 0) < 50">
                      {{ extractionResult()?.confidence?.website || 0 }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="error-results">
              <h2>Extraction Failed</h2>
              <p>{{ extractionResult()?.error }}</p>
              <button class="retry-btn" (click)="clearResults()">Try Again</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .flyer-parser-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #333;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
      margin: 0;
    }

    .upload-section {
      margin-bottom: 30px;
    }

    .file-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .file-label {
      display: block;
      width: 100%;
      padding: 40px 20px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f9f9f9;
    }

    .file-label:hover:not(.disabled) {
      border-color: #007bff;
      background: #f0f8ff;
    }

    .file-label.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .upload-icon {
      font-size: 24px;
      display: block;
      margin-bottom: 10px;
    }

    .image-preview {
      margin-bottom: 30px;
      text-align: center;
    }

    .image-preview img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .loading-state {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .results-section {
      margin-top: 30px;
    }

    .success-results h2 {
      color: #28a745;
      margin-bottom: 20px;
    }

    .overall-confidence {
      margin-bottom: 30px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .confidence-bar {
      width: 100%;
      height: 10px;
      background: #e9ecef;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 10px;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%);
      transition: width 0.3s ease;
    }

    .event-fields {
      display: grid;
      gap: 20px;
    }

    .field {
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      background: white;
    }

    .field label {
      display: block;
      font-weight: 600;
      color: #495057;
      margin-bottom: 8px;
    }

    .field-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .field-value {
      flex: 1;
      color: #212529;
      word-wrap: break-word;
    }

    .confidence-score {
      margin-left: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      background: #28a745;
      color: white;
    }

    .confidence-score.low-confidence {
      background: #ffc107;
      color: #212529;
    }

    .error-results {
      text-align: center;
      padding: 30px;
      background: #f8d7da;
      border-radius: 8px;
      color: #721c24;
    }

    .error-results h2 {
      color: #dc3545;
      margin-bottom: 15px;
    }

    .retry-btn {
      margin-top: 20px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }

    .retry-btn:hover {
      background: #0056b3;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .flyer-parser-container {
        padding: 15px;
      }

      .field-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .confidence-score {
        margin-left: 0;
        margin-top: 5px;
      }
    }
  `]
})
export class FlyerParserComponent {
  private llmService = inject(LLMService);

  readonly selectedImageUrl = signal<string | null>(null);
  readonly extractionResult = signal<EventExtractionResult | null>(null);
  readonly isProcessing = signal(false);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImageUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process the image
    this.isProcessing.set(true);
    this.extractionResult.set(null);

    try {
      const result = await this.llmService.extractEventFromImage(file);
      this.extractionResult.set(result);
    } catch (error) {
      console.error('Error processing flyer:', error);
      this.extractionResult.set({
        success: false,
        eventData: null,
        confidence: {
          overall: 0,
          title: 0,
          description: 0,
          date: 0,
          location: 0,
          venueId: 0,
          organizer: 0,
          ticketInfo: 0,
          contactInfo: 0,
          website: 0
        },
        error: 'Failed to process image'
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  clearResults(): void {
    this.selectedImageUrl.set(null);
    this.extractionResult.set(null);
    this.isProcessing.set(false);
  }
}
