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
  IonAvatar,
  IonBadge,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendar, 
  people, 
  trendingUp, 
  notifications, 
  star,
  add,
  statsChart,
  time,
  location,
  ticket
} from 'ionicons/icons';

@Component({
  selector: 'app-mobile-dashboard',
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
    IonAvatar,
    IonBadge,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonFab,
    IonFabButton
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mobile Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Stats Cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-icon">
                  <ion-icon name="calendar" color="primary"></ion-icon>
                </div>
                <div class="stat-number">1,234</div>
                <div class="stat-label">Events</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-icon">
                  <ion-icon name="people" color="secondary"></ion-icon>
                </div>
                <div class="stat-number">456</div>
                <div class="stat-label">Attendees</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-icon">
                  <ion-icon name="trending-up" color="success"></ion-icon>
                </div>
                <div class="stat-number">89%</div>
                <div class="stat-label">Success</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-icon">
                  <ion-icon name="stats-chart" color="warning"></ion-icon>
                </div>
                <div class="stat-number">£2.4k</div>
                <div class="stat-label">Revenue</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Segment Filter -->
      <ion-segment [(ngModel)]="selectedSegment" class="segment-filter">
        <ion-segment-button value="recent">
          <ion-label>Recent</ion-label>
        </ion-segment-button>
        <ion-segment-button value="popular">
          <ion-label>Popular</ion-label>
        </ion-segment-button>
        <ion-segment-button value="upcoming">
          <ion-label>Upcoming</ion-label>
        </ion-segment-button>
      </ion-segment>
      
      <!-- Event List -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="calendar" slot="start"></ion-icon>
            Events
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            @for (event of events; track event.name) {
              <ion-item>
              <ion-avatar slot="start">
                <img [src]="event.avatar" [alt]="event.name">
              </ion-avatar>
              <ion-label>
                <h2>{{ event.name }}</h2>
                <p>
                  <ion-icon name="location" size="small"></ion-icon>
                  {{ event.location }}
                </p>
                <p>
                  <ion-icon name="time" size="small"></ion-icon>
                  {{ event.date }}
                </p>
              </ion-label>
              <ion-badge 
                slot="end" 
                [color]="getBadgeColor(event.status)">
                {{ event.status }}
              </ion-badge>
              </ion-item>
            }
          </ion-list>
        </ion-card-content>
      </ion-card>
      
      <!-- Quick Actions -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Quick Actions</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-button expand="block" fill="outline" color="primary">
                  <ion-icon name="add" slot="start"></ion-icon>
                  Create Event
                </ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button expand="block" fill="outline" color="secondary">
                  <ion-icon name="stats-chart" slot="start"></ion-icon>
                  View Stats
                </ion-button>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="6">
                <ion-button expand="block" fill="outline" color="tertiary">
                  <ion-icon name="people" slot="start"></ion-icon>
                  Manage Users
                </ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button expand="block" fill="outline" color="warning">
                  <ion-icon name="notifications" slot="start"></ion-icon>
                  Notifications
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>
      
      <!-- Activity Feed -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Recent Activity</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            @for (activity of activities; track activity.title) {
              <ion-item>
              <ion-avatar slot="start">
                <div class="activity-icon" [style.background-color]="activity.color">
                  <ion-icon [name]="activity.icon" color="light"></ion-icon>
                </div>
              </ion-avatar>
              <ion-label>
                <h3>{{ activity.title }}</h3>
                <p>{{ activity.description }}</p>
                <p class="activity-time">{{ activity.time }}</p>
              </ion-label>
              </ion-item>
            }
          </ion-list>
        </ion-card-content>
      </ion-card>
      
      <!-- Floating Action Button -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button>
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .stat-card {
      margin: 8px;
    }
    
    .stat-card ion-card-content {
      text-align: center;
      padding: 16px;
    }
    
    .stat-icon {
      font-size: 2rem;
      margin-bottom: 8px;
    }
    
    .stat-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--ion-color-primary);
    }
    
    .stat-label {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }
    
    .segment-filter {
      margin: 16px;
    }
    
    .activity-icon {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .activity-time {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }
    
    ion-item ion-icon[size="small"] {
      margin-right: 4px;
    }
  `]
})
export class MobileDashboardComponent {
  selectedSegment = 'recent';
  
  events = [
    {
      name: 'Summer Music Festival',
      location: 'Central Park',
      date: '2024-08-15',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40/FF6B6B/FFFFFF?text=M'
    },
    {
      name: 'Tech Conference 2024',
      location: 'Convention Center',
      date: '2024-09-02',
      status: 'Pending',
      avatar: 'https://via.placeholder.com/40x40/4ECDC4/FFFFFF?text=T'
    },
    {
      name: 'Art Exhibition',
      location: 'Gallery District',
      date: '2024-07-20',
      status: 'Completed',
      avatar: 'https://via.placeholder.com/40x40/45B7D1/FFFFFF?text=A'
    },
    {
      name: 'Food Festival',
      location: 'Market Square',
      date: '2024-08-30',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40/F39C12/FFFFFF?text=F'
    }
  ];
  
  activities = [
    {
      title: 'New Event Created',
      description: 'Summer Music Festival was created',
      time: '2 hours ago',
      icon: 'calendar',
      color: '#667eea'
    },
    {
      title: 'User Registration',
      description: 'John Doe registered for Tech Conference',
      time: '4 hours ago',
      icon: 'people',
      color: '#4ECDC4'
    },
    {
      title: 'Ticket Purchase',
      description: '5 tickets sold for Art Exhibition',
      time: '6 hours ago',
      icon: 'ticket',
      color: '#F39C12'
    },
    {
      title: 'Event Updated',
      description: 'Food Festival details updated',
      time: '1 day ago',
      icon: 'notifications',
      color: '#E74C3C'
    }
  ];
  
  constructor() {
    addIcons({ 
      calendar, 
      people, 
      trendingUp, 
      notifications, 
      star,
      add,
      statsChart,
      time,
      location,
      ticket
    });
  }
  
  getBadgeColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'medium';
      default:
        return 'primary';
    }
  }
}