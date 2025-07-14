import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fullscreen-onboarding',
  imports: [CommonModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-content">
        <!-- Progress Indicator -->
        <div class="progress-indicator">
          <div class="progress-dots">
            <div
              *ngFor="let step of steps; let i = index"
              class="dot"
              [class.active]="i === currentStep()">
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="slide-content">
          <div class="illustration">
            <div class="icon" [innerHTML]="steps[currentStep()].icon"></div>
          </div>

          <h1>{{ steps[currentStep()].title }}</h1>
          <p>{{ steps[currentStep()].description }}</p>
        </div>

        <!-- Navigation -->
        <div class="navigation">
          <button
            *ngIf="currentStep() > 0"
            class="btn btn-secondary"
            (click)="previousStep()">
            Previous
          </button>

          <div class="spacer" *ngIf="currentStep() === 0"></div>

          <button
            *ngIf="currentStep() < steps.length - 1"
            class="btn btn-primary"
            (click)="nextStep()">
            Next
          </button>

          <button
            *ngIf="currentStep() === steps.length - 1"
            class="btn btn-success"
            (click)="completeOnboarding()">
            Get Started
          </button>
        </div>

        <!-- Skip Button -->
        <button
          *ngIf="currentStep() < steps.length - 1"
          class="skip-btn"
          (click)="skipOnboarding()">
          Skip
        </button>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .onboarding-content {
      max-width: 400px;
      width: 90%;
      text-align: center;
      padding: 2rem;
    }

    .progress-indicator {
      margin-bottom: 3rem;
    }

    .progress-dots {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .dot.active {
      background: white;
      transform: scale(1.2);
    }

    .slide-content {
      margin-bottom: 3rem;
    }

    .illustration {
      margin-bottom: 2rem;
    }

    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 300;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    p {
      font-size: 1.1rem;
      line-height: 1.6;
      opacity: 0.9;
      margin-bottom: 0;
    }

    .navigation {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .spacer {
      flex: 1;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 25px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 100px;
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-primary:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
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

    .btn-success {
      background: #4CAF50;
      color: white;
    }

    .btn-success:hover {
      background: #45a049;
      transform: translateY(-2px);
    }

    .skip-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .skip-btn:hover {
      color: white;
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .onboarding-content {
        padding: 1rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 1rem;
      }

      .icon {
        font-size: 3rem;
      }

      .navigation {
        flex-direction: column;
        gap: 0.5rem;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class FullscreenOnboardingComponent {
  currentStep = signal(0);

  steps = [
    {
      title: 'Welcome to Watford Events',
      description: 'Discover amazing events happening in your area and connect with your community.',
      icon: '🎉'
    },
    {
      title: 'Smart Event Discovery',
      description: 'Use our AI-powered flyer parser to automatically extract event details from images.',
      icon: '📸'
    },
    {
      title: 'Stay Connected',
      description: 'Get notifications about events you\'re interested in and never miss out on the fun.',
      icon: '🔔'
    },
    {
      title: 'Ready to Start?',
      description: 'Let\'s help you find your next amazing event experience in Watford.',
      icon: '🚀'
    }
  ];

  nextStep() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  skipOnboarding() {
    console.log('Onboarding skipped');
    this.completeOnboarding();
  }

  completeOnboarding() {
    console.log('Onboarding completed');
    // Navigate to main app
  }
}
