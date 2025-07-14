import { 
  levenshteinDistance, 
  calculateSimilarity, 
  findBestMatch, 
  findSimilarMatches,
  isPartialMatch 
} from './string-similarity.utils';

describe('String Similarity Utils', () => {
  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('should return the length of the second string when first is empty', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
    });

    it('should return the length of the first string when second is empty', () => {
      expect(levenshteinDistance('hello', '')).toBe(5);
    });

    it('should calculate distance for different strings', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('Globe', 'Global')).toBe(2);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1);
    });

    it('should return 0 for one empty string', () => {
      expect(calculateSimilarity('', 'hello')).toBe(0);
      expect(calculateSimilarity('hello', '')).toBe(0);
    });

    it('should return similarity between 0 and 1', () => {
      const similarity = calculateSimilarity('Globe Theatre', 'Globe Theater');
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1);
    });

    it('should be case insensitive', () => {
      expect(calculateSimilarity('HELLO', 'hello')).toBe(1);
      expect(calculateSimilarity('Globe', 'globe')).toBe(1);
    });
  });

  describe('findBestMatch', () => {
    const venues = [
      'The Globe Theatre',
      'Watford Palace Theatre',
      'The Horns',
      'Cassiobury Park',
      'Vicarage Road Stadium'
    ];

    it('should find exact match', () => {
      const result = findBestMatch('The Globe Theatre', venues);
      expect(result).toEqual({
        match: 'The Globe Theatre',
        similarity: 1
      });
    });

    it('should find close match', () => {
      const result = findBestMatch('Globe Theater', venues);
      expect(result).toBeTruthy();
      expect(result?.match).toBe('The Globe Theatre');
      expect(result?.similarity).toBeGreaterThan(0.6);
    });

    it('should return null for no matches above threshold', () => {
      const result = findBestMatch('Random Place', venues);
      expect(result).toBeNull();
    });

    it('should return null for empty query', () => {
      const result = findBestMatch('', venues);
      expect(result).toBeNull();
    });
  });

  describe('findSimilarMatches', () => {
    const venues = [
      'The Globe Theatre',
      'Globe Cinema',
      'Watford Palace Theatre',
      'The Horns'
    ];

    it('should find multiple matches sorted by similarity', () => {
      const results = findSimilarMatches('Globe', venues, 0.5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1]?.similarity || 0);
    });

    it('should filter by threshold', () => {
      const results = findSimilarMatches('Globe', venues, 0.9);
      expect(results.every(r => r.similarity >= 0.9)).toBe(true);
    });
  });

  describe('isPartialMatch', () => {
    it('should return true for substring matches', () => {
      expect(isPartialMatch('Globe', 'The Globe Theatre')).toBe(true);
      expect(isPartialMatch('theatre', 'The Globe Theatre')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isPartialMatch('GLOBE', 'The Globe Theatre')).toBe(true);
      expect(isPartialMatch('globe', 'THE GLOBE THEATRE')).toBe(true);
    });

    it('should return false for non-matches', () => {
      expect(isPartialMatch('Stadium', 'The Globe Theatre')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isPartialMatch('', 'The Globe Theatre')).toBe(false);
      expect(isPartialMatch('Globe', '')).toBe(false);
    });
  });
});