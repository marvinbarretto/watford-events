/**
 * Text Processing Utilities
 * 
 * Collection of pure functions for text normalization, capitalization,
 * and formatting. Each function has a single responsibility and is easily testable.
 */

/**
 * Normalizes text that is in ALL CAPS to proper title case
 * Handles special cases and preserves intentional capitalization
 * 
 * @param text - Input text that may be in all caps
 * @returns Normalized text in proper case
 * 
 * @example
 * normalizeCapitalization('WRESTLING FRINGE FAMILY FRIENDLY') 
 * // Returns: 'Wrestling Fringe Family Friendly'
 */
export function normalizeCapitalization(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const trimmed = text.trim();
  
  // If text is all caps, convert to title case
  if (trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
    return toTitleCase(trimmed);
  }
  
  // If text has mixed case or is all lowercase, return as-is
  return trimmed;
}

/**
 * Converts text to proper title case
 * Handles articles, prepositions, and conjunctions appropriately
 * 
 * @param text - Input text to convert
 * @returns Text in title case
 * 
 * @example
 * toTitleCase('the lord of the rings')
 * // Returns: 'The Lord of the Rings'
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Words that should remain lowercase unless at start/end
  const lowercaseWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 
    'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with'
  ]);

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index, array) => {
      // Always capitalize first and last words
      if (index === 0 || index === array.length - 1) {
        return capitalizeFirstLetter(word);
      }
      
      // Keep articles/prepositions lowercase unless they're important
      if (lowercaseWords.has(word)) {
        return word;
      }
      
      return capitalizeFirstLetter(word);
    })
    .join(' ');
}

/**
 * Capitalizes the first letter of a word
 * 
 * @param word - Word to capitalize
 * @returns Word with first letter capitalized
 */
function capitalizeFirstLetter(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Removes extra whitespace from text
 * Collapses multiple spaces into single spaces and trims
 * 
 * @param text - Input text with potential extra whitespace
 * @returns Clean text with normalized spacing
 * 
 * @example
 * cleanExtraWhitespace('  hello    world  ')
 * // Returns: 'hello world'
 */
export function cleanExtraWhitespace(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple whitespace with single space
}

/**
 * Removes common punctuation that might interfere with parsing
 * Preserves important punctuation like periods in abbreviations
 * 
 * @param text - Input text with punctuation
 * @returns Text with unnecessary punctuation removed
 * 
 * @example
 * removePunctuation('Event!!! - Amazing!!!')
 * // Returns: 'Event - Amazing'
 */
export function removePunctuation(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove excessive exclamation marks and question marks
    .replace(/[!]{2,}/g, '')
    .replace(/[?]{2,}/g, '')
    // Remove quotation marks (but preserve apostrophes)
    .replace(/["""]/g, '')
    // Remove single quotes at word boundaries (quotation marks) but keep apostrophes
    .replace(/\b'\b/g, '') // Remove standalone single quotes
    .replace(/^'|'$/g, '') // Remove single quotes at start/end of string
    // Remove excessive periods (but preserve single periods)
    .replace(/\.{2,}/g, '')
    // Clean up any resulting extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes event title text by applying all cleaning functions
 * This is a convenience function that applies the most common normalizations
 * 
 * @param title - Raw event title
 * @returns Cleaned and normalized event title
 * 
 * @example
 * normalizeEventTitle('WRESTLING FRINGE FAMILY FRIENDLY WRESTLING!!!')
 * // Returns: 'Wrestling Fringe Family Friendly Wrestling'
 */
export function normalizeEventTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  // First remove punctuation, then normalize case
  let normalized = cleanExtraWhitespace(removePunctuation(title.trim()));
  
  // For event titles, always convert to title case if all caps or all lowercase
  if (normalized === normalized.toUpperCase() || normalized === normalized.toLowerCase()) {
    normalized = toTitleCase(normalized);
  }

  return normalized;
}

/**
 * Normalizes location/venue text for better matching
 * Removes common venue suffixes and normalizes formatting
 * 
 * @param location - Raw location text
 * @returns Normalized location text
 * 
 * @example
 * normalizeLocationText('PUMP HOUSE THEATRE & ARTS CENTRE')
 * // Returns: 'Pump House Theatre Arts Centre'
 */
export function normalizeLocationText(location: string): string {
  if (!location || typeof location !== 'string') {
    return '';
  }

  let normalized = location.trim();
  
  // For locations, always convert to title case if all caps or all lowercase
  if (normalized === normalized.toUpperCase() || normalized === normalized.toLowerCase()) {
    normalized = toTitleCase(normalized);
  }

  return cleanExtraWhitespace(
    normalized
      // Normalize common separators
      .replace(/\s*&\s*/g, ' ')
      .replace(/\s*\+\s*/g, ' ')
      // Remove common suffixes that might vary
      .replace(/\b(ltd|limited|inc|incorporated|llc|plc)\b\.?/gi, '')
  );
}