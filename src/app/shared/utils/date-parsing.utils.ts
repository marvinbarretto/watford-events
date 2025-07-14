/**
 * Date and Time Parsing Utilities
 * 
 * Collection of pure functions for parsing natural language dates and times
 * from extracted text. Handles various formats and edge cases.
 */

/**
 * Result type for parsed date/time information
 */
export interface ParsedDateTime {
  date: string | null;      // ISO date format: YYYY-MM-DD
  startTime: string | null; // 24-hour time format: HH:MM
  endTime: string | null;   // 24-hour time format: HH:MM
  isAllDay: boolean;
  raw: string;              // Original input for debugging
}

/**
 * Parses natural language date/time text into structured format
 * Handles various formats including embedded times
 * 
 * @param input - Natural language date/time text
 * @returns Parsed date and time information
 * 
 * @example
 * parseNaturalDateTime('SUNDAY 20TH JULY 2025 - 3PM')
 * // Returns: { date: '2025-07-20', startTime: '15:00', endTime: null, isAllDay: false }
 */
export function parseNaturalDateTime(input: string): ParsedDateTime {
  if (!input || typeof input !== 'string') {
    return createEmptyDateTime(input);
  }

  const cleaned = input.trim();
  
  // Try to extract date and time separately
  const dateStr = extractDateFromText(cleaned);
  const timeInfo = extractTimeFromText(cleaned);

  return {
    date: dateStr,
    startTime: timeInfo.startTime,
    endTime: timeInfo.endTime,
    isAllDay: timeInfo.isAllDay,
    raw: input
  };
}

/**
 * Extracts date from natural language text
 * 
 * @param text - Text containing date information
 * @returns ISO date string (YYYY-MM-DD) or null
 * 
 * @example
 * extractDateFromText('Sunday 20th July 2025')
 * // Returns: '2025-07-20'
 */
export function extractDateFromText(text: string): string | null {
  if (!text) return null;

  // Remove common prefixes and clean text
  const cleaned = text
    .toLowerCase()
    .replace(/^(on\s+|date:\s*|when:\s*)/i, '')
    .trim();

  // Try different date patterns
  const patterns = [
    // "20th July 2025", "July 20 2025", "July 20, 2025"
    /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
    // "July 20 2025", "July 20, 2025"
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i,
    // ISO format "2025-07-20"
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // US format "07/20/2025", "7/20/2025"
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // UK format "20/07/2025"
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        const date = parseMatchedDate(match, pattern);
        if (date && isValidDate(date)) {
          return date;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

/**
 * Extracts time information from text
 * 
 * @param text - Text containing time information
 * @returns Time information object
 */
export function extractTimeFromText(text: string): {
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
} {
  if (!text) {
    return { startTime: null, endTime: null, isAllDay: false };
  }

  const cleaned = text.toLowerCase();

  // Check for "all day" indicators
  if (/\b(all day|all-day|whole day|entire day)\b/i.test(cleaned)) {
    return { startTime: null, endTime: null, isAllDay: true };
  }

  // Time patterns with various formats
  const timePatterns = [
    // "3PM", "3 PM", "15:00", "3:30PM"
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi,
    // 24-hour format "15:00", "15:30"
    /\b(\d{1,2}):(\d{2})\b/g,
    // Hour only "3", "15" (when followed by time indicators)
    /\b(\d{1,2})\s*(?:o'?clock|hours?)\b/gi
  ];

  const times: string[] = [];
  
  for (const pattern of timePatterns) {
    let match;
    while ((match = pattern.exec(cleaned)) !== null) {
      const timeStr = parseTimeMatch(match);
      if (timeStr) {
        times.push(timeStr);
      }
    }
  }

  // Sort times and determine start/end
  const sortedTimes = times.sort();
  
  return {
    startTime: sortedTimes[0] || null,
    endTime: sortedTimes[1] || null,
    isAllDay: times.length === 0 && !/\d/.test(cleaned)
  };
}

/**
 * Validates if a date string represents a valid date
 * 
 * @param dateString - Date string to validate
 * @returns True if valid date
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900;
}

/**
 * Standardizes date format to ISO (YYYY-MM-DD)
 * 
 * @param input - Date in various formats
 * @returns ISO date string or null
 */
export function standardizeDateFormat(input: string): string | null {
  if (!input) return null;
  
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// Helper functions

function createEmptyDateTime(raw: string): ParsedDateTime {
  return {
    date: null,
    startTime: null,
    endTime: null,
    isAllDay: false,
    raw: raw || ''
  };
}

function parseMatchedDate(match: RegExpMatchArray, pattern: RegExp): string | null {
  const patternStr = pattern.toString();
  
  // Handle different pattern types
  if (patternStr.includes('january|february')) {
    // Month name patterns
    if (match[2] && match[1] && match[3]) {
      // "20th July 2025" format
      const day = parseInt(match[1]);
      const month = getMonthNumber(match[2]);
      const year = parseInt(match[3]);
      return formatDate(year, month, day);
    } else if (match[1] && match[2] && match[3]) {
      // "July 20 2025" format
      const month = getMonthNumber(match[1]);
      const day = parseInt(match[2]);
      const year = parseInt(match[3]);
      return formatDate(year, month, day);
    }
  } else if (patternStr.includes('(\\d{4})-(\\d{1,2})-(\\d{1,2})')) {
    // ISO format
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  } else if (patternStr.includes('(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})')) {
    // Slash format - assume MM/DD/YYYY for US, DD/MM/YYYY for UK
    const year = parseInt(match[3]);
    const first = parseInt(match[1]);
    const second = parseInt(match[2]);
    
    // If first number > 12, it's likely DD/MM/YYYY
    if (first > 12) {
      return formatDate(year, second, first);
    } else {
      return formatDate(year, first, second);
    }
  }
  
  return null;
}

function getMonthNumber(monthName: string): number {
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  return months[monthName.toLowerCase() as keyof typeof months] || 1;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function parseTimeMatch(match: RegExpMatchArray): string | null {
  const hour = parseInt(match[1]);
  const minute = parseInt(match[2] || '0');
  const period = match[3]?.toLowerCase();
  
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  
  let adjustedHour = hour;
  
  if (period) {
    if (period === 'pm' && hour !== 12) {
      adjustedHour = hour + 12;
    } else if (period === 'am' && hour === 12) {
      adjustedHour = 0;
    }
  }
  
  if (adjustedHour > 23) return null;
  
  return `${adjustedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}