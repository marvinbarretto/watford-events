import { TestBed } from '@angular/core/testing';
import { FirestoreCrudService } from './firestore-crud.service';
import { firestoreServiceProviders } from '../../../testing/test-providers';

describe('FirestoreCrudService', () => {
  let service: FirestoreCrudService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FirestoreCrudService,
        ...firestoreServiceProviders
      ]
    });
    service = TestBed.inject(FirestoreCrudService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
