import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ChipComponent } from '../chip/chip.component';
import { TypeaheadComponent, TypeaheadOption } from '../typeahead/typeahead.component';

/**
 * Multi-select component using chips and typeahead for selection
 * Supports maximum selection limits and custom option display
 */
@Component({
  selector: 'app-multi-select',
  imports: [ChipComponent, TypeaheadComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="multi-select-container">
      <!-- Selected items as chips -->
      @if (selectedItems().length > 0) {
        <div class="selected-chips">
          @for (item of selectedItems(); track item.value) {
            <app-chip
              [text]="item.label"
              type="action"
              variant="category"
              icon="×"
              (clicked)="removeItem(item)"
            />
          }
        </div>
      }

      <!-- Typeahead for adding new items -->
      @if (!isMaxSelectionReached()) {
        <app-typeahead
          [placeholder]="placeholder"
          [disabled]="disabled"
          [searchFunction]="searchFunction"
          [displayFunction]="displayFunction"
          [compareFunction]="compareFunction"
          (selectedOption)="addItem($event)"
        />
      } @else {
        <div class="max-selection-message">
          Maximum {{ maxSelections }} {{ maxSelections === 1 ? 'selection' : 'selections' }} reached
        </div>
      }

      @if (helpText) {
        <div class="help-text">{{ helpText }}</div>
      }
    </div>
  `,
  styles: [`
    .multi-select-container {
      width: 100%;
    }

    .selected-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
      min-height: 24px;
    }

    .max-selection-message {
      padding: 12px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      color: #6c757d;
      font-size: 14px;
      text-align: center;
    }

    .help-text {
      margin-top: 6px;
      font-size: 12px;
      color: #6c757d;
      line-height: 1.4;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .selected-chips {
        gap: 6px;
        margin-bottom: 10px;
      }
    }
  `]
})
export class MultiSelectComponent<T = any> implements ControlValueAccessor {
  @Input() placeholder = 'Search and select...';
  @Input() disabled = false;
  @Input() maxSelections = 3;
  @Input() helpText = '';
  @Input() searchFunction: (query: string) => Promise<TypeaheadOption<T>[]> | TypeaheadOption<T>[] = () => [];
  @Input() displayFunction: (value: T) => string = (value: T) => String(value);
  @Input() compareFunction: (a: T, b: T) => boolean = (a: T, b: T) => a === b;

  @Output() selectionChanged = new EventEmitter<TypeaheadOption<T>[]>();

  // Component state
  readonly selectedItems = signal<TypeaheadOption<T>[]>([]);

  // Computed properties
  readonly isMaxSelectionReached = computed(() =>
    this.selectedItems().length >= this.maxSelections
  );

  // ControlValueAccessor
  private onChange = (value: T[]) => {};
  private onTouched = () => {};

  addItem(option: TypeaheadOption<T>) {
    if (this.isMaxSelectionReached()) return;

    const currentItems = this.selectedItems();
    const alreadySelected = currentItems.some(item =>
      this.compareFunction(item.value, option.value)
    );

    if (!alreadySelected) {
      const newItems = [...currentItems, option];
      this.selectedItems.set(newItems);
      this.updateValue();
      this.selectionChanged.emit(newItems);
    }
  }

  removeItem(option: TypeaheadOption<T>) {
    const currentItems = this.selectedItems();
    const newItems = currentItems.filter(item =>
      !this.compareFunction(item.value, option.value)
    );

    this.selectedItems.set(newItems);
    this.updateValue();
    this.selectionChanged.emit(newItems);
  }

  private updateValue() {
    const values = this.selectedItems().map(item => item.value);
    this.onChange(values);
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(values: T[] | null): void {
    if (!values || !Array.isArray(values)) {
      this.selectedItems.set([]);
      return;
    }

    // Convert values back to TypeaheadOptions
    // Note: This requires the parent to provide enough context
    // For now, we'll create basic options with value as label
    const options: TypeaheadOption<T>[] = values.map(value => ({
      value,
      label: this.displayFunction(value)
    }));

    this.selectedItems.set(options);
  }

  registerOnChange(fn: (value: T[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
