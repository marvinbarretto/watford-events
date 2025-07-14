import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '@shared/data-access/base.component';
import { ThemeStore } from '@shared/data-access/theme.store';
import { AuthStore } from '@auth/data-access/auth.store';
import { OverlayService } from '@shared/data-access/overlay.service';
import { SsrPlatformService } from '@shared/utils/ssr/ssr-platform.service';
import { ModalLoginComponent } from '@auth/feature/modal-login.component';
import { Roles } from '@auth/utils/roles.enum';
import packageJson from '../../../../../package.json';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent extends BaseComponent {
  protected readonly themeStore = inject(ThemeStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly overlayService = inject(OverlayService);

  showExamplesDropdown = false;
  showMobileMenu = false;
  readonly version = packageJson.version;

  get isAdmin(): boolean {
    return this.authStore.user()?.role === Roles.Admin;
  }

  onThemeToggle(): void {
    this.themeStore.toggleTheme();
  }

  onLogin(): void {
    // Progressive enhancement: Use modal in browser, page navigation in SSR/fallback
    this.platform.onlyOnBrowser(() => {
      // Enhanced experience: Modal login
      const modalResult = this.overlayService.open(ModalLoginComponent);

      modalResult.result.then((result) => {
        if (result === 'success') {
          // User successfully logged in - modal will close automatically
          console.log('Login successful via modal');
        } else if (result === 'cancelled') {
          // User cancelled - modal will close automatically
          console.log('Login cancelled');
        }
      }).catch((error) => {
        // Fallback to page navigation if modal fails
        console.warn('Modal login failed, falling back to page navigation:', error);
        this.router.navigate(['/login']);
      });
    });

    // Fallback: Page navigation (works in SSR and as fallback)
    if (!this.platform.isBrowser) {
      this.router.navigate(['/login']);
    }
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

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    // Close examples dropdown when opening mobile menu
    if (this.showMobileMenu) {
      this.showExamplesDropdown = false;
    }
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }
}
