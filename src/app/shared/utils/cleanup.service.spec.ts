import { TestBed } from '@angular/core/testing';
import { CleanupService } from './cleanup.service';
import { firestoreServiceProviders } from '../../../testing';

describe('CleanupService', () => {
  let service: CleanupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CleanupService,
        ...firestoreServiceProviders
      ]
    });
    service = TestBed.inject(CleanupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should extend FirestoreService', () => {
    expect(service).toBeInstanceOf(CleanupService);
    // Should have inherited Firestore methods
    expect(typeof (service as any).collection$).toBe('function');
    expect(typeof (service as any).doc$).toBe('function');
  });
});
