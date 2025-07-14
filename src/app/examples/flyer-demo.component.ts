import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Platform } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonItem,
  IonLabel,
  IonList,
  IonProgressBar,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  camera,
  image,
  cloudUpload,
  checkmark,
  close,
  scan,
  document
} from 'ionicons/icons';

@Component({
  selector: 'app-flyer-demo',
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonBadge
  ],
  template: `
    @if (platform.is('capacitor')) {
      <!-- Mobile: Camera-first experience -->
      <ion-header>
        <ion-toolbar>
          <ion-title>Flyer Scanner</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="mobile-scanner">
          <div class="camera-preview">
            <div class="camera-placeholder">
              <ion-icon name="camera" size="large"></ion-icon>
              <p>Camera Preview</p>
            </div>

            <!-- Scanning Overlay -->
            <div class="scanning-overlay" *ngIf="isScanning">
              <div class="scan-line"></div>
              <div class="scan-corners">
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
              </div>
            </div>
          </div>

          <ion-card class="controls-card">
            <ion-card-content>
              <div class="mobile-controls">
                <ion-button
                  expand="block"
                  size="large"
                  (click)="capturePhoto()"
                  [disabled]="isScanning">
                  <ion-icon name="camera" slot="start"></ion-icon>
                  {{ isScanning ? 'Processing...' : 'Scan Flyer' }}
                </ion-button>

                <ion-button
                  expand="block"
                  fill="outline"
                  (click)="selectFromGallery()">
                  <ion-icon name="image" slot="start"></ion-icon>
                  Choose from Gallery
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card class="tips-card">
            <ion-card-header>
              <ion-card-title>Scanning Tips</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list>
                <ion-item>
                  <ion-icon name="checkmark" slot="start" color="success"></ion-icon>
                  <ion-label>
                    <h3>Good lighting</h3>
                    <p>Make sure the flyer is well-lit</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-icon name="checkmark" slot="start" color="success"></ion-icon>
                  <ion-label>
                    <h3>Steady hands</h3>
                    <p>Keep the camera steady for clear text</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-icon name="checkmark" slot="start" color="success"></ion-icon>
                  <ion-label>
                    <h3>Full flyer</h3>
                    <p>Include the entire flyer in the frame</p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    } @else {
      <!-- Web: Upload-first experience -->
      <div class="web-flyer-parser">
        <div class="upload-section">
          <h2>Flyer Parser Demo</h2>
          <p>Upload an event flyer to extract event details automatically</p>

          <div class="upload-area"
               [class.dragging]="isDragging"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">
            <div class="upload-content">
              <div class="upload-icon">
                <ion-icon name="cloud-upload" size="large"></ion-icon>
              </div>
              <h3>Drop flyer image here</h3>
              <p>or</p>
              <button class="btn btn-primary" (click)="fileInput.click()">
                Choose File
              </button>
              <input
                #fileInput
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                style="display: none;">
            </div>
          </div>

          <div class="supported-formats">
            <p>Supported formats: JPG, PNG, GIF, WebP</p>
            <p>Max file size: 10MB</p>
          </div>
        </div>

        <div class="demo-section">
          <h3>Sample Flyers</h3>
          <p>Try our demo with these sample flyers:</p>

          <div class="sample-flyers">
            @for (sample of sampleFlyers; track sample.name) {
              <div class="sample-flyer" (click)="processSample(sample)">
                <div class="sample-image">
                  <img [src]="sample.image" [alt]="sample.name">
                </div>
                <div class="sample-info">
                  <h4>{{ sample.name }}</h4>
                  <p>{{ sample.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Processing Results (Both Platforms) -->
    <div class="results-section" *ngIf="extractedData">
      <ion-card class="results-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="scan" slot="start"></ion-icon>
            Extracted Event Data
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            @for (field of extractedFields; track field.label) {
              <ion-item>
                <ion-label>
                  <h3>{{ field.label }}</h3>
                  <p>{{ field.value || 'Not found' }}</p>
                </ion-label>
                <ion-badge
                  slot="end"
                  [color]="getConfidenceColor(field.confidence)">
                  {{ field.confidence }}% confidence
                </ion-badge>
              </ion-item>
            }
          </ion-list>

          <ion-button
            expand="block"
            class="create-event-btn"
            (click)="createEvent()">
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Create Event
          </ion-button>
        </ion-card-content>
      </ion-card>
    </div>
  `,
  styles: [`
    /* Mobile Styles */
    .mobile-scanner {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .camera-preview {
      flex: 1;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }

    .camera-placeholder {
      text-align: center;
      color: #666;
    }

    .camera-placeholder ion-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .scanning-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .scan-line {
      position: absolute;
      top: 50%;
      left: 10%;
      right: 10%;
      height: 2px;
      background: #00ff00;
      animation: scan 2s linear infinite;
    }

    .scan-corners {
      position: absolute;
      top: 20%;
      left: 10%;
      right: 10%;
      bottom: 20%;
    }

    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid #00ff00;
    }

    .corner.top-left {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    .corner.top-right {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }

    .corner.bottom-left {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
    }

    .corner.bottom-right {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }

    @keyframes scan {
      0% { transform: translateY(-100px); }
      100% { transform: translateY(100px); }
    }

    .controls-card {
      margin: 16px;
    }

    .mobile-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tips-card {
      margin: 16px;
      margin-top: 0;
    }

    /* Web Styles */
    .web-flyer-parser {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .upload-section {
      text-align: center;
      margin-bottom: 3rem;
    }

    .upload-section h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .upload-section p {
      font-size: 1.1rem;
      opacity: 0.8;
      margin-bottom: 2rem;
    }

    .upload-area {
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 3rem;
      margin: 2rem 0;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .upload-area:hover,
    .upload-area.dragging {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.05);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .upload-icon {
      font-size: 3rem;
      opacity: 0.7;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-primary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .supported-formats {
      opacity: 0.7;
      font-size: 0.9rem;
    }

    .demo-section {
      margin-top: 3rem;
    }

    .demo-section h3 {
      margin-bottom: 1rem;
    }

    .sample-flyers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .sample-flyer {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .sample-flyer:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .sample-image {
      width: 100%;
      height: 120px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .sample-image img {
      max-width: 100%;
      max-height: 100%;
      border-radius: 6px;
    }

    .sample-info h4 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    .sample-info p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    /* Results Section */
    .results-section {
      margin-top: 2rem;
    }

    .results-card {
      margin: 16px;
    }

    .create-event-btn {
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .web-flyer-parser {
        padding: 1rem;
      }

      .upload-area {
        padding: 2rem;
      }

      .sample-flyers {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FlyerDemoComponent {
  protected readonly platform = inject(Platform);

  isDragging = false;
  isScanning = false;
  extractedData: any = null;

  sampleFlyers = [
    {
      name: 'Music Festival',
      description: 'Summer outdoor concert',
      image: 'https://via.placeholder.com/200x120/FF6B6B/FFFFFF?text=Music+Festival'
    },
    {
      name: 'Tech Conference',
      description: 'Annual technology summit',
      image: 'https://via.placeholder.com/200x120/4ECDC4/FFFFFF?text=Tech+Conf'
    },
    {
      name: 'Art Exhibition',
      description: 'Contemporary art showcase',
      image: 'https://via.placeholder.com/200x120/45B7D1/FFFFFF?text=Art+Show'
    }
  ];

  extractedFields = [
    { label: 'Event Name', value: 'Summer Music Festival 2024', confidence: 95 },
    { label: 'Date', value: 'August 15, 2024', confidence: 88 },
    { label: 'Time', value: '7:00 PM', confidence: 75 },
    { label: 'Location', value: 'Cassiobury Park, Watford', confidence: 92 },
    { label: 'Price', value: '£25', confidence: 82 },
    { label: 'Description', value: 'Annual summer music festival featuring local and international artists', confidence: 78 }
  ];

  constructor() {
    addIcons({
      camera,
      image,
      cloudUpload,
      checkmark,
      close,
      scan,
      document
    });
  }

  // Mobile Methods
  capturePhoto() {
    this.isScanning = true;
    setTimeout(() => {
      this.isScanning = false;
      this.extractedData = { processed: true };
    }, 3000);
  }

  selectFromGallery() {
    console.log('Select from gallery');
    this.extractedData = { processed: true };
  }

  // Web Methods
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File) {
    console.log('Processing file:', file.name);
    // Simulate processing
    setTimeout(() => {
      this.extractedData = { processed: true };
    }, 2000);
  }

  processSample(sample: any) {
    console.log('Processing sample:', sample.name);
    this.extractedData = { processed: true };
  }

  // Common Methods
  getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'warning';
    return 'danger';
  }

  createEvent() {
    console.log('Creating event from extracted data');
  }
}
