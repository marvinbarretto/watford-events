import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonRadio,
  IonRadioGroup,
  IonButton,
  IonButtons,
  IonIcon,
  IonDatetime,
  IonModal,
  IonToggle,
  IonRange,
  IonItemDivider,
  IonNote,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendar, 
  time, 
  location, 
  people,
  pricetag,
  save,
  close
} from 'ionicons/icons';

@Component({
  selector: 'app-mobile-form',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonRadio,
    IonRadioGroup,
    IonButton,
    IonButtons,
    IonIcon,
    IonDatetime,
    IonModal,
    IonToggle,
    IonRange,
    IonNote,
    IonGrid,
    IonRow,
    IonCol
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mobile Form</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSave()">
            <ion-icon name="save"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <form>
        <!-- Basic Information -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Event Details</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Event Name</ion-label>
                <ion-input 
                  [(ngModel)]="formData.eventName"
                  name="eventName"
                  placeholder="Enter event name"
                  required></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Description</ion-label>
                <ion-textarea 
                  [(ngModel)]="formData.description"
                  name="description"
                  placeholder="Describe your event..."
                  rows="3"
                  auto-grow="true"></ion-textarea>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Category</ion-label>
                <ion-select 
                  [(ngModel)]="formData.category"
                  name="category"
                  placeholder="Select category">
                  <ion-select-option value="music">Music</ion-select-option>
                  <ion-select-option value="tech">Technology</ion-select-option>
                  <ion-select-option value="art">Art & Culture</ion-select-option>
                  <ion-select-option value="sports">Sports</ion-select-option>
                  <ion-select-option value="food">Food & Drink</ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Location</ion-label>
                <ion-input 
                  [(ngModel)]="formData.location"
                  name="location"
                  placeholder="Event location">
                  <ion-icon name="location" slot="start"></ion-icon>
                </ion-input>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        
        <!-- Date & Time -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Schedule</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item button (click)="openDateModal()">
                <ion-icon name="calendar" slot="start"></ion-icon>
                <ion-label>
                  <h3>Date</h3>
                  <p>{{ formData.eventDate || 'Select date' }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item button (click)="openTimeModal()">
                <ion-icon name="time" slot="start"></ion-icon>
                <ion-label>
                  <h3>Time</h3>
                  <p>{{ formData.eventTime || 'Select time' }}</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Duration (hours)</ion-label>
                <ion-range 
                  [(ngModel)]="formData.duration"
                  name="duration"
                  min="1" 
                  max="24" 
                  step="0.5"
                  snaps="true"
                  color="primary">
                  <ion-label slot="start">1h</ion-label>
                  <ion-label slot="end">24h</ion-label>
                </ion-range>
                <ion-note slot="helper">{{ formData.duration }}h</ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        
        <!-- Pricing -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Pricing</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label>Event Type</ion-label>
                <ion-radio-group [(ngModel)]="formData.eventType" name="eventType">
                  <ion-item>
                    <ion-radio value="free" slot="start"></ion-radio>
                    <ion-label>Free Event</ion-label>
                  </ion-item>
                  <ion-item>
                    <ion-radio value="paid" slot="start"></ion-radio>
                    <ion-label>Paid Event</ion-label>
                  </ion-item>
                </ion-radio-group>
              </ion-item>
              
              @if (formData.eventType === 'paid') {
                <ion-item>
                  <ion-label position="stacked">Price (£)</ion-label>
                  <ion-input 
                    [(ngModel)]="formData.price"
                    name="price"
                    type="number"
                    placeholder="0.00"
                    step="0.01">
                    <ion-icon name="pricetag" slot="start"></ion-icon>
                  </ion-input>
                </ion-item>
              }
              
              @if (formData.eventType === 'paid') {
                <ion-item>
                  <ion-label position="stacked">Max Attendees</ion-label>
                  <ion-input 
                    [(ngModel)]="formData.maxAttendees"
                    name="maxAttendees"
                    type="number"
                    placeholder="100">
                    <ion-icon name="people" slot="start"></ion-icon>
                  </ion-input>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>
        
        <!-- Settings -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Settings</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-checkbox 
                  [(ngModel)]="formData.isPublic"
                  name="isPublic"
                  slot="start"></ion-checkbox>
                <ion-label>
                  <h3>Public Event</h3>
                  <p>Anyone can see this event</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-toggle 
                  [(ngModel)]="formData.allowRegistration"
                  name="allowRegistration"
                  slot="end"></ion-toggle>
                <ion-label>
                  <h3>Online Registration</h3>
                  <p>Allow users to register online</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-toggle 
                  [(ngModel)]="formData.sendNotifications"
                  name="sendNotifications"
                  slot="end"></ion-toggle>
                <ion-label>
                  <h3>Send Notifications</h3>
                  <p>Notify attendees of updates</p>
                </ion-label>
              </ion-item>
              
              <ion-item>
                <ion-toggle 
                  [(ngModel)]="formData.showAttendeeCount"
                  name="showAttendeeCount"
                  slot="end"></ion-toggle>
                <ion-label>
                  <h3>Show Attendee Count</h3>
                  <p>Display number of people attending</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        
        <!-- Actions -->
        <ion-card>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="6">
                  <ion-button expand="block" fill="clear" color="medium">
                    Cancel
                  </ion-button>
                </ion-col>
                <ion-col size="6">
                  <ion-button expand="block" (click)="onSubmit()">
                    Create Event
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>
      </form>
      
      <!-- Date Modal -->
      <ion-modal [isOpen]="showDateModal" (didDismiss)="showDateModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Select Date</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showDateModal = false">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-datetime 
              [(ngModel)]="formData.eventDate"
              name="eventDate"
              presentation="date"
              (ionChange)="onDateChange()">
            </ion-datetime>
          </ion-content>
        </ng-template>
      </ion-modal>
      
      <!-- Time Modal -->
      <ion-modal [isOpen]="showTimeModal" (didDismiss)="showTimeModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Select Time</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showTimeModal = false">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-datetime 
              [(ngModel)]="formData.eventTime"
              name="eventTime"
              presentation="time"
              (ionChange)="onTimeChange()">
            </ion-datetime>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 16px;
    }
    
    ion-item {
      --inner-border-width: 0 0 1px 0;
    }
    
    ion-range {
      padding: 20px 0;
    }
    
    ion-note {
      text-align: center;
    }
    
    .form-actions {
      padding: 16px;
    }
    
    ion-datetime {
      --background: var(--ion-color-light);
    }
  `]
})
export class MobileFormComponent {
  formData = {
    eventName: '',
    description: '',
    category: '',
    location: '',
    eventDate: '',
    eventTime: '',
    duration: 2,
    eventType: 'free',
    price: null,
    maxAttendees: null,
    isPublic: true,
    allowRegistration: false,
    sendNotifications: true,
    showAttendeeCount: false
  };
  
  showDateModal = false;
  showTimeModal = false;
  
  constructor() {
    addIcons({ 
      calendar, 
      time, 
      location, 
      people,
      pricetag,
      save,
      close
    });
  }
  
  openDateModal() {
    this.showDateModal = true;
  }
  
  openTimeModal() {
    this.showTimeModal = true;
  }
  
  onDateChange() {
    this.showDateModal = false;
  }
  
  onTimeChange() {
    this.showTimeModal = false;
  }
  
  onSave() {
    console.log('Form saved:', this.formData);
  }
  
  onSubmit() {
    console.log('Form submitted:', this.formData);
  }
}