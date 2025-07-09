import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { SsrPlatformService } from './shared/utils/ssr/ssr-platform.service';
import { WebMainShell } from './shared/ui/shells/web-main-shell.component';
import { MobileMainShell } from './shared/ui/shells/mobile-main-shell.component';
import { FullScreenShell } from './shared/ui/shells/fullscreen-shell.component';
import { FlyerParserShell } from './shared/ui/shells/flyer-parser-shell.component';

type ShellType = 
  | 'web-main'           // Desktop web layout
  | 'mobile-main'        // Mobile with Ionic components  
  | 'fullscreen'         // Login, onboarding (no nav)
  | 'flyer-parser';      // Special layout for flyer scanning

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    WebMainShell,
    MobileMainShell,
    FullScreenShell,
    FlyerParserShell
  ],
  template: `
    @if (currentShell()) {
      @switch (currentShell()) {
        @case ('web-main') {
          <app-web-main-shell />
        }
        @case ('mobile-main') {
          <app-mobile-main-shell />
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
    
    // Main shells vary by platform - safe platform detection for SSR
    if (routeShell === 'main' || !routeShell) {
      const isMobile = this.ssrPlatform.onlyOnBrowser(() => this.platform.is('capacitor')) || false;
      return isMobile ? 'mobile-main' : 'web-main';
    }
    
    return 'web-main'; // Fallback
  }
}
