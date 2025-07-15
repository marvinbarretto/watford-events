import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonTextarea,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/angular/standalone';
import { PlatformDetectionService } from '@shared/utils/platform-detection.service';

@Component({
  selector: 'app-test-responsive',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    // Ionic components
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonTextarea,
    IonHeader,
    IonToolbar,
    IonTitle
  ],
  template: `
    <!-- Platform Detection Debug Info -->
    <div class="platform-debug">
      <h3>Current Platform Detection:</h3>
      <ul>
        <li>isCapacitorNative: {{ platformDetection.isCapacitorNative }}</li>
        <li>isMobileWeb: {{ platformDetection.isMobileWeb }}</li>
        <li>isWeb: {{ platformDetection.isWeb }}</li>
        <li>platform: {{ platformDetection.platform }}</li>
      </ul>
    </div>

    <!-- Conditional Platform-Specific Layouts -->
    @if (platformDetection.isCapacitorNative) {
      <!-- CAPACITOR NATIVE: Full Ionic Layout -->
      <ion-header>
        <ion-toolbar>
          <ion-title>Test Responsive (Native)</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Native Ionic Experience</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>This is the full Ionic native experience with proper touch interactions.</p>
          </ion-card-content>
        </ion-card>

        <form [formGroup]="testForm">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Name</ion-label>
              <ion-input 
                placeholder="Enter your name"
                formControlName="name"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Message</ion-label>
              <ion-textarea 
                placeholder="Enter a message"
                formControlName="message"
              ></ion-textarea>
            </ion-item>
          </ion-list>
        </form>

        <div class="ion-padding">
          <ion-button expand="block" fill="solid">
            Native Submit
          </ion-button>
          <ion-button expand="block" fill="outline" routerLink="/events">
            Back to Events
          </ion-button>
        </div>
      </ion-content>
      
    } @else if (platformDetection.isMobileWeb) {
      <!-- MOBILE WEB: Hybrid Layout -->
      <div class="mobile-web-container">
        <header class="mobile-header">
          <h1>Test Responsive (Mobile Web)</h1>
        </header>
        
        <main class="mobile-content">
          <div class="mobile-card">
            <h2>Mobile Web Experience</h2>
            <p>This uses custom mobile styling with some Ionic components for familiarity.</p>
          </div>

          <form [formGroup]="testForm" class="mobile-form">
            <div class="form-group">
              <label for="name">Name:</label>
              <input 
                type="text" 
                id="name" 
                formControlName="name"
                class="mobile-input"
                placeholder="Enter your name"
              />
            </div>
            
            <div class="form-group">
              <label for="message">Message:</label>
              <textarea 
                id="message" 
                formControlName="message"
                class="mobile-textarea"
                placeholder="Enter a message"
                rows="4"
              ></textarea>
            </div>

            <div class="mobile-buttons">
              <button type="submit" class="btn-primary">Mobile Submit</button>
              <button type="button" class="btn-secondary" routerLink="/events">
                Back to Events
              </button>
            </div>
          </form>
        </main>
      </div>
      
    } @else {
      <!-- DESKTOP WEB: Full Custom Layout -->
      <div class="desktop-container">
        <header class="desktop-header">
          <h1>Test Responsive (Desktop Web)</h1>
          <nav class="desktop-nav">
            <a routerLink="/events" class="nav-link">Events</a>
            <a routerLink="/profile" class="nav-link">Profile</a>
          </nav>
        </header>
        
        <main class="desktop-content">
          <div class="desktop-grid">
            <div class="card">
              <h2>Desktop Web Experience</h2>
              <p>This is a fully custom desktop layout optimized for mouse and keyboard interaction.</p>
            </div>

            <div class="card">
              <h3>Responsive Form</h3>
              <form [formGroup]="testForm" class="desktop-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="desktop-name">Name:</label>
                    <input 
                      type="text" 
                      id="desktop-name" 
                      formControlName="name"
                      class="form-control"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="desktop-message">Message:</label>
                    <textarea 
                      id="desktop-message" 
                      formControlName="message"
                      class="form-control"
                      placeholder="Enter a message"
                      rows="3"
                    ></textarea>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Desktop Submit</button>
                  <button type="button" class="btn btn-outline" routerLink="/events">
                    Back to Events
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    }

    <!-- Analysis Section (Always Visible) -->
    <div class="analysis-section">
      <h3>Responsive Design Analysis</h3>
      <div class="analysis-grid">
        <div class="analysis-card">
          <h4>Pros of This Approach:</h4>
          <ul>
            <li>Single component maintains all logic</li>
            <li>Shared form state and validation</li>
            <li>One route works everywhere</li>
            <li>Platform-specific optimizations possible</li>
          </ul>
        </div>
        <div class="analysis-card">
          <h4>Cons of This Approach:</h4>
          <ul>
            <li>Complex template with lots of conditionals</li>
            <li>All platform code loads regardless of use</li>
            <li>Harder to maintain as complexity grows</li>
            <li>Potential for inconsistent experiences</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styleUrl: './test-responsive.component.scss'
})
export class TestResponsiveComponent {
  readonly platformDetection = inject(PlatformDetectionService);
  private readonly fb = inject(FormBuilder);

  readonly testForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  constructor() {
    console.log('TestResponsiveComponent loaded on platform:', this.platformDetection.platform);
  }
}