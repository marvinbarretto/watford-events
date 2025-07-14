import { Component, Input, Output, EventEmitter, forwardRef, signal, inject, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TypeaheadComponent, TypeaheadOption } from '@shared/ui/typeahead/typeahead.component';
import { VenueLookupService } from '@shared/data-access/venue-lookup.service';
import { Venue } from '../../../venues/utils/venue.model';
import { IconComponent } from '@shared/ui/icon/icon.component';

/**
 * Reusable venue selection component that combines typeahead search with venue display
 * Features:
 * - Typeahead search for venues
 * - Display selected venue as a tag
 * - Clear selected venue functionality
 * - Reactive forms integration via ControlValueAccessor
 * - Venue inference for unrecognized venues
 */
@Component({
  selector: 'app-venue-select',
  imports: [TypeaheadComponent, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VenueSelectComponent),
      multi: true
    }
  ],
  template: `
    <!-- Show typeahead when no venue selected -->
    @if (!selectedVenue()) {
      <app-typeahead
        class="venue-typeahead"
        [class.field-error]="hasError"
        [placeholder]="placeholder"
        [searchFunction]="venueSearchFunction"
        [displayFunction]="venueDisplayFunction"
        [compareFunction]="venueCompareFunction"
        [debounceTime]="300"
        [minSearchLength]="2"
        [ariaLabel]="ariaLabel"
        [disabled]="disabled"
        (selectedOption)="onVenueSelected($event)"
        (searchChanged)="onLocationSearchChanged($event)"
        [inputClass]="inputClass"
        #venueTypeahead
      ></app-typeahead>
    }

    <!-- Show venue tag when venue selected -->
    @if (selectedVenue()) {
      <div class="venue-tag" [class.llm-populated]="isLlmPopulated">
        <span class="venue-icon">📍</span>
        <span class="venue-details">
          <span class="venue-name">{{ selectedVenue()!.name }}</span>
          <span class="venue-address">{{ selectedVenue()!.address }}</span>
        </span>
        <button class="remove-venue-btn" 
                (click)="clearVenue()" 
                type="button" 
                [attr.aria-label]="'Clear ' + selectedVenue()!.name"
                [disabled]="disabled">
          <app-icon name="close" size="xs" />
        </button>
      </div>
    }

    <!-- Venue inference hint -->
    @if (showVenueInference()) {
      <div class="inference-hint">
        <span class="hint-icon">{{ getVenueInferenceIcon() }}</span>
        <span class="hint-text">{{ venueInferenceMessage() }}</span>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    /* Venue Typeahead Integration */
    .venue-typeahead {
      width: 100%;
    }

    /* Selected Venue Display */
    .venue-tag {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: var(--primary);
      color: var(--on-primary);
      border-radius: 12px;
      border: 2px solid var(--primary);
      min-height: 56px;
      box-sizing: border-box;
      position: relative;
      transition: all 0.2s;
    }

    .venue-tag:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    .venue-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .venue-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .venue-name {
      font-weight: 600;
      font-size: 0.875rem;
      line-height: 1.2;
    }

    .venue-address {
      font-size: 0.75rem;
      opacity: 0.9;
      line-height: 1.2;
    }

    .remove-venue-btn {
      background: none;
      border: none;
      color: var(--on-primary);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s;
      line-height: 1;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .remove-venue-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .remove-venue-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Inference Hint */
    .inference-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--success);
      color: var(--background);
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .hint-icon {
      font-size: 1rem;
    }

    /* LLM Populated State */
    .venue-tag.llm-populated {
      background: var(--primary-lighter, rgba(99, 102, 241, 0.08));
      border-color: var(--primary);
      animation: llmGlow 0.5s ease-out;
    }

    .venue-tag.llm-populated::after {
      content: '✨';
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      opacity: 0.7;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes llmGlow {
      0% {
        background: var(--primary-lighter, rgba(99, 102, 241, 0.15));
        box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
      }
      100% {
        background: var(--primary-lighter, rgba(99, 102, 241, 0.08));
        box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-50%) scale(0.8); }
      to { opacity: 0.7; transform: translateY(-50%) scale(1); }
    }

    /* Error State */
    :host(.field-error) .venue-typeahead {
      border-color: var(--error);
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .venue-tag {
        padding: 0.875rem 1rem;
      }
      
      .venue-name {
        font-size: 0.8rem;
      }
      
      .venue-address {
        font-size: 0.7rem;
      }
    }
  `]
})
export class VenueSelectComponent implements ControlValueAccessor {
  // Services
  protected readonly venueLookupService = inject(VenueLookupService);

  // Inputs
  @Input() placeholder = 'e.g., The Globe Theatre, Watford';
  @Input() inputClass = 'field-input';
  @Input() name = 'venue';
  @Input() ariaLabel = 'Search for venue or enter custom location';
  @Input() disabled = false;
  @Input() hasError = false;
  @Input() isLlmPopulated = false;

  // Outputs
  @Output() venueSelected = new EventEmitter<Venue>();
  @Output() venueCleared = new EventEmitter<void>();
  @Output() locationChanged = new EventEmitter<string>();

  // State
  readonly selectedVenue = signal<Venue | null>(null);
  readonly locationText = signal<string>('');
  
  // Venue inference
  readonly inferredVenueMatch = signal<Venue | null>(null);
  readonly venueInferenceType = signal<'close-match' | 'new-venue' | null>(null);
  readonly venueInferenceMessage = signal<string>('');

  // Venue typeahead functions
  readonly venueSearchFunction = (query: string) => this.venueLookupService.searchVenues(query);
  readonly venueDisplayFunction = (venue: Venue) => this.venueLookupService.displayVenue(venue);
  readonly venueCompareFunction = (a: Venue, b: Venue) => this.venueLookupService.compareVenues(a, b);

  // Computed
  readonly showVenueInference = computed(() => {
    return !!(this.venueInferenceType() && this.venueInferenceMessage() && !this.selectedVenue());
  });

  // Control Value Accessor
  private onChange = (value: { venue: Venue | null; location: string; venueId?: string }) => {};
  private onTouched = () => {};

  writeValue(value: any): void {
    if (value && typeof value === 'object') {
      if (value.venue) {
        this.selectedVenue.set(value.venue);
        this.locationText.set(value.venue.name);
      } else if (value.location) {
        this.locationText.set(value.location);
        this.selectedVenue.set(null);
      }
    } else {
      this.selectedVenue.set(null);
      this.locationText.set('');
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Event handlers
  onVenueSelected(option: TypeaheadOption<Venue>) {
    const venue = option.value;
    this.selectedVenue.set(venue);
    this.clearVenueInference();
    
    // Emit change
    this.onChange({
      venue: venue,
      location: venue.name,
      venueId: venue.id
    });
    
    this.venueSelected.emit(venue);
  }

  onLocationSearchChanged(query: string) {
    this.locationText.set(query);
    
    // Clear selected venue if user is typing a custom location
    if (this.selectedVenue() && query !== this.selectedVenue()!.name) {
      this.selectedVenue.set(null);
    }
    
    // Emit change
    this.onChange({
      venue: null,
      location: query,
      venueId: undefined
    });
    
    this.locationChanged.emit(query);
    
    // Trigger venue inference
    this.runVenueInference(query);
  }

  clearVenue() {
    this.selectedVenue.set(null);
    this.clearVenueInference();
    this.locationText.set('');
    
    // Emit change
    this.onChange({
      venue: null,
      location: '',
      venueId: undefined
    });
    
    this.venueCleared.emit();
    this.onTouched();
  }

  private clearVenueInference() {
    this.inferredVenueMatch.set(null);
    this.venueInferenceType.set(null);
    this.venueInferenceMessage.set('');
  }

  private async runVenueInference(query: string) {
    // Clear previous inference
    this.clearVenueInference();

    // Skip inference if query is too short or if venue is already selected
    if (!query || query.length < 3 || this.selectedVenue()) {
      return;
    }

    try {
      const analysis = await this.venueLookupService.analyzeVenueInput(query);
      
      if (analysis.type === 'close-match' && analysis.venue) {
        this.inferredVenueMatch.set(analysis.venue);
        this.venueInferenceType.set('close-match');
        this.venueInferenceMessage.set(analysis.message);
      } else if (analysis.type === 'new-venue' && analysis.message) {
        this.inferredVenueMatch.set(null);
        this.venueInferenceType.set('new-venue');
        this.venueInferenceMessage.set(analysis.message);
      }
      // For exact matches, we don't show inference as the venue should appear in typeahead
    } catch (error) {
      console.error('Error running venue inference:', error);
      this.clearVenueInference();
    }
  }

  getVenueInferenceIcon(): string {
    const type = this.venueInferenceType();
    switch (type) {
      case 'close-match':
        return '📍';
      case 'new-venue':
        return '🏢';
      default:
        return '📍';
    }
  }
}