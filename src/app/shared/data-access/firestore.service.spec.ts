import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { FirebaseService } from './firestore.service';
import { FirebaseMetricsService } from './firebase-metrics.service';
import { 
  createMockDocumentSnapshot, 
  createMockQuerySnapshot
} from '../../../testing';

// Mock Firestore functions
jest.mock('@angular/fire/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn()
}));

// Mock the actual service since it's abstract
class TestFirebaseService extends FirebaseService {
  // Expose protected methods for testing
  public testCollection$<T>(path: string) {
    return this.collection$<T>(path);
  }
  
  public testDoc$<T>(path: string) {
    return this.doc$<T>(path);
  }
}

describe('FirebaseService', () => {
  let service: TestFirebaseService;
  let mockFirestore: jest.Mocked<Firestore>;
  let mockMetricsService: jest.Mocked<FirebaseMetricsService>;

  beforeEach(() => {
    mockFirestore = {
      app: {} as any,
      _delegate: {} as any
    } as jest.Mocked<Firestore>;

    mockMetricsService = {
      trackCall: jest.fn(),
      trackError: jest.fn(),
      getMetrics: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TestFirebaseService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: FirebaseMetricsService, useValue: mockMetricsService }
      ]
    });

    service = TestBed.inject(TestFirebaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('collection$ method', () => {
    it('should fetch collection data successfully', (done) => {
      // Arrange
      const mockData = [{ id: '1', name: 'Test Item 1' }, { id: '2', name: 'Test Item 2' }];
      const path = 'test-collection';

      // Mock Firebase collection query
      const { collection, getDocs } = require('@angular/fire/firestore');
      (collection as jest.Mock).mockReturnValue({});
      (getDocs as jest.Mock).mockResolvedValue(createMockQuerySnapshot(mockData));

      // Act & Assert
      service.testCollection$(path).subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(mockMetricsService.trackCall).toHaveBeenCalledWith('read', path, 'collection$');
          done();
        },
        error: done
      });
    });

    it('should handle collection fetch errors', (done) => {
      // Arrange
      const path = 'test-collection';
      const errorMessage = 'Permission denied';

      jest.spyOn(require('@angular/fire/firestore'), 'collection').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDocs').mockRejectedValue(
        new Error(errorMessage)
      );

      // Act & Assert
      service.testCollection$(path).subscribe({
        next: () => done('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          expect(mockMetricsService.trackCall).toHaveBeenCalledWith('read', path, 'collection$');
          done();
        }
      });
    });

    it('should return empty array for empty collection', (done) => {
      // Arrange
      const path = 'empty-collection';

      jest.spyOn(require('@angular/fire/firestore'), 'collection').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDocs').mockResolvedValue(
        createMockQuerySnapshot([])
      );

      // Act & Assert
      service.testCollection$(path).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          expect(result).toBeEmpty();
          done();
        },
        error: done
      });
    });
  });

  describe('doc$ method', () => {
    it('should fetch single document successfully', (done) => {
      // Arrange
      const mockData = { id: '123', name: 'Test Document', value: 42 };
      const path = 'test-collection/doc-123';

      jest.spyOn(require('@angular/fire/firestore'), 'doc').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDoc').mockResolvedValue(
        createMockDocumentSnapshot(mockData, 'doc-123')
      );

      // Act & Assert
      service.testDoc$(path).subscribe({
        next: (result) => {
          expect(result).toEqual(mockData);
          expect(mockMetricsService.trackCall).toHaveBeenCalledWith('read', 'test-collection', 'doc$');
          done();
        },
        error: done
      });
    });

    it('should return undefined for non-existent document', (done) => {
      // Arrange
      const path = 'test-collection/non-existent';

      jest.spyOn(require('@angular/fire/firestore'), 'doc').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDoc').mockResolvedValue(
        createMockDocumentSnapshot(null, 'non-existent')
      );

      // Act & Assert
      service.testDoc$(path).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        },
        error: done
      });
    });

    it('should handle document fetch errors', (done) => {
      // Arrange
      const path = 'test-collection/error-doc';
      const errorMessage = 'Document not found';

      jest.spyOn(require('@angular/fire/firestore'), 'doc').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDoc').mockRejectedValue(
        new Error(errorMessage)
      );

      // Act & Assert
      service.testDoc$(path).subscribe({
        next: () => done('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('metrics tracking', () => {
    it('should track metrics for all operations', () => {
      // Arrange
      const collectionPath = 'users';
      const docPath = 'users/user-123';

      jest.spyOn(require('@angular/fire/firestore'), 'collection').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDocs').mockResolvedValue(
        createMockQuerySnapshot([])
      );
      jest.spyOn(require('@angular/fire/firestore'), 'doc').mockReturnValue({});
      jest.spyOn(require('@angular/fire/firestore'), 'getDoc').mockResolvedValue(
        createMockDocumentSnapshot(null)
      );

      // Act
      service.testCollection$(collectionPath).subscribe();
      service.testDoc$(docPath).subscribe();

      // Assert
      expect(mockMetricsService.trackCall).toHaveBeenCalledWith('read', collectionPath, 'collection$');
      expect(mockMetricsService.trackCall).toHaveBeenCalledWith('read', 'users', 'doc$');
      expect(mockMetricsService.trackCall).toHaveBeenCalledTimes(2);
    });
  });
});