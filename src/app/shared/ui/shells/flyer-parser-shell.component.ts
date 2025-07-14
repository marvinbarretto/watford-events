import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Platform } from '@ionic/angular';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, chevronBack } from 'ionicons/icons';

@Component({
  selector: 'app-flyer-parser-shell',
  imports: [
    RouterOutlet,
    IonApp,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBackButton,
    IonButtons
  ],
  template: `
    @if (platform.is('capacitor')) {
      <!-- Mobile: Camera-first experience -->
      <ion-app>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-back-button defaultHref="/events"></ion-back-button>
            </ion-buttons>
            <ion-title>Scan Flyer</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content fullscreen>
          <router-outlet></router-outlet>
        </ion-content>
      </ion-app>
    } @else {
      <!-- Web: Upload-first experience -->
      <div class="web-flyer-parser">
        <header class="flyer-parser-header">
          <h1>Flyer Parser</h1>
          <p>Upload an event flyer to extract event details</p>
        </header>

        <main class="flyer-parser-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    }
  `,
  styles: [`
    .web-flyer-parser {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .flyer-parser-header {
      padding: 2rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .flyer-parser-header h1 {
      margin: 0 0 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
    }

    .flyer-parser-header p {
      margin: 0;
      opacity: 0.8;
      font-size: 1.1rem;
    }

    .flyer-parser-content {
      flex: 1;
      padding: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `]
})
export class FlyerParserShell {
  protected readonly platform = inject(Platform);

  constructor() {
    addIcons({ camera, chevronBack });
  }
}
