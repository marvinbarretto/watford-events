import { Component, inject } from '@angular/core';
import { 
  IonApp, 
  IonTabBar, 
  IonTabButton, 
  IonIcon,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, camera, person, home } from 'ionicons/icons';
import { ToastService } from '../../data-access/toast.service';
import { PlatformDetectionService } from '../../utils/platform-detection.service';

@Component({
  selector: 'app-mobile-ionic-shell',
  imports: [
    IonApp, 
    IonTabBar, 
    IonTabButton, 
    IonIcon,
    IonRouterOutlet
  ],
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
    </ion-app>
  `,
  styleUrl: './mobile-ionic-shell.component.scss'
})
export class MobileIonicShell {
  readonly toastService = inject(ToastService);
  readonly platformDetection = inject(PlatformDetectionService);

  constructor() {
    addIcons({ calendar, camera, person, home });
  }
}