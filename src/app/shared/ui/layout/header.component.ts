import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeStore } from '@shared/data-access/theme.store';
import { AuthStore } from '@auth/data-access/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  protected readonly themeStore = inject(ThemeStore);
  protected readonly authStore = inject(AuthStore);
  
  showExamplesDropdown = false;

  onThemeToggle(): void {
    this.themeStore.toggleTheme();
  }

  onLogin(): void {
    this.authStore.loginWithGoogle();
  }

  onLogout(): void {
    this.authStore.logout();
  }
  
  toggleExamplesDropdown(): void {
    this.showExamplesDropdown = !this.showExamplesDropdown;
  }
  
  closeDropdown(): void {
    this.showExamplesDropdown = false;
  }
}