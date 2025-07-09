import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthStore } from '../data-access/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="app-logo">📅</div>
          <h1>Watford Events</h1>
          <p>Create events from flyer photos using AI</p>
        </div>

        <div class="login-content">
          <!-- Quick Start with Google -->
          <div class="quick-start-section">
            <h2>Get Started Quickly</h2>
            <button class="google-login-btn" (click)="loginWithGoogle()" [disabled]="isLoading()">
              <span class="google-icon">🚀</span>
              <span>{{ isLoading() ? 'Signing in...' : 'Continue with Google' }}</span>
            </button>
            <p class="quick-start-note">Sign in with Google to start creating events instantly</p>
          </div>

          <div class="divider">
            <span>or</span>
          </div>

          <!-- Email/Password Form -->
          <div class="email-login-section">
            <h3>Sign in with Email</h3>
            
            <form [formGroup]="loginForm" (ngSubmit)="loginWithEmail()">
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="form-control"
                  placeholder="Enter your email"
                  [class.error]="emailError()"
                />
                @if (emailError()) {
                  <span class="error-text">{{ emailError() }}</span>
                }
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  class="form-control"
                  placeholder="Enter your password"
                  [class.error]="passwordError()"
                />
                @if (passwordError()) {
                  <span class="error-text">{{ passwordError() }}</span>
                }
              </div>

              <button 
                type="submit" 
                class="email-login-btn"
                [disabled]="!loginForm.valid || isLoading()"
              >
                {{ isLoading() ? 'Signing in...' : 'Sign In' }}
              </button>
            </form>
          </div>

          <!-- Guest Access -->
          <div class="guest-section">
            <h3>Just Testing?</h3>
            <button class="guest-btn" (click)="continueAsGuest()" [disabled]="isLoading()">
              <span class="guest-icon">👤</span>
              <span>Continue as Guest</span>
            </button>
            <p class="guest-note">Try the app without creating an account</p>
          </div>
        </div>

        <!-- Error Display -->
        @if (error()) {
          <div class="error-banner">
            <span class="error-icon">⚠️</span>
            <span>{{ error() }}</span>
            <button class="dismiss-error" (click)="clearError()">×</button>
          </div>
        }

        <!-- Features Preview -->
        <div class="features-preview">
          <h3>What you can do:</h3>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">📸</span>
              <span>Take photos of event flyers</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤖</span>
              <span>AI extracts event details automatically</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <span>Edit and publish your events</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📱</span>
              <span>Mobile-first design for on-the-go use</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <p>
            New to event management? 
            <a href="#" class="learn-more">Learn more about our AI features</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .app-logo {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .login-header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .login-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .login-content {
      margin-bottom: 30px;
    }

    /* Quick Start Section */
    .quick-start-section {
      text-align: center;
      margin-bottom: 30px;
    }

    .quick-start-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 20px;
    }

    .google-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 15px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .google-login-btn:hover:not(:disabled) {
      background: #3367d6;
      transform: translateY(-2px);
    }

    .google-login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .google-icon {
      font-size: 20px;
    }

    .quick-start-note {
      margin: 15px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    /* Divider */
    .divider {
      text-align: center;
      margin: 30px 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e9ecef;
    }

    .divider span {
      background: white;
      padding: 0 15px;
      color: #666;
      font-size: 14px;
    }

    /* Email Login Section */
    .email-login-section h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
      text-align: center;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: 600;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-text {
      display: block;
      margin-top: 5px;
      color: #dc3545;
      font-size: 14px;
    }

    .email-login-btn {
      width: 100%;
      padding: 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .email-login-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .email-login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* Guest Section */
    .guest-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #e9ecef;
    }

    .guest-section h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
    }

    .guest-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 12px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .guest-btn:hover:not(:disabled) {
      background: #545b62;
    }

    .guest-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .guest-icon {
      font-size: 16px;
    }

    .guest-note {
      margin: 10px 0 0 0;
      color: #666;
      font-size: 12px;
    }

    /* Error Banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .error-icon {
      font-size: 18px;
    }

    .dismiss-error {
      margin-left: auto;
      background: none;
      border: none;
      color: #721c24;
      font-size: 18px;
      cursor: pointer;
    }

    /* Features Preview */
    .features-preview {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #e9ecef;
    }

    .features-preview h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 16px;
      text-align: center;
    }

    .feature-list {
      display: grid;
      gap: 15px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .feature-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    /* Footer */
    .login-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .login-footer p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .learn-more {
      color: #007bff;
      text-decoration: none;
    }

    .learn-more:hover {
      text-decoration: underline;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .login-container {
        padding: 10px;
      }
      
      .login-card {
        padding: 30px 20px;
      }
      
      .app-logo {
        font-size: 40px;
      }
      
      .login-header h1 {
        font-size: 24px;
      }
    }
  `]
})
export class LoginComponent {
  // Services
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Form
  loginForm: FormGroup;

  // State
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly emailError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Redirect if already authenticated
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/events']);
      }
    });
  }

  async loginWithGoogle() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      this.authStore.loginWithGoogle();
      // Navigation will happen automatically via the effect
    } catch (error: any) {
      console.error('Google login failed:', error);
      this.error.set(error.message || 'Google login failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithEmail() {
    if (!this.loginForm.valid || this.isLoading()) return;

    this.clearFieldErrors();
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { email, password } = this.loginForm.value;
      this.authStore.loginWithEmail(email, password);
      // Navigation will happen automatically via the effect
    } catch (error: any) {
      console.error('Email login failed:', error);
      this.handleLoginError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async continueAsGuest() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      // For now, just redirect to events - could implement anonymous auth later
      this.router.navigate(['/events']);
    } catch (error: any) {
      console.error('Guest access failed:', error);
      this.error.set('Failed to continue as guest');
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleLoginError(error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;

    switch (errorCode) {
      case 'auth/user-not-found':
        this.emailError.set('No account found with this email');
        break;
      case 'auth/wrong-password':
        this.passwordError.set('Incorrect password');
        break;
      case 'auth/invalid-email':
        this.emailError.set('Invalid email address');
        break;
      case 'auth/too-many-requests':
        this.error.set('Too many failed attempts. Please try again later.');
        break;
      default:
        this.error.set(errorMessage || 'Login failed. Please try again.');
    }
  }

  private clearFieldErrors() {
    this.emailError.set(null);
    this.passwordError.set(null);
  }

  clearError() {
    this.error.set(null);
  }
}