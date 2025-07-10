import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminEventManagement } from './admin-event-management';
import { firestoreServiceProviders } from '../../../../testing/test-providers';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('AdminEventManagement', () => {
  let component: AdminEventManagement;
  let fixture: ComponentFixture<AdminEventManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEventManagement],
      providers: [
        ...firestoreServiceProviders,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: { params: {}, queryParams: {} }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEventManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
