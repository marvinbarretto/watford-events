import { Component, input, output } from '@angular/core';

export type FilterOption = 'upcoming' | 'today' | 'tomorrow' | 'this-week' | 'this-month' | 'all';
export type UnitOption = 'today' | 'tomorrow' | 'this-week' | 'all';

export interface EventCounts {
  upcoming: number;
  today: number;
  tomorrow: number;
  thisWeek: number;
  thisMonth: number;
  all: number;
}

@Component({
  selector: 'app-event-filter',

  template: `
    <div class="event-filter">
      <div class="filter-header">
        <h3 class="filter-title">Filter Events</h3>
        @if (eventCounts(); as counts) {
          <span class="total-count">{{ counts.all }} total</span>
        }
      </div>

      <div class="filter-options">
        <button
          class="filter-option"
          [class.active]="activeFilter() === 'upcoming'"
          (click)="selectFilter('upcoming')"
        >
          <span class="option-label">Upcoming</span>
          @if (eventCounts(); as counts) {
            <span class="option-count">{{ counts.upcoming }}</span>
          }
        </button>

        <button
          class="filter-option"
          [class.active]="activeFilter() === 'today'"
          (click)="selectFilter('today')"
        >
          <span class="option-label">Today</span>
          @if (eventCounts(); as counts) {
            <span class="option-count">{{ counts.today }}</span>
          }
        </button>

        <button
          class="filter-option"
          [class.active]="activeFilter() === 'tomorrow'"
          (click)="selectFilter('tomorrow')"
        >
          <span class="option-label">Tomorrow</span>
          @if (eventCounts(); as counts) {
            <span class="option-count">{{ counts.tomorrow }}</span>
          }
        </button>

        <button
          class="filter-option"
          [class.active]="activeFilter() === 'this-week'"
          (click)="selectFilter('this-week')"
        >
          <span class="option-label">This Week</span>
          @if (eventCounts(); as counts) {
            <span class="option-count">{{ counts.thisWeek }}</span>
          }
        </button>

        <button
          class="filter-option"
          [class.active]="activeFilter() === 'this-month'"
          (click)="selectFilter('this-month')"
        >
          <span class="option-label">This Month</span>
          @if (eventCounts(); as counts) {
            <span class="option-count">{{ counts.thisMonth }}</span>
          }
        </button>

        <button
          class="filter-option"
          [class.active]="activeFilter() === 'all'"
          (click)="selectFilter('all')"
        >
          <span class="option-label">All Events</span>
          @if (eventCounts(); as counts) {
            <span class="option-count">{{ counts.all }}</span>
          }
        </button>
      </div>

      <div class="search-section">
        <input
          type="text"
          class="search-input"
          placeholder="Search events..."
          [value]="searchTerm()"
          (input)="onSearchInput($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .event-filter {
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .filter-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
    }

    .total-count {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .filter-options {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--background-lighter);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-secondary);
    }

    .filter-option:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .filter-option.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--on-primary);
    }

    .option-label {
      font-weight: 500;
    }

    .option-count {
      background: rgba(0, 0, 0, 0.1);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }

    .filter-option.active .option-count {
      background: rgba(255, 255, 255, 0.3);
    }

    .search-section {
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
      background: var(--background-lighter);
      color: var(--text);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    /* Mobile optimization */
    @media (max-width: 768px) {
      .event-filter {
        padding: 16px;
      }

      .filter-options {
        gap: 6px;
      }

      .filter-option {
        padding: 6px 12px;
        font-size: 13px;
      }

      .search-input {
        padding: 8px 12px;
        font-size: 16px; /* Prevent zoom on iOS */
      }
    }
  `]
})
export class EventFilterComponent {
  // Inputs
  readonly activeFilter = input<FilterOption>('upcoming');
  readonly eventCounts = input<EventCounts | null>(null);
  readonly searchTerm = input<string>('');

  // Outputs
  readonly filterChanged = output<FilterOption>();
  readonly searchChanged = output<string>();

  selectFilter(filter: FilterOption) {
    this.filterChanged.emit(filter);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target?.value !== undefined) {
      this.searchChanged.emit(target.value);
    }
  }
}
