/**
 * Angular service for the EthicalScraperService - provides clean interface for components
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { EventModel } from '@app/events/utils/event.model';
import { EventDataTransformer, EventExtractionResult } from '../utils/event-data-transformer';
import { SsrPlatformService } from '../utils/ssr/ssr-platform.service';

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
  private platform = inject(SsrPlatformService);
  
  private readonly baseUrl = '/api/scrape';

  /**
   * Scrape a URL with optional custom configuration
   */
  scrapeUrl(request: ScrapingRequest): Observable<ScrapingResult> {
    console.log(`🕷️  [SCRAPER-SERVICE] Starting scrape for: ${request.url}`);
    
    // SSR Safety: Only make HTTP calls in browser
    if (this.platform.isServer) {
      console.warn(`🔧 [SCRAPER-SERVICE] Skipping scrape during SSR for: ${request.url}`);
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
        errors: ['HTTP requests not available during SSR'],
        extractedAt: new Date().toISOString()
      } as ScrapingResult);
    }
    
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
    
    // SSR Safety: Only make HTTP calls in browser
    if (this.platform.isServer) {
      console.warn(`🔧 [SCRAPER-SERVICE] Skipping cache stats during SSR`);
      return of({ size: 0, urls: [] });
    }
    
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
    
    // SSR Safety: Only make HTTP calls in browser
    if (this.platform.isServer) {
      console.warn(`🔧 [SCRAPER-SERVICE] Skipping cache clear during SSR`);
      return of({ message: 'Cache clear skipped during SSR' });
    }
    
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
    ],

    /**
     * Event-specific extractors for event data
     */
    eventData: () => [
      {
        name: 'title',
        selector: 'title, h1, .event-title, [class*="title"], [class*="name"], [property="og:title"]',
        required: true,
        transform: 'trim' as const
      },
      {
        name: 'description',
        selector: '[name="description"], [property="og:description"], .description, .event-description, .content, .details, .summary',
        attribute: 'content',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'date',
        selector: '.date, .event-date, [class*="date"], time[datetime], [property="article:published_time"], [data-date]',
        attribute: 'datetime',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'start_time',
        selector: '.time, .start-time, [class*="time"], [data-start-time], .when',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'end_time',
        selector: '.end-time, [class*="end"], [data-end-time], .until',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'location',
        selector: '.location, .venue, .address, [class*="location"], [class*="venue"], [class*="address"], .where',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'organizer',
        selector: '.organizer, .organiser, .host, .by, .author, [class*="organiz"], [class*="host"]',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'price',
        selector: '.price, .cost, .ticket-price, [class*="price"], [class*="cost"], .tickets',
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'website',
        selector: 'a[href*="ticket"], a[href*="book"], a[href*="more"], .website, .link',
        attribute: 'href',
        required: false
      },
      {
        name: 'contact',
        selector: '.contact, .email, .phone, [class*="contact"], [href^="mailto:"], [href^="tel:"]',
        required: false,
        transform: 'trim' as const
      }
    ],

    /**
     * Event listing extractors for pages with multiple events
     */
    eventListing: () => [
      {
        name: 'events',
        selector: '.event, .event-item, [class*="event"], article, .listing-item',
        multiple: true,
        required: false
      },
      {
        name: 'event_titles',
        selector: '.event h1, .event h2, .event h3, .event .title, .event-title',
        multiple: true,
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'event_dates',
        selector: '.event .date, .event time, .event [class*="date"]',
        multiple: true,
        required: false,
        transform: 'trim' as const
      },
      {
        name: 'event_locations',
        selector: '.event .location, .event .venue, .event [class*="location"]',
        multiple: true,
        required: false,
        transform: 'trim' as const
      }
    ]
  };

  /**
   * Scrape a URL specifically for event data and return EventModel objects
   */
  scrapeForEvents(
    url: string, 
    options?: Partial<ScrapingRequest['options']>,
    createdBy: string = 'scraper-system',
    ownerId: string = 'scraper-system'
  ): Observable<EventExtractionResult> {
    console.log(`🎪 [EVENT-SCRAPER] Scraping for events: ${url}`);
    
    const request: ScrapingRequest = {
      url,
      extractors: this.createExtractors.eventData(),
      options: {
        includeIframes: true,
        useCache: true,
        cacheTTL: 300,
        ...options
      }
    };

    return this.scrapeUrl(request).pipe(
      map(result => {
        console.log(`🔄 [EVENT-SCRAPER] Transforming scraped data to events`);
        return EventDataTransformer.transformScrapingResult(result, createdBy, ownerId);
      }),
      tap(extractionResult => {
        if (extractionResult.events.length > 0) {
          console.log(`✅ [EVENT-SCRAPER] Successfully extracted ${extractionResult.events.length} events`);
          extractionResult.events.forEach((event, index) => {
            console.log(`📅 [EVENT ${index + 1}] ${event.title} - ${event.date} - ${event.location || 'No location'}`);
          });
        } else {
          console.warn(`⚠️  [EVENT-SCRAPER] No events extracted from ${url}`);
          if (extractionResult.errors.length > 0) {
            console.error(`❌ [EVENT-SCRAPER] Errors: ${extractionResult.errors.join(', ')}`);
          }
          if (extractionResult.warnings.length > 0) {
            console.warn(`⚠️  [EVENT-SCRAPER] Warnings: ${extractionResult.warnings.join(', ')}`);
          }
        }
      }),
      catchError(error => {
        console.error(`💥 [EVENT-SCRAPER] Error scraping events: ${error.message}`);
        return of({
          events: [],
          errors: [error.message || 'Unknown error occurred'],
          warnings: []
        } as EventExtractionResult);
      })
    );
  }

  /**
   * Scrape multiple event listing pages for events
   */
  scrapeEventListing(
    url: string,
    options?: Partial<ScrapingRequest['options']>,
    createdBy: string = 'scraper-system',
    ownerId: string = 'scraper-system'
  ): Observable<EventExtractionResult> {
    console.log(`📋 [EVENT-LISTING] Scraping event listing: ${url}`);
    
    const request: ScrapingRequest = {
      url,
      extractors: this.createExtractors.eventListing(),
      options: {
        includeIframes: true,
        useCache: true,
        cacheTTL: 300,
        ...options
      }
    };

    return this.scrapeUrl(request).pipe(
      map(result => {
        console.log(`🔄 [EVENT-LISTING] Transforming scraped listing data to events`);
        return EventDataTransformer.transformScrapingResult(result, createdBy, ownerId);
      }),
      tap(extractionResult => {
        if (extractionResult.events.length > 0) {
          console.log(`✅ [EVENT-LISTING] Successfully extracted ${extractionResult.events.length} events from listing`);
        } else {
          console.warn(`⚠️  [EVENT-LISTING] No events extracted from listing ${url}`);
        }
      }),
      catchError(error => {
        console.error(`💥 [EVENT-LISTING] Error scraping event listing: ${error.message}`);
        return of({
          events: [],
          errors: [error.message || 'Unknown error occurred'],
          warnings: []
        } as EventExtractionResult);
      })
    );
  }

  /**
   * Convenient method to scrape for events with custom extractors
   */
  scrapeForEventsWithCustomExtractors(
    url: string,
    customExtractors: ScrapingRequest['extractors'],
    options?: Partial<ScrapingRequest['options']>,
    createdBy: string = 'scraper-system',
    ownerId: string = 'scraper-system'
  ): Observable<EventExtractionResult> {
    console.log(`🎨 [CUSTOM-EVENT-SCRAPER] Scraping with custom extractors: ${url}`);
    
    const request: ScrapingRequest = {
      url,
      extractors: customExtractors,
      options: {
        includeIframes: true,
        useCache: true,
        cacheTTL: 300,
        ...options
      }
    };

    return this.scrapeUrl(request).pipe(
      map(result => {
        console.log(`🔄 [CUSTOM-EVENT-SCRAPER] Transforming custom scraped data to events`);
        return EventDataTransformer.transformScrapingResult(result, createdBy, ownerId);
      }),
      catchError(error => {
        console.error(`💥 [CUSTOM-EVENT-SCRAPER] Error: ${error.message}`);
        return of({
          events: [],
          errors: [error.message || 'Unknown error occurred'],
          warnings: []
        } as EventExtractionResult);
      })
    );
  }
}