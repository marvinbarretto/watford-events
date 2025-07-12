import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthStore } from '../data-access/auth.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="app-logo">📅</div>
          <h1>Join Watford Events</h1>
          <p>Create an account to start managing events with AI</p>
        </div>

        <div class="register-content">
          <!-- Quick Start with Google -->
          <div class="quick-start-section">
            <h2>Get Started Quickly</h2>
            <button class="google-register-btn" (click)="registerWithGoogle()" [disabled]="isLoading()">
              <span class="google-icon">🚀</span>
              <span>{{ isLoading() ? 'Creating account...' : 'Sign up with Google' }}</span>
            </button>
            <p class="quick-start-note">Create your account with Google in one click</p>
          </div>

          <div class="divider">
            <span>or</span>
          </div>

          <!-- Email/Password Form -->
          <div class="email-register-section">
            <h3>Sign up with Email</h3>
            
            <form [formGroup]="registerForm" (ngSubmit)="registerWithEmail()">
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
                  placeholder="Create a password (min 6 characters)"
                  [class.error]="passwordError()"
                />
                @if (passwordError()) {
                  <span class="error-text">{{ passwordError() }}</span>
                }
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  class="form-control"
                  placeholder="Confirm your password"
                  [class.error]="confirmPasswordError()"
                />
                @if (confirmPasswordError()) {
                  <span class="error-text">{{ confirmPasswordError() }}</span>
                }
              </div>

              <button 
                type="submit" 
                class="email-register-btn"
                [disabled]="!registerForm.valid || isLoading()"
              >
                {{ isLoading() ? 'Creating account...' : 'Create Account' }}
              </button>
            </form>
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
          <h3>What you'll be able to do:</h3>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">📸</span>
              <span>Upload flyer photos to create events</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤖</span>
              <span>AI automatically extracts event details</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <span>Manage and publish your events</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📱</span>
              <span>Access from any device</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="register-footer">
          <p>
            Already have an account? 
            <a routerLink="/login" class="login-link">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .register-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .app-logo {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .register-header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .register-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .register-content {
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

    .google-register-btn {
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

    .google-register-btn:hover:not(:disabled) {
      background: #3367d6;
      transform: translateY(-2px);
    }

    .google-register-btn:disabled {
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

    /* Email Register Section */
    .email-register-section h3 {
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

    .email-register-btn {
      width: 100%;
      padding: 15px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .email-register-btn:hover:not(:disabled) {
      background: #218838;
    }

    .email-register-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
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
    .register-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .register-footer p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .login-link {
      color: #007bff;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .register-container {
        padding: 10px;
      }
      
      .register-card {
        padding: 30px 20px;
      }
      
      .app-logo {
        font-size: 40px;
      }
      
      .register-header h1 {
        font-size: 24px;
      }
    }
  `]
})
export class RegisterComponent {
  // Services
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Form
  registerForm: FormGroup;

  // State
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly emailError = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly confirmPasswordError = signal<string | null>(null);

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    // Redirect if already authenticated
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });

    // Add password confirmation validation
    this.registerForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.validatePasswordConfirmation();
    });

    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.validatePasswordConfirmation();
    });
  }

  async registerWithGoogle() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      this.authStore.loginWithGoogle();
      // Navigation will happen automatically via the effect
    } catch (error: any) {
      console.error('Google registration failed:', error);
      this.error.set(error.message || 'Google registration failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async registerWithEmail() {
    if (!this.registerForm.valid || this.isLoading()) return;

    this.clearFieldErrors();
    this.validatePasswordConfirmation();

    if (this.confirmPasswordError()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { email, password } = this.registerForm.value;
      this.authStore.registerWithEmail(email, password);
      // Navigation will happen automatically via the effect
    } catch (error: any) {
      console.error('Email registration failed:', error);
      this.handleRegistrationError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private validatePasswordConfirmation() {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;

    if (confirmPassword && password !== confirmPassword) {
      this.confirmPasswordError.set('Passwords do not match');
    } else {
      this.confirmPasswordError.set(null);
    }
  }

  private handleRegistrationError(error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;

    switch (errorCode) {
      case 'auth/email-already-in-use':
        this.emailError.set('An account with this email already exists');
        break;
      case 'auth/invalid-email':
        this.emailError.set('Invalid email address');
        break;
      case 'auth/weak-password':
        this.passwordError.set('Password is too weak. Please choose a stronger password.');
        break;
      case 'auth/too-many-requests':
        this.error.set('Too many failed attempts. Please try again later.');
        break;
      default:
        this.error.set(errorMessage || 'Registration failed. Please try again.');
    }
  }

  private clearFieldErrors() {
    this.emailError.set(null);
    this.passwordError.set(null);
    this.confirmPasswordError.set(null);
  }

  clearError() {
    this.error.set(null);
  }
}