import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, inject, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';

/**
 * Option type for typeahead items
 */
export type TypeaheadOption<T = any> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

/**
 * Reusable typeahead component with search functionality
 * Supports custom data sources and display templates
 */
@Component({
  selector: 'app-typeahead',
  standalone: true,
  imports: [ReactiveFormsModule, OverlayModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypeaheadComponent),
      multi: true
    }
  ],
  template: `
    <div class="typeahead-container">
      <input
        #searchInput
        type="text"
        [formControl]="searchControl"
        [class]="inputClass"
        [placeholder]="placeholder"
        [readonly]="readonly"
        [disabled]="disabled"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
        autocomplete="off"
      />
      
      @if (isLoading()) {
        <div class="loading-indicator">
          <span>🔍 Searching...</span>
        </div>
      }
      
      @if (showDropdown() && options().length > 0) {
        <div class="dropdown-overlay" 
             cdkOverlayOrigin 
             #trigger="cdkOverlayOrigin">
          <div class="dropdown-content">
            @for (option of options(); track option.value; let i = $index) {
              <div 
                class="dropdown-item"
                [class.selected]="selectedIndex() === i"
                [class.disabled]="option.disabled"
                (click)="selectOption(option)"
                (mouseenter)="setSelectedIndex(i)"
              >
                <div class="option-label">{{ option.label }}</div>
                @if (option.description) {
                  <div class="option-description">{{ option.description }}</div>
                }
              </div>
            }
          </div>
        </div>
      }
      
      @if (showDropdown() && options().length === 0 && searchControl.value && !isLoading()) {
        <div class="dropdown-overlay">
          <div class="dropdown-content">
            <div class="dropdown-item no-results">
              <div class="option-label">No results found</div>
              <div class="option-description">Try a different search term</div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .typeahead-container {
      position: relative;
      width: 100%;
    }

    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
    }

    input:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .loading-indicator {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
      font-size: 14px;
    }

    .dropdown-overlay {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      margin-top: 2px;
    }

    .dropdown-content {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      max-height: 200px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #f8f9fa;
      transition: background-color 0.2s;
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item:hover:not(.disabled),
    .dropdown-item.selected:not(.disabled) {
      background: #f8f9fa;
    }

    .dropdown-item.disabled {
      color: #6c757d;
      cursor: not-allowed;
      background: #f8f9fa;
    }

    .dropdown-item.no-results {
      color: #6c757d;
      cursor: default;
    }

    .dropdown-item.no-results:hover {
      background: white;
    }

    .option-label {
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
    }

    .option-description {
      font-size: 14px;
      color: #6c757d;
      line-height: 1.3;
    }

    .disabled .option-label {
      color: #6c757d;
    }

    /* Auto-filled styling */
    .auto-filled {
      background: #e7f3ff;
      border-color: #007bff;
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
      .dropdown-content {
        max-height: 150px;
      }
      
      .dropdown-item {
        padding: 10px;
      }
    }
  `]
})
export class TypeaheadComponent<T = any> implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() placeholder = 'Search...';
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() inputClass = 'form-control';
  @Input() debounceTime = 300;
  @Input() minSearchLength = 1;
  @Input() searchFunction: (query: string) => Promise<TypeaheadOption<T>[]> | TypeaheadOption<T>[] = () => [];
  @Input() displayFunction: (value: T) => string = (value: T) => String(value);
  @Input() compareFunction: (a: T, b: T) => boolean = (a: T, b: T) => a === b;

  @Output() selectedOption = new EventEmitter<TypeaheadOption<T>>();
  @Output() searchChanged = new EventEmitter<string>();

  // Component state
  readonly searchControl = new FormControl('');
  readonly isLoading = signal(false);
  readonly showDropdown = signal(false);
  readonly selectedIndex = signal(-1);
  readonly options = signal<TypeaheadOption<T>[]>([]);

  // Internal state
  private destroy$ = new Subject<void>();
  private currentValue: T | null = null;
  private hasFocus = false;

  // ControlValueAccessor
  private onChange = (value: T | null) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.length < this.minSearchLength) {
            this.options.set([]);
            this.showDropdown.set(false);
            return of([]);
          }

          this.isLoading.set(true);
          this.searchChanged.emit(query);

          const result = this.searchFunction(query);
          if (result instanceof Promise) {
            return result;
          }
          return of(result);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (options) => {
          this.options.set(options);
          this.selectedIndex.set(-1);
          this.showDropdown.set(this.hasFocus && options.length > 0);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Typeahead search error:', error);
          this.options.set([]);
          this.showDropdown.set(false);
          this.isLoading.set(false);
        }
      });
  }

  onFocus() {
    this.hasFocus = true;
    if (this.options().length > 0) {
      this.showDropdown.set(true);
    }
  }

  onBlur() {
    this.hasFocus = false;
    // Delay hiding dropdown to allow for option selection
    setTimeout(() => {
      this.showDropdown.set(false);
      this.onTouched();
    }, 200);
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.showDropdown()) return;

    const optionsArray = this.options();
    const currentIndex = this.selectedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < optionsArray.length - 1 ? currentIndex + 1 : 0;
        this.setSelectedIndex(nextIndex);
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : optionsArray.length - 1;
        this.setSelectedIndex(prevIndex);
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < optionsArray.length) {
          this.selectOption(optionsArray[currentIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showDropdown.set(false);
        this.selectedIndex.set(-1);
        break;
    }
  }

  setSelectedIndex(index: number) {
    this.selectedIndex.set(index);
  }

  selectOption(option: TypeaheadOption<T>) {
    if (option.disabled) return;

    this.currentValue = option.value;
    this.searchControl.setValue(option.label, { emitEvent: false });
    this.showDropdown.set(false);
    this.selectedIndex.set(-1);
    
    this.onChange(option.value);
    this.selectedOption.emit(option);
  }

  // ControlValueAccessor implementation
  writeValue(value: T | null): void {
    this.currentValue = value;
    if (value) {
      const displayValue = this.displayFunction(value);
      this.searchControl.setValue(displayValue, { emitEvent: false });
    } else {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }
}