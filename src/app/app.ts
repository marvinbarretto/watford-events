import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { filter } from 'rxjs/operators';
import { SsrPlatformService } from './shared/utils/ssr/ssr-platform.service';
import { PlatformDetectionService } from './shared/utils/platform-detection.service';
import { WebMainShell } from './shared/ui/shells/web-main-shell.component';
import { FullScreenShell } from './shared/ui/shells/fullscreen-shell.component';
import { FlyerParserShell } from './shared/ui/shells/flyer-parser-shell.component';

// === PRESERVED FOR FUTURE USE: Mobile shell imports ===
// import { MobileMainShell } from './shared/ui/shells/mobile-main-shell.component';
// import { MobileIonicShell } from './shared/ui/shells/mobile-ionic-shell.component';

/**
 * SHELL ARCHITECTURE STRATEGY
 * 
 * Current Implementation: WEB-MAIN SHELL FOR ALL PLATFORMS
 * - Desktop web browsers → web-main shell (responsive design)
 * - Mobile web browsers → web-main shell (mobile optimizations) 
 * - Capacitor native apps → web-main shell (mobile + native optimizations)
 * 
 * Benefits:
 * ✅ Single codebase with consistent UX across platforms
 * ✅ No CSS conflicts or complex shell management
 * ✅ Immediate deployment capability for Capacitor
 * ✅ Leverages existing responsive design system
 * 
 * Future Ionic Integration Path:
 * 1. Mobile shell components are preserved (mobile-main, mobile-ionic)
 * 2. Uncomment imports and template cases
 * 3. Restore platform detection logic in selectShellForPlatform()
 * 4. Test and optimize mobile-specific shells
 * 
 * This approach provides working mobile deployment now while preserving
 * flexibility for future platform-specific optimizations.
 */

type ShellType =
  | 'web-main'           // Desktop web layout
  | 'mobile-main'        // Mobile with Ionic components
  | 'mobile-ionic'       // Native mobile with full Ionic optimization
  | 'fullscreen'         // Login, onboarding (no nav)
  | 'flyer-parser';      // Special layout for flyer scanning

@Component({
  selector: 'app-root',  imports: [
    RouterOutlet,
    WebMainShell,
    FullScreenShell,
    FlyerParserShell
    // === PRESERVED FOR FUTURE USE: Mobile shell components ===
    // MobileMainShell,
    // MobileIonicShell,
  ],
  template: `
    @if (currentShell()) {
      @switch (currentShell()) {
        @case ('web-main') {
          <app-web-main-shell />
        }
        @case ('mobile-main') {
          <!-- PRESERVED FOR FUTURE USE -->
          <!-- <app-mobile-main-shell /> -->
        }
        @case ('mobile-ionic') {
          <!-- PRESERVED FOR FUTURE USE -->  
          <!-- <app-mobile-ionic-shell /> -->
        }
        @case ('fullscreen') {
          <app-fullscreen-shell />
        }
        @case ('flyer-parser') {
          <app-flyer-parser-shell />
        }
      }
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styleUrl: './app.scss'
})
export class App {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly ssrPlatform = inject(SsrPlatformService);
  private readonly platformDetection = inject(PlatformDetectionService);

  private readonly navigationSignal = signal(0);

  constructor() {
    // Force recomputation on route changes - only on browser
    this.ssrPlatform.onlyOnBrowser(() => {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.navigationSignal.update(v => v + 1);
      });
    });
  }

  readonly currentShell = computed(() => {
    this.navigationSignal(); // Force recomputation

    // During SSR, use a safe default
    const url = this.ssrPlatform.onlyOnBrowser(() => this.router.url) || '/';
    const routeShell = this.getShellFromUrl(url);

    return this.selectShellForPlatform(routeShell);
  });

  private getShellFromUrl(url: string): string {
    if (url.startsWith('/flyer-parser')) {
      return 'flyer-parser';
    }

    if (url.startsWith('/login')) {
      return 'fullscreen';
    }

    return 'main';
  }

  private selectShellForPlatform(routeShell: string): ShellType {
    // Special shells handle platform differences internally
    if (routeShell === 'fullscreen') {
      return 'fullscreen';
    }

    if (routeShell === 'flyer-parser') {
      return 'flyer-parser';
    }

    // STRATEGY: Use web-main shell for all platforms (web, mobile web, Capacitor)
    // This provides a consistent responsive experience across all devices
    // Mobile shells preserved in codebase for future Ionic integration if needed
    if (routeShell === 'main' || !routeShell) {
      return 'web-main'; // All platforms use responsive web shell
    }

    // === COMMENTED OUT: Platform-specific shell logic preserved for future use ===
    // // Check for Capacitor native platform first
    // const isCapacitorNative = this.ssrPlatform.onlyOnBrowser(() => 
    //   Capacitor.isNativePlatform() || this.platformDetection.isCapacitorNative
    // ) || false;
    // 
    // if (isCapacitorNative) {
    //   return 'mobile-ionic';
    // }
    // 
    // // Fallback to existing mobile detection for mobile web
    // const isMobileWeb = this.ssrPlatform.onlyOnBrowser(() => 
    //   this.platformDetection.isMobileWeb
    // ) || false;
    // 
    // return isMobileWeb ? 'mobile-main' : 'web-main';

    return 'web-main'; // Fallback
  }
}
