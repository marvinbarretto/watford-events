import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-processing-overlay',
  standalone: true,
  template: `
    <div class="processing-overlay">
      <div class="processing-content">
        <div class="spinner"></div>
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
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

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .processing-content {
        padding: 20px;
      }
      
      .processing-content h2 {
        font-size: 20px;
      }

      .processing-content p {
        font-size: 14px;
      }
    }
  `]
})
export class ProcessingOverlayComponent {
  @Input() title = 'Processing...';
  @Input() message = 'Please wait while we process your request';
}