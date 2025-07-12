import { Component, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-date-box',
  imports: [DatePipe],
  template: `
    <div class="date-box" [class.has-month]="showMonth()">
      <div class="day-of-week">{{ dayOfWeekText() }}</div>
      <div class="day-number">{{ dayText() }}</div>
      @if (showMonth()) {
        <div class="month-text">{{ monthText() }}</div>
      }
    </div>
  `,
  styles: [`
    .date-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      min-width: 3.5rem;
      text-align: center;
      background: var(--background-lighter);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .date-box.has-month {
      padding: 0.375rem 0.5rem;
    }

    .day-of-week {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      line-height: 1;
    }

    .day-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
      margin-top: 0.125rem;
    }

    .month-text {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-top: 0.125rem;
      line-height: 1;
    }
  `]
})
export class DateBoxComponent {
  readonly date = input.required<Date>();

  private readonly datePipe = new DatePipe('en-US');

  readonly showMonth = computed(() => {
    const eventDate = this.date();
    const now = new Date();

    // Show month if event is NOT in the current month or year
    return eventDate.getMonth() !== now.getMonth() ||
           eventDate.getFullYear() !== now.getFullYear();
  });

  readonly dayOfWeekText = computed(() => {
    return this.datePipe.transform(this.date(), 'EEE') || '';
  });

  readonly dayText = computed(() => {
    return this.datePipe.transform(this.date(), 'd') || '';
  });

  readonly monthText = computed(() => {
    return this.datePipe.transform(this.date(), 'MMM') || '';
  });
}
