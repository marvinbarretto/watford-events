import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateBoxComponent } from './date-box.component';
import { ComponentRef } from '@angular/core';

describe('DateBoxComponent', () => {
  let component: DateBoxComponent;
  let fixture: ComponentFixture<DateBoxComponent>;
  let componentRef: ComponentRef<DateBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateBoxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DateBoxComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    componentRef.setInput('date', new Date('2024-07-14'));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('current month events', () => {
    beforeEach(() => {
      // Mock current date to July 2024
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(6); // July (0-indexed)
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should show day of week and day number for current month', () => {
      const eventDate = new Date('2024-07-14'); // Sunday in July 2024
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      expect(component.dayOfWeekText()).toBe('Sun');
      expect(component.dayText()).toBe('14');
      expect(component.showMonth()).toBe(false);
    });

    it('should not show month text for current month', () => {
      const eventDate = new Date('2024-07-20');
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      const monthElement = fixture.nativeElement.querySelector('.month-text');
      expect(monthElement).toBeNull();
    });

    it('should have correct CSS class for current month', () => {
      const eventDate = new Date('2024-07-25');
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      const dateBox = fixture.nativeElement.querySelector('.date-box');
      expect(dateBox.classList.contains('has-month')).toBe(false);
    });
  });

  describe('different month events', () => {
    beforeEach(() => {
      // Mock current date to July 2024
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(6); // July (0-indexed)
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should show day of week, day number, and month for different month', () => {
      const eventDate = new Date('2024-08-15'); // August 2024
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      expect(component.dayOfWeekText()).toBe('Thu');
      expect(component.dayText()).toBe('15');
      expect(component.monthText()).toBe('Aug');
      expect(component.showMonth()).toBe(true);
    });

    it('should show month text element for different month', () => {
      const eventDate = new Date('2024-06-10'); // June 2024
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      const monthElement = fixture.nativeElement.querySelector('.month-text');
      expect(monthElement).toBeTruthy();
      expect(monthElement.textContent.trim()).toBe('Jun');
    });

    it('should have correct CSS class for different month', () => {
      const eventDate = new Date('2024-09-05');
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      const dateBox = fixture.nativeElement.querySelector('.date-box');
      expect(dateBox.classList.contains('has-month')).toBe(true);
    });
  });

  describe('different year events', () => {
    beforeEach(() => {
      // Mock current date to July 2024
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(6); // July (0-indexed)
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should show month for same month but different year', () => {
      const eventDate = new Date('2025-07-14'); // July 2025 (different year)
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      expect(component.dayOfWeekText()).toBe('Mon');
      expect(component.dayText()).toBe('14');
      expect(component.monthText()).toBe('Jul');
      expect(component.showMonth()).toBe(true);
    });

    it('should show month for previous year', () => {
      const eventDate = new Date('2023-12-25'); // December 2023
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      expect(component.showMonth()).toBe(true);
      expect(component.monthText()).toBe('Dec');
    });
  });

  describe('DOM structure', () => {
    it('should always render day of week and day number', () => {
      const eventDate = new Date('2024-07-14');
      componentRef.setInput('date', eventDate);
      fixture.detectChanges();

      const dayOfWeekElement = fixture.nativeElement.querySelector('.day-of-week');
      const dayNumberElement = fixture.nativeElement.querySelector('.day-number');

      expect(dayOfWeekElement).toBeTruthy();
      expect(dayNumberElement).toBeTruthy();
      expect(dayOfWeekElement.textContent.trim()).toBe('Sun');
      expect(dayNumberElement.textContent.trim()).toBe('14');
    });

    it('should conditionally render month text', () => {
      // Test current month (should not show month)
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(6); // July
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
      
      const currentMonthDate = new Date('2024-07-14');
      componentRef.setInput('date', currentMonthDate);
      fixture.detectChanges();

      let monthElement = fixture.nativeElement.querySelector('.month-text');
      expect(monthElement).toBeNull();

      // Test different month (should show month)
      const differentMonthDate = new Date('2024-08-14');
      componentRef.setInput('date', differentMonthDate);
      fixture.detectChanges();

      monthElement = fixture.nativeElement.querySelector('.month-text');
      expect(monthElement).toBeTruthy();
      expect(monthElement.textContent.trim()).toBe('Aug');

      jest.restoreAllMocks();
    });
  });
});