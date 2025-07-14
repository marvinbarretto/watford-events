/**
 * Unit Tests for Date Parsing Utilities
 * 
 * Test suite covering date/time parsing functions with the wrestling event
 * test case and various other real-world scenarios.
 */

import {
  parseNaturalDateTime,
  extractDateFromText,
  extractTimeFromText,
  isValidDate,
  standardizeDateFormat
} from './date-parsing.utils';

describe('Date Parsing Utilities', () => {

  describe('parseNaturalDateTime', () => {
    it('should parse the wrestling event test case', () => {
      const result = parseNaturalDateTime('SUNDAY 20TH JULY 2025 - 3PM');
      
      expect(result.date).toBe('2025-07-20');
      expect(result.startTime).toBe('15:00');
      expect(result.endTime).toBeNull();
      expect(result.isAllDay).toBe(false);
      expect(result.raw).toBe('SUNDAY 20TH JULY 2025 - 3PM');
    });

    it('should handle all day events', () => {
      const result = parseNaturalDateTime('Saturday July 20 2025 - All day');
      
      expect(result.date).toBe('2025-07-20');
      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.isAllDay).toBe(true);
    });

    it('should handle time ranges', () => {
      const result = parseNaturalDateTime('July 20 2025 from 2PM to 5PM');
      
      expect(result.date).toBe('2025-07-20');
      expect(result.startTime).toBe('14:00');
      expect(result.endTime).toBe('17:00');
      expect(result.isAllDay).toBe(false);
    });

    it('should handle empty input', () => {
      const result = parseNaturalDateTime('');
      
      expect(result.date).toBeNull();
      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.isAllDay).toBe(false);
    });

    it('should handle invalid input', () => {
      const result = parseNaturalDateTime('not a date');
      
      expect(result.date).toBeNull();
      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.isAllDay).toBe(false);
    });
  });

  describe('extractDateFromText', () => {
    it('should extract date from wrestling event format', () => {
      expect(extractDateFromText('SUNDAY 20TH JULY 2025 - 3PM'))
        .toBe('2025-07-20');
    });

    it('should handle various date formats', () => {
      const testCases = [
        { input: '20th July 2025', expected: '2025-07-20' },
        { input: 'July 20 2025', expected: '2025-07-20' },
        { input: 'July 20, 2025', expected: '2025-07-20' },
        { input: '2025-07-20', expected: '2025-07-20' },
        { input: '07/20/2025', expected: '2025-07-20' },
        { input: '20/07/2025', expected: '2025-07-20' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(extractDateFromText(input)).toBe(expected);
      });
    });

    it('should handle month names case insensitively', () => {
      expect(extractDateFromText('20TH JULY 2025')).toBe('2025-07-20');
      expect(extractDateFromText('20th july 2025')).toBe('2025-07-20');
      expect(extractDateFromText('20th July 2025')).toBe('2025-07-20');
    });

    it('should handle ordinal numbers', () => {
      const testCases = [
        '1st July 2025',
        '2nd July 2025', 
        '3rd July 2025',
        '4th July 2025',
        '21st July 2025',
        '22nd July 2025',
        '23rd July 2025'
      ];

      testCases.forEach(input => {
        const result = extractDateFromText(input);
        expect(result).toMatch(/^2025-07-\d{2}$/);
      });
    });

    it('should return null for invalid dates', () => {
      expect(extractDateFromText('not a date')).toBeNull();
      expect(extractDateFromText('')).toBeNull();
      expect(extractDateFromText('32nd July 2025')).toBeNull();
    });

    it('should handle prefixes', () => {
      expect(extractDateFromText('Date: July 20 2025')).toBe('2025-07-20');
      expect(extractDateFromText('When: July 20 2025')).toBe('2025-07-20');
      expect(extractDateFromText('On July 20 2025')).toBe('2025-07-20');
    });
  });

  describe('extractTimeFromText', () => {
    it('should extract time from wrestling event format', () => {
      const result = extractTimeFromText('SUNDAY 20TH JULY 2025 - 3PM');
      
      expect(result.startTime).toBe('15:00');
      expect(result.endTime).toBeNull();
      expect(result.isAllDay).toBe(false);
    });

    it('should handle various time formats', () => {
      const testCases = [
        { input: '3PM', expected: '15:00' },
        { input: '3 PM', expected: '15:00' },
        { input: '3:30PM', expected: '15:30' },
        { input: '15:00', expected: '15:00' },
        { input: '15:30', expected: '15:30' },
        { input: '9AM', expected: '09:00' },
        { input: '12PM', expected: '12:00' },
        { input: '12AM', expected: '00:00' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = extractTimeFromText(input);
        expect(result.startTime).toBe(expected);
      });
    });

    it('should handle time ranges', () => {
      const result = extractTimeFromText('2PM to 5PM');
      expect(result.startTime).toBe('14:00');
      expect(result.endTime).toBe('17:00');
    });

    it('should detect all day events', () => {
      const testCases = [
        'all day event',
        'all-day festival',
        'whole day workshop',
        'entire day conference'
      ];

      testCases.forEach(input => {
        const result = extractTimeFromText(input);
        expect(result.isAllDay).toBe(true);
        expect(result.startTime).toBeNull();
        expect(result.endTime).toBeNull();
      });
    });

    it('should handle no time specified', () => {
      const result = extractTimeFromText('Just a date with no time');
      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.isAllDay).toBe(false);
    });

    it('should handle multiple times and sort them', () => {
      const result = extractTimeFromText('Event from 5PM to 2PM');
      expect(result.startTime).toBe('14:00'); // Earlier time becomes start
      expect(result.endTime).toBe('17:00');   // Later time becomes end
    });
  });

  describe('isValidDate', () => {
    it('should validate correct ISO dates', () => {
      expect(isValidDate('2025-07-20')).toBe(true);
      expect(isValidDate('2025-12-31')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('2025-13-20')).toBe(false); // Invalid month
      expect(isValidDate('2025-07-32')).toBe(false); // Invalid day
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('1800-01-01')).toBe(false); // Too old
    });

    it('should handle various date formats', () => {
      expect(isValidDate('July 20, 2025')).toBe(true);
      expect(isValidDate('07/20/2025')).toBe(true);
      expect(isValidDate('2025/07/20')).toBe(true);
    });
  });

  describe('standardizeDateFormat', () => {
    it('should convert various formats to ISO', () => {
      const testCases = [
        { input: 'July 20, 2025', expected: '2025-07-20' },
        { input: '07/20/2025', expected: '2025-07-20' },
        { input: '2025-07-20', expected: '2025-07-20' },
        { input: 'Jul 20 2025', expected: '2025-07-20' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(standardizeDateFormat(input)).toBe(expected);
      });
    });

    it('should return null for invalid input', () => {
      expect(standardizeDateFormat('not a date')).toBeNull();
      expect(standardizeDateFormat('')).toBeNull();
      expect(standardizeDateFormat('invalid')).toBeNull();
    });

    it('should handle null and undefined', () => {
      expect(standardizeDateFormat(null as any)).toBeNull();
      expect(standardizeDateFormat(undefined as any)).toBeNull();
    });
  });

  describe('Real-world test cases', () => {
    it('should handle complex wrestling event scenarios', () => {
      const testCases = [
        {
          input: 'SUNDAY 20TH JULY 2025 - 3PM',
          expectedDate: '2025-07-20',
          expectedTime: '15:00'
        },
        {
          input: 'Saturday evening July 19th 2025 at 7:30PM',
          expectedDate: '2025-07-19',
          expectedTime: '19:30'
        },
        {
          input: 'July 21 2025 all day wrestling festival',
          expectedDate: '2025-07-21',
          expectedTime: null,
          isAllDay: true
        }
      ];

      testCases.forEach(({ input, expectedDate, expectedTime, isAllDay = false }) => {
        const result = parseNaturalDateTime(input);
        expect(result.date).toBe(expectedDate);
        expect(result.startTime).toBe(expectedTime);
        expect(result.isAllDay).toBe(isAllDay);
      });
    });

    it('should handle common event description patterns', () => {
      const testCases = [
        'Event on December 25th 2025 from 2-4PM',
        'New Year party Jan 1st 2026 starting at 10PM',
        'Summer festival June 15 2025 all day',
        'Workshop Thursday March 20th 2025 9AM-5PM'
      ];

      testCases.forEach(input => {
        const result = parseNaturalDateTime(input);
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Should extract some meaningful information
        expect(result.date || result.startTime || result.isAllDay).toBeTruthy();
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        'Date: undefined',
        'Time: null',
        '---',
        '13:70', // Invalid time
        'February 30 2025' // Invalid date
      ];

      malformedInputs.forEach(input => {
        expect(() => parseNaturalDateTime(input)).not.toThrow();
        const result = parseNaturalDateTime(input);
        expect(result.raw).toBe(input);
      });
    });

    it('should handle very long strings', () => {
      const longInput = 'Event on July 20 2025 at 3PM with a very long description '.repeat(100);
      const result = parseNaturalDateTime(longInput);
      expect(result.date).toBe('2025-07-20');
      expect(result.startTime).toBe('15:00');
    });

    it('should handle empty and whitespace strings', () => {
      const emptyInputs = ['', '   ', '\n\t', null, undefined];
      
      emptyInputs.forEach(input => {
        const result = parseNaturalDateTime(input as any);
        expect(result.date).toBeNull();
        expect(result.startTime).toBeNull();
        expect(result.endTime).toBeNull();
        expect(result.isAllDay).toBe(false);
      });
    });
  });
});