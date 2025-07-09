/**
 * URL pattern matching system for site-specific configurations
 */

import { SiteMatcher } from './types';

export class SiteMatcherService {
  private matchers: SiteMatcher[] = [
    // News sites
    { pattern: '*.bbc.co.uk/news/*', configName: 'bbc-news', priority: 10 },
    { pattern: '*.bbc.com/news/*', configName: 'bbc-news', priority: 10 },
    { pattern: '*.theguardian.com/*/*', configName: 'guardian-article', priority: 10 },
    { pattern: '*.reuters.com/*/article/*', configName: 'reuters-article', priority: 10 },
    
    // Social media
    { pattern: '*.reddit.com/r/*/comments/*', configName: 'reddit-post', priority: 8 },
    { pattern: '*.linkedin.com/pulse/*', configName: 'linkedin-article', priority: 8 },
    { pattern: '*.medium.com/*', configName: 'medium-article', priority: 8 },
    
    // E-commerce
    { pattern: '*.amazon.com/*/dp/*', configName: 'amazon-product', priority: 6 },
    { pattern: '*.amazon.co.uk/*/dp/*', configName: 'amazon-product', priority: 6 },
    
    // Generic fallbacks (lowest priority)
    { pattern: '*', configName: 'generic-article', priority: 1 },
  ];

  /**
   * Find the best matching site configuration for a given URL
   */
  findConfigForUrl(url: string): string | null {
    console.log(`🗂️  [CONFIG] Looking for site config for: ${url}`);
    
    try {
      const urlObj = new URL(url);
      const fullUrl = urlObj.toString();
      
      // Sort matchers by priority (highest first)
      const sortedMatchers = [...this.matchers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      for (const matcher of sortedMatchers) {
        if (this.matchesPattern(fullUrl, matcher.pattern)) {
          console.log(`✅ [CONFIG] Matched pattern "${matcher.pattern}" -> config: ${matcher.configName}`);
          return matcher.configName;
        }
      }
      
      console.log(`❌ [CONFIG] No specific config found for ${url}, using generic`);
      return 'generic-article';
      
    } catch (error) {
      console.error(`💥 [CONFIG] Error parsing URL ${url}: ${error}`);
      return null;
    }
  }

  /**
   * Check if a URL matches a wildcard pattern
   */
  private matchesPattern(url: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*');  // Convert * to .*
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  /**
   * Add a new site matcher (for dynamic configuration)
   */
  addMatcher(matcher: SiteMatcher): void {
    console.log(`➕ [CONFIG] Adding new matcher: ${matcher.pattern} -> ${matcher.configName}`);
    this.matchers.push(matcher);
  }

  /**
   * Remove a site matcher
   */
  removeMatcher(pattern: string): boolean {
    const initialLength = this.matchers.length;
    this.matchers = this.matchers.filter(m => m.pattern !== pattern);
    const removed = this.matchers.length < initialLength;
    
    if (removed) {
      console.log(`➖ [CONFIG] Removed matcher: ${pattern}`);
    } else {
      console.log(`❌ [CONFIG] Matcher not found: ${pattern}`);
    }
    
    return removed;
  }

  /**
   * Get all registered matchers
   */
  getAllMatchers(): SiteMatcher[] {
    return [...this.matchers];
  }

  /**
   * Test a URL against all patterns (for debugging)
   */
  testUrl(url: string): Array<{ pattern: string; configName: string; matches: boolean }> {
    console.log(`🧪 [CONFIG] Testing URL: ${url}`);
    
    return this.matchers.map(matcher => ({
      pattern: matcher.pattern,
      configName: matcher.configName,
      matches: this.matchesPattern(url, matcher.pattern)
    }));
  }
}

// Export singleton instance
export const siteMatcherService = new SiteMatcherService();