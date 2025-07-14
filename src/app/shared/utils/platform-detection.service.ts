import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SsrPlatformService } from './ssr/ssr-platform.service';

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectionService {
  private readonly ssrPlatform = inject(SsrPlatformService);

  get isCapacitorNative(): boolean {
    return this.ssrPlatform.isBrowser && Capacitor.isNativePlatform();
  }

  get isWeb(): boolean {
    return this.ssrPlatform.isBrowser && !Capacitor.isNativePlatform();
  }

  get isMobileWeb(): boolean {
    if (!this.ssrPlatform.isBrowser) return false;
    
    const window = this.ssrPlatform.getWindow();
    if (!window) return false;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
    
    return (isMobile || isTablet) && !this.isCapacitorNative;
  }

  get platform(): 'ios' | 'android' | 'web' | 'mobile-web' | 'server' {
    if (this.ssrPlatform.isServer) return 'server';
    if (!this.ssrPlatform.isBrowser) return 'server';
    
    if (this.isCapacitorNative) {
      return Capacitor.getPlatform() as 'ios' | 'android';
    }
    
    return this.isMobileWeb ? 'mobile-web' : 'web';
  }

  get shouldUseRedirectAuth(): boolean {
    // Use redirect auth for Capacitor native apps and mobile web browsers
    return this.isCapacitorNative || this.isMobileWeb;
  }
}