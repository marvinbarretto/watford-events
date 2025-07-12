/**
 * Unit tests for EthicalScraperService
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EthicalScraperService, ScrapingRequest, ScrapingResult } from './ethical-scraper.service';

describe('EthicalScraperService', () => {
  let service: EthicalScraperService;
  let httpMock: HttpTestingController;

  const mockScrapingResult: ScrapingResult = {
    url: 'https://example.com',
    success: true,
    data: {
      title: 'Test Article',
      content: 'Test content',
      author: 'Test Author'
    },
    metadata: {
      processingTime: 1500,
      actionsExecuted: 2,
      extractorsRun: 3,
      iframesProcessed: 1,
      cacheUsed: false,
      robotsTxtChecked: true
    },
    extractedAt: '2025-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EthicalScraperService
      ]
    });

    service = TestBed.inject(EthicalScraperService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('scrapeUrl', () => {
    it('should send POST request to /api/scrape with correct payload', () => {
      const request: ScrapingRequest = {
        url: 'https://example.com',
        options: {
          includeIframes: true,
          useCache: true
        }
      };

      service.scrapeUrl(request).subscribe(result => {
        expect(result).toEqual(mockScrapingResult);
      });

      const req = httpMock.expectOne('/api/scrape');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockScrapingResult);
    });

    it('should handle successful response with logging', () => {
      jest.spyOn(console, 'log');

      const request: ScrapingRequest = {
        url: 'https://example.com'
      };

      service.scrapeUrl(request).subscribe();

      const req = httpMock.expectOne('/api/scrape');
      req.flush(mockScrapingResult);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/✅ \[SCRAPER-SERVICE\] Scraping successful/)
      );
    });

    it('should handle HTTP errors gracefully', () => {
      jest.spyOn(console, 'error');

      const request: ScrapingRequest = {
        url: 'https://example.com'
      };

      service.scrapeUrl(request).subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Http failure response for /api/scrape: 500 Server Error');
      });

      const req = httpMock.expectOne('/api/scrape');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('scrapeSimple', () => {
    it('should call scrapeUrl with default options', () => {
      jest.spyOn(service, 'scrapeUrl').mockReturnValue(new Promise(() => {}) as any);

      const url = 'https://example.com';
      service.scrapeSimple(url);

      expect(service.scrapeUrl).toHaveBeenCalledWith({
        url,
        options: {
          includeIframes: true,
          useCache: true,
          cacheTTL: 300
        }
      });
    });

    it('should merge custom options with defaults', () => {
      jest.spyOn(service, 'scrapeUrl').mockReturnValue(new Promise(() => {}) as any);

      const url = 'https://example.com';
      const customOptions = { screenshot: true, cacheTTL: 600 };
      
      service.scrapeSimple(url, customOptions);

      expect(service.scrapeUrl).toHaveBeenCalledWith({
        url,
        options: {
          includeIframes: true,
          useCache: true,
          cacheTTL: 600,
          screenshot: true
        }
      });
    });
  });

  describe('scrapeWithActions', () => {
    it('should include custom actions in request', () => {
      jest.spyOn(service, 'scrapeUrl').mockReturnValue(new Promise(() => {}) as any);

      const url = 'https://example.com';
      const actions = [
        {
          step: 1,
          action: 'click' as const,
          target: '.cookie-accept',
          description: 'Accept cookies'
        }
      ];

      service.scrapeWithActions(url, actions);

      expect(service.scrapeUrl).toHaveBeenCalledWith({
        url,
        actions,
        options: {
          includeIframes: true,
          useCache: false,
          screenshot: true
        }
      });
    });
  });

  describe('getCacheStats', () => {
    it('should fetch cache statistics', () => {
      const mockStats = { size: 5, urls: ['url1', 'url2'] };

      service.getCacheStats().subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne('/api/scrape/cache/stats');
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });

    it('should handle cache stats error gracefully', () => {
      service.getCacheStats().subscribe(stats => {
        expect(stats).toEqual({ size: 0, urls: [] });
      });

      const req = httpMock.expectOne('/api/scrape/cache/stats');
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('clearCache', () => {
    it('should send DELETE request to clear cache', () => {
      const mockResponse = { message: 'Cache cleared successfully' };

      service.clearCache().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/scrape/cache');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('helper methods', () => {
    describe('createActionSequence', () => {
      it('should create accept cookies and wait actions', () => {
        const actions = service.createActionSequence.acceptCookiesAndWait();
        
        expect(actions).toHaveLength(2);
        expect(actions[0].action).toBe('click');
        expect(actions[0].optional).toBe(true);
        expect(actions[1].action).toBe('wait');
        expect(actions[1].waitFor).toBe('selector');
      });

      it('should create click and navigate actions', () => {
        const actions = service.createActionSequence.clickAndNavigate('.button', 'Click button');
        
        expect(actions).toHaveLength(1);
        expect(actions[0].action).toBe('click');
        expect(actions[0].target).toBe('.button');
        expect(actions[0].waitFor).toBe('navigation');
      });

      it('should create scroll actions with specified count', () => {
        const actions = service.createActionSequence.scrollToLoadMore(2);
        
        expect(actions).toHaveLength(4); // 2 scroll + 2 wait actions
        expect(actions[0].action).toBe('scroll');
        expect(actions[1].action).toBe('wait');
        expect(actions[2].action).toBe('scroll');
        expect(actions[3].action).toBe('wait');
      });
    });

    describe('createExtractors', () => {
      it('should create article metadata extractors', () => {
        const extractors = service.createExtractors.articleMetadata();
        
        expect(extractors).toHaveLength(4);
        expect(extractors[0].name).toBe('title');
        expect(extractors[0].required).toBe(true);
        expect(extractors[1].name).toBe('description');
        expect(extractors[1].attribute).toBe('content');
      });

      it('should create link extractors', () => {
        const extractors = service.createExtractors.allLinks();
        
        expect(extractors).toHaveLength(1);
        expect(extractors[0].name).toBe('links');
        expect(extractors[0].multiple).toBe(true);
        expect(extractors[0].attribute).toBe('href');
      });

      it('should create image extractors', () => {
        const extractors = service.createExtractors.imagesWithCaptions();
        
        expect(extractors).toHaveLength(2);
        expect(extractors[0].name).toBe('images');
        expect(extractors[1].name).toBe('imageCaptions');
      });
    });
  });
});