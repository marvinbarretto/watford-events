import { Component, forwardRef, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ChipComponent } from '../chip/chip.component';

/**
 * Simple hashtag-style tag input component
 * Allows users to add custom tags with autocomplete from existing popular tags
 */
@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [ChipComponent, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="tag-input-container">
      <!-- Selected tags as chips -->
      @if (tags().length > 0) {
        <div class="tag-chips">
          @for (tag of tags(); track tag) {
            <app-chip
              [text]="'#' + tag"
              type="action"
              variant="feature"
              icon="×"
              (clicked)="removeTag(tag)"
            />
          }
        </div>
      }
      
      <!-- Input for adding new tags -->
      @if (!isMaxTagsReached()) {
        <div class="tag-input-wrapper">
          <input
            type="text"
            [formControl]="inputControl"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            class="tag-input"
            (keydown)="onKeyDown($event)"
            (blur)="onInputBlur()"
          />
          
          <!-- Autocomplete suggestions -->
          @if (showSuggestions() && filteredSuggestions().length > 0) {
            <div class="suggestions-dropdown">
              @for (suggestion of filteredSuggestions(); track suggestion; let i = $index) {
                <div 
                  class="suggestion-item"
                  [class.selected]="selectedSuggestionIndex() === i"
                  (click)="selectSuggestion(suggestion)"
                  (mouseenter)="setSelectedSuggestionIndex(i)"
                >
                  #{{ suggestion }}
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="max-tags-message">
          Maximum {{ maxTags() }} {{ maxTags() === 1 ? 'tag' : 'tags' }} reached
        </div>
      }
      
      @if (helpText()) {
        <div class="help-text">{{ helpText() }}</div>
      }
    </div>
  `,
  styles: [`
    .tag-input-container {
      width: 100%;
    }

    .tag-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
      min-height: 24px;
    }

    .tag-input-wrapper {
      position: relative;
    }

    .tag-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .tag-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .tag-input:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      margin-top: 2px;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      max-height: 150px;
      overflow-y: auto;
    }

    .suggestion-item {
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f8f9fa;
      transition: background-color 0.2s;
      color: #ef6c00;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover,
    .suggestion-item.selected {
      background: #fff3e0;
    }

    .max-tags-message {
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
      .tag-chips {
        gap: 6px;
        margin-bottom: 10px;
      }
      
      .tag-input {
        padding: 10px;
      }
      
      .suggestion-item {
        padding: 8px 10px;
      }
    }
  `]
})
export class TagInputComponent implements ControlValueAccessor {
  // Modern signal inputs
  readonly placeholder = signal('Add hashtags... (e.g., #livemusic, #family)');
  readonly disabled = signal(false);
  readonly maxTags = signal(10);
  readonly helpText = signal('');
  readonly suggestions = signal<string[]>([]);
  readonly allowCustomTags = signal(true);
  readonly minTagLength = signal(2);
  readonly maxTagLength = signal(30);

  // Component state
  readonly tags = signal<string[]>([]);
  readonly inputControl = new FormControl('');
  readonly showSuggestions = signal(false);
  readonly selectedSuggestionIndex = signal(-1);

  // Computed properties
  readonly isMaxTagsReached = computed(() => 
    this.tags().length >= this.maxTags()
  );

  readonly filteredSuggestions = computed(() => {
    const input = this.inputControl.value?.toLowerCase() || '';
    if (!input || input.length < this.minTagLength()) return [];
    
    return this.suggestions()
      .filter(suggestion => 
        suggestion.toLowerCase().includes(input) &&
        !this.tags().includes(suggestion)
      )
      .slice(0, 5);
  });

  // ControlValueAccessor
  private onChange = (value: string[]) => {};
  private onTouched = () => {};

  constructor() {
    // Setup suggestion filtering
    this.inputControl.valueChanges.subscribe(value => {
      const hasInput = Boolean(value && value.length >= this.minTagLength());
      const hasSuggestions = this.filteredSuggestions().length > 0;
      this.showSuggestions.set(hasInput && hasSuggestions);
    });
  }

  onKeyDown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();

    // Remove # if user types it
    if (value.startsWith('#')) {
      value = value.substring(1);
    }

    switch (event.key) {
      case 'Enter':
      case ',':
      case ';':
      case ' ':
        event.preventDefault();
        if (this.selectedSuggestionIndex() >= 0) {
          this.selectSuggestion(this.filteredSuggestions()[this.selectedSuggestionIndex()]);
        } else if (value && this.allowCustomTags()) {
          this.addTag(value);
        }
        break;

      case 'Backspace':
        if (!value && this.tags().length > 0) {
          this.removeTag(this.tags()[this.tags().length - 1]);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (this.showSuggestions()) {
          const suggestions = this.filteredSuggestions();
          const currentIndex = this.selectedSuggestionIndex();
          const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
          this.setSelectedSuggestionIndex(nextIndex);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.showSuggestions()) {
          const suggestions = this.filteredSuggestions();
          const currentIndex = this.selectedSuggestionIndex();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
          this.setSelectedSuggestionIndex(prevIndex);
        }
        break;

      case 'Escape':
        this.showSuggestions.set(false);
        this.selectedSuggestionIndex.set(-1);
        break;
    }
  }

  onInputBlur() {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      this.showSuggestions.set(false);
      this.selectedSuggestionIndex.set(-1);
      this.onTouched();
    }, 200);
  }

  selectSuggestion(suggestion: string) {
    this.addTag(suggestion);
  }

  setSelectedSuggestionIndex(index: number) {
    this.selectedSuggestionIndex.set(index);
  }

  addTag(tagText: string) {
    const tag = this.normalizeTag(tagText);
    
    if (!tag || tag.length < this.minTagLength() || tag.length > this.maxTagLength()) {
      return;
    }

    if (this.isMaxTagsReached() || this.tags().includes(tag)) {
      return;
    }

    const newTags = [...this.tags(), tag];
    this.tags.set(newTags);
    this.inputControl.setValue('', { emitEvent: false });
    this.showSuggestions.set(false);
    this.selectedSuggestionIndex.set(-1);
    
    this.updateValue();
  }

  removeTag(tag: string) {
    const newTags = this.tags().filter(t => t !== tag);
    this.tags.set(newTags);
    this.updateValue();
  }

  private normalizeTag(tag: string): string {
    return tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters except letters/numbers
      .substring(0, this.maxTagLength());
  }

  private updateValue() {
    this.onChange(this.tags());
  }

  // ControlValueAccessor implementation
  writeValue(tags: string[] | null): void {
    if (!tags || !Array.isArray(tags)) {
      this.tags.set([]);
      return;
    }
    
    this.tags.set([...tags]);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.inputControl.disable();
    } else {
      this.inputControl.enable();
    }
  }

  // Public methods for parent components
  setSuggestions(suggestions: string[]) {
    this.suggestions.set(suggestions);
  }

  setHelpText(text: string) {
    this.helpText.set(text);
  }

  setMaxTags(max: number) {
    this.maxTags.set(max);
  }
}