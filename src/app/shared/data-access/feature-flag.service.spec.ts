import { FeatureFlagService } from './feature-flag.service';
import { environment } from '../../../environments/environment';

// Mock the environment module
jest.mock('../../../environments/environment', () => ({
  __esModule: true,
  environment: {
    production: false,
    ENABLE_ALL_FEATURES_FOR_DEV: false,
    featureFlags: {
      patchwork: false,
      landlord: false,
      theme: false,
      search: false,
      badges: false,
      missions: false,
      photoUpload: false,
      carpets: false
    }
  }
}));

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  const mockEnvironment = environment as jest.Mocked<typeof environment>;

  // Helper to set environment state
  const setEnvironment = (
    production: boolean,
    enableAll: boolean,
    flags: Partial<typeof environment.featureFlags> = {}
  ) => {
    mockEnvironment.production = production;
    mockEnvironment.ENABLE_ALL_FEATURES_FOR_DEV = enableAll;
    mockEnvironment.featureFlags = {
      ...mockEnvironment.featureFlags,
      ...flags
    };
  };

  beforeEach(() => {
    // Reset to default state before each test
    setEnvironment(false, false, {
      patchwork: false,
      landlord: false,
      theme: false,
      search: false,
      badges: false,
      missions: false,
      photoUpload: false,
      carpets: false
    });

    // Create service instance directly (no TestBed needed)
    service = new FeatureFlagService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('production mode', () => {
    it('should return true when flag is enabled', () => {
      setEnvironment(true, false, { patchwork: true });

      expect(service.isEnabled('patchwork')).toBe(true);
    });

    it('should return false when flag is disabled', () => {
      setEnvironment(true, false, { patchwork: false });

      expect(service.isEnabled('patchwork')).toBe(false);
    });

    it('should return false for undefined flag', () => {
      setEnvironment(true, false, {});

      expect(service.isEnabled('search')).toBe(false);
    });

    it('should ignore ENABLE_ALL_FEATURES_FOR_DEV in production', () => {
      setEnvironment(true, true, { theme: false });

      expect(service.isEnabled('theme')).toBe(false);
    });
  });

  describe('development mode with ENABLE_ALL_FEATURES_FOR_DEV', () => {
    it('should return true for any flag when enabled', () => {
      setEnvironment(false, true, { landlord: false });

      expect(service.isEnabled('landlord')).toBe(true);
    });

    it('should return true for undefined flag when enabled', () => {
      setEnvironment(false, true, {});

      expect(service.isEnabled('badges')).toBe(true);
    });
  });

  describe('development mode without ENABLE_ALL_FEATURES_FOR_DEV', () => {
    it('should return true when flag is enabled', () => {
      setEnvironment(false, false, { missions: true });

      expect(service.isEnabled('missions')).toBe(true);
    });

    it('should return false when flag is disabled', () => {
      setEnvironment(false, false, { photoUpload: false });

      expect(service.isEnabled('photoUpload')).toBe(false);
    });

    it('should return false for undefined flag', () => {
      setEnvironment(false, false, {});

      expect(service.isEnabled('carpets')).toBe(false);
    });
  });
});
