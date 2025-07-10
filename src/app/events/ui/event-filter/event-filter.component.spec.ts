import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { EventFilterComponent, FilterOption, EventCounts } from './event-filter.component';

describe('EventFilterComponent', () => {
  let component: EventFilterComponent;
  let fixture: ComponentFixture<EventFilterComponent>;

  const mockEventCounts: EventCounts = {
    all: 42,
    upcoming: 25,
    today: 3,
    thisWeek: 8,
    thisMonth: 15
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EventFilterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.activeFilter()).toBe('upcoming');
      expect(component.eventCounts()).toBeNull();
      expect(component.searchTerm()).toBe('');
    });

    it('should render filter title', () => {
      fixture.detectChanges();
      const titleElement = fixture.debugElement.query(By.css('.filter-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('Filter Events');
    });
  });

  describe('Event Counts Display', () => {
    beforeEach(() => {
      // Set up component with event counts
      fixture.componentRef.setInput('eventCounts', mockEventCounts);
      fixture.detectChanges();
    });

    it('should display total count in header', () => {
      const totalCountElement = fixture.debugElement.query(By.css('.total-count'));
      expect(totalCountElement.nativeElement.textContent.trim()).toBe('42 total');
    });

    it('should display individual counts for each filter option', () => {
      const filterButtons = fixture.debugElement.queryAll(By.css('.filter-option'));
      const counts = filterButtons.map(button => 
        button.query(By.css('.option-count'))?.nativeElement?.textContent?.trim()
      );

      expect(counts).toEqual(['25', '3', '8', '15', '42']);
    });

    it('should not display counts when eventCounts is null', () => {
      fixture.componentRef.setInput('eventCounts', null);
      fixture.detectChanges();

      const totalCountElement = fixture.debugElement.query(By.css('.total-count'));
      const optionCounts = fixture.debugElement.queryAll(By.css('.option-count'));

      expect(totalCountElement).toBeNull();
      expect(optionCounts).toHaveLength(0);
    });
  });

  describe('Filter Selection', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('eventCounts', mockEventCounts);
      fixture.detectChanges();
    });

    it('should mark the active filter button as active', () => {
      fixture.componentRef.setInput('activeFilter', 'today');
      fixture.detectChanges();

      const todayButton = fixture.debugElement.query(
        By.css('button:nth-of-type(2)') // Today is the second button
      );
      const upcomingButton = fixture.debugElement.query(
        By.css('button:nth-of-type(1)') // Upcoming is the first button
      );

      expect(todayButton.nativeElement.classList).toContain('active');
      expect(upcomingButton.nativeElement.classList).not.toContain('active');
    });

    it('should emit filterChanged when filter button is clicked', () => {
      const filterChangedSpy = jest.fn();
      component.filterChanged.subscribe(filterChangedSpy);

      const thisWeekButton = fixture.debugElement.query(
        By.css('button:nth-of-type(3)') // This Week is the third button
      );
      thisWeekButton.nativeElement.click();

      expect(filterChangedSpy).toHaveBeenCalledWith('this-week');
    });

    it('should call selectFilter method when button is clicked', () => {
      const selectFilterSpy = jest.spyOn(component, 'selectFilter');

      const thisMonthButton = fixture.debugElement.query(
        By.css('button:nth-of-type(4)') // This Month is the fourth button
      );
      thisMonthButton.nativeElement.click();

      expect(selectFilterSpy).toHaveBeenCalledWith('this-month');
    });

    it('should test all filter options', () => {
      const filterChangedSpy = jest.fn();
      component.filterChanged.subscribe(filterChangedSpy);

      const filterOptions: FilterOption[] = ['upcoming', 'today', 'this-week', 'this-month', 'all'];
      const buttons = fixture.debugElement.queryAll(By.css('.filter-option'));

      filterOptions.forEach((option, index) => {
        buttons[index].nativeElement.click();
        expect(filterChangedSpy).toHaveBeenCalledWith(option);
      });

      expect(filterChangedSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('Search Functionality', () => {
    let searchInput: DebugElement;

    beforeEach(() => {
      fixture.detectChanges();
      searchInput = fixture.debugElement.query(By.css('.search-input'));
    });

    it('should display search input with correct placeholder', () => {
      expect(searchInput.nativeElement.placeholder).toBe('Search events...');
    });

    it('should display current search term value', () => {
      fixture.componentRef.setInput('searchTerm', 'test search');
      fixture.detectChanges();

      expect(searchInput.nativeElement.value).toBe('test search');
    });

    it('should emit searchChanged when user types in search input', () => {
      const searchChangedSpy = jest.fn();
      component.searchChanged.subscribe(searchChangedSpy);

      // Simulate user typing
      searchInput.nativeElement.value = 'music events';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      expect(searchChangedSpy).toHaveBeenCalledWith('music events');
    });

    it('should call onSearchInput method when input event occurs', () => {
      const onSearchInputSpy = jest.spyOn(component, 'onSearchInput');

      searchInput.nativeElement.value = 'art exhibition';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      expect(onSearchInputSpy).toHaveBeenCalled();
    });

    it('should handle empty search input', () => {
      const searchChangedSpy = jest.fn();
      component.searchChanged.subscribe(searchChangedSpy);

      searchInput.nativeElement.value = '';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      expect(searchChangedSpy).toHaveBeenCalledWith('');
    });

    it('should handle special characters in search', () => {
      const searchChangedSpy = jest.fn();
      component.searchChanged.subscribe(searchChangedSpy);

      const specialText = 'café & müsic!';
      searchInput.nativeElement.value = specialText;
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      expect(searchChangedSpy).toHaveBeenCalledWith(specialText);
    });
  });

  describe('Component Structure and Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('eventCounts', mockEventCounts);
      fixture.detectChanges();
    });

    it('should render all filter option buttons', () => {
      const filterButtons = fixture.debugElement.queryAll(By.css('.filter-option'));
      expect(filterButtons).toHaveLength(5);

      const expectedLabels = ['Upcoming', 'Today', 'This Week', 'This Month', 'All Events'];
      filterButtons.forEach((button, index) => {
        const label = button.query(By.css('.option-label'));
        expect(label.nativeElement.textContent.trim()).toBe(expectedLabels[index]);
      });
    });

    it('should have proper component structure', () => {
      const filterContainer = fixture.debugElement.query(By.css('.event-filter'));
      const filterHeader = fixture.debugElement.query(By.css('.filter-header'));
      const filterOptions = fixture.debugElement.query(By.css('.filter-options'));
      const searchSection = fixture.debugElement.query(By.css('.search-section'));

      expect(filterContainer).toBeTruthy();
      expect(filterHeader).toBeTruthy();
      expect(filterOptions).toBeTruthy();
      expect(searchSection).toBeTruthy();
    });

    it('should render option labels and counts for each filter', () => {
      const filterButtons = fixture.debugElement.queryAll(By.css('.filter-option'));

      filterButtons.forEach(button => {
        const label = button.query(By.css('.option-label'));
        const count = button.query(By.css('.option-count'));

        expect(label).toBeTruthy();
        expect(count).toBeTruthy();
        expect(label.nativeElement.textContent.trim()).toBeTruthy();
        expect(count.nativeElement.textContent.trim()).toBeTruthy();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined eventCounts gracefully', () => {
      fixture.componentRef.setInput('eventCounts', undefined);
      
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      const totalCountElement = fixture.debugElement.query(By.css('.total-count'));
      expect(totalCountElement).toBeNull();
    });

    it('should handle zero counts correctly', () => {
      const zeroCounts: EventCounts = {
        all: 0,
        upcoming: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      };

      fixture.componentRef.setInput('eventCounts', zeroCounts);
      fixture.detectChanges();

      const totalCountElement = fixture.debugElement.query(By.css('.total-count'));
      expect(totalCountElement.nativeElement.textContent.trim()).toBe('0 total');

      const optionCounts = fixture.debugElement.queryAll(By.css('.option-count'));
      optionCounts.forEach(count => {
        expect(count.nativeElement.textContent.trim()).toBe('0');
      });
    });

    it('should handle invalid filter option gracefully', () => {
      // This tests the TypeScript typing more than runtime behavior
      // but ensures the component doesn't break with unexpected values
      fixture.componentRef.setInput('activeFilter', 'invalid-filter' as FilterOption);
      
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      // No button should be active with invalid filter
      const activeButtons = fixture.debugElement.queryAll(By.css('.filter-option.active'));
      expect(activeButtons).toHaveLength(0);
    });

    it('should handle malformed input events gracefully', () => {
      const searchChangedSpy = jest.fn();
      component.searchChanged.subscribe(searchChangedSpy);

      // Create a malformed event without target
      const malformedEvent = new Event('input');
      Object.defineProperty(malformedEvent, 'target', {
        value: null,
        writable: false
      });

      // Now the component should handle this gracefully
      expect(() => {
        component.onSearchInput(malformedEvent);
      }).not.toThrow();

      // Should not have emitted anything with malformed event
      expect(searchChangedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Input Signal Integration (Angular 20)', () => {
    it('should work with signal inputs', () => {
      // Test that the component works correctly with Angular 20 signal inputs
      fixture.componentRef.setInput('activeFilter', 'today');
      fixture.componentRef.setInput('eventCounts', mockEventCounts);
      fixture.componentRef.setInput('searchTerm', 'test search');
      fixture.detectChanges();

      // Verify the inputs are reflected correctly
      expect(component.activeFilter()).toBe('today');
      expect(component.eventCounts()).toEqual(mockEventCounts);
      expect(component.searchTerm()).toBe('test search');

      // Verify UI reflects the signal values
      const todayButton = fixture.debugElement.query(By.css('button:nth-of-type(2)'));
      expect(todayButton.nativeElement.classList).toContain('active');

      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      expect(searchInput.nativeElement.value).toBe('test search');
    });
  });
});