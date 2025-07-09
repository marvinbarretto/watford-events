import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-camera-alignment-guide',
  standalone: true,
  template: `
    <div class="alignment-guide">
      <!-- Live Capture Indicator -->
      <div class="live-indicator">
        <div class="pulse-ring"></div>
        <div class="pulse-ring pulse-ring-delay"></div>
        <div class="live-dot"></div>
        <span class="live-text">LIVE</span>
      </div>
    </div>
  `,
  styles: [`
    .alignment-guide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 3;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .live-indicator {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
    }

    .pulse-ring {
      position: absolute;
      width: 80px;
      height: 80px;
      border: 3px solid rgba(255, 59, 48, 0.4);
      border-radius: 50%;
      animation: pulse-ring 2s infinite;
    }

    .pulse-ring-delay {
      animation-delay: 1s;
    }

    .live-dot {
      position: absolute;
      width: 16px;
      height: 16px;
      background: #ff3b30;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    .live-text {
      position: absolute;
      top: 110px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      animation: pulse-text 2s infinite;
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      100% {
        transform: scale(1.4);
        opacity: 0;
      }
    }

    @keyframes pulse-dot {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
    }

    @keyframes pulse-text {
      0%, 100% {
        opacity: 0.8;
      }
      50% {
        opacity: 1;
      }
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .live-indicator {
        width: 80px;
        height: 80px;
      }
      
      .pulse-ring {
        width: 60px;
        height: 60px;
      }
      
      .live-dot {
        width: 12px;
        height: 12px;
      }
      
      .live-text {
        top: 90px;
        font-size: 12px;
      }
    }
  `]
})
export class CameraAlignmentGuideComponent {
  @Input() frameWidth = 300;
  @Input() frameHeight = 200;
  @Input() showGrid = false;
  @Input() showCenterCrosshair = false;
}