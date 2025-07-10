# Testing Strategy for Watford Events

> **Our Testing Philosophy**: Test behavior, not implementation details, using a clear testing pyramid that balances comprehensive coverage with fast feedback.

## Table of Contents

- [Testing Pyramid Overview](#testing-pyramid-overview)
- [Unit Testing Strategy](#unit-testing-strategy)
- [Integration Testing Strategy](#integration-testing-strategy)
- [E2E Testing Strategy](#e2e-testing-strategy)
- [Testing Decision Matrix](#testing-decision-matrix)
- [Mock Strategy Guidelines](#mock-strategy-guidelines)
- [Testing Patterns & Examples](#testing-patterns--examples)
- [Tool Choices & Rationale](#tool-choices--rationale)
- [Testing Anti-Patterns](#testing-anti-patterns)
- [CI/CD Integration](#cicd-integration)

## Testing Pyramid Overview

```
    /\     E2E Tests (20%)
   /  \    Critical user journeys, real integrations
  /____\   
 /      \   Integration Tests (15%)
/        \  Component + Store, multi-component flows
\________/
\        /  Unit Tests (80%)
 \______/   Pure logic, isolated components/services
```

### Coverage Targets
- **Overall**: 70% minimum (enforced by Jest config)
- **Critical paths**: 90%+ coverage
- **New features**: 80%+ coverage required before merge

## Unit Testing Strategy

### **What to Unit Test**
✅ **Pure Logic & Computations**
- Date filtering algorithms (`eventCounts`, `filteredEvents`)
- Search/filter logic
- Data transformations and utilities
- Validation functions

✅ **Component Behavior (Isolated)**
- Input/output behavior
- Signal updates and computed properties
- Event handlers and user interactions
- Component state management

✅ **Service Methods**
- CRUD operations
- Error handling
- Data validation
- Business logic

✅ **Store State Management**
- Action dispatch behavior
- State updates
- Computed values
- Side effects (with mocked dependencies)

### **Unit Testing Patterns**

**Stores**: Mock dependencies, not the store itself
```typescript
// ✅ Good - Mock EventService, test EventStore
const mockEventService = createEventServiceMock();
const eventStore = new EventStore(mockEventService);

// ❌ Bad - Mocking the store defeats the purpose
const mockEventStore = createEventStoreMock();
```

**Components**: Test behavior, mock external dependencies
```typescript
// ✅ Good - Test component with mocked store
const mockEventStore = createEventStoreMock();
TestBed.configureTestingModule({
  providers: [{ provide: EventStore, useValue: mockEventStore }]
});
```

**Services**: Test concrete implementations
```typescript
// ✅ Good - Test concrete EventService
const eventService = new EventService(mockFirestore);

// ❌ Bad - Testing abstract FirestoreService
```

## Integration Testing Strategy

### **What to Integration Test**
- **Component + Store combinations**: Real store with mocked external services
- **Multi-component flows**: Navigation between related components
- **Authentication integration**: How login state affects component behavior
- **Form workflows**: Complex forms with validation and submission

### **Integration Test Scope**
- Component renders correctly with real store data
- User interactions trigger correct store actions
- Store state changes reflect in component UI
- Navigation and routing work as expected

## E2E Testing Strategy

### **What to E2E Test**
🎯 **Critical User Journeys**
- **Authentication Flow**: Sign up → Email verification → Login
- **Event Discovery**: Browse → Filter → Search → View details
- **Flyer Parser MVP**: Upload image → AI processing → Event creation → Publish
- **Event Management**: Create → Edit → Publish → Delete (admin flow)

🎯 **Real Integration Points**
- Firebase Authentication
- Firestore data persistence
- File upload to Firebase Storage
- LLM API integration (with test images)
- Mobile web experience

🎯 **Cross-Browser & Performance**
- Core functionality works in Chrome, Firefox, Safari
- Mobile responsive behavior
- Page load performance thresholds
- LLM processing timeout handling

### **E2E Testing Boundaries**
❌ **Don't E2E Test**
- Individual component logic (use unit tests)
- Data formatting/transformation (use unit tests)
- Error scenarios that are hard to reproduce (use unit tests)
- Edge cases with specific data combinations

## Testing Decision Matrix

| Scenario | Test Type | Rationale |
|----------|-----------|-----------|
| Date filtering logic | Unit | Pure logic, fast, many edge cases |
| Component renders event list | Unit | Component behavior in isolation |
| User clicks filter button | Unit | Simple user interaction |
| Filter + navigation + persistence | E2E | Multi-step user journey |
| Firebase auth integration | E2E | Real external service |
| Flyer upload → event creation | E2E | Critical business flow |
| Error handling for invalid data | Unit | Fast, predictable scenarios |
| Component + real store | Integration | Verify real data flow |

## Mock Strategy Guidelines

### **Unit Tests - Mock Aggressively**
- Mock all external dependencies (Firebase, HTTP, etc.)
- Mock stores when testing components
- Mock services when testing stores
- Use test data factories for consistent data

### **Integration Tests - Mock Externals Only**
- Real components + real stores
- Mock external services (Firebase, APIs)
- Real routing and navigation
- Real data transformations

### **E2E Tests - Minimize Mocking**
- Real Firebase (use test environment)
- Real LLM API (with test images/prompts)
- Real authentication flow
- Mock only unreliable external services

## Testing Patterns & Examples

### **Event Filtering Example**

**Unit Test Pattern:**
```typescript
describe('HomeComponent filtering logic', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: EventStore, useValue: mockEventStore }
      ]
    });
  });

  it('should filter events by date range', () => {
    // Arrange - Set up test events with specific dates
    const testEvents = [
      createMockEvent({ date: new Date('2024-07-15') }),
      createMockEvent({ date: new Date('2024-07-20') })
    ];
    mockEventStore.publishedEvents.set(testEvents);
    
    // Act - Apply filter
    component.onFilterChanged('this-week');
    
    // Assert - Verify filtering logic
    expect(component.filteredEvents()).toHaveLength(1);
  });
});
```

**E2E Test Pattern:**
```typescript
test('user can filter events and see correct counts', async ({ page }) => {
  // Navigate to events page
  await page.goto('/events');
  
  // Verify initial state
  await expect(page.locator('[data-testid="total-count"]')).toContainText('42 total');
  
  // Apply filter
  await page.click('[data-testid="filter-today"]');
  
  // Verify filtered results
  await expect(page.locator('[data-testid="event-list"] .event-item')).toHaveCount(3);
  await expect(page.locator('[data-testid="today-count"]')).toContainText('3');
});
```

## Tool Choices & Rationale

### **Jest for Unit/Integration Tests**
- ✅ Fast execution
- ✅ Great Angular integration
- ✅ Signal support
- ✅ Comprehensive assertion library
- ✅ Coverage reporting

### **Playwright for E2E Tests**
- ✅ Lighter than Cypress
- ✅ Multi-browser support
- ✅ Better mobile testing
- ✅ Parallel execution
- ✅ Built-in screenshots/videos
- ✅ Great CI/CD integration

### **Testing Infrastructure**
- **Test Data Factories**: Consistent, realistic test data
- **Mock Service Catalog**: Pre-configured mocks for common services
- **Provider Presets**: Standard provider configurations for different test scenarios
- **Signal Test Helpers**: Angular 20 signal-aware testing utilities

## Testing Anti-Patterns

❌ **Don't Do These**
```typescript
// Testing implementation details
expect(component.privateMethod).toHaveBeenCalled();

// Mocking everything in unit tests
const mockEverything = jest.fn();

// Testing Angular framework behavior
expect(component.ngOnInit).toHaveBeenCalled();

// Brittle E2E tests that test UI details
await expect(page.locator('.button')).toHaveCSS('color', 'rgb(255, 0, 0)');

// Testing stores by mocking them
const mockStore = { events: [] };
```

✅ **Do These Instead**
```typescript
// Test behavior and outputs
expect(component.filteredEvents()).toEqual(expectedEvents);

// Mock only external dependencies
const mockEventService = createEventServiceMock();

// Test user-visible behavior
await page.click('[data-testid="filter-button"]');
await expect(page.locator('[data-testid="event-count"]')).toContainText('5');

// Test stores with mocked dependencies
const eventStore = new EventStore(mockEventService);
```

## CI/CD Integration

### **Test Execution Order**
1. **Lint & TypeCheck** (fast feedback)
2. **Unit Tests** (parallel execution)
3. **Integration Tests** (after unit tests pass)
4. **E2E Tests** (final validation, longest running)

### **Performance Targets**
- Unit tests: < 30 seconds total
- Integration tests: < 2 minutes total
- E2E tests: < 10 minutes total
- Coverage generation: < 1 minute

### **Branch Protection**
- All tests must pass before merge
- Coverage threshold must be met
- E2E tests run on staging environment

## Quick Commands Reference

```bash
# Unit tests
npm test                    # Run all unit tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report

# E2E tests (when implemented)
npm run e2e                # Run all E2E tests
npm run e2e:headed         # Run with browser UI
npm run e2e:mobile         # Run mobile-specific tests

# Combined
npm run test:all           # Run unit + integration + E2E
npm run test:ci            # CI-optimized test run
```

---

> **Remember**: This strategy should evolve with the project. When patterns aren't working, update this document and communicate changes to the team.