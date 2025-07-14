import { Component, signal, inject, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CameraService } from '../../../shared/data-access/camera.service';
import { CameraAlignmentGuideComponent } from './camera-alignment-guide.component';
import { CameraCaptureButtonComponent } from './camera-capture-button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-full-screen-camera',  imports: [CameraAlignmentGuideComponent, CameraCaptureButtonComponent, IconComponent],
  template: `
    <div class="full-screen-camera">
      <!-- Camera Stream -->
      <video
        #videoElement
        class="camera-stream"
        autoplay
        playsinline
        muted
      ></video>

      <!-- Camera Error Overlay -->
      @if (cameraError()) {
        <div class="camera-error-overlay">
          <div class="error-content">
            <p>{{ cameraError() }}</p>
            <button class="retry-btn" (click)="initializeCamera()">
              Try Again
            </button>
          </div>
        </div>
      }

      <!-- Alignment Guide -->
      @if (showAlignmentGuide && cameraReady()) {
        <app-camera-alignment-guide
          [frameWidth]="300"
          [frameHeight]="200"
          [showGrid]="false"
        />
      }

      <!-- Header Overlay -->
      <div class="header-overlay">
        <button class="back-btn" (click)="onBackClick()">
          <app-icon name="arrow_back" size="sm" />
          <span>Back</span>
        </button>
        <h1>Scan Flyer</h1>
      </div>

      <!-- Bottom Controls -->
      <div class="bottom-controls">
        <app-camera-capture-button
          [disabled]="!cameraReady() || isProcessing"
          [isProcessing]="isProcessing"
          (capture)="capturePhoto()"
        />
      </div>
    </div>
  `,
  styles: [`
    .full-screen-camera {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .camera-stream {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }

    .camera-error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .error-content {
      text-align: center;
      color: white;
      padding: 20px;
    }

    .retry-btn {
      margin-top: 15px;
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }

    .retry-btn:hover {
      background: #0056b3;
    }

    .header-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 20px;
      background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
      display: flex;
      align-items: center;
      gap: 20px;
      z-index: 5;
      padding-top: max(20px, env(safe-area-inset-top));
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 16px;
      cursor: pointer;
      backdrop-filter: blur(10px);
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .back-arrow {
      font-size: 18px;
    }

    .header-overlay h1 {
      margin: 0;
      color: white;
      font-size: 20px;
      font-weight: 600;
    }

    .bottom-controls {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 30px 20px;
      background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%);
      display: flex;
      justify-content: center;
      z-index: 10;
      padding-bottom: max(30px, env(safe-area-inset-bottom));
      height: auto;
      min-height: 120px;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .header-overlay {
        padding: 15px;
        padding-top: max(15px, env(safe-area-inset-top));
      }

      .bottom-controls {
        padding: 15px;
        padding-bottom: max(15px, env(safe-area-inset-bottom));
      }
    }
  `]
})
export class FullScreenCameraComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  @Input() showAlignmentGuide = true;
  @Input() isProcessing = false;

  @Output() photoTaken = new EventEmitter<string>();
  @Output() backClicked = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  // Services
  private cameraService = inject(CameraService);

  // State
  readonly cameraReady = signal(false);
  readonly cameraError = signal<string | null>(null);

  async ngOnInit() {
    await this.initializeCamera();
  }

  ngOnDestroy() {
    this.cameraService.releaseCamera();
  }

  async initializeCamera() {
    try {
      this.cameraError.set(null);
      this.cameraReady.set(false);

      // Request rear camera for document scanning
      const stream = await this.cameraService.requestRearCamera();

      if (this.videoElement?.nativeElement) {
        this.cameraService.attachToVideoElement(this.videoElement.nativeElement, stream);
        this.cameraReady.set(true);
      }
    } catch (error: any) {
      console.error('Camera initialization failed:', error);
      const errorMessage = error.message || 'Failed to access camera';
      this.cameraError.set(errorMessage);
      this.error.emit(errorMessage);
      this.cameraReady.set(false);
    }
  }

  async capturePhoto() {
    if (!this.videoElement?.nativeElement) return;

    try {
      const video = this.videoElement.nativeElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Use actual video dimensions for proper aspect ratio
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      this.photoTaken.emit(dataUrl);
    } catch (error: any) {
      console.error('Photo capture failed:', error);
      this.error.emit('Failed to capture photo');
    }
  }

  onBackClick() {
    this.backClicked.emit();
  }
}
