import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthStore } from '../data-access/auth.store';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <div class="app-logo">📅</div>
          <h1>Reset Your Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password</p>
        </div>

        @if (!emailSent()) {
          <div class="forgot-password-content">
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="sendResetEmail()">
              <div class="form-group">
                <label for="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="form-control"
                  placeholder="Enter your email address"
                  [class.error]="emailError()"
                />
                @if (emailError()) {
                  <span class="error-text">{{ emailError() }}</span>
                }
              </div>

              <button 
                type="submit" 
                class="reset-btn"
                [disabled]="!forgotPasswordForm.valid || isLoading()"
              >
                {{ isLoading() ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </form>
          </div>
        } @else {
          <!-- Success State -->
          <div class="success-content">
            <div class="success-icon">✅</div>
            <h2>Email Sent!</h2>
            <p>We've sent a password reset link to <strong>{{ sentToEmail() }}</strong></p>
            
            <div class="success-instructions">
              <h3>What's next?</h3>
              <ol>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>Create a new password</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>

            <button class="resend-btn" (click)="resendEmail()" [disabled]="isLoading()">
              {{ isLoading() ? 'Sending...' : 'Resend Email' }}
            </button>
          </div>
        }

        <!-- Error Display -->
        @if (error()) {
          <div class="error-banner">
            <span class="error-icon">⚠️</span>
            <span>{{ error() }}</span>
            <button class="dismiss-error" (click)="clearError()">×</button>
          </div>
        }

        <!-- Navigation Links -->
        <div class="forgot-password-footer">
          <p>
            Remember your password? 
            <a routerLink="/login" class="login-link">Sign in here</a>
          </p>
          <p>
            Don't have an account? 
            <a routerLink="/register" class="register-link">Create one here</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .forgot-password-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .forgot-password-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .app-logo {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .forgot-password-header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .forgot-password-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }

    .forgot-password-content {
      margin-bottom: 30px;
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

    .reset-btn {
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

    .reset-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .reset-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* Success State */
    .success-content {
      text-align: center;
      margin-bottom: 30px;
    }

    .success-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .success-content h2 {
      margin: 0 0 15px 0;
      color: #28a745;
      font-size: 24px;
    }

    .success-content > p {
      margin: 0 0 30px 0;
      color: #666;
      font-size: 16px;
    }

    .success-instructions {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: left;
    }

    .success-instructions h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
    }

    .success-instructions ol {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }

    .success-instructions li {
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .resend-btn {
      padding: 12px 24px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .resend-btn:hover:not(:disabled) {
      background: #545b62;
    }

    .resend-btn:disabled {
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

    /* Footer */
    .forgot-password-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .forgot-password-footer p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
    }

    .forgot-password-footer p:last-child {
      margin-bottom: 0;
    }

    .login-link,
    .register-link {
      color: #007bff;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link:hover,
    .register-link:hover {
      text-decoration: underline;
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .forgot-password-container {
        padding: 10px;
      }
      
      .forgot-password-card {
        padding: 30px 20px;
      }
      
      .app-logo {
        font-size: 40px;
      }
      
      .forgot-password-header h1 {
        font-size: 24px;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  // Services
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  // Form
  forgotPasswordForm: FormGroup;

  // State
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly emailError = signal<string | null>(null);
  readonly emailSent = signal(false);
  readonly sentToEmail = signal<string | null>(null);

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async sendResetEmail() {
    if (!this.forgotPasswordForm.valid || this.isLoading()) return;

    this.clearFieldErrors();
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { email } = this.forgotPasswordForm.value;
      await this.authStore.resetPassword(email);
      
      this.sentToEmail.set(email);
      this.emailSent.set(true);
      console.log('Password reset email sent successfully');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      this.handleResetError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendEmail() {
    if (!this.sentToEmail() || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.authStore.resetPassword(this.sentToEmail()!);
      console.log('Password reset email resent successfully');
    } catch (error: any) {
      console.error('Password reset resend failed:', error);
      this.handleResetError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleResetError(error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;

    switch (errorCode) {
      case 'auth/user-not-found':
        this.emailError.set('No account found with this email address');
        break;
      case 'auth/invalid-email':
        this.emailError.set('Invalid email address');
        break;
      case 'auth/too-many-requests':
        this.error.set('Too many reset attempts. Please try again later.');
        break;
      default:
        this.error.set(errorMessage || 'Failed to send reset email. Please try again.');
    }
  }

  private clearFieldErrors() {
    this.emailError.set(null);
  }

  clearError() {
    this.error.set(null);
  }
}