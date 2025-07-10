import { Timestamp } from "firebase/firestore";

export function earliest(a?: Timestamp, b?: Date): Timestamp {
  if (!a && !b) throw new Error('Both dates are undefined');
  if (!a) return Timestamp.fromDate(b!);
  if (!b) return a;
  return a.toDate() < b ? a : Timestamp.fromDate(b);
}

export function latest(a?: Timestamp, b?: Date): Timestamp {
  if (!a && !b) throw new Error('Both dates are undefined');
  if (!a) return Timestamp.fromDate(b!);
  if (!b) return a;
  return a.toDate() > b ? a : Timestamp.fromDate(b);
}

/**
 * Converts various date formats to a JavaScript Date object
 * Handles:
 * - Firestore Timestamps ({seconds: number, nanoseconds: number})
 * - JavaScript Date objects
 * - Date strings
 * - Any other format that Date constructor can handle
 */
export function convertToDate(dateValue: any): Date {
  try {
    // Already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // String date
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    
    // Firestore Timestamp object
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      // Firestore Timestamp has seconds and nanoseconds
      return new Date(dateValue.seconds * 1000);
    }
    
    // Fallback: attempt direct conversion
    return new Date(dateValue);
  } catch (error) {
    console.error('❌ Date conversion failed:', error, 'Input:', dateValue);
    // Return current date as fallback
    return new Date();
  }
}

/**
 * Gets the start of day for a given date (00:00:00.000)
 */
export function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Gets the end of day for a given date (23:59:59.999)
 */
export function getEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Calculates relative time from now (Today, Tomorrow, In X days, etc.)
 */
export function getRelativeTime(date: Date): string | null {
  const now = new Date();
  const today = getStartOfDay(now);
  const eventDay = getStartOfDay(date);
  
  const diffTime = eventDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `In ${diffDays} days`;
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays < -1 && diffDays >= -7) {
    return `${Math.abs(diffDays)} days ago`;
  } else {
    return null;
  }
}

/**
 * Checks if a date is within a range (inclusive)
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const dateTime = date.getTime();
  return dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
}

/**
 * Gets the date range for "this week" (today + next 7 days)
 */
export function getThisWeekRange(): { start: Date; end: Date } {
  const today = getStartOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  
  return {
    start: today,
    end: getEndOfDay(weekEnd)
  };
}

/**
 * Gets the date range for "this month" (rest of current month)
 */
export function getThisMonthRange(): { start: Date; end: Date } {
  const today = getStartOfDay(new Date());
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    start: today,
    end: getEndOfDay(monthEnd)
  };
}
