import { Component, signal, inject, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthStore } from '../data-access/auth.store';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-modal-login',
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <div class="login-modal">
      <div class="modal-header">
        <h2>Sign In</h2>
        <button class="close-btn" (click)="cancel()" type="button" aria-label="Close login modal">
          <app-icon name="close" size="sm" />
        </button>
      </div>

      <div class="modal-content">
        <!-- Quick Start with Google -->
        <div class="google-section">
          <button class="google-login-btn" (click)="loginWithGoogle()" [disabled]="isLoading()">
            <span class="google-icon">🚀</span>
            <span>{{ isLoading() ? 'Signing in...' : 'Continue with Google' }}</span>
          </button>
        </div>

        <div class="divider">
          <span>or</span>
        </div>

        <!-- Email/Password Form -->
        <form [formGroup]="loginForm" (ngSubmit)="loginWithEmail()">
          <div class="form-group">
            <label for="modal-email">Email</label>
            <input
              id="modal-email"
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
            <label for="modal-password">Password</label>
            <input
              id="modal-password"
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

        <!-- Error Display -->
        @if (error()) {
          <div class="error-banner">
            <span class="error-icon">⚠️</span>
            <span>{{ error() }}</span>
            <button class="dismiss-error" (click)="clearError()" aria-label="Dismiss error">
              <app-icon name="close" size="xs" />
            </button>
          </div>
        }

        <!-- Auth Links -->
        <div class="auth-links">
          <p>
            <a href="/forgot-password" class="forgot-link">Forgot your password?</a>
          </p>
          <p>
            Don't have an account?
            <a href="/register" class="register-link">Create one here</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 420px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
      margin-bottom: 20px;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-content {
      padding: 0 24px 24px;
    }

    /* Google Section */
    .google-section {
      margin-bottom: 20px;
    }

    .google-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 12px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .google-login-btn:hover:not(:disabled) {
      background: #3367d6;
    }

    .google-login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .google-icon {
      font-size: 18px;
    }

    /* Divider */
    .divider {
      text-align: center;
      margin: 20px 0;
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

    /* Form Styles */
    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      color: #333;
      font-weight: 500;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 15px;
      transition: border-color 0.2s;
      box-sizing: border-box;
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
      margin-top: 4px;
      color: #dc3545;
      font-size: 13px;
    }

    .email-login-btn {
      width: 100%;
      padding: 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
    }

    .email-login-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .email-login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* Error Banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 6px;
      margin: 16px 0;
      font-size: 14px;
    }

    .error-icon {
      font-size: 16px;
    }

    .dismiss-error {
      margin-left: auto;
      background: none;
      border: none;
      color: #721c24;
      font-size: 16px;
      cursor: pointer;
    }

    /* Auth Links */
    .auth-links {
      text-align: center;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    .auth-links p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }

    .forgot-link,
    .register-link {
      color: #007bff;
      text-decoration: none;
    }

    .forgot-link:hover,
    .register-link:hover {
      text-decoration: underline;
    }

    .register-link {
      font-weight: 500;
    }

    /* Mobile Optimizations */
    @media (max-width: 480px) {
      .login-modal {
        max-width: 100%;
        margin: 0;
      }

      .modal-header,
      .modal-content {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
  `]
})
export class ModalLoginComponent {
  // Services
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  // Outputs
  readonly result = output<'success' | 'cancelled'>();

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

    // Watch for successful authentication using effect
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        this.result.emit('success');
      }
    });
  }

  async loginWithGoogle() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.authStore.loginWithGoogle();
      // Success will be handled by the auth subscription
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
      await this.authStore.loginWithEmail(email, password);
      // Success will be handled by the auth subscription
    } catch (error: any) {
      console.error('Email login failed:', error);
      this.handleLoginError(error);
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

  cancel() {
    this.result.emit('cancelled');
  }
}
