import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthStore } from '@auth/data-access/auth.store';
import { UserStore } from '@users/data-access/user.store';
import { Roles } from '@auth/utils/roles.enum';
import { ChipComponent } from '@shared/ui/chip/chip.component';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-user-info',
  imports: [CommonModule, RouterModule, FormsModule, ChipComponent, IconComponent],
  template: `
    <!-- Only show when user is authenticated -->
    @if (authStore.isAuthenticated() && userStore.hasUser()) {
      <div class="user-info-bar">
        <div class="user-info-container">
          <!-- Avatar -->
          <div class="user-avatar">
            @if (userStore.avatarUrl()) {
              <img [src]="userStore.avatarUrl()!" [alt]="userStore.displayName() + ' avatar'" />
            } @else {
              <div class="default-avatar">
                {{ getInitials() }}
              </div>
            }
          </div>

          <!-- User Details -->
          <div class="user-details">
            @if (needsUsernameSetup()) {
              <!-- First-time Google user prompt -->
              <div class="username-setup">
                <span class="welcome-text">👋 Welcome! Please set your username:</span>
                <div class="username-input-group">
                  <input
                    type="text"
                    [(ngModel)]="newUsername"
                    (keyup.enter)="saveUsername()"
                    placeholder="Enter your username"
                    class="username-input"
                    [disabled]="savingUsername()"
                  />
                  <button
                    (click)="saveUsername()"
                    class="save-btn"
                    [disabled]="!isValidUsername() || savingUsername()">
                    {{ savingUsername() ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </div>
            } @else {
              <!-- Normal user display -->
              <div class="user-display">
                @if (editingUsername()) {
                  <!-- Editing mode -->
                  <div class="username-edit-group">
                    <input
                      type="text"
                      [(ngModel)]="editUsername"
                      (keyup.enter)="saveUsernameEdit()"
                      (keyup.escape)="cancelEdit()"
                      class="username-edit-input"
                      [disabled]="savingUsername()"
                    />
                    <button (click)="saveUsernameEdit()" class="save-btn-small" [disabled]="savingUsername()">✓</button>
                    <button (click)="cancelEdit()" class="cancel-btn-small">✗</button>
                  </div>
                } @else {
                  <!-- Display mode -->
                  <div class="username-display">
                    <span class="username" (click)="startEdit()">{{ userStore.displayName() }}</span>

                    <!-- User Status Chip -->
                    <app-chip
                      [text]="getUserStatusText()"
                      [icon]="getUserStatusIcon()"
                      [color]="getUserStatusColor()"
                      [textColor]="getUserStatusTextColor()"
                      [borderColor]="getUserStatusBorderColor()"
                      type="ui"
                      variant="custom"
                    />

                    <!-- Role Chip -->
                    @if (user()?.role && user()!.role !== Roles.Authenticated && user()!.role !== Roles.Public) {
                      <app-chip
                        [text]="getRoleDisplay()"
                        [icon]="getRoleIcon()"
                        [color]="getRoleColor()"
                        [textColor]="getRoleTextColor()"
                        [borderColor]="getRoleBorderColor()"
                        type="ui"
                        variant="custom"
                      />
                    }
                  </div>
                }
              </div>
            }

            @if (errorMessage()) {
              <div class="error-message">{{ errorMessage() }}</div>
            }
          </div>

          <!-- Quick Actions -->
          <div class="user-actions">
            <a routerLink="/settings" class="settings-link" title="Settings">
              <app-icon
                name="settings"
                size="md"
                animation="hover-weight"
                [color]="getIconColor()"
              />
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .user-info-bar {
      background: linear-gradient(135deg, var(--background-lighter) 0%, var(--background-darker) 100%);
      border-bottom: 1px solid var(--border);
      padding: 12px 0;
    }

    .user-info-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    /* Avatar Styles */
    .user-avatar {
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--background-lighter);
      box-shadow: 0 2px 4px var(--shadow);
    }

    .default-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
      color: var(--on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      border: 2px solid var(--background-lighter);
      box-shadow: 0 2px 4px var(--shadow);
    }

    /* User Details */
    .user-details {
      flex: 1;
      min-width: 0;
    }

    /* Username Setup (First-time) */
    .username-setup {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .welcome-text {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .username-input-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .username-input {
      padding: 6px 12px;
      border: 2px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      min-width: 200px;
      transition: border-color 0.2s;
      background: var(--background-lighter);
      color: var(--text);
    }

    .username-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .save-btn {
      padding: 6px 16px;
      background: var(--success);
      color: var(--background-lighter);
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .save-btn:hover:not(:disabled) {
      background: var(--success-hover);
    }

    .save-btn:disabled {
      background: var(--text-muted);
      cursor: not-allowed;
    }

    /* Username Display */
    .user-display {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .username-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .username {
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .username:hover {
      background: var(--background-darker);
    }


    /* Username Editing */
    .username-edit-group {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .username-edit-input {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      min-width: 150px;
      background: var(--background-lighter);
      color: var(--text);
    }

    .save-btn-small, .cancel-btn-small {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    }

    .save-btn-small {
      background: var(--success);
      color: var(--background-lighter);
    }

    .cancel-btn-small {
      background: var(--text-muted);
      color: var(--background-lighter);
    }

    /* User Actions */
    .user-actions {
      flex-shrink: 0;
    }

    .settings-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 18px;
      padding: 8px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .settings-link:hover {
      background: var(--background-darker);
    }

    /* Error Message */
    .error-message {
      font-size: 12px;
      color: var(--error);
      margin-top: 4px;
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
      .user-info-container {
        padding: 0 15px;
        gap: 10px;
      }

      .username-input-group {
        flex-direction: column;
        align-items: stretch;
        gap: 6px;
      }

      .username-input {
        min-width: auto;
        width: 100%;
      }

      .welcome-text {
        font-size: 13px;
      }
    }
  `]
})
export class UserInfoComponent {
  // Services
  protected readonly authStore = inject(AuthStore);
  protected readonly userStore = inject(UserStore);

  // Expose Roles enum to template
  protected readonly Roles = Roles;

  // State
  readonly editingUsername = signal(false);
  readonly savingUsername = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form values
  newUsername = signal('');
  editUsername = signal('');

  // Computed
  readonly user = this.userStore.user;

  /**
   * Check if this user needs to set up their username
   * (Google users who haven't customized their display name)
   */
  needsUsernameSetup = computed(() => {
    const user = this.user();
    const authUser = this.authStore.user();

    if (!user || !authUser) return false;

    // Check if this is a Google user with a generated display name
    const displayName = user.displayName;
    const email = user.email;

    // If display name is just the email prefix, user needs to set username
    if (email && displayName === email.split('@')[0]) {
      return true;
    }

    // If display name is empty or null
    if (!displayName || displayName.trim() === '') {
      return true;
    }

    return false;
  });

  /**
   * Get user initials for default avatar
   */
  getInitials(): string {
    const displayName = this.userStore.displayName();
    if (!displayName) return 'U';

    return displayName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Get role display text
   */
  getRoleDisplay(): string {
    const role = this.user()?.role;
    switch (role) {
      case Roles.Admin: return 'Admin';
      case Roles.Author: return 'Author';
      default: return '';
    }
  }

  /**
   * Get role icon
   */
  getRoleIcon(): string {
    const role = this.user()?.role;
    switch (role) {
      case Roles.Admin: return 'admin_panel_settings';
      case Roles.Author: return 'edit';
      default: return '';
    }
  }

  /**
   * Get role chip background color from theme
   */
  getRoleColor(): string {
    const role = this.user()?.role;
    switch (role) {
      case Roles.Admin: return 'var(--error)';
      case Roles.Author: return 'var(--info)';
      default: return 'var(--secondary)';
    }
  }

  /**
   * Get role chip text color from theme
   */
  getRoleTextColor(): string {
    const role = this.user()?.role;
    switch (role) {
      case Roles.Admin: return 'var(--background-lighter)';
      case Roles.Author: return 'var(--background-lighter)';
      default: return 'var(--on-secondary)';
    }
  }

  /**
   * Get role chip border color from theme
   */
  getRoleBorderColor(): string {
    const role = this.user()?.role;
    switch (role) {
      case Roles.Admin: return 'var(--error-hover)';
      case Roles.Author: return 'var(--info-hover)';
      default: return 'var(--border)';
    }
  }

  /**
   * Get icon color from theme
   */
  getIconColor(): string {
    return 'var(--text-secondary)';
  }

  /**
   * Get user status text
   */
  getUserStatusText(): string {
    const user = this.user();
    if (!user) return 'Unknown';

    // Check if user has been active recently (within last 5 minutes)
    // Note: Using joinedAt as fallback since we don't have lastActive tracking yet
    const lastActive = new Date(user.joinedAt);
    const now = new Date();
    const timeDiff = now.getTime() - lastActive.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < 5) {
      return 'Online';
    } else if (minutesDiff < 60) {
      return 'Recently Active';
    } else {
      return 'Offline';
    }
  }

  /**
   * Get user status icon
   */
  getUserStatusIcon(): string {
    const statusText = this.getUserStatusText();
    switch (statusText) {
      case 'Online': return 'radio_button_checked';
      case 'Recently Active': return 'schedule';
      case 'Offline': return 'radio_button_unchecked';
      default: return 'help';
    }
  }

  /**
   * Get user status background color
   */
  getUserStatusColor(): string {
    const statusText = this.getUserStatusText();
    switch (statusText) {
      case 'Online': return 'var(--success)';
      case 'Recently Active': return 'var(--warning)';
      case 'Offline': return 'var(--background-darker)';
      default: return 'var(--secondary)';
    }
  }

  /**
   * Get user status text color
   */
  getUserStatusTextColor(): string {
    const statusText = this.getUserStatusText();
    switch (statusText) {
      case 'Online': return 'var(--background-lighter)';
      case 'Recently Active': return 'var(--background-lighter)';
      case 'Offline': return 'var(--text-secondary)';
      default: return 'var(--on-secondary)';
    }
  }

  /**
   * Get user status border color
   */
  getUserStatusBorderColor(): string {
    const statusText = this.getUserStatusText();
    switch (statusText) {
      case 'Online': return 'var(--success-hover)';
      case 'Recently Active': return 'var(--warning-hover)';
      case 'Offline': return 'var(--border)';
      default: return 'var(--border)';
    }
  }

  /**
   * Check if the new username is valid
   */
  isValidUsername(): boolean {
    const username = this.newUsername().trim();
    return username.length >= 2 && username.length <= 30;
  }

  /**
   * Save new username (first-time setup)
   */
  async saveUsername(): Promise<void> {
    if (!this.isValidUsername() || this.savingUsername()) return;

    this.savingUsername.set(true);
    this.errorMessage.set(null);

    try {
      const username = this.newUsername().trim();
      await this.userStore.updateDisplayName(username);
      this.newUsername.set('');
      console.log('[UserInfoComponent] ✅ Username saved:', username);
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Failed to save username');
      console.error('[UserInfoComponent] ❌ Failed to save username:', error);
    } finally {
      this.savingUsername.set(false);
    }
  }

  /**
   * Start editing username
   */
  startEdit(): void {
    this.editUsername.set(this.userStore.displayName() || '');
    this.editingUsername.set(true);
    this.errorMessage.set(null);
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingUsername.set(false);
    this.editUsername.set('');
    this.errorMessage.set(null);
  }

  /**
   * Save username edit
   */
  async saveUsernameEdit(): Promise<void> {
    const newName = this.editUsername().trim();
    if (!newName || newName.length < 2 || this.savingUsername()) return;

    this.savingUsername.set(true);
    this.errorMessage.set(null);

    try {
      await this.userStore.updateDisplayName(newName);
      this.editingUsername.set(false);
      this.editUsername.set('');
      console.log('[UserInfoComponent] ✅ Username updated:', newName);
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Failed to update username');
      console.error('[UserInfoComponent] ❌ Failed to update username:', error);
    } finally {
      this.savingUsername.set(false);
    }
  }
}
