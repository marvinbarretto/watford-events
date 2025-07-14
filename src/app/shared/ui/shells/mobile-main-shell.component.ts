import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, camera, person, home } from 'ionicons/icons';

@Component({
  selector: 'app-mobile-main-shell',
  imports: [RouterOutlet, IonApp, IonTabs, IonTabBar, IonTabButton, IonIcon],
  template: `
    <ion-app>
      <ion-tabs>
        <router-outlet></router-outlet>

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
      </ion-tabs>
    </ion-app>
  `
})
export class MobileMainShell {
  constructor() {
    addIcons({ calendar, camera, person, home });
  }
}
