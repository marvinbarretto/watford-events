import { Component, signal, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EventParsingService, EditableEventData, ParsedEventData } from '../data-access/event-parsing.service';
import { EventStore } from '../data-access/event.store';
import { EventModel, EventType, EventCategory, EVENT_CATEGORIES } from '../utils/event.model';
import { VenueLookupService } from '../../shared/data-access/venue-lookup.service';
import { Venue } from '../../venues/utils/venue.model';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-natural-language-add-event',
  imports: [RouterModule, FormsModule, IconComponent],
  template: `
    <div class="natural-add-container">
      <!-- Header -->
      <div class="header">
        <button class="back-btn" (click)="goBack()">
          <app-icon name="arrow_back" size="sm" />
          <span>Back</span>
        </button>
        <h1>What's your event?</h1>
        <p class="subtitle">Describe your event naturally and we'll help you create it</p>
      </div>

      <!-- Chat Interface -->
      <div class="chat-container">
        <!-- Example Prompts -->
        @if (!hasStarted()) {
          <div class="example-prompts">
            <h3>Try saying something like:</h3>
            <div class="prompt-cards">
              <button
                class="prompt-card"
                (click)="useExample('Jazz concert at The Horns next Saturday 8pm, £15 tickets')"
              >
                <strong>Jazz concert</strong> at The Horns next Saturday 8pm, £15 tickets
              </button>
              <button
                class="prompt-card"
                (click)="useExample('Team lunch Friday 12pm at Marios Restaurant')"
              >
                <strong>Team lunch</strong> Friday 12pm at Marios Restaurant
              </button>
              <button
                class="prompt-card"
                (click)="useExample('Workshop every Monday 7pm at Community Centre, free entry')"
              >
                <strong>Workshop</strong> every Monday 7pm at Community Centre, free entry
              </button>
            </div>
          </div>
        }

        <!-- Chat Messages -->
        <div class="chat-messages" #chatMessages>
          @for (message of chatHistory(); track $index) {
            <div class="message" [class]="'message--' + message.type">
              <div class="message-content">
                @if (message.type === 'user') {
                  <div class="message-text">{{ message.text }}</div>
                } @else {
                  <div class="message-text" [innerHTML]="message.text"></div>
                }
              </div>
              @if (message.type === 'ai' && message.eventData) {
                <div class="parsed-preview">
                  <div class="preview-header">
                    <span class="confidence-badge" [class]="getConfidenceClass(message.confidence || 0)">
                      {{ message.confidence }}% confident
                    </span>
                  </div>
                  <div class="preview-fields">
                    @if (message.eventData.title) {
                      <div class="field">
                        <label>Title:</label>
                        <span>{{ message.eventData.title }}</span>
                      </div>
                    }
                    @if (message.eventData.date) {
                      <div class="field">
                        <label>Date:</label>
                        <span>{{ formatDate(message.eventData.date) }}</span>
                      </div>
                    }
                    @if (message.eventData.location) {
                      <div class="field">
                        <label>Location:</label>
                        <span>{{ message.eventData.location }}</span>
                      </div>
                    }
                    @if (message.eventData.ticketInfo) {
                      <div class="field">
                        <label>Tickets:</label>
                        <span>{{ message.eventData.ticketInfo }}</span>
                      </div>
                    }
                  </div>
                  @if (message.confidence && message.confidence >= 75) {
                    <div class="preview-actions">
                      <button class="btn-enhance" (click)="enhanceEvent()">
                        ✨ Enhance Details
                      </button>
                      <button class="btn-create" (click)="createEvent()">
                        ✅ Create Event
                      </button>
                    </div>
                  } @else {
                    <div class="improvement-suggestions">
                      <p>Try adding more details like:</p>
                      <ul>
                        @if (!message.eventData.date) {
                          <li>When is it happening?</li>
                        }
                        @if (!message.eventData.location) {
                          <li>Where is it taking place?</li>
                        }
                        @if (!message.eventData.ticketInfo) {
                          <li>How much does it cost?</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (isProcessing()) {
            <div class="message message--ai">
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="chat-input-container">
          <div class="input-wrapper">
            <textarea
              #messageInput
              [value]="currentInput()"
              (input)="onInputChange($event)"
              (keydown.enter)="handleEnterKey($event)"
              placeholder="Describe your event... (e.g., 'Coffee morning tomorrow 10am at the community hall, bring £2')"
              class="message-input"
              rows="2"
              [disabled]="isProcessing()"
            ></textarea>
            <button
              class="send-btn"
              (click)="sendMessage()"
              [disabled]="!currentInput().trim() || isProcessing()"
            >
              @if (isProcessing()) {
                <span class="spinner"></span>
              } @else {
                Send
              }
            </button>
          </div>

          <!-- Quick Actions -->
          @if (hasStarted()) {
            <div class="quick-actions">
              <button class="quick-action" (click)="addMoreDetails()">
                📝 Add more details
              </button>
              <button class="quick-action" (click)="startOver()">
                🔄 Start over
              </button>
              <button class="quick-action" (click)="useManualForm()">
                📋 Use manual form
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .natural-add-container {
      height: 100vh;
      background: var(--background);
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      background: var(--background-lighter);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      font-size: 16px;
      color: var(--primary);
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
      margin-bottom: 1rem;
    }

    .back-btn:hover {
      background: var(--background);
    }

    .back-arrow {
      font-size: 20px;
    }

    .header h1 {
      margin: 0 0 0.5rem 0;
      color: var(--text);
      font-size: 2rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
      font-size: 1.1rem;
    }

    /* Chat Interface */
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
      padding: 0 1.5rem;
    }

    /* Example Prompts */
    .example-prompts {
      padding: 2rem 0;
      text-align: center;
    }

    .example-prompts h3 {
      margin: 0 0 1.5rem 0;
      color: var(--text);
      font-weight: 600;
    }

    .prompt-cards {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;
    }

    .prompt-card {
      background: var(--background-lighter);
      border: 2px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-size: 1rem;
      color: var(--text);
    }

    .prompt-card:hover {
      border-color: var(--primary);
      background: var(--secondary);
      transform: translateY(-2px);
    }

    .prompt-card strong {
      color: var(--primary);
    }

    /* Chat Messages */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }

    .message--user {
      align-self: flex-end;
    }

    .message--ai {
      align-self: flex-start;
    }

    .message-content {
      background: var(--background-lighter);
      border-radius: 18px;
      padding: 1rem 1.5rem;
      border: 1px solid var(--border);
    }

    .message--user .message-content {
      background: var(--primary);
      color: var(--on-primary);
      border-color: var(--primary);
    }

    .message-text {
      margin: 0;
      line-height: 1.5;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-secondary);
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Parsed Preview */
    .parsed-preview {
      margin-top: 1rem;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .confidence-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .confidence-badge.high {
      background: var(--success);
      color: var(--background-darker);
    }

    .confidence-badge.medium {
      background: var(--warning);
      color: var(--background-darker);
    }

    .confidence-badge.low {
      background: var(--error);
      color: var(--background-lighter);
    }

    .preview-fields {
      display: grid;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .field {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .field label {
      font-weight: 600;
      color: var(--text-secondary);
      min-width: 4rem;
      font-size: 0.875rem;
    }

    .field span {
      color: var(--text);
    }

    .preview-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .btn-enhance, .btn-create {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .btn-enhance {
      background: var(--secondary);
      color: var(--text);
      border: 1px solid var(--border);
    }

    .btn-enhance:hover {
      background: var(--background);
    }

    .btn-create {
      background: var(--primary);
      color: var(--on-primary);
    }

    .btn-create:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .improvement-suggestions {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--secondary);
      border-radius: 8px;
    }

    .improvement-suggestions p {
      margin: 0 0 0.5rem 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .improvement-suggestions ul {
      margin: 0;
      padding-left: 1.25rem;
      color: var(--text);
    }

    .improvement-suggestions li {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    /* Input Area */
    .chat-input-container {
      padding: 1rem 0;
      border-top: 1px solid var(--border);
      background: var(--background);
    }

    .input-wrapper {
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      margin-bottom: 1rem;
    }

    .message-input {
      flex: 1;
      padding: 1rem;
      border: 2px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      line-height: 1.5;
      resize: none;
      transition: border-color 0.2s;
      background: var(--background-lighter);
      color: var(--text);
      min-height: 60px;
      max-height: 120px;
    }

    .message-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .message-input::placeholder {
      color: var(--text-secondary);
    }

    .send-btn {
      padding: 1rem 1.5rem;
      background: var(--primary);
      color: var(--on-primary);
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 80px;
      height: 60px;
    }

    .send-btn:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .send-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .quick-action {
      padding: 0.5rem 1rem;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text);
    }

    .quick-action:hover {
      background: var(--secondary);
      border-color: var(--primary);
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .natural-add-container {
        height: 100vh;
      }

      .header {
        padding: 1rem;
      }

      .header h1 {
        font-size: 1.5rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .chat-container {
        padding: 0 1rem;
      }

      .message {
        max-width: 90%;
      }

      .prompt-cards {
        grid-template-columns: 1fr;
      }

      .input-wrapper {
        flex-direction: column;
        gap: 0.5rem;
      }

      .send-btn {
        width: 100%;
        height: 50px;
      }

      .quick-actions {
        justify-content: center;
      }
    }
  `]
})
export class NaturalLanguageAddEventComponent implements AfterViewInit {
  // Services
  private eventParsingService = inject(EventParsingService);
  private eventStore = inject(EventStore);
  private router = inject(Router);
  private venueLookupService = inject(VenueLookupService);

  // View refs
  @ViewChild('messageInput') messageInputRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef<HTMLDivElement>;

  // State signals
  readonly chatHistory = signal<ChatMessage[]>([]);
  readonly currentInput = signal('');
  readonly isProcessing = signal(false);
  readonly hasStarted = signal(false);
  readonly currentEventData = signal<EditableEventData | null>(null);
  readonly currentConfidence = signal(0);

  ngAfterViewInit() {
    // Focus the input after view init
    this.focusInput();
  }

  useExample(text: string) {
    this.currentInput.set(text);
    this.sendMessage();
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.currentInput.set(target.value);
  }

  handleEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    const message = this.currentInput().trim();
    if (!message || this.isProcessing()) return;

    // Add user message
    this.addMessage({
      type: 'user',
      text: message,
      timestamp: new Date()
    });

    this.currentInput.set('');
    this.hasStarted.set(true);
    this.isProcessing.set(true);

    try {
      // Parse the message
      const parsed = this.eventParsingService.parseEventText(message);
      const editableData = this.eventParsingService.convertToEditableFormat(parsed);

      // Store current event data
      this.currentEventData.set(editableData);
      this.currentConfidence.set(parsed.overallConfidence);

      // Generate response message
      const responseText = this.generateResponseText(parsed, editableData);

      // Add AI response
      this.addMessage({
        type: 'ai',
        text: responseText,
        timestamp: new Date(),
        eventData: editableData,
        confidence: parsed.overallConfidence
      });

    } catch (error) {
      console.error('Error parsing message:', error);
      this.addMessage({
        type: 'ai',
        text: "I had trouble understanding that. Could you try rephrasing your event details?",
        timestamp: new Date()
      });
    } finally {
      this.isProcessing.set(false);
      this.scrollToBottom();
      this.focusInput();
    }
  }

  private addMessage(message: ChatMessage) {
    this.chatHistory.update(history => [...history, message]);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private generateResponseText(parsed: ParsedEventData, editable: EditableEventData): string {
    const confidence = parsed.overallConfidence;

    if (confidence >= 85) {
      return "Great! I've extracted the key details from your event description. Everything looks good!";
    } else if (confidence >= 70) {
      return "I've got most of the details! You might want to add a bit more information to make sure everything's perfect.";
    } else if (confidence >= 50) {
      return "I've picked up some details, but I need a bit more information to create a complete event.";
    } else {
      return "I can see you're describing an event, but I need more details to help you create it. Try adding information like the date, time, and location.";
    }
  }

  enhanceEvent() {
    const eventData = this.currentEventData();
    if (!eventData) return;

    // Navigate to the confirmation page with event data
    this.router.navigate(['/events/create/confirm'], {
      state: {
        eventData: eventData
      }
    });
  }

  async createEvent() {
    const eventData = this.currentEventData();
    if (!eventData || !eventData.title || !eventData.date) {
      this.addMessage({
        type: 'ai',
        text: "I need at least a title and date to create the event. Can you provide those details?",
        timestamp: new Date()
      });
      return;
    }

    this.isProcessing.set(true);

    try {
      // Convert to AppEvent format
      const eventToCreate = {
        title: eventData.title,
        description: eventData.description || '',
        date: typeof eventData.date === 'string' ? eventData.date : new Date(eventData.date).toISOString().split('T')[0],
        location: eventData.location || '',
        organizer: eventData.organizer,
        ticketInfo: eventData.ticketInfo,
        contactInfo: eventData.contactInfo,
        website: eventData.website,
        categories: eventData.categories || [],
        tags: eventData.tags || [],
        status: 'published' as const,
        attendeeIds: [],
        eventType: 'single' as EventType,
        isException: false
      };

      const savedEvent = await this.eventStore.createEvent(eventToCreate);

      if (savedEvent) {
        this.addMessage({
          type: 'ai',
          text: `🎉 Perfect! Your event "<strong>${eventData.title}</strong>" has been created successfully. You can view it in your events list.`,
          timestamp: new Date()
        });

        // Navigate to events list after a delay
        setTimeout(() => {
          this.router.navigate(['/events']);
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error creating event:', error);
      this.addMessage({
        type: 'ai',
        text: `Sorry, there was an error creating your event: ${error.message}. Please try again.`,
        timestamp: new Date()
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  addMoreDetails() {
    this.focusInput();
    this.addMessage({
      type: 'ai',
      text: "What additional details would you like to add? You can mention things like the organizer, ticket prices, contact information, or any other relevant details.",
      timestamp: new Date()
    });
  }

  startOver() {
    this.chatHistory.set([]);
    this.currentEventData.set(null);
    this.currentConfidence.set(0);
    this.hasStarted.set(false);
    this.currentInput.set('');
    this.focusInput();
  }

  useManualForm() {
    const eventData = this.currentEventData();
    if (eventData) {
      this.router.navigate(['/events/create/confirm'], {
        state: {
          eventData: eventData
        }
      });
    } else {
      this.router.navigate(['/events/create']);
    }
  }

  goBack() {
    this.router.navigate(['/events/create']);
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  private focusInput() {
    setTimeout(() => {
      if (this.messageInputRef?.nativeElement) {
        this.messageInputRef.nativeElement.focus();
      }
    }, 100);
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatMessagesRef?.nativeElement) {
        const element = this.chatMessagesRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}

// Supporting interfaces
interface ChatMessage {
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  eventData?: EditableEventData;
  confidence?: number;
}
