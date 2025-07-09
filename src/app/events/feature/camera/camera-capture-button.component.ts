import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camera-capture-button',
  template: `
    <button
      class="capture-button"
      [class.processing]="isProcessing"
      [disabled]="disabled"
      (click)="onCapture()"
      [attr.aria-label]="buttonLabel"
    >
      <div class="button-content">
        @if (isProcessing) {
          <div class="spinner"></div>
          <span>{{ processingText }}</span>
        } @else {
          <span class="camera-icon">📸</span>
          <span>{{ captureText }}</span>
        }
      </div>
    </button>
  `,
  styles: [`
    .capture-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.9);
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    }

    .capture-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 1);
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.05);
    }

    .capture-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .capture-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .capture-button.processing {
      background: rgba(0, 123, 255, 0.9);
      border-color: rgba(0, 123, 255, 0.3);
      animation: pulse 1.5s infinite;
    }

    .button-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .camera-icon {
      font-size: 28px;
      line-height: 1;
    }

    .capture-button span {
      font-size: 10px;
      font-weight: 600;
      color: #333;
      text-align: center;
      line-height: 1;
    }

    .capture-button.processing span {
      color: white;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.9;
      }
      50% {
        transform: scale(1.05);
        opacity: 1;
      }
    }

    /* Touch-friendly sizing for mobile */
    @media (max-width: 768px) {
      .capture-button {
        width: 70px;
        height: 70px;
        border-width: 3px;
      }

      .camera-icon {
        font-size: 24px;
      }

      .button-content span {
        font-size: 9px;
      }

      .spinner {
        width: 20px;
        height: 20px;
      }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .capture-button {
        background: white;
        border-color: black;
      }

      .capture-button span {
        color: black;
      }
    }
  `]
})
export class CameraCaptureButtonComponent {
  @Input() disabled = false;
  @Input() isProcessing = false;
  @Input() captureText = 'Capture';
  @Input() processingText = 'Processing...';

  @Output() capture = new EventEmitter<void>();

  get buttonLabel(): string {
    if (this.isProcessing) return this.processingText;
    if (this.disabled) return 'Camera not ready';
    return `${this.captureText} flyer`;
  }

  onCapture() {
    if (!this.disabled && !this.isProcessing) {
      this.capture.emit();
    }
  }
}
