import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fullscreen-welcome',
  imports: [CommonModule],
  template: `
    <div class="welcome-container">
      <div class="welcome-content">
        <!-- Logo/Brand -->
        <div class="brand">
          <div class="logo">🎭</div>
          <h1>Watford Events</h1>
        </div>

        <!-- Welcome Message -->
        <div class="welcome-message">
          <h2>Welcome Back!</h2>
          <p>Ready to discover amazing events in your area?</p>
        </div>

        <!-- Action Buttons -->
        <div class="actions">
          <button class="btn btn-primary" (click)="goToEvents()">
            Explore Events
          </button>
          <button class="btn btn-secondary" (click)="goToFlyerParser()">
            📸 Scan Flyer
          </button>
          <button class="btn btn-outline" (click)="goToProfile()">
            My Profile
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat">
            <div class="stat-number">{{ stats.totalEvents }}</div>
            <div class="stat-label">Events This Month</div>
          </div>
          <div class="stat">
            <div class="stat-number">{{ stats.attendees }}</div>
            <div class="stat-label">People Attending</div>
          </div>
          <div class="stat">
            <div class="stat-number">{{ stats.categories }}</div>
            <div class="stat-label">Categories</div>
          </div>
        </div>

        <!-- Featured Events -->
        <div class="featured-events">
          <h3>Featured Events</h3>
          <div class="event-cards">
            <div
              *ngFor="let event of featuredEvents"
              class="event-card"
              (click)="viewEvent(event)">
              <div class="event-date">
                <div class="day">{{ event.day }}</div>
                <div class="month">{{ event.month }}</div>
              </div>
              <div class="event-info">
                <h4>{{ event.name }}</h4>
                <p>{{ event.location }}</p>
                <span class="event-category">{{ event.category }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Background Animation -->
      <div class="background-animation">
        <div class="floating-element" *ngFor="let element of floatingElements"
             [style.left.%]="element.x"
             [style.top.%]="element.y"
             [style.animation-delay.s]="element.delay">
          {{ element.icon }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow: hidden;
    }

    .welcome-content {
      max-width: 500px;
      width: 90%;
      text-align: center;
      padding: 2rem;
      position: relative;
      z-index: 2;
    }

    .brand {
      margin-bottom: 2rem;
    }

    .logo {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .brand h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .welcome-message {
      margin-bottom: 2rem;
    }

    .welcome-message h2 {
      font-size: 1.8rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }

    .welcome-message p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .btn {
      padding: 0.875rem 2rem;
      border: none;
      border-radius: 25px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-primary:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .btn-outline {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
      transform: translateY(-2px);
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .featured-events {
      text-align: left;
    }

    .featured-events h3 {
      text-align: center;
      margin-bottom: 1rem;
      font-weight: 400;
    }

    .event-cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .event-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      backdrop-filter: blur(10px);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .event-card:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .event-date {
      text-align: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.5rem;
      min-width: 60px;
    }

    .day {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .month {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .event-info {
      flex: 1;
    }

    .event-info h4 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 500;
    }

    .event-info p {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .event-category {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .floating-element {
      position: absolute;
      font-size: 2rem;
      opacity: 0.1;
      animation: float 20s infinite ease-in-out;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    @media (max-width: 480px) {
      .welcome-content {
        padding: 1rem;
      }

      .brand h1 {
        font-size: 2rem;
      }

      .logo {
        font-size: 3rem;
      }

      .welcome-message h2 {
        font-size: 1.5rem;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .stat:last-child {
        grid-column: span 2;
      }
    }
  `]
})
export class FullscreenWelcomeComponent {
  stats = {
    totalEvents: 24,
    attendees: 1200,
    categories: 8
  };

  featuredEvents = [
    {
      name: 'Summer Music Festival',
      location: 'Cassiobury Park',
      category: 'Music',
      day: '15',
      month: 'AUG'
    },
    {
      name: 'Tech Meetup',
      location: 'Innovation Hub',
      category: 'Technology',
      day: '22',
      month: 'AUG'
    },
    {
      name: 'Art Exhibition',
      location: 'Gallery District',
      category: 'Art',
      day: '28',
      month: 'AUG'
    }
  ];

  floatingElements = [
    { icon: '🎵', x: 10, y: 20, delay: 0 },
    { icon: '🎭', x: 85, y: 15, delay: 2 },
    { icon: '🎨', x: 15, y: 70, delay: 4 },
    { icon: '🎪', x: 80, y: 75, delay: 6 },
    { icon: '🎯', x: 50, y: 85, delay: 8 },
    { icon: '🎸', x: 90, y: 45, delay: 10 }
  ];

  goToEvents() {
    console.log('Navigate to events');
  }

  goToFlyerParser() {
    console.log('Navigate to flyer parser');
  }

  goToProfile() {
    console.log('Navigate to profile');
  }

  viewEvent(event: any) {
    console.log('View event:', event);
  }
}
