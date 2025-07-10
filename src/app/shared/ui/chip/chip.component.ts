import { Component, input, output, computed } from '@angular/core';

export type ChipType = 'ui' | 'action';
export type ChipVariant = 'status' | 'category' | 'confidence' | 'feature' | 'custom';
export type ChipStatus = 'published' | 'draft' | 'cancelled' | 'mock' | 'featured' | 'live';

@Component({
  selector: 'app-chip',
  standalone: true,
  template: `
    <span
      class="chip"
      [class]="chipClasses()"
      [style.background-color]="customColor()"
      [style.border-color]="customBorderColor()"
      [style.color]="customTextColor()"
      (click)="handleClick()"
    >
      @if (icon()) {
        <span class="chip-icon">{{ icon() }}</span>
      }
      <span class="chip-text">{{ text() }}</span>
    </span>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    /* Base Types */
    .chip-ui {
      background: transparent;
      border: 1px solid #e9ecef;
      color: #666;
    }

    .chip-action {
      cursor: pointer;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      color: #495057;
    }

    .chip-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      filter: brightness(0.95);
    }

    /* Status Variants */
    .chip-status.status-published,
    .chip-status.status-live {
      background: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }

    .chip-status.status-draft {
      background: #fff3cd;
      color: #856404;
      border-color: #ffeaa7;
    }

    .chip-status.status-cancelled {
      background: #f8d7da;
      color: #721c24;
      border-color: #f5c6cb;
    }

    .chip-status.status-mock {
      background: rgba(255, 193, 7, 0.2);
      color: #856404;
      border-color: rgba(255, 193, 7, 0.5);
    }

    .chip-status.status-featured {
      background: #e3f2fd;
      color: #0d47a1;
      border-color: #bbdefb;
    }

    /* Category Variants */
    .chip-category {
      background: #e7f3ff;
      color: #0066cc;
      border-color: #b3d9ff;
    }

    /* Confidence Variants */
    .chip-confidence {
      background: #f0f8ff;
      color: #0066cc;
      border-color: #cce5ff;
    }

    .chip-confidence.low-confidence {
      background: #fff3cd;
      color: #856404;
      border-color: #ffeaa7;
    }

    /* Feature Variants */
    .chip-feature {
      background: #fff3e0;
      color: #ef6c00;
      border-color: #ffcc80;
    }

    /* Action chip specific styles */
    .chip-action.chip-status.status-published:hover,
    .chip-action.chip-status.status-live:hover {
      background: #c3e6cb;
    }

    .chip-action.chip-status.status-draft:hover {
      background: #ffeaa7;
    }

    .chip-action.chip-status.status-cancelled:hover {
      background: #f5c6cb;
    }

    .chip-icon {
      font-size: 14px;
      line-height: 1;
    }

    .chip-text {
      line-height: 1;
    }
  `]
})
export class ChipComponent {
  // Required inputs
  readonly text = input.required<string>();
  
  // Optional inputs
  readonly type = input<ChipType>('ui');
  readonly variant = input<ChipVariant>('custom');
  readonly status = input<ChipStatus | null>(null);
  readonly color = input<string | null>(null);
  readonly borderColor = input<string | null>(null);
  readonly textColor = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly clickable = input<boolean>(false);
  readonly lowConfidence = input<boolean>(false);

  // Outputs
  readonly clicked = output<void>();

  // Computed properties
  readonly chipClasses = computed(() => {
    const classes = ['chip'];
    
    // Add type class
    classes.push(`chip-${this.type()}`);
    
    // Add variant class
    if (this.variant() !== 'custom') {
      classes.push(`chip-${this.variant()}`);
    }
    
    // Add status class if provided
    if (this.status()) {
      classes.push(`status-${this.status()}`);
    }
    
    // Add low confidence class
    if (this.lowConfidence()) {
      classes.push('low-confidence');
    }
    
    return classes.join(' ');
  });

  readonly customColor = computed(() => {
    return this.color() || null;
  });

  readonly customBorderColor = computed(() => {
    return this.borderColor() || null;
  });

  readonly customTextColor = computed(() => {
    return this.textColor() || null;
  });

  readonly isClickable = computed(() => {
    return this.type() === 'action' || this.clickable();
  });

  handleClick() {
    if (this.isClickable()) {
      this.clicked.emit();
    }
  }
}