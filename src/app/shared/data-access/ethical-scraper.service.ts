/**
 * Angular service for the EthicalScraperService - provides clean interface for components
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { CacheService } from './cache.service';

export interface ScrapingRequest {
  url: string;
  actions?: Array<{
    step: number;
    action: 'navigate' | 'click' | 'wait' | 'type' | 'scroll' | 'extract' | 'screenshot';
    target?: string;
    value?: string;
    timeout?: number;
    waitFor?: 'navigation' | 'selector' | 'timeout' | 'networkidle';
    description: string;
    optional?: boolean;
  }>;
  extractors?: Array<{
    name: string;
    selector: string;
    attribute?: string;
    multiple?: boolean;
    required?: boolean;
    transform?: 'trim' | 'lowercase' | 'uppercase' | 'url' | 'number';
  }>;
  options?: {
    headless?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
    waitForNetworkIdle?: boolean;
    screenshotOnError?: boolean;
    respectRobotsTxt?: boolean;
    politenessDelay?: number;
    maxRetries?: number;
    includeIframes?: boolean;
    screenshot?: boolean;
    useCache?: boolean;
    cacheTTL?: number;
  };
}

export interface ScrapingResult {
  url: string;
  success: boolean;
  data: Record<string, any>;
  metadata: {
    processingTime: number;
    actionsExecuted: number;
    extractorsRun: number;
    iframesProcessed: number;
    screenshotTaken?: boolean;
    cacheUsed?: boolean;
    robotsTxtChecked?: boolean;
    userAgent?: string;
    finalUrl?: string;
    memoryUsage?: number;
  };
  errors?: string[];
  warnings?: string[];
  extractedAt: string;
}

export interface CacheStats {
  size: number;
  urls: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EthicalScraperService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  
  private readonly baseUrl = '/api/scrape';

  /**
   * Scrape a URL with optional custom configuration
   */
  scrapeUrl(request: ScrapingRequest): Observable<ScrapingResult> {
    console.log(`🕷️  [SCRAPER-SERVICE] Starting scrape for: ${request.url}`);
    
    return this.http.post<ScrapingResult>(this.baseUrl, request).pipe(
      tap(result => {
        if (result.success) {
          console.log(`✅ [SCRAPER-SERVICE] Scraping successful: ${result.url}`);
          console.log(`📊 [SCRAPER-SERVICE] Processing time: ${result.metadata.processingTime}ms`);
          console.log(`💾 [SCRAPER-SERVICE] Cache used: ${result.metadata.cacheUsed ? 'Yes' : 'No'}`);
          console.log(`🖼️  [SCRAPER-SERVICE] iFrames processed: ${result.metadata.iframesProcessed}`);
        } else {
          console.error(`❌ [SCRAPER-SERVICE] Scraping failed: ${result.url}`);
          console.error(`🔍 [SCRAPER-SERVICE] Errors: ${result.errors?.join(', ')}`);
        }
      }),
      catchError(error => {
        console.error(`💥 [SCRAPER-SERVICE] HTTP error: ${error.message}`);
        return of({
          url: request.url,
          success: false,
          data: {},
          metadata: {
            processingTime: 0,
            actionsExecuted: 0,
            extractorsRun: 0,
            iframesProcessed: 0,
            cacheUsed: false
          },
          errors: [error.message || 'Unknown error occurred'],
          extractedAt: new Date().toISOString()
        } as ScrapingResult);
      })
    );
  }

  /**
   * Simple URL scraping with default configuration
   */
  scrapeSimple(url: string, options?: Partial<ScrapingRequest['options']>): Observable<ScrapingResult> {
    console.log(`🔗 [SCRAPER-SERVICE] Simple scrape: ${url}`);
    
    return this.scrapeUrl({
      url,
      options: {
        includeIframes: true,
        useCache: true,
        cacheTTL: 300,
        ...options
      }
    });
  }

  /**
   * Scrape with custom actions (for E2E interactions)
   */
  scrapeWithActions(
    url: string, 
    actions: ScrapingRequest['actions'], 
    options?: Partial<ScrapingRequest['options']>
  ): Observable<ScrapingResult> {
    console.log(`🎭 [SCRAPER-SERVICE] Scrape with ${actions?.length || 0} custom actions: ${url}`);
    
    return this.scrapeUrl({
      url,
      actions,
      options: {
        includeIframes: true,
        useCache: false, // Don't cache interactive scrapes by default
        screenshot: true, // Take screenshot for debugging
        ...options
      }
    });
  }

  /**
   * Scrape with custom data extractors
   */
  scrapeWithExtractors(
    url: string,
    extractors: ScrapingRequest['extractors'],
    options?: Partial<ScrapingRequest['options']>
  ): Observable<ScrapingResult> {
    console.log(`📊 [SCRAPER-SERVICE] Scrape with ${extractors?.length || 0} custom extractors: ${url}`);
    
    return this.scrapeUrl({
      url,
      extractors,
      options: {
        includeIframes: true,
        useCache: true,
        ...options
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Observable<CacheStats> {
    console.log(`📊 [SCRAPER-SERVICE] Getting cache statistics`);
    
    return this.http.get<CacheStats>(`${this.baseUrl}/cache/stats`).pipe(
      tap(stats => {
        console.log(`📊 [SCRAPER-SERVICE] Cache stats: ${stats.size} entries`);
      }),
      catchError(error => {
        console.error(`💥 [SCRAPER-SERVICE] Error getting cache stats: ${error.message}`);
        return of({ size: 0, urls: [] });
      })
    );
  }

  /**
   * Clear server-side cache
   */
  clearCache(): Observable<{ message: string }> {
    console.log(`🗑️  [SCRAPER-SERVICE] Clearing server cache`);
    
    return this.http.delete<{ message: string }>(`${this.baseUrl}/cache`).pipe(
      tap(result => {
        console.log(`✅ [SCRAPER-SERVICE] ${result.message}`);
      }),
      catchError(error => {
        console.error(`💥 [SCRAPER-SERVICE] Error clearing cache: ${error.message}`);
        return of({ message: 'Failed to clear cache' });
      })
    );
  }

  /**
   * Helper method to create common action sequences
   */
  createActionSequence = {
    /**
     * Accept cookie banner and wait for content
     */
    acceptCookiesAndWait: (contentSelector: string = 'main, article, .content') => [
      {
        step: 1,
        action: 'click' as const,
        target: '[data-testid*="cookie"], [class*="cookie"], [id*="cookie"], .gdpr-banner, .consent-banner',
        timeout: 5000,
        description: 'Accept cookie banner if present',
        optional: true
      },
      {
        step: 2,
        action: 'wait' as const,
        waitFor: 'selector' as const,
        target: contentSelector,
        timeout: 10000,
        description: 'Wait for main content to load'
      }
    ],

    /**
     * Click element and wait for navigation
     */
    clickAndNavigate: (selector: string, description: string) => [
      {
        step: 1,
        action: 'click' as const,
        target: selector,
        waitFor: 'navigation' as const,
        timeout: 10000,
        description
      }
    ],

    /**
     * Scroll to load more content
     */
    scrollToLoadMore: (scrollCount: number = 3) => {
      const actions = [];
      for (let i = 0; i < scrollCount; i++) {
        actions.push({
          step: i + 1,
          action: 'scroll' as const,
          description: `Scroll ${i + 1} to load more content`,
          timeout: 2000
        });
        actions.push({
          step: i + 1.5,
          action: 'wait' as const,
          waitFor: 'timeout' as const,
          timeout: 1000,
          description: `Wait after scroll ${i + 1}`
        });
      }
      return actions;
    }
  };

  /**
   * Helper method to create common extractors
   */
  createExtractors = {
    /**
     * Basic article metadata
     */
    articleMetadata: () => [
      {
        name: 'title',
        selector: 'title, h1, [property="og:title"]',
        required: true,
        transform: 'trim' as const
      },
      {
        name: 'description',
        selector: '[name="description"], [property="og:description"]',
        attribute: 'content',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'author',
        selector: '[name="author"], [rel="author"], .author, .byline',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'publishDate',
        selector: '[property="article:published_time"], time[datetime]',
        attribute: 'datetime',
        required: false
      }
    ],

    /**
     * All links on page
     */
    allLinks: () => [
      {
        name: 'links',
        selector: 'a[href]',
        attribute: 'href',
        multiple: true,
        required: false
      }
    ],

    /**
     * All images with captions
     */
    imagesWithCaptions: () => [
      {
        name: 'images',
        selector: 'img[src]',
        attribute: 'src',
        multiple: true,
        required: false
      },
      {
        name: 'imageCaptions',
        selector: 'figcaption, .caption, img[alt]',
        attribute: 'alt',
        multiple: true,
        required: false
      }
    ]
  };
}