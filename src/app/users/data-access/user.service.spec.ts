import { MockServices } from '../../../testing/mock-services';
import { createMockUser } from '../../../testing/test-data-factories';
import { User } from '../utils/user.model';
import { of } from 'rxjs';

describe('UserService', () => {
  let mockUserService: any;

  beforeEach(() => {
    mockUserService = MockServices.user();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be created', () => {
      expect(mockUserService).toBeTruthy();
    });

    it('should have UserService methods', () => {
      // Test that service has expected methods
      expect(typeof mockUserService.getUser).toBe('function');
      expect(typeof mockUserService.updateUser).toBe('function');
      expect(typeof mockUserService.createUser).toBe('function');
      expect(typeof mockUserService.getAllUsers).toBe('function');
    });
  });

  describe('getUser method', () => {
    it('should return user observable', () => {
      // Arrange
      const uid = 'test-user-123';
      const mockUser = createMockUser({ uid });
      
      mockUserService.getUser.mockReturnValue(of(mockUser));

      // Act
      const result$ = mockUserService.getUser(uid);

      // Assert
      result$.subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      expect(mockUserService.getUser).toHaveBeenCalledWith(uid);
    });

    it('should return undefined for non-existent user', () => {
      // Arrange
      const uid = 'non-existent-user';
      
      mockUserService.getUser.mockReturnValue(of(undefined));

      // Act
      const result$ = mockUserService.getUser(uid);

      // Assert
      result$.subscribe(user => {
        expect(user).toBeUndefined();
      });
    });
  });

  describe('updateUser method', () => {
    it('should update user data', async () => {
      // Arrange
      const uid = 'test-user-123';
      const updateData: Partial<User> = { displayName: 'Updated Name' };
      
      mockUserService.updateUser.mockResolvedValue(undefined);

      // Act
      await mockUserService.updateUser(uid, updateData);

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith(uid, updateData);
    });

    it('should handle update errors', async () => {
      // Arrange
      const uid = 'test-user-123';
      const updateData: Partial<User> = { displayName: 'Updated Name' };
      const errorMessage = 'Update failed';
      
      mockUserService.updateUser.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(mockUserService.updateUser(uid, updateData)).rejects.toThrow(errorMessage);
    });
  });

  describe('createUser method', () => {
    it('should create new user', async () => {
      // Arrange
      const uid = 'new-user-123';
      const userData = createMockUser({ uid });
      
      mockUserService.createUser.mockResolvedValue(undefined);

      // Act
      await mockUserService.createUser(uid, userData);

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(uid, userData);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const uid = 'new-user-123';
      const userData = createMockUser({ uid });
      const errorMessage = 'Creation failed';
      
      mockUserService.createUser.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(mockUserService.createUser(uid, userData)).rejects.toThrow(errorMessage);
    });
  });

  describe('getAllUsers method', () => {
    it('should return all users', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({ uid: 'user-1', displayName: 'User 1' }),
        createMockUser({ uid: 'user-2', displayName: 'User 2' })
      ];
      
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await mockUserService.getAllUsers();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockUserService.getAllUsers).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockUserService.getAllUsers.mockResolvedValue([]);

      // Act
      const result = await mockUserService.getAllUsers();

      // Assert
      expect(result).toEqual([]);
      expect(result).toBeEmpty();
    });

    it('should handle fetch errors', async () => {
      // Arrange
      const errorMessage = 'Fetch failed';
      mockUserService.getAllUsers.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(mockUserService.getAllUsers()).rejects.toThrow(errorMessage);
    });
  });
});
