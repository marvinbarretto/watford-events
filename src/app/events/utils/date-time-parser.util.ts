/**
 * Date/Time Parsing Utilities
 * 
 * Helper functions for parsing natural language dates and times
 * from LLM responses into structured date/time formats
 */

export interface ParsedDateTime {
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
}

/**
 * Parse natural language date/time strings into structured format
 * Handles common formats like:
 * - "Sunday 20th July 2025, 3 PM"
 * - "July 20, 2025 3 PM"
 * - "20 July 2025 3 PM"
 */
export function parseEventDateTime(dateString: string): ParsedDateTime | null {
  try {
    console.log('🔍 [parseEventDateTime] Input:', dateString);
    
    // Handle common natural language date formats
    let normalizedDate = dateString.toLowerCase()
      .replace(/(\d+)(st|nd|rd|th)/g, '$1') // Remove ordinal suffixes
      .replace(/sunday|monday|tuesday|wednesday|thursday|friday|saturday/g, '') // Remove day names
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log('🔍 [parseEventDateTime] Normalized:', normalizedDate);

    // Try to parse common formats
    let date: Date | null = null;

    // Format: "20 July 2025, 3 PM" or "20 July 2025 3 PM"
    const match1 = normalizedDate.match(/(\d{1,2})\s+(\w+)\s+(\d{4})[,\s]+(\d{1,2})\s*(pm|am)/i);
    console.log('🔍 [parseEventDateTime] Match1 attempt:', match1);
    if (match1) {
      date = parseFormat1(match1);
      if (date) console.log('🔍 [parseEventDateTime] Match1 created date:', date);
    }

    // Format: "July 20 2025 3 PM" or "July 20, 2025 3 PM"
    const match2 = normalizedDate.match(/(\w+)\s+(\d{1,2})[,\s]+(\d{4})[,\s]+(\d{1,2})\s*(pm|am)/i);
    if (!date && match2) {
      date = parseFormat2(match2);
      if (date) console.log('🔍 [parseEventDateTime] Match2 created date:', date);
    }

    // Fallback to native Date parsing
    if (!date) {
      date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('❌ [parseEventDateTime] All parsing attempts failed');
        return null;
      }
      console.log('🔍 [parseEventDateTime] Fallback parsing successful:', date);
    }

    // Convert to separate date and time formats
    const result = formatDateTime(date);
    console.log('✅ [parseEventDateTime] Final result:', result);
    return result;

  } catch (error) {
    console.error('❌ [parseEventDateTime] Error:', error);
    return null;
  }
}

/**
 * Parse format: "20 July 2025, 3 PM"
 */
function parseFormat1(match: RegExpMatchArray): Date | null {
  const [, day, month, year, hour, ampm] = match;
  console.log('🔍 [parseFormat1] Parts:', { day, month, year, hour, ampm });
  
  const monthIndex = getMonthIndex(month);
  if (monthIndex === -1) return null;

  const hour24 = convertTo24Hour(parseInt(hour), ampm);
  return new Date(parseInt(year), monthIndex, parseInt(day), hour24, 0);
}

/**
 * Parse format: "July 20, 2025 3 PM"
 */
function parseFormat2(match: RegExpMatchArray): Date | null {
  const [, month, day, year, hour, ampm] = match;
  console.log('🔍 [parseFormat2] Parts:', { month, day, year, hour, ampm });
  
  const monthIndex = getMonthIndex(month);
  if (monthIndex === -1) return null;

  const hour24 = convertTo24Hour(parseInt(hour), ampm);
  return new Date(parseInt(year), monthIndex, parseInt(day), hour24, 0);
}

/**
 * Get month index from month name
 */
function getMonthIndex(monthName: string): number {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return monthNames.findIndex(m => m.startsWith(monthName.toLowerCase()));
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(hour: number, ampm: string): number {
  let hour24 = hour;
  if (ampm.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
  if (ampm.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
  return hour24;
}

/**
 * Format Date object into structured date/time strings
 */
function formatDateTime(date: Date): ParsedDateTime {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Additional utility: Check if a date string is likely to be parseable
 */
export function isLikelyDateTime(dateString: string): boolean {
  if (!dateString || dateString === 'Not found') return false;
  
  // Check for common date indicators
  const hasDateIndicators = /\d{1,2}.*\d{4}/.test(dateString) || // day and year
                           /january|february|march|april|may|june|july|august|september|october|november|december/i.test(dateString) || // month names
                           /\d{1,2}\s*(am|pm)/i.test(dateString); // time with AM/PM
  
  return hasDateIndicators;
}

/**
 * Additional utility: Extract time portion from a date string
 */
export function extractTimeFromString(dateString: string): string | null {
  const timeMatch = dateString.match(/(\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    const [, hour, ampm] = timeMatch;
    const hour24 = convertTo24Hour(parseInt(hour), ampm);
    return `${String(hour24).padStart(2, '0')}:00`;
  }
  return null;
}