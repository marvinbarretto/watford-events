import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';
import { USER_THEME_TOKEN } from '../libs/tokens/user-theme.token';
import { ThemeStore } from './shared/data-access/theme.store';
import { TemplatePageTitleStrategy } from './TemplatePageTitleStrategy';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: USER_THEME_TOKEN, useValue: 'light' },
    provideAppInitializer(() => {
      inject(ThemeStore);
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()), 
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), 
    provideAuth(() => getAuth()), 
    provideAnalytics(() => getAnalytics()), 
    ScreenTrackingService, 
    UserTrackingService, 
    provideFirestore(() => {
      const firestore = getFirestore();
      
      // 🔥 ENABLE FIREBASE OFFLINE PERSISTENCE 🔥
      // This enables automatic IndexedDB caching for all Firestore operations
      // Only enable in browser environment (not during SSR)
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        enableIndexedDbPersistence(firestore).then(() => {
          console.log('🔥 [Firebase] ✅ OFFLINE PERSISTENCE ENABLED!');
          console.log('🔥 [Firebase] 💾 All reads will be cached in IndexedDB');
          console.log('🔥 [Firebase] 📱 App will work offline automatically');
          console.log('🔥 [Firebase] 🔄 Writes will queue when offline and sync when back online');
        }).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('🔥 [Firebase] ⚠️ Offline persistence failed: Multiple tabs open');
            console.warn('🔥 [Firebase] 💡 Persistence can only be enabled in one tab at a time');
          } else if (err.code === 'unimplemented') {
            console.warn('🔥 [Firebase] ⚠️ Browser does not support offline persistence');
          } else {
            console.error('🔥 [Firebase] ❌ Offline persistence error:', err);
          }
        });
      }
      
      return firestore;
    }),
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
  ]
};
