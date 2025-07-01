import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideClientHydration(withEventReplay()), provideFirebaseApp(() => initializeApp({ projectId: "watford-events", appId: "1:96622213811:web:93b481584742d93c178ec6", storageBucket: "watford-events.firebasestorage.app", apiKey: "AIzaSyC5iLSLevYe2zkEcARQbzMIF0wLP6VXyfg", authDomain: "watford-events.firebaseapp.com", messagingSenderId: "96622213811", measurementId: "G-488QLDGW25" })), provideAuth(() => getAuth()), provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService, provideFirestore(() => getFirestore())
  ]
};
