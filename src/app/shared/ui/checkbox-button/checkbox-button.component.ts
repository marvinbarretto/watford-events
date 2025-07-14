import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox-button',
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxButtonComponent),
      multi: true
    }
  ],
  template: `
    <label 
      class="checkbox-button"
      [class.checked]="checked"
      [class.disabled]="disabled"
    >
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onToggle($event)"
        (blur)="onTouched()"
      />
      <span class="checkbox-button-content">
        <ng-content>{{ label }}</ng-content>
      </span>
    </label>
  `,
  styles: [`
    .checkbox-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--background-lighter);
      min-height: 44px; /* Accessibility: minimum touch target */
      box-sizing: border-box;
      user-select: none;
    }

    .checkbox-button:hover:not(.disabled) {
      border-color: var(--primary);
      background: var(--background);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .checkbox-button:focus-within {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .checkbox-button.checked {
      border-color: var(--primary);
      background: var(--primary-light);
      color: var(--primary-dark);
    }

    .checkbox-button.checked:hover:not(.disabled) {
      background: var(--primary);
      color: var(--on-primary);
    }

    .checkbox-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--background-lighter);
      border-color: var(--border);
    }

    .checkbox-button input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .checkbox-button-content {
      font-size: 0.9rem;
      font-weight: 500;
      color: inherit;
      flex: 1;
      text-align: left;
    }

    /* Layout variants */
    .checkbox-buttons-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-buttons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .checkbox-buttons-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* Compact variant for inline use */
    .checkbox-buttons-inline .checkbox-button {
      padding: 0.5rem 0.875rem;
      min-height: 36px;
      border-radius: 20px;
    }

    .checkbox-buttons-inline .checkbox-button-content {
      font-size: 0.8rem;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .checkbox-buttons-grid {
        grid-template-columns: 1fr;
      }
      
      .checkbox-button {
        padding: 0.75rem 1rem;
      }
    }
  `]
})
export class CheckboxButtonComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() value: any = null;
  @Input() disabled = false;
  @Input() checked = false;
  
  @Output() checkedChange = new EventEmitter<boolean>();

  onChange = (value: any) => {};
  onTouched = () => {};

  onToggle(event: Event) {
    if (this.disabled) return;
    
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    
    // Emit for template binding
    this.checkedChange.emit(this.checked);
    
    // For ControlValueAccessor
    this.onChange(this.checked ? this.value || this.label : null);
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.checked = Boolean(value);
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}