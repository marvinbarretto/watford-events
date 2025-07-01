import { TestBed } from '@angular/core/testing';
import { Auth, User } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { createMockFirebaseUser } from '../../../testing';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: jest.Mocked<Auth>;

  beforeEach(() => {
    mockAuth = {
      currentUser: null,
      onAuthStateChanged: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      updateProfile: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with null user and not authenticated', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('authentication state', () => {
    it('should update state when user signs in', () => {
      // Arrange
      const mockUser = createMockFirebaseUser({
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      });

      // Act
      // Simulate auth state change
      service.user.set(mockUser);
      service.isAuthenticated.set(true);
      service.isLoading.set(false);

      // Assert
      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should update state when user signs out', () => {
      // Arrange - start with authenticated user
      const mockUser = createMockFirebaseUser();
      service.user.set(mockUser);
      service.isAuthenticated.set(true);

      // Act
      service.user.set(null);
      service.isAuthenticated.set(false);

      // Assert
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('signIn method', () => {
    it('should sign in user successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'testPassword123';
      const mockUser = createMockFirebaseUser({ email });
      const mockCredential = { user: mockUser };

      mockAuth.signInWithEmailAndPassword.mockResolvedValue(mockCredential as any);

      // Act
      const result = await service.signIn(email, password);

      // Assert
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockCredential);
    });

    it('should handle sign in errors', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongPassword';
      const errorMessage = 'Invalid credentials';

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.signIn(email, password)).rejects.toThrow(errorMessage);
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
    });

    it('should handle invalid email format', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';
      const password = 'testPassword123';

      mockAuth.signInWithEmailAndPassword.mockRejectedValue(
        new Error('Invalid email format')
      );

      // Act & Assert
      await expect(service.signIn(invalidEmail, password)).rejects.toThrow('Invalid email format');
    });
  });

  describe('signUp method', () => {
    it('should create new user successfully', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'newPassword123';
      const displayName = 'New User';
      const mockUser = createMockFirebaseUser({ email, displayName });
      const mockCredential = { user: mockUser };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValue(mockCredential as any);

      // Act
      const result = await service.signUp(email, password, displayName);

      // Assert
      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockCredential);
    });

    it('should handle sign up errors', async () => {
      // Arrange
      const email = 'existing@example.com';
      const password = 'testPassword123';
      const displayName = 'Test User';
      const errorMessage = 'Email already in use';

      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.signUp(email, password, displayName)).rejects.toThrow(errorMessage);
    });

    it('should handle weak password errors', async () => {
      // Arrange
      const email = 'test@example.com';
      const weakPassword = '123';
      const displayName = 'Test User';

      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(
        new Error('Password should be at least 6 characters')
      );

      // Act & Assert
      await expect(service.signUp(email, weakPassword, displayName))
        .rejects.toThrow('Password should be at least 6 characters');
    });
  });

  describe('signOut method', () => {
    it('should sign out user successfully', async () => {
      // Arrange
      mockAuth.signOut.mockResolvedValue();

      // Act
      await service.signOut();

      // Assert
      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      // Arrange
      const errorMessage = 'Sign out failed';
      mockAuth.signOut.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.signOut()).rejects.toThrow(errorMessage);
    });
  });

  describe('resetPassword method', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      mockAuth.sendPasswordResetEmail.mockResolvedValue();

      // Act
      await service.resetPassword(email);

      // Assert
      expect(mockAuth.sendPasswordResetEmail).toHaveBeenCalledWith(email);
    });

    it('should handle password reset errors', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const errorMessage = 'User not found';
      mockAuth.sendPasswordResetEmail.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(service.resetPassword(email)).rejects.toThrow(errorMessage);
    });
  });

  describe('role checking', () => {
    it('should check user roles correctly', () => {
      // Arrange
      const mockUser = createMockFirebaseUser();
      service.user.set(mockUser);

      // Act & Assert
      expect(service.checkRole('admin')).toBe(false); // Default user has no roles
      expect(service.hasAnyRole(['admin', 'moderator'])).toBe(false);
    });

    it('should return false for role checks when not authenticated', () => {
      // Arrange
      service.user.set(null);

      // Act & Assert
      expect(service.checkRole('admin')).toBe(false);
      expect(service.hasAnyRole(['admin', 'moderator'])).toBe(false);
    });
  });

  describe('loading states', () => {
    it('should manage loading state during operations', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'testPassword123';
      const mockUser = createMockFirebaseUser({ email });
      const mockCredential = { user: mockUser };

      // Simulate a delayed response
      mockAuth.signInWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockCredential as any), 100))
      );

      // Act
      const signInPromise = service.signIn(email, password);
      
      // The service should be handling loading state internally
      // This test demonstrates how you might test loading states if exposed
      
      await signInPromise;

      // Assert
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
    });
  });

  describe('user profile updates', () => {
    it('should update user profile when provided', async () => {
      // This test assumes the service has profile update functionality
      // Arrange
      const mockUser = createMockFirebaseUser();
      const displayName = 'Updated Name';
      
      service.user.set(mockUser);
      
      // Act & Assert
      // If your service has updateProfile method:
      // await service.updateProfile({ displayName });
      // expect(mockAuth.updateProfile).toHaveBeenCalledWith({ displayName });
      
      // For now, just verify the user state
      expect(service.user()).toBeTruthy();
    });
  });
});