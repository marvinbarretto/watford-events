import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventParsingService, EditableEventData, ParsedEventData, ParsedField } from '@events/data-access/event-parsing.service';
import { EventCategory, EVENT_CATEGORIES, EventModel, EventType } from '@events/utils/event.model';

@Component({
  selector: 'app-event-parser',
  imports: [FormsModule],
  styles: [`
    .parser {
      min-height: 100vh;
      background: var(--background);
    }

    /* Header */
    .parser__header {
      background: var(--background-darker);
      border-bottom: 1px solid var(--border);
      padding: 1.5rem;
    }

    .parser__header-inner {
      max-width: 1400px;
      margin: 0 auto;
    }

    .parser__title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.25rem 0;
    }

    .parser__subtitle {
      color: var(--text-secondary);
      margin: 0;
    }

    .parser__status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
    }

    /* Confidence indicator */
    .confidence {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .confidence__bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .confidence__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
    }

    .confidence__track {
      width: 6rem;
      height: 0.375rem;
      background: var(--background-darkest);
      border-radius: 999px;
      overflow: hidden;
    }

    .confidence__fill {
      height: 100%;
      background: linear-gradient(to right, var(--error), var(--warning), var(--success));
      border-radius: 999px;
      transition: width 0.5s ease;
    }

    .confidence__value {
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 3rem;
    }

    .confidence__value--high { color: var(--success); }
    .confidence__value--medium { color: var(--warning); }
    .confidence__value--low { color: var(--error); }

    /* Field legend */
    .legend {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
    }

    .legend__item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--text-muted);
    }

    .legend__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
    }

    .legend__dot--parsed { background: var(--success); }
    .legend__dot--low { background: var(--warning); }
    .legend__dot--empty { background: var(--background-darker); }

    /* AI toggle */
    .ai-toggle {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .ai-toggle input {
      margin-right: 0.5rem;
    }

    /* Main content panels */
    .parser__content {
      display: flex;
      height: calc(100vh - 140px);
    }

    .parser__panel {
      width: 50%;
      padding: 1.5rem;
    }

    .parser__panel--left {
      padding-right: 0.75rem;
    }

    .parser__panel--right {
      padding-left: 0.75rem;
    }

    /* Panel card */
    .panel {
      background: var(--background-lighter);
      border-radius: 0.75rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel__header {
      background: var(--background-lightest);
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .panel__title {
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .panel__actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Buttons */
    .btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .btn--secondary {
      background: var(--secondary);
      color: var(--on-secondary);
    }

    .btn--secondary:hover {
      background: var(--secondary-hover);
    }

    .btn--primary {
      background: var(--primary);
      color: var(--on-primary);
    }

    .btn--primary:hover {
      background: var(--primary-hover);
    }

    .btn--primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn--success {
      background: var(--success);
      color: var(--background-darker);
    }

    .btn--success:hover {
      background: var(--success-hover);
    }

    .panel__body {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Input panel */
    .input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .input-textarea {
      flex: 1;
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      resize: none;
      font-family: monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      transition: all 0.2s;
      background: var(--background-darkest);
      color: var(--text);
    }

    .input-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--shadow);
    }

    .input-highlighted {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--primary);
      border-radius: 0.5rem;
      background: var(--background-darkest);
      font-family: monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      overflow: auto;
      white-space: pre-wrap;
    }

    /* Append mode indicator */
    .append-mode {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--background-darkest);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
    }

    .append-mode__label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .append-mode__label input {
      cursor: pointer;
    }

    .append-mode__help {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      margin-left: 1.5rem;
    }

    /* JSON editor */
    .json {
      font-family: monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--text);
      overflow: auto;
      flex: 1;
    }

    .json__line {
      display: flex;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .json__line--indent {
      margin-left: 1rem;
    }

    .json__key {
      color: var(--primary);
      margin-right: 0.5rem;
    }

    .json__value-wrapper {
      flex: 1;
    }

    .json__field-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .field-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
    }

    .field-dot--parsed { background: var(--success); }
    .field-dot--low { background: var(--warning); }
    .field-dot--empty { background: var(--background-darker); }

    .field-confidence {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .json__value-display {
      min-height: 1.5rem;
      padding: 0.25rem 0.5rem;
      background: var(--background-darkest);
      border-radius: 0.25rem;
      cursor: text;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .json__value-display:hover {
      background: var(--background);
      border-color: var(--border-strong);
    }

    .json__value-display.hidden {
      display: none !important;
    }

    .json__value-input {
      width: 100%;
      padding: 0.25rem 0.5rem;
      background: var(--background-darkest);
      border: 1px solid var(--primary);
      border-radius: 0.25rem;
      outline: none;
      font-family: inherit;
      font-size: inherit;
      color: var(--text);
    }

    .json__value-input.hidden {
      display: none !important;
    }

    .json__value-input:focus {
      box-shadow: 0 0 0 2px var(--shadow);
    }

    .json__string {
      color: var(--success);
    }

    .json__placeholder {
      color: var(--text-muted);
      font-style: italic;
    }

    .json__punct {
      color: var(--text-muted);
    }

    /* Categories */
    .categories {
      margin-top: 0.5rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.25rem;
    }

    .category {
      display: flex;
      align-items: center;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      transition: background 0.2s;
    }

    .category:hover {
      background: var(--background);
    }

    .category input {
      margin-right: 0.25rem;
      width: 0.75rem;
      height: 0.75rem;
    }

    .category span {
      color: var(--text-secondary);
    }

    /* Tags */
    .tags {
      margin-top: 0.5rem;
    }

    .tags__list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      background: var(--background);
      color: var(--primary);
      border: 1px solid var(--border);
      border-radius: 999px;
      font-size: 0.75rem;
    }

    .tag__remove {
      margin-left: 0.25rem;
      cursor: pointer;
      color: var(--primary);
    }

    .tag__remove:hover {
      color: var(--primary-hover);
    }

    .tags__input-wrapper {
      display: flex;
      gap: 0.25rem;
    }

    .tags__input {
      flex: 1;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.25rem;
      background: var(--background-darkest);
      color: var(--text);
    }

    .tags__input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .tags__add {
      padding: 0.25rem 0.5rem;
      background: var(--primary);
      color: var(--on-primary);
      border: none;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .tags__add:hover {
      background: var(--primary-hover);
    }

    /* Highlight spans for parsed text */
    .highlight-high {
      background-color: var(--success);
      color: var(--background-darker);
      padding: 0 0.25rem;
      border-radius: 0.25rem;
    }

    .highlight-medium {
      background-color: var(--warning);
      color: var(--background-darker);
      padding: 0 0.25rem;
      border-radius: 0.25rem;
    }

    .highlight-low {
      background-color: var(--error);
      color: var(--background-lighter);
      padding: 0 0.25rem;
      border-radius: 0.25rem;
    }
  `],
  template: `
    <div class="parser">
      <!-- Header -->
      <div class="parser__header">
        <div class="parser__header-inner">
          <h1 class="parser__title">Event Parser</h1>
          <p class="parser__subtitle">Extract event data from text and refine the results</p>

          <div class="parser__status-bar">
            <div class="confidence">
              <div class="confidence__bar">
                <span class="confidence__label">Confidence:</span>
                <div class="confidence__track">
                  <div
                    class="confidence__fill"
                    [style.width.%]="overallConfidence()"
                  ></div>
                </div>
                <span class="confidence__value" [class]="getConfidenceColorClass()">{{ overallConfidence() }}%</span>
              </div>

              <div class="legend">
                <div class="legend__item">
                  <div class="legend__dot legend__dot--parsed"></div>
                  <span>Parsed</span>
                </div>
                <div class="legend__item">
                  <div class="legend__dot legend__dot--low"></div>
                  <span>Low confidence</span>
                </div>
                <div class="legend__item">
                  <div class="legend__dot legend__dot--empty"></div>
                  <span>Empty</span>
                </div>
              </div>
            </div>

            <div class="ai-toggle">
              <label>
                <input type="checkbox" [(ngModel)]="useLLM" disabled>
                AI Enhancement (Soon)
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="parser__content">
        <!-- Left Panel - Text Input -->
        <div class="parser__panel parser__panel--left">
          <div class="panel">
            <div class="panel__header">
              <h2 class="panel__title">Input Text</h2>
              <div class="panel__actions">
                <button
                  (click)="clearInput()"
                  class="btn btn--secondary"
                >
                  Clear
                </button>
                <button
                  (click)="parseText()"
                  class="btn btn--primary"
                  [disabled]="!inputText().trim()"
                >
                  Parse
                </button>
              </div>
            </div>

            <div class="panel__body">
              <div class="input-wrapper">
                @if (highlightedText()) {
                  <div class="input-highlighted" [innerHTML]="highlightedText()"></div>
                }

                <textarea
                  [value]="inputText()"
                  (input)="onInputChange($event)"
                  placeholder="Paste event text, flyer content, or any event-related information here..."
                  class="input-textarea"
                  [class.hidden]="highlightedText()"
                ></textarea>

                <div class="append-mode">
                  <label class="append-mode__label">
                    <input
                      type="checkbox"
                      [(ngModel)]="appendMode"
                    />
                    Append mode - add more context
                  </label>
                  <div class="append-mode__help">
                    Keep adding text to improve parsing confidence for uncertain fields
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel - Live JSON Editor -->
        <div class="parser__panel parser__panel--right">
          <div class="panel">
            <div class="panel__header">
              <h2 class="panel__title">Event Data</h2>
              <div class="panel__actions">
                <button
                  (click)="resetToDefaults()"
                  class="btn btn--secondary"
                >
                  Reset
                </button>
                <button
                  (click)="copyEventJson()"
                  class="btn btn--success"
                >
                  Copy JSON
                </button>
                <button
                  (click)="createEvent()"
                  class="btn btn--primary"
                  [disabled]="!editableEvent().title || !editableEvent().date"
                >
                  Create Event
                </button>
              </div>
            </div>

            <div class="panel__body">
              <div class="json">
                <div class="json__punct">{{ '{' }}</div>

                <!-- Title -->
                <div class="json__line json__line--indent">
                  <span class="json__key">"title":</span>
                  <div class="json__value-wrapper">
                    <div class="json__field-info">
                      <span [class]="getFieldIndicatorClass('title')" class="field-dot"></span>
                      @if (getFieldConfidence('title') > 0) {
                        <span class="field-confidence">{{ getFieldConfidence('title') }}%</span>
                      }
                    </div>
                    @if (activeField() !== 'title') {
                      <div
                        (click)="focusField('title')"
                        class="json__value-display"
                      >
                        <span class="json__string">"</span><span [class]="editableEvent().title ? '' : 'json__placeholder'">{{ editableEvent().title || 'Enter title...' }}</span><span class="json__string">"</span>
                      </div>
                    }
                    @if (activeField() === 'title') {
                      <input
                        #titleInput
                        type="text"
                        [value]="editableEvent().title"
                        (input)="updateField('title', $event)"
                        (blur)="blurField()"
                        (keyup.enter)="blurField()"
                        class="json__value-input"
                        placeholder="Event title"
                      />
                    }
                  </div>
                  <span class="json__punct">{{ ',' }}</span>
                </div>

                <!-- Description -->
                <div class="json__line json__line--indent">
                  <span class="json__key">"description":</span>
                  <div class="json__value-wrapper">
                    <div class="json__field-info">
                      <span [class]="getFieldIndicatorClass('description')" class="field-dot"></span>
                      @if (getFieldConfidence('description') > 0) {
                        <span class="field-confidence">{{ getFieldConfidence('description') }}%</span>
                      }
                    </div>
                    @if (activeField() !== 'description') {
                      <div
                        (click)="focusField('description')"
                        class="json__value-display"
                      >
                        <span class="json__string">"</span><span [class]="editableEvent().description ? '' : 'json__placeholder'">{{ editableEvent().description || 'Enter description...' }}</span><span class="json__string">"</span>
                      </div>
                    }
                    @if (activeField() === 'description') {
                      <textarea
                        #descriptionInput
                        [value]="editableEvent().description"
                        (input)="updateField('description', $event)"
                        (blur)="blurField()"
                        rows="3"
                        class="json__value-input"
                        placeholder="Event description"
                      ></textarea>
                    }
                  </div>
                  <span class="json__punct">{{ ',' }}</span>
                </div>

                <!-- Date -->
                <div class="json__line json__line--indent">
                  <span class="json__key">"date":</span>
                  <div class="json__value-wrapper">
                    <div class="json__field-info">
                      <span [class]="getFieldIndicatorClass('date')" class="field-dot"></span>
                      @if (getFieldConfidence('date') > 0) {
                        <span class="field-confidence">{{ getFieldConfidence('date') }}%</span>
                      }
                    </div>
                    @if (activeField() !== 'date') {
                      <div
                        (click)="focusField('date')"
                        class="json__value-display"
                      >
                        <span class="json__string">"</span><span [class]="editableEvent().date ? '' : 'json__placeholder'">{{ editableEvent().date || 'Enter date...' }}</span><span class="json__string">"</span>
                      </div>
                    }
                    @if (activeField() === 'date') {
                      <input
                        #dateInput
                        type="datetime-local"
                        [value]="editableEvent().date"
                        (input)="updateField('date', $event)"
                        (blur)="blurField()"
                        class="json__value-input"
                      />
                    }
                  </div>
                  <span class="json__punct">{{ ',' }}</span>
                </div>

                <!-- Categories -->
                <div class="json__line json__line--indent">
                  <span class="json__key">"categories":</span>
                  <div class="json__value-wrapper">
                    <div class="json__field-info">
                      <span [class]="getFieldIndicatorClass('categories')" class="field-dot"></span>
                    </div>
                    <div>
                      {{ '[' }}
                      @if (editableEvent().categories && editableEvent().categories!.length > 0) {
                        @for (category of editableEvent().categories; track category; let last = $last) {
                          <span class="json__string">"{{ category }}"</span>@if (!last) {<span class="json__punct">{{ ',' }} </span>}
                        }
                      } @else {
                        <span class="json__placeholder">none selected</span>
                      }
                      {{ ']' }}
                    </div>
                    <div class="categories">
                      @for (category of availableCategories.slice(0, 9); track category.value) {
                        <label class="category">
                          <input
                            type="checkbox"
                            [checked]="editableEvent().categories?.includes(category.value)"
                            (change)="toggleCategory(category.value)"
                          />
                          <span>{{ category.label }}</span>
                        </label>
                      }
                    </div>
                  </div>
                </div>

                <!-- Tags -->
                <div class="json__line json__line--indent">
                  <span class="json__key">"tags":</span>
                  <div class="json__value-wrapper">
                    <div class="json__field-info">
                      <span [class]="getFieldIndicatorClass('tags')" class="field-dot"></span>
                    </div>
                    <div>
                      {{ '[' }}
                      @if (editableEvent().tags && editableEvent().tags!.length > 0) {
                        @for (tag of editableEvent().tags; track tag; let last = $last) {
                          <span class="json__string">"{{ tag }}"</span>@if (!last) {<span class="json__punct">{{ ',' }} </span>}
                        }
                      } @else {
                        <span class="json__placeholder">no tags</span>
                      }
                      {{ ']' }}
                    </div>
                    <div class="tags">
                      <div class="tags__list">
                        @for (tag of editableEvent().tags || []; track tag) {
                          <span class="tag">
                            {{ tag }}
                            <button
                              (click)="removeTag(tag)"
                              class="tag__remove"
                            >
                              ×
                            </button>
                          </span>
                        }
                      </div>
                      <div class="tags__input-wrapper">
                        <input
                          type="text"
                          [(ngModel)]="newTag"
                          (keyup.enter)="addTag()"
                          class="tags__input"
                          placeholder="Add tag..."
                        />
                        <button
                          (click)="addTag()"
                          class="tags__add"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="json__punct">{{ '}' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EventParserComponent {
  private parsingService = inject(EventParsingService);

  // Signals for reactive state
  inputText = signal('');
  editableEvent = signal<EditableEventData>(this.getDefaultEvent());
  parsedData = signal<ParsedEventData | null>(null);
  overallConfidence = signal(0);
  highlightedText = signal('');
  activeField = signal<string | null>(null);
  cumulativeText = signal(''); // Store all text added over time
  useLLM = false;
  appendMode = false;
  newTag = '';

  // Available categories for selection
  availableCategories = EVENT_CATEGORIES;

  onInputChange(event: Event) {
    const text = (event.target as HTMLTextAreaElement).value;
    this.inputText.set(text);

    // Auto-parse on input if there's substantial content
    if (text.trim().length > 50) {
      this.parseText();
    }
  }

  parseText() {
    const newText = this.inputText();
    if (!newText.trim()) return;

    let textToParse: string;

    if (this.appendMode && this.cumulativeText()) {
      // In append mode, combine existing cumulative text with new text
      textToParse = this.cumulativeText() + '\n\n' + newText;
      this.cumulativeText.set(textToParse);
      // Clear the input for next append
      this.inputText.set('');
    } else {
      // Normal mode - parse just the new text
      textToParse = newText;
      this.cumulativeText.set(newText);
    }

    const parsed = this.parsingService.parseEventText(textToParse);

    // In append mode, merge with existing data rather than replace
    if (this.appendMode && this.parsedData()) {
      const mergedParsed = this.mergeParsingResults(this.parsedData()!, parsed);
      this.parsedData.set(mergedParsed);
      this.overallConfidence.set(mergedParsed.overallConfidence);

      // Update editable event with merged data, but preserve manual edits
      const newEditable = this.parsingService.convertToEditableFormat(mergedParsed);
      const currentEditable = this.editableEvent();

      // Only update fields that weren't manually edited (preserve user changes)
      const mergedEditable = this.mergeEditableData(currentEditable, newEditable);
      this.editableEvent.set(mergedEditable);
    } else {
      // Normal mode - replace all data
      this.parsedData.set(parsed);
      this.overallConfidence.set(parsed.overallConfidence);

      const editable = this.parsingService.convertToEditableFormat(parsed);
      this.editableEvent.set(editable);
    }

    // Generate highlighted text
    this.generateHighlightedText(textToParse, this.parsedData()!);
  }

  private mergeParsingResults(existing: ParsedEventData, newData: ParsedEventData): ParsedEventData {
    const merged = { ...existing };

    // For each field, keep the one with higher confidence
    Object.keys(newData).forEach(key => {
      if (key === 'overallConfidence') return;

      const existingField = existing[key as keyof ParsedEventData];
      const newField = newData[key as keyof ParsedEventData];

      if (newField && typeof newField === 'object' && 'confidence' in newField) {
        const newParsedField = newField as ParsedField;
        const existingParsedField = existingField as ParsedField;

        // Use new field if it has higher confidence or existing field is empty
        if (!existingParsedField || newParsedField.confidence > existingParsedField.confidence) {
          (merged as any)[key] = newField;
        }
      } else if (Array.isArray(newField)) {
        // For arrays (categories, tags), merge uniquely
        const existingArray = (existingField as any[]) || [];
        const mergedArray = [...new Set([...existingArray, ...newField])];
        (merged as any)[key] = mergedArray;
      }
    });

    // Recalculate overall confidence
    const confidenceValues = Object.values(merged)
      .filter(field => field && typeof field === 'object' && 'confidence' in field)
      .map(field => (field as ParsedField).confidence);

    merged.overallConfidence = confidenceValues.length > 0
      ? Math.round(confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length)
      : 0;

    return merged;
  }

  private mergeEditableData(current: EditableEventData, newData: EditableEventData): EditableEventData {
    const merged = { ...current };

    // Only update fields that are empty or have very low confidence
    Object.keys(newData).forEach(key => {
      const currentValue = current[key as keyof EditableEventData];
      const newValue = newData[key as keyof EditableEventData];

      // If current field is empty, use new value
      if (!currentValue || (typeof currentValue === 'string' && !currentValue.trim()) ||
          (Array.isArray(currentValue) && currentValue.length === 0)) {
        (merged as any)[key] = newValue;
      }
      // For arrays, merge uniquely
      else if (Array.isArray(currentValue) && Array.isArray(newValue)) {
        (merged as any)[key] = [...new Set([...currentValue, ...newValue])];
      }
    });

    return merged;
  }

  private generateHighlightedText(text: string, parsed: ParsedEventData) {
    let highlighted = text;
    const highlights: { start: number; end: number; field: string; confidence: number }[] = [];

    // Collect all highlights with positions
    Object.entries(parsed).forEach(([field, value]) => {
      if (value && typeof value === 'object' && 'startIndex' in value && 'endIndex' in value) {
        const parsedField = value as ParsedField;
        if (parsedField.startIndex !== undefined && parsedField.endIndex !== undefined) {
          highlights.push({
            start: parsedField.startIndex,
            end: parsedField.endIndex,
            field,
            confidence: parsedField.confidence
          });
        }
      }
    });

    // Sort by start position (reverse to avoid index shifting)
    highlights.sort((a, b) => b.start - a.start);

    // Apply highlights
    highlights.forEach(highlight => {
      const cssClass = this.getHighlightClass(highlight.confidence);
      const before = highlighted.substring(0, highlight.start);
      const match = highlighted.substring(highlight.start, highlight.end);
      const after = highlighted.substring(highlight.end);

      highlighted = before +
        `<span class="${cssClass}" title="${highlight.field}: ${highlight.confidence}% confidence">${match}</span>` +
        after;
    });

    this.highlightedText.set(highlighted);
  }

  private getHighlightClass(confidence: number): string {
    if (confidence >= 85) return 'highlight-high';
    if (confidence >= 70) return 'highlight-medium';
    return 'highlight-low';
  }

  getFieldIndicatorClass(field: keyof EditableEventData): string {
    const value = this.editableEvent()[field];
    const hasValue = value && (typeof value === 'string' ? value.trim() : true) &&
                    (Array.isArray(value) ? value.length > 0 : true);

    if (hasValue) {
      const confidence = this.getFieldConfidence(field);
      if (confidence >= 80) return 'field-dot--parsed';
      if (confidence >= 60) return 'field-dot--low';
      return 'field-dot--parsed'; // Manually edited
    }
    return 'field-dot--empty';
  }

  getFieldConfidence(field: keyof EditableEventData): number {
    const parsed = this.parsedData();
    if (!parsed) return 0;

    const fieldData = parsed[field as keyof ParsedEventData];
    if (fieldData && typeof fieldData === 'object' && 'confidence' in fieldData) {
      return (fieldData as ParsedField).confidence;
    }
    return 0;
  }

  getConfidenceColorClass(): string {
    const confidence = this.overallConfidence();
    if (confidence >= 80) return 'confidence__value--high';
    if (confidence >= 60) return 'confidence__value--medium';
    return 'confidence__value--low';
  }

  updateField(field: keyof EditableEventData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const current = this.editableEvent();

    this.editableEvent.set({
      ...current,
      [field]: target.value
    });
  }

  toggleCategory(category: EventCategory) {
    const current = this.editableEvent();
    const categories = current.categories || [];

    const index = categories.indexOf(category);
    if (index > -1) {
      categories.splice(index, 1);
    } else if (categories.length < 3) {
      categories.push(category);
    }

    this.editableEvent.set({
      ...current,
      categories: [...categories]
    });
  }

  addTag() {
    if (!this.newTag.trim()) return;

    const current = this.editableEvent();
    const tags = current.tags || [];

    if (tags.length < 10 && !tags.includes(this.newTag.trim().toLowerCase())) {
      this.editableEvent.set({
        ...current,
        tags: [...tags, this.newTag.trim().toLowerCase()]
      });
    }

    this.newTag = '';
  }

  removeTag(tag: string) {
    const current = this.editableEvent();
    const tags = current.tags || [];
    const index = tags.indexOf(tag);

    if (index > -1) {
      tags.splice(index, 1);
      this.editableEvent.set({
        ...current,
        tags: [...tags]
      });
    }
  }

  loadSample(sample: string) {
    this.inputText.set(sample);
    this.parseText();
  }

  clearInput() {
    this.inputText.set('');
    this.highlightedText.set('');
    this.cumulativeText.set('');
    this.appendMode = false;
    this.resetToDefaults();
  }

  resetToDefaults() {
    this.editableEvent.set(this.getDefaultEvent());
    this.parsedData.set(null);
    this.overallConfidence.set(0);
    this.cumulativeText.set('');
  }

  createEvent() {
    const eventData = this.getEventForCreation();
    console.log('Creating Event:', eventData);
    // TODO: Integrate with EventStore
    alert('Event creation will be implemented when connected to EventStore');
  }

  copyEventJson() {
    navigator.clipboard.writeText(this.getEventJson());
    // Could add a toast notification here
  }

  getEventJson(): string {
    return JSON.stringify(this.editableEvent(), null, 2);
  }

  getEventForCreation(): Partial<EventModel> {
    const current = this.editableEvent();
    return {
      title: current.title,
      description: current.description,
      date: typeof current.date === 'string' ? current.date : new Date(current.date).toISOString().split('T')[0],
      location: current.location,
      organizer: current.organizer,
      ticketInfo: current.ticketInfo,
      contactInfo: current.contactInfo,
      website: current.website,
      categories: current.categories,
      tags: current.tags,
      status: current.status,
      eventType: 'single', // Default to single event for parser-created events
      attendeeIds: [],
      rawTextData: this.inputText()
    };
  }

  focusField(field: string) {
    this.activeField.set(field);
    // Focus the input after the view updates
    setTimeout(() => {
      const input = document.querySelector(`#${field}Input`) as HTMLInputElement | HTMLTextAreaElement;
      if (input) {
        input.focus();
        input.select(); // Select all text for easy editing
      }
    }, 10);
  }

  blurField() {
    this.activeField.set(null);
  }

  private getDefaultEvent(): EditableEventData {
    return {
      title: '',
      description: '',
      date: '',
      location: '',
      organizer: '',
      ticketInfo: '',
      contactInfo: '',
      website: '',
      categories: [],
      tags: [],
      status: 'draft'
    };
  }
}
