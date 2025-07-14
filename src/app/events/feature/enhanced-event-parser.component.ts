import { Component, signal, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MultiModalParserService, MultiModalResult, ParsingProgress } from '@events/data-access/multi-modal-parser.service';
import { DataSourceInput, ProcessingResult } from '@events/data-access/data-source-processor.interface';
import { EventCategory, EVENT_CATEGORIES } from '@events/utils/event.model';
import { GapAnalysisService, GapAnalysisResult } from '@events/data-access/gap-analysis.service';

/**
 * Enhanced Event Parser Component
 * Supports multiple input sources with intelligent fusion
 */
@Component({
  selector: 'app-enhanced-event-parser',
  imports: [FormsModule, CommonModule],
  template: `
    <div class="parser">
      <!-- Header with enhanced status -->
      <div class="parser__header">
        <div class="parser__header-inner">
          <h1 class="parser__title">Enhanced Event Parser</h1>
          <p class="parser__subtitle">Extract event data from text, images, and web sources</p>

          <!-- Enhanced Status Bar -->
          <div class="parser__status-bar">
            <!-- Overall Confidence -->
            <div class="confidence">
              <div class="confidence__bar">
                <span class="confidence__label">Overall Confidence</span>
                <div class="confidence__track">
                  <div
                    class="confidence__fill"
                    [style.width.%]="overallConfidence()"
                  ></div>
                </div>
                <span
                  class="confidence__value"
                  [class]="getConfidenceClass(overallConfidence())"
                >
                  {{ overallConfidence() }}%
                </span>
              </div>
            </div>

            <!-- Processing Progress -->
            @if (isProcessing()) {
              <div class="progress">
                <div class="progress__bar">
                  <span class="progress__label">{{ progress().stage }}</span>
                  <div class="progress__track">
                    <div
                      class="progress__fill"
                      [style.width.%]="progressPercentage()"
                    ></div>
                  </div>
                  <span class="progress__text">
                    {{ progress().completedSources }}/{{ progress().totalSources }}
                  </span>
                </div>
                @if (progress().currentSource) {
                  <div class="progress__current">{{ progress().currentSource }}</div>
                }
              </div>
            }

            <!-- Source Status -->
            <div class="sources">
              <span class="sources__label">Active Sources:</span>
              @for (source of activeSources(); track $index) {
                <span class="source-badge" [class]="getSourceBadgeClass(source)">
                  {{ getSourceDisplayName(source.type) }}
                </span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="parser__content">
        <!-- Left Panel - Multi-Source Input -->
        <div class="parser__panel parser__panel--left">
          <div class="panel">
            <div class="panel__header">
              <h2 class="panel__title">Input Sources</h2>
              <div class="panel__actions">
                <button
                  (click)="clearAllSources()"
                  class="btn btn--secondary"
                  [disabled]="activeSources().length === 0"
                >
                  Clear All
                </button>
                <button
                  (click)="parseAllSources()"
                  class="btn btn--primary"
                  [disabled]="activeSources().length === 0 || isProcessing()"
                >
                  {{ isProcessing() ? 'Processing...' : 'Parse All' }}
                </button>
              </div>
            </div>

            <div class="panel__body">
              <!-- Source Tabs -->
              <div class="source-tabs">
                <button
                  (click)="setActiveTab('text')"
                  class="source-tab"
                  [class.active]="activeTab() === 'text'"
                >
                  📝 Text
                </button>
                <button
                  (click)="setActiveTab('image')"
                  class="source-tab"
                  [class.active]="activeTab() === 'image'"
                >
                  🖼️ Image
                </button>
                <button
                  (click)="setActiveTab('url')"
                  class="source-tab"
                  [class.active]="activeTab() === 'url'"
                >
                  🌐 Web URL
                </button>
              </div>

              <!-- Text Input Tab -->
              @if (activeTab() === 'text') {
                <div class="input-section">
                  <div class="input-header">
                    <label class="input-label">Paste Event Information</label>
                    <div class="input-actions">
                      <button
                        (click)="addTextSource()"
                        class="btn btn--small btn--success"
                        [disabled]="!textInput().trim()"
                      >
                        Add Text Source
                      </button>
                    </div>
                  </div>
                  <textarea
                    [(ngModel)]="textInput"
                    placeholder="Paste event text, flyer content, or any event-related information here..."
                    class="input-textarea"
                    rows="10"
                  ></textarea>
                </div>
              }

              <!-- Image Upload Tab -->
              @if (activeTab() === 'image') {
                <div class="input-section">
                  <div class="input-header">
                    <label class="input-label">Upload Event Flyer</label>
                  </div>

                  <!-- Drag & Drop Area -->
                  <div
                    class="drop-zone"
                    [class.dragover]="isDragOver()"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    (click)="fileInput.click()"
                  >
                    <div class="drop-zone__content">
                      <span class="drop-zone__icon">📤</span>
                      <span class="drop-zone__text">
                        Drag & drop image files here or click to browse
                      </span>
                      <span class="drop-zone__formats">
                        Supports: JPG, PNG, WebP, GIF
                      </span>
                    </div>
                  </div>

                  <input
                    #fileInput
                    type="file"
                    accept="image/*"
                    multiple
                    (change)="onFileSelect($event)"
                    class="file-input"
                  />
                </div>
              }

              <!-- URL Input Tab -->
              @if (activeTab() === 'url') {
                <div class="input-section">
                  <div class="input-header">
                    <label class="input-label">Event Website or Social Media URL</label>
                    <div class="input-actions">
                      <button
                        (click)="addUrlSource()"
                        class="btn btn--small btn--success"
                        [disabled]="!urlInput().trim() || !isValidUrl(urlInput())"
                      >
                        Add URL Source
                      </button>
                    </div>
                  </div>
                  <input
                    [(ngModel)]="urlInput"
                    type="url"
                    placeholder="https://example.com/event-page"
                    class="input-url"
                  />
                  <div class="url-examples">
                    <strong>Examples:</strong>
                    <span>Facebook events, Eventbrite pages, venue websites</span>
                  </div>
                </div>
              }

              <!-- Active Sources List -->
              @if (activeSources().length > 0) {
                <div class="sources-list">
                  <h3 class="sources-list__title">Active Sources ({{ activeSources().length }})</h3>
                  @for (source of activeSources(); track $index; let i = $index) {
                    <div class="source-item">
                      <div class="source-item__info">
                        <span class="source-item__type">{{ getSourceDisplayName(source.type) }}</span>
                        <span class="source-item__preview">{{ getSourcePreview(source) }}</span>
                      </div>
                      <button
                        (click)="removeSource(i)"
                        class="source-item__remove"
                        title="Remove source"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Panel - Fused Results -->
        <div class="parser__panel parser__panel--right">
          <div class="panel">
            <div class="panel__header">
              <h2 class="panel__title">
                Extracted Event Data
                @if (fusionResult()) {
                  <span class="fusion-badge">Fused from {{ individualResults().length }} sources</span>
                }
              </h2>
              <div class="panel__actions">
                <button
                  (click)="resetData()"
                  class="btn btn--secondary"
                  [disabled]="!hasExtractedData()"
                >
                  Reset
                </button>
                <button
                  (click)="copyEventJson()"
                  class="btn btn--success"
                  [disabled]="!hasExtractedData()"
                >
                  Copy JSON
                </button>
                <button
                  (click)="createEvent()"
                  class="btn btn--primary"
                  [disabled]="!canCreateEvent()"
                >
                  Create Event
                </button>
              </div>
            </div>

            <div class="panel__body">
              @if (hasExtractedData()) {
                <!-- Fusion Summary -->
                @if (fusionResult()) {
                  <div class="fusion-summary">
                    <div class="fusion-summary__header">
                      <h4>Data Fusion Summary</h4>
                      <span class="fusion-summary__confidence">{{ fusionResult()!.confidence.overall }}% confidence</span>
                    </div>

                    @if (fusionResult()!.conflicts.length > 0) {
                      <div class="fusion-conflicts">
                        <strong>Resolved {{ fusionResult()!.conflicts.length }} conflicts:</strong>
                        @for (conflict of fusionResult()!.conflicts; track $index) {
                          <div class="conflict-item">
                            {{ conflict.field }}: {{ conflict.strategy }} strategy
                          </div>
                        }
                      </div>
                    }

                    @if (fusionResult()!.recommendations.length > 0) {
                      <div class="fusion-recommendations">
                        <strong>Recommendations:</strong>
                        @for (rec of fusionResult()!.recommendations; track $index) {
                          <div class="recommendation-item">{{ rec }}</div>
                        }
                      </div>
                    }
                  </div>
                }

                <!-- Gap Analysis Section -->
                @if (showGapAnalysis()) {
                  <div class="gap-analysis">
                    <div class="gap-analysis__header">
                      <h4>Data Completeness Analysis</h4>
                      <div class="completeness-meter">
                        <div class="completeness-meter__track">
                          <div
                            class="completeness-meter__fill"
                            [style.width.%]="dataCompleteness()"
                            [class]="dataCompleteness() >= 80 ? 'completeness-meter__fill--high' :
                                     dataCompleteness() >= 60 ? 'completeness-meter__fill--medium' :
                                     'completeness-meter__fill--low'"
                          ></div>
                        </div>
                        <span class="completeness-meter__value">{{ dataCompleteness() }}% complete</span>
                      </div>
                    </div>

                    <!-- Readiness Status -->
                    <div class="readiness-status">
                      @switch (gapAnalysis()?.overall?.readiness) {
                        @case ('ready') {
                          <div class="readiness-status__item readiness-status__item--ready">
                            <span class="readiness-status__icon">✅</span>
                            <span class="readiness-status__text">Ready to create event!</span>
                          </div>
                        }
                        @case ('needs_work') {
                          <div class="readiness-status__item readiness-status__item--needs-work">
                            <span class="readiness-status__icon">⚠️</span>
                            <span class="readiness-status__text">Almost ready - {{ criticalGaps().length }} critical fields need attention</span>
                          </div>
                        }
                        @case ('minimal') {
                          <div class="readiness-status__item readiness-status__item--minimal">
                            <span class="readiness-status__icon">🔍</span>
                            <span class="readiness-status__text">More data needed - {{ criticalGaps().length }} critical gaps found</span>
                          </div>
                        }
                      }
                    </div>

                    <!-- Gap Details -->
                    @if (gapAnalysis()?.gaps && gapAnalysis()!.gaps.length > 0) {
                      <div class="gaps-grid">
                        @for (gap of gapAnalysis()!.gaps; track gap.field) {
                          <div class="gap-item" [class]="getGapStatusClass(gap) + ' ' + getImportanceClass(gap.importance)">
                            <div class="gap-item__header">
                              <span class="gap-item__field">{{ gap.displayName }}</span>
                              <span class="gap-item__status">{{ gap.status === 'missing' ? 'Missing' :
                                                                   gap.status === 'low_confidence' ? 'Low confidence' :
                                                                   gap.status === 'partial' ? 'Partial' : 'Good' }}</span>
                            </div>
                            @if (gap.currentValue && gap.status !== 'missing') {
                              <div class="gap-item__current">{{ gap.currentValue }}</div>
                            }
                            <div class="gap-item__confidence">{{ gap.confidence }}% confidence</div>
                          </div>
                        }
                      </div>
                    }

                    <!-- Smart Suggestions -->
                    @if (recommendedSources().length > 0) {
                      <div class="smart-suggestions">
                        <h5>💡 Recommended next steps:</h5>
                        <div class="suggestions-grid">
                          @for (suggestion of recommendedSources(); track suggestion.sourceType) {
                            <div class="suggestion-card" (click)="clickSuggestionCard(suggestion.sourceType)">
                              <div class="suggestion-card__header">
                                <span class="suggestion-card__icon">{{ suggestion.icon }}</span>
                                <span class="suggestion-card__title">{{ suggestion.displayName }}</span>
                                <span class="suggestion-card__likelihood suggestion-card__likelihood--{{ suggestion.likelihood }}">
                                  {{ suggestion.likelihood }} impact
                                </span>
                              </div>
                              <div class="suggestion-card__reasoning">{{ suggestion.reasoning }}</div>
                              <div class="suggestion-card__examples">
                                <strong>Examples:</strong>
                                <span>{{ suggestion.examples[0] }}</span>
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- Next Best Action -->
                    @if (gapAnalysis()?.nextBestAction) {
                      <div class="next-action">
                        @switch (gapAnalysis()!.nextBestAction.type) {
                          @case ('add_source') {
                            <button
                              class="next-action__btn next-action__btn--add-source"
                              (click)="clickNextAction(gapAnalysis()!.nextBestAction.sourceType)"
                            >
                              <span class="next-action__icon">➕</span>
                              {{ gapAnalysis()!.nextBestAction.message }}
                            </button>
                          }
                          @case ('manual_edit') {
                            <div class="next-action__message next-action__message--edit">
                              <span class="next-action__icon">✏️</span>
                              {{ gapAnalysis()!.nextBestAction.message }}
                            </div>
                          }
                          @case ('ready_to_create') {
                            <button
                              class="next-action__btn next-action__btn--create"
                              (click)="createEvent()"
                            >
                              <span class="next-action__icon">🚀</span>
                              {{ gapAnalysis()!.nextBestAction.message }}
                            </button>
                          }
                        }
                      </div>
                    }
                  </div>
                }

                <!-- Enhanced JSON Editor -->
                <div class="json-editor">
                  <!-- Title -->
                  <div class="json-field">
                    <div class="json-field__header">
                      <span class="json-field__key">title</span>
                      <div class="json-field__meta">
                        @if (getFieldConfidence('title') > 0) {
                          <span class="field-confidence">{{ getFieldConfidence('title') }}%</span>
                        }
                        @if (getFieldSource('title')) {
                          <span class="field-source">{{ getFieldSource('title') }}</span>
                        }
                      </div>
                    </div>

                    @if (activeField() !== 'title') {
                      <div
                        (click)="focusField('title')"
                        class="json-field__display"
                      >
                        {{ extractedData()?.title?.value || 'Click to enter title...' }}
                      </div>
                    }
                    @if (activeField() === 'title') {
                      <input
                        #titleInput
                        type="text"
                        [value]="extractedData()?.title?.value || ''"
                        (input)="updateField('title', $event)"
                        (blur)="blurField()"
                        (keyup.enter)="blurField()"
                        class="json-field__input"
                        placeholder="Event title"
                      />
                    }
                  </div>

                  <!-- Description -->
                  <div class="json-field">
                    <div class="json-field__header">
                      <span class="json-field__key">description</span>
                      <div class="json-field__meta">
                        @if (getFieldConfidence('description') > 0) {
                          <span class="field-confidence">{{ getFieldConfidence('description') }}%</span>
                        }
                        @if (getFieldSource('description')) {
                          <span class="field-source">{{ getFieldSource('description') }}</span>
                        }
                      </div>
                    </div>

                    @if (activeField() !== 'description') {
                      <div
                        (click)="focusField('description')"
                        class="json-field__display json-field__display--multiline"
                      >
                        {{ extractedData()?.description?.value || 'Click to enter description...' }}
                      </div>
                    }
                    @if (activeField() === 'description') {
                      <textarea
                        #descriptionInput
                        [value]="extractedData()?.description?.value || ''"
                        (input)="updateField('description', $event)"
                        (blur)="blurField()"
                        rows="4"
                        class="json-field__input"
                        placeholder="Event description"
                      ></textarea>
                    }
                  </div>

                  <!-- Date -->
                  <div class="json-field">
                    <div class="json-field__header">
                      <span class="json-field__key">date</span>
                      <div class="json-field__meta">
                        @if (getFieldConfidence('date') > 0) {
                          <span class="field-confidence">{{ getFieldConfidence('date') }}%</span>
                        }
                        @if (getFieldSource('date')) {
                          <span class="field-source">{{ getFieldSource('date') }}</span>
                        }
                      </div>
                    </div>

                    @if (activeField() !== 'date') {
                      <div
                        (click)="focusField('date')"
                        class="json-field__display"
                      >
                        {{ formatDateForDisplay(extractedData()?.date?.value) || 'Click to enter date...' }}
                      </div>
                    }
                    @if (activeField() === 'date') {
                      <input
                        #dateInput
                        type="datetime-local"
                        [value]="extractedData()?.date?.value || ''"
                        (input)="updateField('date', $event)"
                        (blur)="blurField()"
                        class="json-field__input"
                      />
                    }
                  </div>

                  <!-- Additional Fields... (location, organizer, etc.) -->
                  <!-- Categories -->
                  <div class="json-field">
                    <div class="json-field__header">
                      <span class="json-field__key">categories</span>
                    </div>
                    <div class="categories-grid">
                      @for (category of availableCategories; track category.value) {
                        <label class="category-option">
                          <input
                            type="checkbox"
                            [checked]="selectedCategories().includes(category.value)"
                            (change)="toggleCategory(category.value)"
                          />
                          <span>{{ category.label }}</span>
                        </label>
                      }
                    </div>
                  </div>
                </div>
              } @else {
                <div class="empty-state">
                  <div class="empty-state__icon">🎯</div>
                  <div class="empty-state__title">Ready to Extract Event Data</div>
                  <div class="empty-state__text">
                    Add sources in the left panel and click "Parse All" to begin extraction.
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Base styles */
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
      margin: 0 0 1rem 0;
    }

    .parser__status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    /* Progress indicators */
    .confidence, .progress {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .confidence__bar, .progress__bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .confidence__label, .progress__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
    }

    .confidence__track, .progress__track {
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

    .progress__fill {
      height: 100%;
      background: var(--primary);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .confidence__value, .progress__text {
      font-size: 0.875rem;
      font-weight: 500;
      min-width: 3rem;
    }

    .confidence__value--high { color: var(--success); }
    .confidence__value--medium { color: var(--warning); }
    .confidence__value--low { color: var(--error); }

    .progress__current {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Source indicators */
    .sources {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .sources__label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .source-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--secondary);
      color: var(--on-secondary);
    }

    .source-badge--active {
      background: var(--primary);
      color: var(--on-primary);
    }

    /* Main content */
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

    /* Panel styles */
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
      flex-shrink: 0;
    }

    .panel__title {
      font-weight: 600;
      color: var(--text);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .fusion-badge {
      font-size: 0.75rem;
      background: var(--success);
      color: var(--on-success);
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .panel__actions {
      display: flex;
      gap: 0.5rem;
    }

    .panel__body {
      padding: 1rem;
      overflow-y: auto;
      flex: 1;
    }

    /* Source tabs */
    .source-tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .source-tab {
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .source-tab:hover {
      color: var(--text);
      background: var(--background-lighter);
    }

    .source-tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Input sections */
    .input-section {
      margin-bottom: 1.5rem;
    }

    .input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .input-label {
      font-weight: 500;
      color: var(--text);
    }

    .input-actions {
      display: flex;
      gap: 0.5rem;
    }

    .input-textarea, .input-url {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--background);
      color: var(--text);
      font-family: inherit;
      resize: vertical;
    }

    .input-textarea {
      min-height: 200px;
    }

    /* Drag and drop */
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: 0.5rem;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--background);
    }

    .drop-zone:hover, .drop-zone.dragover {
      border-color: var(--primary);
      background: var(--background-lighter);
    }

    .drop-zone__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .drop-zone__icon {
      font-size: 2rem;
    }

    .drop-zone__text {
      color: var(--text);
      font-weight: 500;
    }

    .drop-zone__formats {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .file-input {
      display: none;
    }

    /* URL examples */
    .url-examples {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: var(--background-lighter);
      border-radius: 0.25rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Sources list */
    .sources-list {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .sources-list__title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    .source-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 0.25rem;
    }

    .source-item__info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .source-item__type {
      font-weight: 500;
      color: var(--text);
      font-size: 0.875rem;
    }

    .source-item__preview {
      color: var(--text-secondary);
      font-size: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .source-item__remove {
      background: none;
      border: none;
      color: var(--error);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: background 0.2s;
    }

    .source-item__remove:hover {
      background: var(--background-lighter);
    }

    /* Fusion summary */
    .fusion-summary {
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .fusion-summary__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .fusion-summary__header h4 {
      margin: 0;
      color: var(--text);
    }

    .fusion-summary__confidence {
      font-weight: 600;
      color: var(--success);
    }

    .fusion-conflicts, .fusion-recommendations {
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }

    .conflict-item, .recommendation-item {
      margin-left: 1rem;
      color: var(--text-secondary);
    }

    /* Enhanced JSON editor */
    .json-editor {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .json-field {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .json-field__header {
      background: var(--background-lighter);
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .json-field__key {
      font-weight: 600;
      color: var(--text);
      font-family: 'Courier New', monospace;
    }

    .json-field__meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .field-confidence {
      font-size: 0.75rem;
      background: var(--success);
      color: var(--on-success);
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .field-source {
      font-size: 0.75rem;
      background: var(--secondary);
      color: var(--on-secondary);
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .json-field__display {
      padding: 0.75rem;
      min-height: 1.5rem;
      cursor: pointer;
      transition: background 0.2s;
      color: var(--text);
    }

    .json-field__display:hover {
      background: var(--background-lighter);
    }

    .json-field__display--multiline {
      white-space: pre-wrap;
      min-height: 3rem;
    }

    .json-field__input {
      width: 100%;
      padding: 0.75rem;
      border: none;
      background: var(--background);
      color: var(--text);
      font-family: inherit;
      resize: none;
    }

    .json-field__input:focus {
      outline: none;
      background: var(--background-lighter);
    }

    /* Categories grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .category-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .category-option input {
      margin: 0;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .empty-state__icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state__title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text);
    }

    .empty-state__text {
      max-width: 300px;
    }

    /* Buttons */
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn--small {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn--primary {
      background: var(--primary);
      color: var(--on-primary);
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }

    .btn--secondary {
      background: var(--secondary);
      color: var(--on-secondary);
    }

    .btn--secondary:hover:not(:disabled) {
      background: var(--secondary-hover);
    }

    .btn--success {
      background: var(--success);
      color: var(--on-success);
    }

    .btn--success:hover:not(:disabled) {
      background: var(--success-hover);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Gap Analysis Styles */
    .gap-analysis {
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .gap-analysis__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .gap-analysis__header h4 {
      margin: 0;
      color: var(--text);
    }

    /* Completeness Meter */
    .completeness-meter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .completeness-meter__track {
      width: 120px;
      height: 8px;
      background: var(--background-darkest);
      border-radius: 4px;
      overflow: hidden;
    }

    .completeness-meter__fill {
      height: 100%;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .completeness-meter__fill--high {
      background: var(--success);
    }

    .completeness-meter__fill--medium {
      background: var(--warning);
    }

    .completeness-meter__fill--low {
      background: var(--error);
    }

    .completeness-meter__value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    /* Readiness Status */
    .readiness-status {
      margin-bottom: 1rem;
    }

    .readiness-status__item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 500;
    }

    .readiness-status__item--ready {
      background: var(--success-light);
      color: var(--success-dark);
      border: 1px solid var(--success);
    }

    .readiness-status__item--needs-work {
      background: var(--warning-light);
      color: var(--warning-dark);
      border: 1px solid var(--warning);
    }

    .readiness-status__item--minimal {
      background: var(--error-light);
      color: var(--error-dark);
      border: 1px solid var(--error);
    }

    /* Gaps Grid */
    .gaps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .gap-item {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.75rem;
      position: relative;
    }

    .gap-item__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .gap-item__field {
      font-weight: 600;
      color: var(--text);
      font-size: 0.875rem;
    }

    .gap-item__status {
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .gap-status--missing .gap-item__status {
      background: var(--error);
      color: var(--on-error);
    }

    .gap-status--low .gap-item__status {
      background: var(--warning);
      color: var(--on-warning);
    }

    .gap-status--partial .gap-item__status {
      background: var(--info);
      color: var(--on-info);
    }

    .gap-status--good .gap-item__status {
      background: var(--success);
      color: var(--on-success);
    }

    .gap-item__current {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gap-item__confidence {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Importance indicators */
    .gap-importance--critical {
      border-left: 4px solid var(--error);
    }

    .gap-importance--important {
      border-left: 4px solid var(--warning);
    }

    .gap-importance--nice {
      border-left: 4px solid var(--info);
    }

    /* Smart Suggestions */
    .smart-suggestions {
      margin-bottom: 1rem;
    }

    .smart-suggestions h5 {
      margin: 0 0 0.75rem 0;
      color: var(--text);
      font-size: 1rem;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.75rem;
    }

    .suggestion-card {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .suggestion-card:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .suggestion-card__header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .suggestion-card__icon {
      font-size: 1.25rem;
    }

    .suggestion-card__title {
      font-weight: 600;
      color: var(--text);
      flex: 1;
    }

    .suggestion-card__likelihood {
      font-size: 0.75rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }

    .suggestion-card__likelihood--high {
      background: var(--success);
      color: var(--on-success);
    }

    .suggestion-card__likelihood--medium {
      background: var(--warning);
      color: var(--on-warning);
    }

    .suggestion-card__likelihood--low {
      background: var(--info);
      color: var(--on-info);
    }

    .suggestion-card__reasoning {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .suggestion-card__examples {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .suggestion-card__examples strong {
      color: var(--text-secondary);
    }

    /* Next Action */
    .next-action {
      text-align: center;
    }

    .next-action__btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .next-action__btn--add-source {
      background: var(--primary);
      color: var(--on-primary);
    }

    .next-action__btn--add-source:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .next-action__btn--create {
      background: var(--success);
      color: var(--on-success);
    }

    .next-action__btn--create:hover {
      background: var(--success-hover);
      transform: translateY(-1px);
    }

    .next-action__message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 500;
    }

    .next-action__message--edit {
      background: var(--info-light);
      color: var(--info-dark);
      border: 1px solid var(--info);
    }

    .next-action__icon {
      font-size: 1.125rem;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .parser__content {
        flex-direction: column;
        height: auto;
      }

      .parser__panel {
        width: 100%;
        padding: 0.75rem;
      }

      .parser__status-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .confidence, .progress, .sources {
        justify-content: center;
      }

      .gaps-grid {
        grid-template-columns: 1fr;
      }

      .suggestions-grid {
        grid-template-columns: 1fr;
      }

      .gap-analysis__header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class EnhancedEventParserComponent {
  private readonly _multiModalParser = inject(MultiModalParserService);
  private readonly _gapAnalysisService = inject(GapAnalysisService);

  // UI State
  readonly activeTab = signal<'text' | 'image' | 'url'>('text');
  readonly activeField = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly isProcessing = signal(false);

  // Input signals
  readonly textInput = signal('');
  readonly urlInput = signal('');

  // Data signals
  readonly activeSources = signal<DataSourceInput[]>([]);
  readonly extractedData = signal<any>(null);
  readonly fusionResult = signal<any>(null);
  readonly individualResults = signal<ProcessingResult[]>([]);
  readonly selectedCategories = signal<EventCategory[]>([]);

  // Gap analysis signals
  readonly gapAnalysis = signal<GapAnalysisResult | null>(null);

  // Progress tracking
  readonly progress = this._multiModalParser.progress;

  // Computed values
  readonly overallConfidence = computed(() => {
    const data = this.extractedData();
    return data?.overallConfidence || 0;
  });

  readonly progressPercentage = computed(() => {
    const prog = this.progress();
    if (prog.totalSources === 0) return 0;
    return Math.round((prog.completedSources / prog.totalSources) * 100);
  });

  readonly hasExtractedData = computed(() => !!this.extractedData());

  readonly canCreateEvent = computed(() => {
    const data = this.extractedData();
    return data && data.title?.value && data.date?.value;
  });

  // Gap analysis computed values
  readonly showGapAnalysis = computed(() => {
    return this.hasExtractedData() && this.gapAnalysis() !== null;
  });

  readonly usedSourceTypes = computed(() => {
    return this.activeSources().map(source => source.type);
  });

  readonly dataCompleteness = computed(() => {
    const gap = this.gapAnalysis();
    return gap?.overall.completeness || 0;
  });

  readonly criticalGaps = computed(() => {
    const gap = this.gapAnalysis();
    return gap?.gaps.filter(g => g.importance === 'critical') || [];
  });

  readonly recommendedSources = computed(() => {
    const gap = this.gapAnalysis();
    return gap?.suggestedSources.slice(0, 3) || [];
  });

  // Constants
  readonly availableCategories = EVENT_CATEGORIES;

  @ViewChild('titleInput') titleInputRef!: ElementRef;
  @ViewChild('descriptionInput') descriptionInputRef!: ElementRef;
  @ViewChild('dateInput') dateInputRef!: ElementRef;

  // Tab management
  setActiveTab(tab: 'text' | 'image' | 'url'): void {
    this.activeTab.set(tab);
  }

  // Source management
  addTextSource(): void {
    const text = this.textInput().trim();
    if (!text) return;

    this.activeSources.update(sources => [
      ...sources,
      { type: 'text', data: text, priority: 50 }
    ]);

    this.textInput.set('');
  }

  addUrlSource(): void {
    const url = this.urlInput().trim();
    if (!url || !this.isValidUrl(url)) return;

    this.activeSources.update(sources => [
      ...sources,
      { type: 'url', data: url, priority: 70 }
    ]);

    this.urlInput.set('');
  }

  removeSource(index: number): void {
    this.activeSources.update(sources =>
      sources.filter((_, i) => i !== index)
    );
  }

  clearAllSources(): void {
    this.activeSources.set([]);
    this.resetData();
  }

  // File handling
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addImageSources(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = Array.from(event.dataTransfer?.files || [])
      .filter(file => file.type.startsWith('image/'));

    if (files.length > 0) {
      this.addImageSources(files);
    }
  }

  private addImageSources(files: File[]): void {
    const newSources = files.map(file => ({
      type: 'image' as const,
      data: file,
      priority: 80
    }));

    this.activeSources.update(sources => [...sources, ...newSources]);
  }

  // Parsing
  async parseAllSources(): Promise<void> {
    if (this.activeSources().length === 0 || this.isProcessing()) return;

    try {
      this.isProcessing.set(true);

      const result = await this._multiModalParser.parseFromMultipleSources(
        this.activeSources(),
        {
          enableParallelProcessing: true,
          fusionConfig: {
            defaultStrategy: 'highest_confidence',
            confidenceThreshold: 30
          }
        }
      );

      if (result.success && result.finalData) {
        this.extractedData.set(result.finalData);
        this.fusionResult.set(result.fusionResult);
        this.individualResults.set(result.individualResults);

        // Update categories from extracted data
        if (result.finalData.categories) {
          this.selectedCategories.set(result.finalData.categories);
        }

        // Trigger gap analysis
        this.updateGapAnalysis();
      } else {
        console.error('Parsing failed:', result.error);
        // TODO: Show error message to user
      }

    } catch (error) {
      console.error('Error during parsing:', error);
      // TODO: Show error message to user
    } finally {
      this.isProcessing.set(false);
    }
  }

  // Field editing
  focusField(fieldName: string): void {
    this.activeField.set(fieldName);

    // Focus the input after a brief delay to allow DOM update
    setTimeout(() => {
      const inputRef = this.getFieldInputRef(fieldName);
      if (inputRef) {
        inputRef.nativeElement.focus();
      }
    }, 0);
  }

  blurField(): void {
    this.activeField.set(null);
  }

  updateField(fieldName: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;

    this.extractedData.update(data => {
      if (!data) return data;

      return {
        ...data,
        [fieldName]: {
          ...data[fieldName],
          value,
          source: 'Manual Edit'
        }
      };
    });
  }

  private getFieldInputRef(fieldName: string): ElementRef | null {
    switch (fieldName) {
      case 'title': return this.titleInputRef;
      case 'description': return this.descriptionInputRef;
      case 'date': return this.dateInputRef;
      default: return null;
    }
  }

  // Categories
  toggleCategory(category: EventCategory): void {
    this.selectedCategories.update(categories => {
      const isSelected = categories.includes(category);
      if (isSelected) {
        return categories.filter(c => c !== category);
      } else {
        return [...categories, category];
      }
    });

    // Update extracted data
    this.extractedData.update(data => {
      if (!data) return data;
      return {
        ...data,
        categories: this.selectedCategories()
      };
    });
  }

  // Utility methods
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getSourceDisplayName(type: string): string {
    const names = {
      text: 'Text',
      image: 'Image',
      url: 'Web URL',
      social: 'Social Media',
      calendar: 'Calendar'
    };
    return names[type as keyof typeof names] || type;
  }

  getSourcePreview(source: DataSourceInput): string {
    switch (source.type) {
      case 'text':
        return typeof source.data === 'string'
          ? source.data.slice(0, 50) + '...'
          : 'Text content';
      case 'image':
        return source.data instanceof File
          ? source.data.name
          : 'Image file';
      case 'url':
        return typeof source.data === 'string'
          ? source.data
          : 'URL';
      default:
        return 'Data source';
    }
  }

  getSourceBadgeClass(source: DataSourceInput): string {
    return 'source-badge--active';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'confidence__value--high';
    if (confidence >= 50) return 'confidence__value--medium';
    return 'confidence__value--low';
  }

  getFieldConfidence(fieldName: string): number {
    const data = this.extractedData();
    const field = data?.[fieldName];
    return field?.confidence || 0;
  }

  getFieldSource(fieldName: string): string | null {
    const data = this.extractedData();
    const field = data?.[fieldName];
    return field?.source || null;
  }

  formatDateForDisplay(dateValue: string | undefined): string {
    if (!dateValue) return '';

    try {
      const date = new Date(dateValue);
      return date.toLocaleString();
    } catch {
      return dateValue;
    }
  }

  // Actions
  resetData(): void {
    this.extractedData.set(null);
    this.fusionResult.set(null);
    this.individualResults.set([]);
    this.selectedCategories.set([]);
    this.activeField.set(null);
  }

  async copyEventJson(): Promise<void> {
    const data = this.extractedData();
    if (!data) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to copy JSON:', error);
      // TODO: Show error message
    }
  }

  // Gap analysis
  private updateGapAnalysis(): void {
    const data = this.extractedData();
    const usedSources = this.usedSourceTypes();

    const analysis = this._gapAnalysisService.analyzeGaps(data, usedSources);
    this.gapAnalysis.set(analysis);
  }

  getSuggestionsForSource(sourceType: string): string {
    const gap = this.gapAnalysis();
    const suggestion = gap?.suggestedSources.find(s => s.sourceType === sourceType);
    return suggestion?.reasoning || `Add ${sourceType} source to improve data quality`;
  }

  getGapStatusClass(gap: any): string {
    switch (gap.status) {
      case 'missing': return 'gap-status--missing';
      case 'low_confidence': return 'gap-status--low';
      case 'partial': return 'gap-status--partial';
      case 'good': return 'gap-status--good';
      default: return '';
    }
  }

  getImportanceClass(importance: string): string {
    switch (importance) {
      case 'critical': return 'gap-importance--critical';
      case 'important': return 'gap-importance--important';
      case 'nice_to_have': return 'gap-importance--nice';
      default: return '';
    }
  }

  async createEvent(): Promise<void> {
    const data = this.extractedData();
    if (!data || !this.canCreateEvent()) return;

    // TODO: Implement event creation
    console.log('Creating event:', data);
  }

  // Handle suggestion card clicks
  clickSuggestionCard(sourceType: string): void {
    // Only switch to tabs that exist in our UI
    if (sourceType === 'text' || sourceType === 'image' || sourceType === 'url') {
      this.setActiveTab(sourceType);
    }
  }

  // Handle next action clicks
  clickNextAction(sourceType?: string): void {
    if (sourceType && (sourceType === 'text' || sourceType === 'image' || sourceType === 'url')) {
      this.setActiveTab(sourceType);
    } else {
      // Default to text tab if no valid source type
      this.setActiveTab('text');
    }
  }
}
