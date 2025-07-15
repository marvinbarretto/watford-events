import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { EventModel, EventCategory, EVENT_CATEGORIES } from '../utils/event.model';
import { AuthService } from '../../auth/data-access/auth.service';
import { EventStore } from '../data-access/event.store';
import { IconComponent } from '@shared/ui/icon/icon.component';

interface EventEnhancementForm {
  description: string;
  organizer: string;
  contactInfo: string;
  website: string;
  ticketInfo: string;
  categories: EventCategory[];
  tags: string[];
}

@Component({
  selector: 'app-event-enhancement',
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div class="event-enhancement">
      <!-- Header -->
      <header class="page-header">
        <button class="back-btn" (click)="goBack()" type="button">
          <app-icon name="arrow_back" size="sm" />
          <span class="back-text">Back</span>
        </button>

        <div class="header-info">
          <h1 class="page-title">Enhance Your Event</h1>
          <p class="page-subtitle">Add details to make your event shine</p>
        </div>

        <div class="status-badge">
          <span class="badge-icon">📝</span>
          <span>Draft</span>
        </div>
      </header>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading event...</p>
        </div>
      }

      <!-- Event Enhancement Content -->
      @if (!isLoading() && event()) {
        <main class="main-content">

          <!-- Event Summary -->
          <section class="event-summary">
            <div class="summary-card">
              <div class="event-icon">{{ getEventIcon() }}</div>
              <div class="event-details">
                <h2 class="event-title">{{ event()!.title }}</h2>
                <div class="event-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📍</span>
                    <span>{{ event()!.location }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span>{{ formatEventDate() }}</span>
                  </div>
                  @if (event()!.startTime && !event()!.isAllDay) {
                    <div class="meta-item">
                      <span class="meta-icon">🕒</span>
                      <span>{{ event()!.startTime }}{{ event()!.endTime ? ' - ' + event()!.endTime : '' }}</span>
                    </div>
                  }
                  @if (event()!.isAllDay) {
                    <div class="meta-item">
                      <span class="meta-icon">☀️</span>
                      <span>All day</span>
                    </div>
                  }
                </div>
              </div>
              <div class="summary-actions">
                <button class="action-btn secondary" (click)="previewEvent()" type="button">
                  👁️ Preview
                </button>
              </div>
            </div>
          </section>

          <!-- Enhancement Form -->
          <form class="enhancement-form" (ngSubmit)="saveEnhancements()">

            <!-- Description Section -->
            <section class="form-section">
              <div class="section-header">
                <h3 class="section-title">Description & Details</h3>
                <p class="section-subtitle">Help people understand what to expect</p>
              </div>

              <div class="form-field">
                <label class="field-label">Event Description</label>
                <textarea
                  class="field-textarea"
                  [(ngModel)]="enhancementForm().description"
                  name="description"
                  placeholder="Describe your event... (optional)"
                  rows="4">
                </textarea>
                @if (suggestedDescription()) {
                  <div class="ai-suggestion">
                    <span class="suggestion-icon">🤖</span>
                    <span class="suggestion-text">Suggested: "{{ suggestedDescription() }}"</span>
                    <button class="use-suggestion-btn" (click)="useSuggestion('description')" type="button">Use</button>
                  </div>
                }
              </div>

              <div class="form-field">
                <label class="field-label">Organizer</label>
                <input
                  class="field-input"
                  type="text"
                  [(ngModel)]="enhancementForm().organizer"
                  name="organizer"
                  placeholder="Who is organizing this event?"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Contact Info</label>
                <input
                  class="field-input"
                  type="text"
                  [(ngModel)]="enhancementForm().contactInfo"
                  name="contactInfo"
                  placeholder="Email or phone for inquiries"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Website / Tickets</label>
                <input
                  class="field-input"
                  type="url"
                  [(ngModel)]="enhancementForm().website"
                  name="website"
                  placeholder="https://example.com"
                />
              </div>
            </section>

            <!-- Categories Section -->
            <section class="form-section">
              <div class="section-header">
                <h3 class="section-title">Categories & Tags</h3>
                <p class="section-subtitle">Help people discover your event</p>
              </div>

              <div class="form-field">
                <label class="field-label">Categories</label>
                <div class="category-grid">
                  @for (category of availableCategories; track category.value) {
                    <label class="category-option">
                      <input
                        type="checkbox"
                        [checked]="isCategorySelected(category.value)"
                        (change)="toggleCategory(category.value)"
                      />
                      <span class="category-label">{{ category.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="form-field">
                <label class="field-label">Tags</label>
                <input
                  class="field-input"
                  type="text"
                  [(ngModel)]="tagInput"
                  name="tags"
                  placeholder="Add tags separated by commas"
                  (blur)="updateTags()"
                />
                @if (enhancementForm().tags.length > 0) {
                  <div class="tag-list">
                    @for (tag of enhancementForm().tags; track tag) {
                      <span class="tag-chip">
                        {{ tag }}
                        <button class="remove-tag" (click)="removeTag(tag)" type="button" aria-label="Remove tag">
                          <app-icon name="close" size="xs" />
                        </button>
                      </span>
                    }
                  </div>
                }
              </div>
            </section>

            <!-- Completion Meter -->
            <section class="completion-section">
              <div class="completion-meter">
                <div class="meter-header">
                  <span class="meter-label">Event Completeness</span>
                  <span class="meter-percentage">{{ completionPercentage() }}%</span>
                </div>
                <div class="meter-bar">
                  <div class="meter-fill" [style.width.%]="completionPercentage()"></div>
                </div>
                <p class="meter-tip">{{ getCompletionTip() }}</p>
              </div>
            </section>

          </form>

          <!-- Action Buttons -->
          <div class="action-bar">
            <button class="action-btn secondary" (click)="saveDraft()" type="button">
              💾 Save Draft
            </button>
            <button class="action-btn primary" (click)="publishEvent()" type="button">
              🚀 Publish Event
            </button>
          </div>

        </main>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Event Not Found</h2>
          <p>{{ error() }}</p>
          <button class="action-btn primary" (click)="goBack()" type="button">Go Back</button>
        </div>
      }

    </div>
  `,
  styles: [`
    .event-enhancement {
      min-height: 100vh;
      background: var(--background);
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--background-lighter);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .back-btn:hover {
      color: var(--primary);
      background: var(--background);
    }

    .header-info {
      flex: 1;
      text-align: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.875rem;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--warning);
      color: var(--background);
      padding: 0.5rem 0.875rem;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Main Content */
    .main-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Event Summary */
    .event-summary {
      margin-bottom: 2rem;
    }

    .summary-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--background-lighter);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .event-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .event-details {
      flex: 1;
    }

    .event-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 1rem 0;
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .meta-icon {
      width: 1.2rem;
      text-align: center;
    }

    .summary-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--background-lighter);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .section-header {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem 0;
    }

    .section-subtitle {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .form-field {
      margin-bottom: 1.5rem;
    }

    .field-label {
      display: block;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .field-input, .field-textarea {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      background: var(--background);
      color: var(--text);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .field-input:focus, .field-textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .field-textarea {
      resize: vertical;
      min-height: 100px;
    }

    /* AI Suggestions */
    .ai-suggestion {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--accent);
      color: var(--background);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .use-suggestion-btn {
      background: var(--background);
      color: var(--accent);
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .use-suggestion-btn:hover {
      background: var(--background-lighter);
    }

    /* Categories */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
    }

    .category-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-option:hover {
      background: var(--background-lightest);
      border-color: var(--primary);
    }

    .category-option input[type="checkbox"]:checked + .category-label {
      color: var(--primary);
      font-weight: 600;
    }

    /* Tags */
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .tag-chip {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--primary);
      color: var(--on-primary);
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .remove-tag {
      background: none;
      border: none;
      color: var(--on-primary);
      cursor: pointer;
      padding: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }

    .remove-tag:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Completion Meter */
    .completion-section {
      margin-bottom: 2rem;
    }

    .completion-meter {
      padding: 1.5rem;
      background: var(--background-lighter);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .meter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .meter-label {
      font-weight: 600;
      color: var(--text);
    }

    .meter-percentage {
      font-weight: 700;
      color: var(--primary);
    }

    .meter-bar {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .meter-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--success), var(--primary));
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .meter-tip {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* Action Bar */
    .action-bar {
      display: flex;
      gap: 1rem;
      justify-content: center;
      padding: 2rem 0;
      border-top: 1px solid var(--border);
    }

    .action-btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 140px;
    }

    .action-btn.primary {
      background: var(--success);
      color: var(--background);
    }

    .action-btn.primary:hover {
      background: var(--success-hover);
      transform: translateY(-1px);
    }

    .action-btn.secondary {
      background: var(--background-lighter);
      color: var(--text);
      border: 2px solid var(--border);
    }

    .action-btn.secondary:hover {
      border-color: var(--primary);
      background: var(--background-lightest);
    }

    /* States */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      padding: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }

      .summary-card {
        flex-direction: column;
        text-align: center;
      }

      .event-meta {
        align-items: center;
      }

      .action-bar {
        flex-direction: column;
        align-items: center;
      }

      .action-btn {
        width: 100%;
        max-width: 300px;
      }

      .category-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EventEnhancementComponent implements OnInit {
  // Services
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly eventStore = inject(EventStore);

  // State
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly event = signal<EventModel | null>(null);
  readonly enhancementForm = signal<EventEnhancementForm>({
    description: '',
    organizer: '',
    contactInfo: '',
    website: '',
    ticketInfo: '',
    categories: [],
    tags: []
  });

  // Form state
  tagInput = '';
  readonly availableCategories = EVENT_CATEGORIES;

  // Computed values
  readonly completionPercentage = computed(() => {
    const form = this.enhancementForm();
    const event = this.event();
    if (!event) return 0;

    let completed = 0;
    const total = 8;

    // Basic info (always completed from previous step)
    completed += 3; // title, location, date

    // Enhancement fields
    if (form.description.trim()) completed++;
    if (form.organizer.trim()) completed++;
    if (form.contactInfo.trim()) completed++;
    if (form.categories.length > 0) completed++;
    if (form.tags.length > 0) completed++;

    return Math.round((completed / total) * 100);
  });

  readonly suggestedDescription = signal<string | null>(null);

  ngOnInit() {
    this.loadEvent();
    this.generateSuggestions();
  }

  private async loadEvent() {
    try {
      const eventId = this.route.snapshot.paramMap.get('id');
      if (!eventId) {
        this.error.set('No event ID provided');
        this.isLoading.set(false);
        return;
      }

      // Load event from EventStore
      const event = await this.eventStore.fetchEventById(eventId);

      if (event) {
        this.event.set(event);

        // Pre-populate enhancement form with existing data
        this.enhancementForm.set({
          description: event.description || '',
          organizer: event.organizer || '',
          contactInfo: event.contactInfo || '',
          website: event.website || '',
          ticketInfo: event.ticketInfo || '',
          categories: event.categories || [],
          tags: event.tags || []
        });
      } else {
        this.error.set('Event not found');
      }

      this.isLoading.set(false);

    } catch (err) {
      console.error('Error in loadEvent:', err);
      this.error.set('Failed to load event');
      this.isLoading.set(false);
    }
  }

  private generateSuggestions() {
    // Generate AI suggestions based on event title
    const event = this.event();
    if (event?.title) {
      // Mock AI suggestion
      this.suggestedDescription.set(
        `Join us for an unforgettable ${event.title.toLowerCase()}! Experience great music, atmosphere, and community in the heart of Watford.`
      );
    }
  }

  // Event formatting
  getEventIcon(): string {
    const categories = this.event()?.categories || [];
    if (categories.includes('music')) return '🎵';
    if (categories.includes('sports')) return '⚽';
    if (categories.includes('food')) return '🍴';
    if (categories.includes('arts')) return '🎨';
    return '📅';
  }

  formatEventDate(): string {
    const event = this.event();
    if (!event) return '';

    const date = new Date(event.date);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Category management
  isCategorySelected(category: EventCategory): boolean {
    return this.enhancementForm().categories.includes(category);
  }

  toggleCategory(category: EventCategory) {
    this.enhancementForm.update(form => {
      const categories = form.categories.includes(category)
        ? form.categories.filter(c => c !== category)
        : [...form.categories, category];

      return { ...form, categories };
    });
  }

  // Tag management
  updateTags() {
    const tags = this.tagInput.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    this.enhancementForm.update(form => ({ ...form, tags }));
    this.tagInput = '';
  }

  removeTag(tagToRemove: string) {
    this.enhancementForm.update(form => ({
      ...form,
      tags: form.tags.filter(tag => tag !== tagToRemove)
    }));
  }

  // AI suggestions
  useSuggestion(field: string) {
    if (field === 'description' && this.suggestedDescription()) {
      this.enhancementForm.update(form => ({
        ...form,
        description: this.suggestedDescription()!
      }));
    }
  }

  // Completion tips
  getCompletionTip(): string {
    const percentage = this.completionPercentage();
    if (percentage >= 80) return 'Your event looks great! Ready to publish.';
    if (percentage >= 60) return 'Add a few more details to boost discoverability.';
    if (percentage >= 40) return 'Consider adding a description and contact info.';
    return 'Add more details to help people find and understand your event.';
  }

  // Actions
  goBack() {
    window.history.back();
  }

  previewEvent() {
    // TODO: Open preview modal or navigate to preview page
    console.log('Preview event:', this.event());
  }

  async saveDraft() {
    try {
      const event = this.event();
      if (!event) return;

      const enhancements = this.enhancementForm();

      // Update event with enhancements
      const updatedEvent = await this.eventStore.updateEvent(event.id, {
        description: enhancements.description.trim() || undefined,
        organizer: enhancements.organizer.trim() || undefined,
        contactInfo: enhancements.contactInfo.trim() || undefined,
        website: enhancements.website.trim() || undefined,
        ticketInfo: enhancements.ticketInfo.trim() || undefined,
        categories: enhancements.categories,
        tags: enhancements.tags,
        updatedAt: new Date()
      });

      if (updatedEvent) {
        // Update local event state
        this.event.set(updatedEvent);
        alert('Draft saved! 💾');
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  }

  async publishEvent() {
    try {
      const event = this.event();
      if (!event) return;

      const enhancements = this.enhancementForm();

      // First save any pending enhancements
      const updatedEvent = await this.eventStore.updateEvent(event.id, {
        description: enhancements.description.trim() || undefined,
        organizer: enhancements.organizer.trim() || undefined,
        contactInfo: enhancements.contactInfo.trim() || undefined,
        website: enhancements.website.trim() || undefined,
        ticketInfo: enhancements.ticketInfo.trim() || undefined,
        categories: enhancements.categories,
        tags: enhancements.tags,
        updatedAt: new Date()
      });

      if (!updatedEvent) {
        throw new Error('Failed to save enhancements');
      }

      // Now publish the event
      const publishedEvent = await this.eventStore.publishEvent(event.id);

      if (publishedEvent) {
        alert('Event published successfully! 🚀');
        this.router.navigate(['/events', event.slug || event.id]);
      } else {
        throw new Error('Failed to publish event');
      }
    } catch (error) {
      console.error('Error publishing event:', error);
      alert('Failed to publish event. Please try again.');
    }
  }

  saveEnhancements() {
    // Called when form is submitted
    this.saveDraft();
  }
}
