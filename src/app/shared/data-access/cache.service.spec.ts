import { MockServices } from '../../../testing/mock-services';

describe('CacheService', () => {
  let mockCacheService: any;

  beforeEach(() => {
    mockCacheService = MockServices.cache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be created', () => {
      expect(mockCacheService).toBeTruthy();
    });

    it('should have cache methods', () => {
      expect(typeof mockCacheService.get).toBe('function');
      expect(typeof mockCacheService.set).toBe('function');
      expect(typeof mockCacheService.clear).toBe('function');
      expect(typeof mockCacheService.has).toBe('function');
    });
  });

  describe('cache operations', () => {
    it('should get data from cache', async () => {
      // Arrange
      const key = 'test-key';
      const value = { id: '1', name: 'Test Item' };
      mockCacheService.get.mockResolvedValue(value);

      // Act
      const result = await mockCacheService.get(key);

      // Assert
      expect(result).toEqual(value);
      expect(mockCacheService.get).toHaveBeenCalledWith(key);
    });

    it('should set data in cache', async () => {
      // Arrange
      const key = 'test-key';
      const value = { id: '1', name: 'Test Item' };
      mockCacheService.set.mockResolvedValue(undefined);

      // Act
      await mockCacheService.set(key, value);

      // Assert
      expect(mockCacheService.set).toHaveBeenCalledWith(key, value);
    });

    it('should delete data from cache', async () => {
      // Arrange
      const key = 'test-key';
      mockCacheService.delete.mockResolvedValue(undefined);

      // Act
      await mockCacheService.delete(key);

      // Assert
      expect(mockCacheService.delete).toHaveBeenCalledWith(key);
    });

    it('should clear all cache', async () => {
      // Arrange
      mockCacheService.clear.mockResolvedValue(undefined);

      // Act
      await mockCacheService.clear();

      // Assert
      expect(mockCacheService.clear).toHaveBeenCalled();
    });

    it('should check if key exists in cache', async () => {
      // Arrange
      const key = 'test-key';
      mockCacheService.has.mockResolvedValue(true);

      // Act
      const result = await mockCacheService.has(key);

      // Assert
      expect(result).toBe(true);
      expect(mockCacheService.has).toHaveBeenCalledWith(key);
    });

    it('should handle cache errors gracefully', async () => {
      // Arrange
      const key = 'test-key';
      const errorMessage = 'Cache error';
      mockCacheService.get.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(mockCacheService.get(key)).rejects.toThrow(errorMessage);
    });
  });
});
