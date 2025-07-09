import { Component, input, output, OnInit, OnDestroy } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (message()) {
      <div 
        class="toast" 
        [class]="'toast-' + type()"
        [attr.role]="'alert'"
        [attr.aria-live]="'polite'"
      >
        <div class="toast-icon">
          @switch (type()) {
            @case ('success') { ✓ }
            @case ('error') { ✕ }
            @case ('warning') { ⚠ }
            @case ('info') { ℹ }
          }
        </div>
        
        <div class="toast-content">
          <p class="toast-message">{{ message() }}</p>
          @if (description()) {
            <p class="toast-description">{{ description() }}</p>
          }
        </div>
        
        @if (dismissible()) {
          <button 
            class="toast-dismiss" 
            (click)="onDismiss()"
            [attr.aria-label]="'Dismiss ' + type() + ' message'"
          >
            ✕
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 320px;
      max-width: 500px;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-message {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }

    .toast-description {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
      opacity: 0.9;
    }

    .toast-dismiss {
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s, background-color 0.2s;
    }

    .toast-dismiss:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.1);
    }

    /* Success Toast */
    .toast-success {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.3);
      color: #047857;
    }

    .toast-success .toast-icon {
      background: #10b981;
      color: white;
    }

    /* Error Toast */
    .toast-error {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #dc2626;
    }

    .toast-error .toast-icon {
      background: #ef4444;
      color: white;
    }

    /* Warning Toast */
    .toast-warning {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.3);
      color: #d97706;
    }

    .toast-warning .toast-icon {
      background: #f59e0b;
      color: white;
    }

    /* Info Toast */
    .toast-info {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #2563eb;
    }

    .toast-info .toast-icon {
      background: #3b82f6;
      color: white;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .toast {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        max-width: none;
        width: calc(100% - 20px);
      }

      .toast-message {
        font-size: 13px;
      }

      .toast-description {
        font-size: 12px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .toast {
        backdrop-filter: blur(12px);
      }

      .toast-success {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
      }

      .toast-error {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
      }

      .toast-warning {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
      }

      .toast-info {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
      }

      .toast-dismiss:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  // Input signals
  readonly message = input.required<string>();
  readonly description = input<string>();
  readonly type = input<ToastType>('info');
  readonly dismissible = input(true);
  readonly duration = input<number | null>(5000); // Auto-dismiss after 5s, null for manual dismiss only
  
  // Output signals
  readonly dismissed = output<void>();

  private timeoutId?: number;

  ngOnInit() {
    // Auto-dismiss after duration if specified
    const autoDismissDuration = this.duration();
    if (autoDismissDuration && autoDismissDuration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.onDismiss();
      }, autoDismissDuration);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  onDismiss() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.dismissed.emit();
  }
}