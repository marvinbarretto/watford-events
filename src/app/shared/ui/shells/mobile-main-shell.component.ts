import { Component, inject } from '@angular/core';
import { IonApp, IonTabBar, IonTabButton, IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, camera, person, home } from 'ionicons/icons';
import { ToastComponent } from '../toast/toast.component';
import { ToastService } from '../../data-access/toast.service';
import { PlatformDetectionService } from '../../utils/platform-detection.service';

@Component({
  selector: 'app-mobile-main-shell',
  imports: [IonApp, IonTabBar, IonTabButton, IonIcon, IonRouterOutlet, ToastComponent],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="events" href="/events">
          <ion-icon name="calendar"></ion-icon>
          Events
        </ion-tab-button>

        <ion-tab-button tab="flyer-parser" href="/flyer-parser">
          <ion-icon name="camera"></ion-icon>
          Scan
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/profile">
          <ion-icon name="person"></ion-icon>
          Profile
        </ion-tab-button>
      </ion-tab-bar>
      
      <!-- Toast Notifications for mobile web (non-native) -->
      @if (!platformDetection.isCapacitorNative) {
        @for (toast of toastService.toasts$$Readonly(); track toast.id) {
          <app-toast
            [message]="toast.message"
            [type]="toast.type"
            [dismissible]="!toast.sticky"
            [duration]="toast.timeout ?? null"
            (dismissed)="toastService.dismiss(toast.id)"
          />
        }
      }
    </ion-app>
  `,
  styleUrl: './mobile-main-shell.component.scss'
})
export class MobileMainShell {
  readonly toastService = inject(ToastService);
  readonly platformDetection = inject(PlatformDetectionService);

  constructor() {
    addIcons({ calendar, camera, person, home });
  }
}
