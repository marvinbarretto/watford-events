/**
 * String similarity utilities for fuzzy matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param a First string
 * @param b Second string
 * @returns Number of character changes needed to transform a into b
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1 scale)
 * @param a First string
 * @param b Second string
 * @returns Similarity score where 1 = identical, 0 = completely different
 */
export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLength = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  
  return 1 - (distance / maxLength);
}

/**
 * Find the best match from a list of strings
 * @param query The string to match against
 * @param candidates Array of strings to search through
 * @param threshold Minimum similarity score to consider a match (default: 0.6)
 * @returns Best match with similarity score, or null if no match above threshold
 */
export function findBestMatch(
  query: string, 
  candidates: string[], 
  threshold: number = 0.6
): { match: string; similarity: number } | null {
  if (!query || candidates.length === 0) return null;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const similarity = calculateSimilarity(query, candidate);
    if (similarity > bestScore && similarity >= threshold) {
      bestMatch = candidate;
      bestScore = similarity;
    }
  }

  return bestMatch ? { match: bestMatch, similarity: bestScore } : null;
}

/**
 * Find all matches above a threshold, sorted by similarity
 * @param query The string to match against
 * @param candidates Array of strings to search through
 * @param threshold Minimum similarity score to consider a match (default: 0.6)
 * @returns Array of matches sorted by similarity score (highest first)
 */
export function findSimilarMatches(
  query: string,
  candidates: string[],
  threshold: number = 0.6
): Array<{ match: string; similarity: number }> {
  if (!query || candidates.length === 0) return [];

  const matches: Array<{ match: string; similarity: number }> = [];

  for (const candidate of candidates) {
    const similarity = calculateSimilarity(query, candidate);
    if (similarity >= threshold) {
      matches.push({ match: candidate, similarity });
    }
  }

  // Sort by similarity score (highest first)
  return matches.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Check if a string is likely a partial match (starts with or contains query)
 * @param query The search query
 * @param target The target string to check
 * @returns True if target contains query as a substring
 */
export function isPartialMatch(query: string, target: string): boolean {
  if (!query || !target) return false;
  return target.toLowerCase().includes(query.toLowerCase());
}