import { TestBed } from '@angular/core/testing';
import { PlatformDetectionService } from './platform-detection.service';
import { SsrPlatformService } from './ssr/ssr-platform.service';
import { Capacitor } from '@capacitor/core';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
    getPlatform: jest.fn(),
  },
}));

describe('PlatformDetectionService', () => {
  let service: PlatformDetectionService;
  let mockSsrPlatform: {
    isBrowser: boolean;
    isServer: boolean;
    getWindow: jest.Mock;
  };

  const createMockSsrPlatform = (isBrowser = true, isServer = false) => ({
    isBrowser,
    isServer,
    getWindow: jest.fn().mockReturnValue({ navigator: { userAgent: 'Mozilla/5.0' } }),
  });

  beforeEach(() => {
    mockSsrPlatform = createMockSsrPlatform();

    TestBed.configureTestingModule({
      providers: [
        PlatformDetectionService,
        { provide: SsrPlatformService, useValue: mockSsrPlatform },
      ],
    });

    service = TestBed.inject(PlatformDetectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isCapacitorNative', () => {
    it('should return true when running in Capacitor native', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      expect(service.isCapacitorNative).toBe(true);
    });

    it('should return false when running in web browser', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      expect(service.isCapacitorNative).toBe(false);
    });

    it('should return false during SSR', () => {
      // Re-configure TestBed with SSR mock
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PlatformDetectionService,
          { provide: SsrPlatformService, useValue: createMockSsrPlatform(false, true) },
        ],
      });
      service = TestBed.inject(PlatformDetectionService);
      
      expect(service.isCapacitorNative).toBe(false);
    });
  });

  describe('shouldUseRedirectAuth', () => {
    it('should return true for Capacitor native', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      expect(service.shouldUseRedirectAuth).toBe(true);
    });

    it('should return true for mobile web browsers', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      mockSsrPlatform.getWindow = jest.fn().mockReturnValue({
        navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      });
      expect(service.shouldUseRedirectAuth).toBe(true);
    });

    it('should return false for desktop browsers', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      mockSsrPlatform.getWindow = jest.fn().mockReturnValue({
        navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      expect(service.shouldUseRedirectAuth).toBe(false);
    });
  });

  describe('platform', () => {
    it('should return ios for iOS Capacitor', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      expect(service.platform).toBe('ios');
    });

    it('should return android for Android Capacitor', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      expect(service.platform).toBe('android');
    });

    it('should return mobile-web for mobile browsers', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      mockSsrPlatform.getWindow = jest.fn().mockReturnValue({
        navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
      });
      expect(service.platform).toBe('mobile-web');
    });

    it('should return web for desktop browsers', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      mockSsrPlatform.getWindow = jest.fn().mockReturnValue({
        navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      expect(service.platform).toBe('web');
    });

    it('should return server during SSR', () => {
      // Re-configure TestBed with SSR mock
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PlatformDetectionService,
          { provide: SsrPlatformService, useValue: createMockSsrPlatform(false, true) },
        ],
      });
      service = TestBed.inject(PlatformDetectionService);
      
      expect(service.platform).toBe('server');
    });
  });
});