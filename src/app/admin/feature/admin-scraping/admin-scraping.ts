/**
 * Admin scraping interface for controlled event imports
 */

import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EthicalScraperService } from '@app/shared/data-access/ethical-scraper.service';
import { ScrapingConfigService, ConfigOption } from '../../data-access/scraping-config.service';
import { EventDataTransformer, EventExtractionResult } from '@app/shared/utils/event-data-transformer';
import { EventModel } from '@app/events/utils/event.model';
import { EventService } from '@app/events/data-access/event.service';
import { AuthService } from '@app/auth/data-access/auth.service';

interface ScrapingState {
  status: 'idle' | 'scraping' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
}

interface EventPreview extends EventModel {
  selected: boolean;
  hasWarnings: boolean;
  warnings: string[];
}

@Component({
  selector: 'app-admin-scraping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-scraping-container">
      <div class="header">
        <h1>🕷️ Event Scraping Tool</h1>
        <p class="subtitle">Import events from external websites with controlled quality review</p>
      </div>

      <!-- Configuration Selection -->
      <div class="config-section card">
        <h3>📋 Scraping Configuration</h3>
        
        <div class="form-group">
          <label for="config-select">Select Configuration:</label>
          <select 
            id="config-select"
            [(ngModel)]="selectedConfig" 
            (ngModelChange)="onConfigChange()"
            [disabled]="scrapingState().status === 'scraping'"
            class="form-control">
            <option value="">Choose a configuration...</option>
            @for (config of availableConfigs(); track config.value) {
              <option [value]="config.value">
                {{ config.label }} - {{ config.domain }}
              </option>
            }
          </select>
        </div>

        @if (selectedConfigDetails()) {
          <div class="config-details">
            <p><strong>Description:</strong> {{ selectedConfigDetails()?.description }}</p>
            <p><strong>Target Domain:</strong> {{ selectedConfigDetails()?.domain }}</p>
            @if (urlValidation().checked && !urlValidation().valid) {
              <div class="warning">
                ⚠️ Warning: Selected configuration may not be optimal for this URL
              </div>
            }
          </div>
        }
      </div>

      <!-- Input Method Selection -->
      <div class="input-section card">
        <h3>🔗 Input Method</h3>
        
        <div class="input-method-tabs">
          <button 
            type="button"
            [class]="inputMethod() === 'url' ? 'tab active' : 'tab'"
            (click)="inputMethod.set('url')">
            🌐 URL Scraping
          </button>
          <button 
            type="button"
            [class]="inputMethod() === 'content' ? 'tab active' : 'tab'"
            (click)="inputMethod.set('content')">
            📝 Paste Content
          </button>
        </div>

        @if (inputMethod() === 'url') {
          <div class="form-group">
            <label for="url-input">Website URL:</label>
            <input 
              type="url" 
              id="url-input"
              [(ngModel)]="targetUrl" 
              (input)="onUrlChange()"
              placeholder="https://example.com/events"
              [disabled]="scrapingState().status === 'scraping'"
              class="form-control">
            
            @if (configSuggestion() && !selectedConfig) {
              <div class="suggestion">
                💡 Suggested configuration: 
                <button 
                  type="button" 
                  class="suggestion-btn"
                  (click)="applySuggestedConfig()">
                  {{ configSuggestion()?.label }}
                </button>
              </div>
            }
          </div>
        }

        @if (inputMethod() === 'content') {
          <div class="form-group">
            <label for="content-input">HTML/XML Content:</label>
            <textarea 
              id="content-input"
              [(ngModel)]="pastedContent"
              placeholder="Paste HTML or XML content here..."
              [disabled]="scrapingState().status === 'scraping'"
              class="form-control content-textarea"
              rows="8">
            </textarea>
            <small class="help-text">
              Paste the HTML source code or XML response from the events page
            </small>
          </div>
        }
      </div>

      <!-- Scraping Controls -->
      <div class="controls-section card">
        <h3>🚀 Scraping Controls</h3>
        
        @if (scrapingState().status === 'idle') {
          <button 
            type="button"
            class="btn btn-primary"
            [disabled]="!canStartScraping()"
            (click)="startScraping()">
            🕷️ Extract Events
          </button>
        }

        @if (scrapingState().status === 'scraping' || scrapingState().status === 'processing') {
          <div class="progress-section">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="scrapingState().progress">
              </div>
            </div>
            <p class="progress-text">{{ scrapingState().message }}</p>
          </div>
        }

        @if (scrapingState().status === 'error') {
          <div class="error-section">
            <p class="error-text">❌ {{ scrapingState().message }}</p>
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="resetScraping()">
              🔄 Try Again
            </button>
          </div>
        }
      </div>

      <!-- Results Preview -->
      @if (extractionResult() && scrapingState().status === 'completed') {
        <div class="results-section card">
          <h3>📊 Extraction Results</h3>
          
          <div class="results-summary">
            <div class="stat">
              <span class="stat-value">{{ extractionResult()?.events?.length || 0 }}</span>
              <span class="stat-label">Events Found</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedEventsCount() }}</span>
              <span class="stat-label">Selected</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ extractionResult()?.errors?.length || 0 }}</span>
              <span class="stat-label">Errors</span>
            </div>
          </div>

          @if (extractionResult()?.errors && extractionResult()!.errors!.length > 0) {
            <div class="errors-section">
              <h4>⚠️ Extraction Errors</h4>
              <ul class="error-list">
                @for (error of extractionResult()?.errors; track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            </div>
          }

          @if (eventPreviews().length > 0) {
            <div class="events-preview">
              <div class="preview-controls">
                <button 
                  type="button" 
                  class="btn btn-small"
                  (click)="selectAllEvents()">
                  ✅ Select All
                </button>
                <button 
                  type="button" 
                  class="btn btn-small"
                  (click)="deselectAllEvents()">
                  ❌ Deselect All
                </button>
              </div>

              <div class="events-table">
                <div class="table-header">
                  <div class="col-select">Select</div>
                  <div class="col-title">Title</div>
                  <div class="col-date">Date</div>
                  <div class="col-location">Location</div>
                  <div class="col-organizer">Organizer</div>
                  <div class="col-status">Status</div>
                </div>

                @for (event of eventPreviews(); track event.id) {
                  <div class="table-row" [class.warning]="event.hasWarnings">
                    <div class="col-select">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="event.selected"
                        [id]="'event-' + event.id">
                    </div>
                    <div class="col-title">
                      <strong>{{ event.title }}</strong>
                      @if (event.hasWarnings) {
                        <div class="warnings">
                          @for (warning of event.warnings; track warning) {
                            <small class="warning-text">⚠️ {{ warning }}</small>
                          }
                        </div>
                      }
                    </div>
                    <div class="col-date">{{ event.date }}</div>
                    <div class="col-location">{{ event.location || 'Not specified' }}</div>
                    <div class="col-organizer">{{ event.organizer || 'Not specified' }}</div>
                    <div class="col-status">
                      @if (event.hasWarnings) {
                        <span class="status warning">⚠️ Needs Review</span>
                      } @else {
                        <span class="status ready">✅ Ready</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Import Controls -->
          @if (selectedEventsCount() > 0) {
            <div class="import-section">
              <h4>💾 Import Events</h4>
              <p>Import {{ selectedEventsCount() }} selected events to the database</p>
              
              <div class="import-options">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="skipDuplicates">
                  Skip events that might be duplicates
                </label>
              </div>
              
              <div class="import-controls">
                <button 
                  type="button"
                  class="btn btn-success"
                  [disabled]="importing()"
                  (click)="importSelectedEvents()">
                  @if (importing()) {
                    ⏳ Importing...
                  } @else {
                    💾 Import {{ selectedEventsCount() }} Events
                  }
                </button>
                
                <button 
                  type="button"
                  class="btn btn-secondary"
                  (click)="resetScraping()">
                  🔄 Start Over
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (importResults().length > 0) {
        <div class="import-results card">
          <h3>✅ Import Complete</h3>
          <p>Successfully imported {{ importResults().length }} events</p>
          
          <div class="imported-events">
            @for (result of importResults(); track result.id) {
              <div class="imported-event">
                ✅ {{ result.title }} - {{ result.date }}
              </div>
            }
          </div>
          
          <button 
            type="button"
            class="btn btn-primary"
            (click)="resetForNewScraping()">
            🆕 Import More Events
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-scraping.scss'
})
export class AdminScraping {
  private scraperService = inject(EthicalScraperService);
  private configService = inject(ScrapingConfigService);
  private eventService = inject(EventService);
  private authService = inject(AuthService);

  // Form state
  selectedConfig = '';
  targetUrl = '';
  pastedContent = '';
  inputMethod = signal<'url' | 'content'>('url');
  skipDuplicates = true;

  // UI state
  scrapingState = signal<ScrapingState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  
  importing = signal(false);
  extractionResult = signal<EventExtractionResult | null>(null);
  eventPreviews = signal<EventPreview[]>([]);
  importResults = signal<EventModel[]>([]);

  // Config data
  availableConfigs = signal<ConfigOption[]>([]);
  selectedConfigDetails = signal<ConfigOption | null>(null);
  configSuggestion = signal<ConfigOption | null>(null);
  urlValidation = signal<{ checked: boolean; valid: boolean }>({ checked: false, valid: false });

  // Computed properties
  selectedEventsCount = computed(() => 
    this.eventPreviews().filter(e => e.selected).length
  );

  canStartScraping = computed(() => {
    const hasConfig = !!this.selectedConfig;
    const hasInput = this.inputMethod() === 'url' 
      ? !!this.targetUrl.trim() 
      : !!this.pastedContent.trim();
    const notScraping = this.scrapingState().status === 'idle';
    
    return hasConfig && hasInput && notScraping;
  });

  constructor() {
    this.loadConfigs();
  }

  private async loadConfigs() {
    this.configService.getConfigs().subscribe(configs => {
      this.availableConfigs.set(configs);
      console.log('📋 [ADMIN-SCRAPING] Loaded configs:', configs.length);
    });
  }

  onConfigChange() {
    const config = this.availableConfigs().find(c => c.value === this.selectedConfig);
    this.selectedConfigDetails.set(config || null);
    
    if (config && this.targetUrl) {
      this.validateUrlForConfig();
    }
    
    console.log('🔧 [ADMIN-SCRAPING] Config changed to:', this.selectedConfig);
  }

  onUrlChange() {
    if (this.targetUrl.trim()) {
      this.getSuggestedConfig();
      
      if (this.selectedConfig) {
        this.validateUrlForConfig();
      }
    } else {
      this.configSuggestion.set(null);
      this.urlValidation.set({ checked: false, valid: false });
    }
  }

  private getSuggestedConfig() {
    this.configService.suggestConfigForUrl(this.targetUrl).subscribe(suggestion => {
      this.configSuggestion.set(suggestion);
      console.log('💡 [ADMIN-SCRAPING] Config suggestion:', suggestion?.value);
    });
  }

  private validateUrlForConfig() {
    this.configService.validateUrlForConfig(this.targetUrl, this.selectedConfig).subscribe(isValid => {
      this.urlValidation.set({ checked: true, valid: isValid });
      console.log('✅ [ADMIN-SCRAPING] URL validation:', isValid);
    });
  }

  applySuggestedConfig() {
    const suggestion = this.configSuggestion();
    if (suggestion) {
      this.selectedConfig = suggestion.value;
      this.onConfigChange();
      console.log('🎯 [ADMIN-SCRAPING] Applied suggested config:', suggestion.value);
    }
  }

  async startScraping() {
    console.log('🚀 [ADMIN-SCRAPING] Starting scraping process');
    
    this.scrapingState.set({
      status: 'scraping',
      progress: 10,
      message: 'Initializing scraper...'
    });

    try {
      if (this.inputMethod() === 'url') {
        await this.scrapeFromUrl();
      } else {
        await this.processContent();
      }
    } catch (error: any) {
      console.error('💥 [ADMIN-SCRAPING] Scraping failed:', error);
      this.scrapingState.set({
        status: 'error',
        progress: 0,
        message: error.message || 'Scraping failed'
      });
    }
  }

  private async scrapeFromUrl() {
    this.scrapingState.set({
      status: 'scraping',
      progress: 30,
      message: 'Scraping website...'
    });

    const currentUser = this.authService.user$$();
    const userId = currentUser?.uid || 'admin-scraper';

    this.scraperService.scrapeForEvents(this.targetUrl, {
      useCache: false
    }, userId, userId).subscribe({
      next: (result) => {
        console.log('📊 [ADMIN-SCRAPING] Extraction result:', result);
        this.processExtractionResult(result);
      },
      error: (error) => {
        throw error;
      }
    });
  }

  private async processContent() {
    this.scrapingState.set({
      status: 'processing',
      progress: 50,
      message: 'Processing pasted content...'
    });

    // Create a mock scraping result for pasted content
    const mockResult = {
      url: 'pasted-content',
      success: true,
      data: {
        // Try to parse the pasted content as if it were scraped
        content: this.pastedContent
      },
      metadata: {
        processingTime: 0,
        actionsExecuted: 0,
        extractorsRun: 0,
        iframesProcessed: 0,
        cacheUsed: false
      },
      extractedAt: new Date().toISOString()
    };

    const currentUser = this.authService.user$$();
    const userId = currentUser?.uid || 'admin-scraper';

    // Transform the mock result
    const extractionResult = EventDataTransformer.transformScrapingResult(
      mockResult, 
      userId, 
      userId
    );

    this.processExtractionResult(extractionResult);
  }

  private processExtractionResult(result: EventExtractionResult) {
    this.scrapingState.set({
      status: 'processing',
      progress: 80,
      message: 'Processing extracted events...'
    });

    // Create event previews with validation
    const previews: EventPreview[] = result.events.map(event => {
      const warnings: string[] = [];
      
      if (!event.location) warnings.push('No location specified');
      if (!event.organizer) warnings.push('No organizer specified');
      if (!event.description) warnings.push('No description provided');
      if (event.categories?.length === 0) warnings.push('No categories assigned');

      return {
        ...event,
        selected: warnings.length === 0, // Auto-select events without warnings
        hasWarnings: warnings.length > 0,
        warnings
      };
    });

    this.extractionResult.set(result);
    this.eventPreviews.set(previews);

    this.scrapingState.set({
      status: 'completed',
      progress: 100,
      message: `Found ${result.events.length} events`
    });

    console.log('✅ [ADMIN-SCRAPING] Processing complete:', previews.length, 'events');
  }

  selectAllEvents() {
    const updated = this.eventPreviews().map(event => ({ ...event, selected: true }));
    this.eventPreviews.set(updated);
  }

  deselectAllEvents() {
    const updated = this.eventPreviews().map(event => ({ ...event, selected: false }));
    this.eventPreviews.set(updated);
  }

  async importSelectedEvents() {
    const selectedEvents = this.eventPreviews().filter(e => e.selected);
    
    if (selectedEvents.length === 0) {
      return;
    }

    console.log('💾 [ADMIN-SCRAPING] Importing', selectedEvents.length, 'events');
    this.importing.set(true);

    try {
      const importedEvents: EventModel[] = [];

      for (const event of selectedEvents) {
        try {
          // Remove preview-specific properties
          const { selected, hasWarnings, warnings, ...eventData } = event;
          
          // Check for duplicates if enabled
          if (this.skipDuplicates) {
            const existing = await this.eventService.findEventByTitleAndDate(
              eventData.title, 
              eventData.date
            );
            if (existing) {
              console.log(`⏭️  [ADMIN-SCRAPING] Skipping duplicate: ${eventData.title}`);
              continue;
            }
          }

          await this.eventService.create(eventData);
          importedEvents.push(eventData);
          console.log(`✅ [ADMIN-SCRAPING] Imported: ${eventData.title}`);
        } catch (error: any) {
          console.error(`💥 [ADMIN-SCRAPING] Failed to import ${event.title}:`, error);
        }
      }

      this.importResults.set(importedEvents);
      console.log('🎉 [ADMIN-SCRAPING] Import complete:', importedEvents.length, 'events imported');
      
    } catch (error: any) {
      console.error('💥 [ADMIN-SCRAPING] Import process failed:', error);
    } finally {
      this.importing.set(false);
    }
  }

  resetScraping() {
    this.scrapingState.set({
      status: 'idle',
      progress: 0,
      message: ''
    });
    this.extractionResult.set(null);
    this.eventPreviews.set([]);
  }

  resetForNewScraping() {
    this.resetScraping();
    this.importResults.set([]);
    this.targetUrl = '';
    this.pastedContent = '';
    this.selectedConfig = '';
    this.selectedConfigDetails.set(null);
  }
}