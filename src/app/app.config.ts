import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore, initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentSingleTabManager } from '@angular/fire/firestore';
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
      // 🔥 ENABLE FIREBASE OFFLINE PERSISTENCE 🔥
      // Using modern initializeFirestore with persistent local cache
      // Only enable in browser environment (not during SSR)
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        try {
          // Get the Firebase app instance
          const app = initializeApp(environment.firebaseConfig);
          const firestore = initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentSingleTabManager({})
            })
          });
          
          console.log('🔥 [Firebase] ✅ OFFLINE PERSISTENCE ENABLED!');
          console.log('🔥 [Firebase] 💾 All reads will be cached in IndexedDB');
          console.log('🔥 [Firebase] 📱 App will work offline automatically');
          console.log('🔥 [Firebase] 🔄 Writes will queue when offline and sync when back online');
          
          return firestore;
        } catch (err: any) {
          console.warn('🔥 [Firebase] ⚠️ Offline persistence failed:', err.message);
          console.warn('🔥 [Firebase] 💡 Falling back to default Firestore');
          // Fallback to default Firestore without persistence
          return getFirestore();
        }
      } else {
        // SSR environment - use default configuration without persistence
        return getFirestore();
      }
    }),
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
  ]
};
