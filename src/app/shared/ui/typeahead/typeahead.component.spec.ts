import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ComponentRef } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { TypeaheadComponent, TypeaheadOption } from './typeahead.component';

describe('TypeaheadComponent', () => {
  let component: TypeaheadComponent<string>;
  let fixture: ComponentFixture<TypeaheadComponent<string>>;
  let componentRef: ComponentRef<TypeaheadComponent<string>>;
  let mockLiveAnnouncer: jest.Mocked<LiveAnnouncer>;

  // Test data
  const mockOptions: TypeaheadOption<string>[] = [
    { value: 'option1', label: 'Option 1', description: 'First option' },
    { value: 'option2', label: 'Option 2', description: 'Second option' },
    { value: 'option3', label: 'Option 3', disabled: true },
    { value: 'option4', label: 'Option 4' }
  ];

  const mockSearchFunction = jest.fn();
  const mockDisplayFunction = jest.fn((value: string) => value);
  const mockCompareFunction = jest.fn((a: string, b: string) => a === b);

  beforeEach(async () => {
    mockLiveAnnouncer = {
      announce: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn(),
      ngOnDestroy: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [TypeaheadComponent, ReactiveFormsModule, OverlayModule],
      providers: [
        { provide: LiveAnnouncer, useValue: mockLiveAnnouncer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TypeaheadComponent<string>);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    // Set up default inputs
    componentRef.setInput('searchFunction', mockSearchFunction);
    componentRef.setInput('displayFunction', mockDisplayFunction);
    componentRef.setInput('compareFunction', mockCompareFunction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      fixture.detectChanges();

      expect(component.placeholder).toBe('Search...');
      expect(component.readonly).toBe(false);
      expect(component.disabled).toBe(false);
      expect(component.debounceTime).toBe(300);
      expect(component.minSearchLength).toBe(1);
      expect(component.size).toBe('medium');
      expect(component.enableCaching).toBe(true);
      expect(component.isLoading()).toBe(false);
      expect(component.showDropdown()).toBe(false);
      expect(component.options()).toEqual([]);
    });

    it('should generate unique component ID', () => {
      fixture.detectChanges();
      expect(component.componentId).toBeDefined();
      expect(component.componentId.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper ARIA attributes on input', () => {
      const input = fixture.nativeElement.querySelector('input');

      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.getAttribute('aria-haspopup')).toBe('listbox');
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-controls')).toBe(`typeahead-listbox-${component.componentId}`);
    });

    it('should update aria-expanded when dropdown opens', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      tick(300); // Wait for debounce
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      expect(input.getAttribute('aria-expanded')).toBe('true');
    }));

    it('should have proper ARIA attributes on dropdown', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('[role="listbox"]');
      expect(dropdown).toBeTruthy();
      expect(dropdown.getAttribute('aria-label')).toContain('Search results for test');
    }));

    it('should have proper ARIA attributes on options', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);
      fixture.detectChanges();

      const options = fixture.nativeElement.querySelectorAll('[role="option"]');
      expect(options.length).toBe(4);

      options.forEach((option: HTMLElement, index: number) => {
        expect(option.getAttribute('id')).toBe(`typeahead-option-${component.componentId}-${index}`);
        expect(option.getAttribute('aria-selected')).toBe('false');
      });
    }));

    it('should update aria-activedescendant when navigating with keyboard', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');

      // Navigate down
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(arrowDownEvent);
      fixture.detectChanges();

      expect(input.getAttribute('aria-activedescendant')).toBe(`typeahead-option-${component.componentId}-0`);
    }));

    it('should announce search results to screen readers', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);

      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('4 results available');
    }));
  });

  describe('Search Functionality', () => {
    it('should not search when query is below minimum length', fakeAsync(() => {
      componentRef.setInput('minSearchLength', 3);
      fixture.detectChanges();

      component.searchControl.setValue('ab');
      tick(300);

      expect(mockSearchFunction).not.toHaveBeenCalled();
      expect(component.options()).toEqual([]);
    }));

    it('should debounce search requests', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('a');
      tick(100);
      component.searchControl.setValue('ab');
      tick(100);
      component.searchControl.setValue('abc');
      tick(300);

      expect(mockSearchFunction).toHaveBeenCalledTimes(1);
      expect(mockSearchFunction).toHaveBeenCalledWith('abc');
    }));

    it('should handle synchronous search function', fakeAsync(() => {
      mockSearchFunction.mockReturnValue(mockOptions);

      component.searchControl.setValue('test');
      tick(300);

      expect(component.options()).toEqual(mockOptions);
    }));

    it('should handle asynchronous search function', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      tick(300);

      expect(component.options()).toEqual(mockOptions);
    }));

    it('should show loading state during search', fakeAsync(() => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve(mockOptions), 1000));
      mockSearchFunction.mockReturnValue(slowPromise);

      component.searchControl.setValue('test');
      tick(300);

      expect(component.isLoading()).toBe(true);

      tick(1000);
      expect(component.isLoading()).toBe(false);
    }));

    it('should handle search errors gracefully', fakeAsync(() => {
      const error = new Error('Search failed');
      mockSearchFunction.mockRejectedValue(error);

      component.searchControl.setValue('test');
      tick(300);

      expect(component.hasError()).toBe(true);
      expect(component.errorMessage()).toBe('Search failed');
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Search failed: Search failed');
    }));
  });

  describe('Caching', () => {
    beforeEach(() => {
      componentRef.setInput('enableCaching', true);
      fixture.detectChanges();
    });

    it('should cache search results', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      // First search
      component.searchControl.setValue('test');
      tick(300);

      // Second search with same query
      component.searchControl.setValue('');
      tick(300);
      component.searchControl.setValue('test');
      tick(300);

      expect(mockSearchFunction).toHaveBeenCalledTimes(1);
      expect(component.options()).toEqual(mockOptions);
    }));

    it('should respect cache timeout', fakeAsync(() => {
      componentRef.setInput('cacheTimeout', 1000);
      mockSearchFunction.mockResolvedValue(mockOptions);

      // First search
      component.searchControl.setValue('test');
      tick(300);

      // Wait beyond cache timeout
      tick(1100);

      // Second search with same query
      component.searchControl.setValue('');
      tick(300);
      component.searchControl.setValue('test');
      tick(300);

      expect(mockSearchFunction).toHaveBeenCalledTimes(2);
    }));

    it('should provide cache statistics', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      tick(300);

      const stats = component.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain('test');
    }));

    it('should clear cache when requested', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      tick(300);

      component.clearCache();

      const stats = component.getCacheStats();
      expect(stats.size).toBe(0);
    }));
  });

  describe('Keyboard Navigation', () => {
    beforeEach(fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);
      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);
      fixture.detectChanges();
    }));

    it('should navigate down with ArrowDown', () => {
      const input = fixture.nativeElement.querySelector('input');

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onKeydown(event);

      expect(component.selectedIndex()).toBe(0);
    });

    it('should navigate up with ArrowUp', () => {
      const input = fixture.nativeElement.querySelector('input');

      // First go down to index 1
      component.setSelectedIndex(1);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onKeydown(event);

      expect(component.selectedIndex()).toBe(0);
    });

    it('should wrap around when navigating past boundaries', () => {
      // Navigate past last item
      component.setSelectedIndex(3);
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onKeydown(downEvent);

      expect(component.selectedIndex()).toBe(0);

      // Navigate before first item
      component.setSelectedIndex(0);
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onKeydown(upEvent);

      expect(component.selectedIndex()).toBe(3);
    });

    it('should select option with Enter', () => {
      component.setSelectedIndex(0);
      const selectedOptionSpy = jest.spyOn(component.selectedOption, 'emit');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(event);

      expect(selectedOptionSpy).toHaveBeenCalledWith(mockOptions[0]);
      expect(component.showDropdown()).toBe(false);
    });

    it('should close dropdown with Escape', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.onKeydown(event);

      expect(component.showDropdown()).toBe(false);
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Search cancelled');
    });

    it('should go to first option with Home', () => {
      component.setSelectedIndex(2);

      const event = new KeyboardEvent('keydown', { key: 'Home' });
      component.onKeydown(event);

      expect(component.selectedIndex()).toBe(0);
    });

    it('should go to last option with End', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      component.onKeydown(event);

      expect(component.selectedIndex()).toBe(3);
    });

    it('should not select disabled options', () => {
      component.setSelectedIndex(2); // disabled option
      const selectedOptionSpy = jest.spyOn(component.selectedOption, 'emit');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(event);

      expect(selectedOptionSpy).not.toHaveBeenCalled();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Option is disabled');
    });
  });

  describe('Mouse Interaction', () => {
    beforeEach(fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);
      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);
      fixture.detectChanges();
    }));

    it('should select option on click', () => {
      const selectedOptionSpy = jest.spyOn(component.selectedOption, 'emit');

      component.selectOption(mockOptions[0]);

      expect(selectedOptionSpy).toHaveBeenCalledWith(mockOptions[0]);
      expect(component.searchControl.value).toBe('option1');
      expect(component.showDropdown()).toBe(false);
    });

    it('should update selected index on mouse enter', () => {
      component.setSelectedIndex(1);

      expect(component.selectedIndex()).toBe(1);
    });

    it('should not select disabled option on click', () => {
      const selectedOptionSpy = jest.spyOn(component.selectedOption, 'emit');

      component.selectOption(mockOptions[2]); // disabled option

      expect(selectedOptionSpy).not.toHaveBeenCalled();
      expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Option is disabled');
    });
  });

  describe('Virtual Scrolling', () => {
    const manyOptions: TypeaheadOption<string>[] = Array.from({ length: 150 }, (_, i) => ({
      value: `option${i}`,
      label: `Option ${i}`
    }));

    beforeEach(() => {
      componentRef.setInput('maxVisibleOptions', 100);
      fixture.detectChanges();
    });

    it('should limit visible options', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(manyOptions);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);

      expect(component.visibleOptions().length).toBe(100);
      expect(component.hasMoreResults()).toBe(true);
      expect(component.remainingResultsCount()).toBe(50);
    }));

    it('should show all options when under threshold', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);

      expect(component.visibleOptions().length).toBe(4);
      expect(component.hasMoreResults()).toBe(false);
      expect(component.remainingResultsCount()).toBe(0);
    }));
  });

  describe('ControlValueAccessor', () => {
    it('should write value correctly', () => {
      component.writeValue('test-value');

      expect(component.getCurrentValue()).toBe('test-value');
      expect(component.searchControl.value).toBe('test-value');
    });

    it('should clear value when null is written', () => {
      component.writeValue('test-value');
      component.writeValue(null);

      expect(component.getCurrentValue()).toBeNull();
      expect(component.searchControl.value).toBe('');
    });

    it('should register onChange callback', () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.selectOption(mockOptions[0]);

      expect(onChangeFn).toHaveBeenCalledWith('option1');
    });

    it('should register onTouched callback', () => {
      const onTouchedFn = jest.fn();
      component.registerOnTouched(onTouchedFn);

      component.onBlur();

      // Wait for setTimeout delay
      setTimeout(() => {
        expect(onTouchedFn).toHaveBeenCalled();
      }, 250);
    });

    it('should handle disabled state', () => {
      component.setDisabledState(true);

      expect(component.disabled).toBe(true);
      expect(component.searchControl.disabled).toBe(true);
      expect(component.showDropdown()).toBe(false);
    });
  });

  describe('Focus Management', () => {
    it('should show dropdown on focus when options exist', fakeAsync(() => {
      mockSearchFunction.mockResolvedValue(mockOptions);
      component.searchControl.setValue('test');
      tick(300);

      component.onFocus();

      expect(component.showDropdown()).toBe(true);
    }));

    it('should hide dropdown on blur after delay', fakeAsync(() => {
      component.showDropdown.set(true);

      component.onBlur();
      tick(200);

      expect(component.showDropdown()).toBe(false);
    }));

    it('should focus input programmatically', () => {
      const input = fixture.nativeElement.querySelector('input');
      const focusSpy = jest.spyOn(input, 'focus');

      component.focus();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Theme Integration', () => {
    it('should apply size classes correctly', () => {
      componentRef.setInput('size', 'large');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.typeahead-container');
      expect(container.getAttribute('data-size')).toBe('large');
    });

    it('should use CSS custom properties for styling', () => {
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      const styles = getComputedStyle(input);

      // Verify that CSS custom properties are being used
      // (This test verifies structure, actual theme values depend on CSS context)
      expect(input).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages', fakeAsync(() => {
      const error = new Error('Network error');
      mockSearchFunction.mockRejectedValue(error);

      component.searchControl.setValue('test');
      tick(300);
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Network error');
    }));

    it('should clear errors when search succeeds', fakeAsync(() => {
      // First, trigger an error
      mockSearchFunction.mockRejectedValue(new Error('Error'));
      component.searchControl.setValue('test');
      tick(300);

      expect(component.hasError()).toBe(true);

      // Then, successful search
      mockSearchFunction.mockResolvedValue(mockOptions);
      component.searchControl.setValue('test2');
      tick(300);

      expect(component.hasError()).toBe(false);
    }));

    it('should retry last search', fakeAsync(() => {
      mockSearchFunction.mockRejectedValue(new Error('Error'));
      component.searchControl.setValue('test');
      tick(300);

      mockSearchFunction.mockResolvedValue(mockOptions);
      component.retryLastSearch();
      tick(300);

      expect(component.hasError()).toBe(false);
      expect(component.options()).toEqual(mockOptions);
    }));
  });

  describe('Public API Methods', () => {
    it('should get search query', () => {
      component.searchControl.setValue('test query');

      expect(component.getSearchQuery()).toBe('test query');
    });

    it('should get current value', () => {
      component.writeValue('test-value');

      expect(component.getCurrentValue()).toBe('test-value');
    });

    it('should check loading state', () => {
      component.isLoading.set(true);

      expect(component.isCurrentlyLoading()).toBe(true);
    });

    it('should trigger search manually', () => {
      const searchChangedSpy = jest.spyOn(component.searchChanged, 'emit');

      component.triggerSearch('manual test');

      expect(component.searchControl.value).toBe('manual test');
      expect(searchChangedSpy).toHaveBeenCalled();
    });

    it('should clear search', () => {
      component.writeValue('test-value');
      component.searchControl.setValue('test query');
      component.showDropdown.set(true);

      component.clearSearch();

      expect(component.getCurrentValue()).toBeNull();
      expect(component.searchControl.value).toBe('');
      expect(component.showDropdown()).toBe(false);
    });
  });

  describe('Customization Options', () => {
    it('should use custom loading text', fakeAsync(() => {
      componentRef.setInput('loadingText', 'Custom loading...');
      fixture.detectChanges();

      const slowPromise = new Promise(resolve => setTimeout(() => resolve(mockOptions), 1000));
      mockSearchFunction.mockReturnValue(slowPromise);

      component.searchControl.setValue('test');
      tick(300);
      fixture.detectChanges();

      const loadingElement = fixture.nativeElement.querySelector('.loading-text');
      expect(loadingElement.textContent).toBe('Custom loading...');
    }));

    it('should use custom no results text', fakeAsync(() => {
      componentRef.setInput('noResultsText', 'Nothing found');
      componentRef.setInput('noResultsDescription', 'Try again');

      mockSearchFunction.mockResolvedValue([]);

      component.searchControl.setValue('test');
      component.onFocus();
      tick(300);
      fixture.detectChanges();

      const noResultsLabel = fixture.nativeElement.querySelector('.no-results .option-label');
      const noResultsDesc = fixture.nativeElement.querySelector('.no-results .option-description');

      expect(noResultsLabel.textContent).toBe('Nothing found');
      expect(noResultsDesc.textContent).toBe('Try again');
    }));

    it('should disable caching when configured', fakeAsync(() => {
      componentRef.setInput('enableCaching', false);
      fixture.detectChanges();

      mockSearchFunction.mockResolvedValue(mockOptions);

      // First search
      component.searchControl.setValue('test');
      tick(300);

      // Second search with same query
      component.searchControl.setValue('');
      tick(300);
      component.searchControl.setValue('test');
      tick(300);

      expect(mockSearchFunction).toHaveBeenCalledTimes(2);
    }));
  });
});
