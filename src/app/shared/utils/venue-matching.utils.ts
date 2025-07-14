/**
 * Venue Matching Utilities
 * 
 * Collection of pure functions for fuzzy matching venue names and locations.
 * Handles various name variations and partial matches.
 */

import { Venue } from '../../venues/utils/venue.model';
import { normalizeLocationText } from './text-processing.utils';

/**
 * Result of venue matching operation
 */
export interface VenueMatchResult {
  venue: Venue | null;
  score: number;        // 0-100, higher is better match
  matchType: 'exact' | 'partial' | 'fuzzy' | 'keyword' | 'none';
  matchedField: 'name' | 'address' | 'both' | 'none';
}

/**
 * Finds the best matching venue from a list based on input text
 * Uses multiple matching strategies and returns the highest scoring match
 * 
 * @param input - Input venue name/location text
 * @param venues - Array of venues to search against
 * @param threshold - Minimum score threshold (default: 60)
 * @returns Best match result or null if no good match found
 * 
 * @example
 * findBestVenueMatch('Pump House Theatre & Arts Centre', venues)
 * // Returns: { venue: pumpHouseVenue, score: 95, matchType: 'partial', matchedField: 'name' }
 */
export function findBestVenueMatch(
  input: string, 
  venues: Venue[], 
  threshold: number = 60
): VenueMatchResult {
  if (!input || !venues || venues.length === 0) {
    return createEmptyMatch();
  }

  const normalizedInput = normalizeVenueName(input);
  const matches: VenueMatchResult[] = [];

  for (const venue of venues) {
    const nameMatch = matchVenueByName(normalizedInput, venue);
    const addressMatch = matchVenueByAddress(normalizedInput, venue);
    
    // Take the best match between name and address
    const bestMatch = nameMatch.score > addressMatch.score ? nameMatch : addressMatch;
    
    if (bestMatch.score >= threshold) {
      matches.push(bestMatch);
    }
  }

  // Return the highest scoring match
  matches.sort((a, b) => b.score - a.score);
  return matches[0] || createEmptyMatch();
}

/**
 * Matches venue by name using various strategies
 * 
 * @param input - Normalized input text
 * @param venue - Venue to match against
 * @returns Match result for venue name
 */
export function matchVenueByName(input: string, venue: Venue): VenueMatchResult {
  const venueName = normalizeVenueName(venue.name);
  
  // Exact match
  if (input === venueName) {
    return {
      venue,
      score: 100,
      matchType: 'exact',
      matchedField: 'name'
    };
  }

  // Partial match (one contains the other)
  if (input.includes(venueName) || venueName.includes(input)) {
    const score = calculatePartialMatchScore(input, venueName);
    return {
      venue,
      score,
      matchType: 'partial',
      matchedField: 'name'
    };
  }

  // Keyword-based match
  const keywordScore = calculateKeywordMatchScore(input, venueName);
  if (keywordScore > 0) {
    return {
      venue,
      score: keywordScore,
      matchType: 'keyword',
      matchedField: 'name'
    };
  }

  // Fuzzy string similarity
  const fuzzyScore = calculateSimilarity(input, venueName);
  if (fuzzyScore > 0) {
    return {
      venue,
      score: fuzzyScore,
      matchType: 'fuzzy',
      matchedField: 'name'
    };
  }

  return createEmptyMatch();
}

/**
 * Matches venue by address
 * 
 * @param input - Normalized input text
 * @param venue - Venue to match against
 * @returns Match result for venue address
 */
export function matchVenueByAddress(input: string, venue: Venue): VenueMatchResult {
  if (!venue.address) {
    return createEmptyMatch();
  }

  const venueAddress = normalizeVenueName(venue.address);
  
  // Check if input contains address keywords
  const addressKeywords = extractAddressKeywords(venueAddress);
  const inputKeywords = extractAddressKeywords(input);
  
  const commonKeywords = addressKeywords.filter(keyword => 
    inputKeywords.some(inputKeyword => 
      inputKeyword.includes(keyword) || keyword.includes(inputKeyword)
    )
  );

  if (commonKeywords.length > 0) {
    const score = Math.min(90, (commonKeywords.length / addressKeywords.length) * 100);
    return {
      venue,
      score,
      matchType: 'keyword',
      matchedField: 'address'
    };
  }

  return createEmptyMatch();
}

/**
 * Normalizes venue name for consistent matching
 * Removes common venue suffixes and normalizes text
 * 
 * @param name - Raw venue name
 * @returns Normalized venue name
 * 
 * @example
 * normalizeVenueName('PUMP HOUSE THEATRE & ARTS CENTRE')
 * // Returns: 'pump house theatre arts centre'
 */
export function normalizeVenueName(name: string): string {
  if (!name) return '';

  return normalizeLocationText(name)
    .toLowerCase()
    // Remove common venue type suffixes
    .replace(/\b(theatre|theater|centre|center|hall|club|pub|bar|restaurant|cafe|museum|gallery|stadium|arena|pavilion|complex)\b/g, '')
    // Remove "arts" when it's redundant
    .replace(/\barts\s+/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates string similarity using Levenshtein-like algorithm
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const distance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - distance) / longer.length) * 100);
}

/**
 * Extracts venue keywords for matching
 * 
 * @param text - Venue text to extract keywords from
 * @returns Array of significant keywords
 */
export function extractVenueKeywords(text: string): string[] {
  if (!text) return [];

  // Common words to ignore
  const stopWords = new Set([
    'the', 'and', 'or', 'of', 'at', 'in', 'on', 'a', 'an', 'is', 'are', 'was', 'were',
    'theatre', 'theater', 'centre', 'center', 'hall', 'club', 'pub', 'bar', 'arts'
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter(word => /^[a-z]+$/.test(word)); // Only alphabetic words
}

/**
 * Extracts keywords from address text
 * 
 * @param address - Address text
 * @returns Array of address keywords
 */
function extractAddressKeywords(address: string): string[] {
  if (!address) return [];

  // Address-specific stop words
  const addressStopWords = new Set([
    'street', 'st', 'road', 'rd', 'avenue', 'ave', 'lane', 'ln', 'drive', 'dr',
    'place', 'pl', 'close', 'way', 'court', 'ct', 'the', 'and', 'of'
  ]);

  return address
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 1 && !addressStopWords.has(word))
    .filter(word => /^[a-z0-9]+$/.test(word));
}

/**
 * Calculates score for partial matches
 * 
 * @param input - Input text
 * @param target - Target text
 * @returns Partial match score (0-95)
 */
function calculatePartialMatchScore(input: string, target: string): number {
  const longer = input.length > target.length ? input : target;
  const shorter = input.length > target.length ? target : input;
  
  // Higher score if the shorter string is a significant portion of the longer
  const ratio = shorter.length / longer.length;
  return Math.round(75 + (ratio * 20)); // 75-95 range
}

/**
 * Calculates keyword-based match score
 * 
 * @param input - Input text
 * @param target - Target text
 * @returns Keyword match score (0-85)
 */
function calculateKeywordMatchScore(input: string, target: string): number {
  const inputKeywords = extractVenueKeywords(input);
  const targetKeywords = extractVenueKeywords(target);
  
  if (inputKeywords.length === 0 || targetKeywords.length === 0) {
    return 0;
  }

  const commonKeywords = inputKeywords.filter(keyword => 
    targetKeywords.some(targetKeyword => 
      keyword.includes(targetKeyword) || targetKeyword.includes(keyword)
    )
  );

  if (commonKeywords.length === 0) return 0;

  // Score based on how many keywords match
  const ratio = commonKeywords.length / Math.max(inputKeywords.length, targetKeywords.length);
  return Math.round(60 + (ratio * 25)); // 60-85 range
}

/**
 * Calculates Levenshtein distance between two strings
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Creates an empty match result
 * 
 * @returns Empty match result
 */
function createEmptyMatch(): VenueMatchResult {
  return {
    venue: null,
    score: 0,
    matchType: 'none',
    matchedField: 'none'
  };
}