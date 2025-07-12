import { TestBed } from '@angular/core/testing';
import { LikeService, ContentType } from './like.service';
import { AuthService } from '@auth/data-access/auth.service';
import { FirestoreService } from './firestore.service';

// Mock the FirestoreService methods we need
class MockFirestoreService {
  async getDocByPath<T>(path: string): Promise<T | undefined> {
    return undefined;
  }
  
  async setDoc<T>(path: string, data: T): Promise<void> {}
  
  async deleteDoc(path: string): Promise<void> {}
  
  async updateDoc<T>(path: string, data: Partial<T>): Promise<void> {}
  
  async exists(path: string): Promise<boolean> {
    return false;
  }
  
  async getDocsWhere<T>(...args: any[]): Promise<T[]> {
    return [];
  }
}

// Mock AuthService
class MockAuthService {
  getUid(): string | null {
    return 'test-user-123';
  }
}

describe('LikeService', () => {
  let service: LikeService;
  let authService: MockAuthService;
  let firestoreService: MockFirestoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LikeService,
        { provide: AuthService, useClass: MockAuthService },
        { provide: FirestoreService, useClass: MockFirestoreService }
      ]
    });
    
    service = TestBed.inject(LikeService);
    authService = TestBed.inject(AuthService) as any;
    firestoreService = service as any; // Access the parent class methods
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toggleLike', () => {
    it('should throw error when user is not authenticated', async () => {
      spyOn(authService, 'getUid').and.returnValue(null);
      
      await expectAsync(service.toggleLike('event123', 'event'))
        .toBeRejectedWithError('User must be authenticated to like content');
    });

    it('should like content when not already liked', async () => {
      const userId = 'test-user-123';
      const contentId = 'event123';
      const contentType: ContentType = 'event';
      const expectedLikeId = `${userId}_${contentType}_${contentId}`;
      
      spyOn(authService, 'getUid').and.returnValue(userId);
      spyOn(service as any, 'getDocByPath').and.returnValue(Promise.resolve(undefined));
      spyOn(service as any, 'setDoc').and.returnValue(Promise.resolve());
      spyOn(service as any, 'updateContentLikeCount').and.returnValue(Promise.resolve());
      
      const result = await service.toggleLike(contentId, contentType);
      
      expect(result).toBe(true);
      expect(service['setDoc']).toHaveBeenCalledWith(
        `likes/${expectedLikeId}`,
        jasmine.objectContaining({
          userId,
          contentId,
          contentType,
          likedAt: jasmine.any(Date)
        })
      );
    });

    it('should unlike content when already liked', async () => {
      const userId = 'test-user-123';
      const contentId = 'event123';
      const contentType: ContentType = 'event';
      const expectedLikeId = `${userId}_${contentType}_${contentId}`;
      const existingLike = {
        userId,
        contentId,
        contentType,
        likedAt: new Date()
      };
      
      spyOn(authService, 'getUid').and.returnValue(userId);
      spyOn(service as any, 'getDocByPath').and.returnValue(Promise.resolve(existingLike));
      spyOn(service as any, 'deleteDoc').and.returnValue(Promise.resolve());
      spyOn(service as any, 'updateContentLikeCount').and.returnValue(Promise.resolve());
      
      const result = await service.toggleLike(contentId, contentType);
      
      expect(result).toBe(false);
      expect(service['deleteDoc']).toHaveBeenCalledWith(`likes/${expectedLikeId}`);
    });
  });

  describe('isLiked', () => {
    it('should return false when user is not authenticated', async () => {
      spyOn(authService, 'getUid').and.returnValue(null);
      
      const result = await service.isLiked('event123', 'event');
      
      expect(result).toBe(false);
    });

    it('should check if content is liked by user', async () => {
      const userId = 'test-user-123';
      const contentId = 'event123';
      const contentType: ContentType = 'event';
      const expectedLikeId = `${userId}_${contentType}_${contentId}`;
      
      spyOn(authService, 'getUid').and.returnValue(userId);
      spyOn(service as any, 'exists').and.returnValue(Promise.resolve(true));
      
      const result = await service.isLiked(contentId, contentType);
      
      expect(result).toBe(true);
      expect(service['exists']).toHaveBeenCalledWith(`likes/${expectedLikeId}`);
    });
  });

  describe('getLikeCount', () => {
    it('should return like count from event document', async () => {
      const contentId = 'event123';
      const contentType: ContentType = 'event';
      const mockEvent = { likeCount: 42 };
      
      spyOn(service as any, 'getDocByPath').and.returnValue(Promise.resolve(mockEvent));
      
      const result = await service.getLikeCount(contentId, contentType);
      
      expect(result).toBe(42);
      expect(service['getDocByPath']).toHaveBeenCalledWith(`events/${contentId}`);
    });

    it('should return like count from venue document', async () => {
      const contentId = 'venue123';
      const contentType: ContentType = 'venue';
      const mockVenue = { likeCount: 15 };
      
      spyOn(service as any, 'getDocByPath').and.returnValue(Promise.resolve(mockVenue));
      
      const result = await service.getLikeCount(contentId, contentType);
      
      expect(result).toBe(15);
      expect(service['getDocByPath']).toHaveBeenCalledWith(`venues/${contentId}`);
    });

    it('should return 0 when content has no like count', async () => {
      const contentId = 'event123';
      const contentType: ContentType = 'event';
      const mockEvent = {}; // No likeCount field
      
      spyOn(service as any, 'getDocByPath').and.returnValue(Promise.resolve(mockEvent));
      
      const result = await service.getLikeCount(contentId, contentType);
      
      expect(result).toBe(0);
    });

    it('should return 0 when content does not exist', async () => {
      const contentId = 'event123';
      const contentType: ContentType = 'event';
      
      spyOn(service as any, 'getDocByPath').and.returnValue(Promise.resolve(undefined));
      
      const result = await service.getLikeCount(contentId, contentType);
      
      expect(result).toBe(0);
    });
  });

  describe('getMultipleLikeStates', () => {
    it('should return empty object when user is not authenticated', async () => {
      spyOn(authService, 'getUid').and.returnValue(null);
      
      const result = await service.getMultipleLikeStates([
        { id: 'event123', type: 'event' },
        { id: 'venue456', type: 'venue' }
      ]);
      
      expect(result).toEqual({});
    });

    it('should return like states for multiple items', async () => {
      const userId = 'test-user-123';
      spyOn(authService, 'getUid').and.returnValue(userId);
      spyOn(service as any, 'exists')
        .and.returnValues(Promise.resolve(true), Promise.resolve(false));
      
      const result = await service.getMultipleLikeStates([
        { id: 'event123', type: 'event' },
        { id: 'venue456', type: 'venue' }
      ]);
      
      expect(result).toEqual({
        'event_event123': true,
        'venue_venue456': false
      });
    });
  });
});