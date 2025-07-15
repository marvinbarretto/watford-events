import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../layout/header.component';
import { FooterComponent } from '../layout/footer.component';
import { UserInfoComponent } from '../user-info/user-info.component';
import { ToastComponent } from '../toast/toast.component';
import { ToastService } from '../../data-access/toast.service';

/**
 * Web Main Shell - Universal Layout Component
 * 
 * STRATEGY: This shell now serves ALL platforms (desktop web, mobile web, Capacitor)
 * using responsive design and mobile optimizations. Mobile-specific shells are 
 * preserved in codebase for future Ionic integration if needed.
 * 
 * Optimizations included:
 * - Safe area support for notched devices
 * - Touch-friendly button sizing (44px minimum)
 * - Momentum scrolling and mobile gestures
 * - Viewport handling and keyboard avoidance
 * - High-DPI display optimizations
 */
@Component({
  selector: 'app-web-main-shell',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, UserInfoComponent, ToastComponent],
  styleUrl: './web-main-shell.component.scss',
  template: `
    <div class="app">
      <app-header></app-header>
      <app-user-info></app-user-info>

      <main class="main">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>
      
      <!-- Toast Notifications -->
      @for (toast of toastService.toasts$$Readonly(); track toast.id) {
        <app-toast
          [message]="toast.message"
          [type]="toast.type"
          [dismissible]="!toast.sticky"
          [duration]="toast.timeout ?? null"
          (dismissed)="toastService.dismiss(toast.id)"
        />
      }
    </div>
  `
})
export class WebMainShell {
  readonly toastService = inject(ToastService);
}
