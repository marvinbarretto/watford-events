/**
 * TypeScript interfaces for the EthicalScraperService configuration system
 */

export interface ScrapingInstruction {
  step: number;
  action: 'navigate' | 'click' | 'wait' | 'type' | 'scroll' | 'extract' | 'screenshot';
  target?: string;  // CSS selector
  value?: string;   // For typing or extracting to a specific field
  timeout?: number; // Timeout in milliseconds
  waitFor?: 'navigation' | 'selector' | 'timeout' | 'networkidle';
  description: string; // For logging and debugging
  optional?: boolean; // If true, don't fail the entire scrape if this step fails
}

export interface SiteSelectors {
  cookieBanner?: string;
  loadingSpinner?: string;
  mainContent?: string;
  pagination?: string;
  errorMessage?: string;
}

export interface SiteOptions {
  headless?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
  waitForNetworkIdle?: boolean;
  screenshotOnError?: boolean;
  respectRobotsTxt?: boolean;
  politenessDelay?: number; // milliseconds
  maxRetries?: number;
  includeIframes?: boolean;
  screenshot?: boolean;
}

export interface DataExtractor {
  name: string;
  selector: string;
  attribute?: string; // 'textContent', 'href', 'src', etc. Defaults to 'textContent'
  multiple?: boolean; // Extract all matches instead of just the first
  required?: boolean; // Fail if not found
  transform?: 'trim' | 'lowercase' | 'uppercase' | 'url' | 'number';
}

export interface SiteConfig {
  domain: string;
  enabled: boolean;
  name: string;
  description?: string;
  instructions: ScrapingInstruction[];
  selectors: SiteSelectors;
  extractors: DataExtractor[];
  options: SiteOptions;
  lastUpdated: string;
  version: string;
}

export interface ScrapingRequest {
  url: string;
  actions?: ScrapingInstruction[];
  extractors?: DataExtractor[];
  options?: Partial<SiteOptions>;
  useCache?: boolean;
  cacheTTL?: number; // seconds
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
    finalUrl?: string; // In case of redirects
    memoryUsage?: number;
  };
  errors?: string[];
  warnings?: string[];
  extractedAt: string;
}

export interface SiteMatcher {
  pattern: string; // URL pattern with wildcards
  configName: string;
  priority?: number; // Higher priority patterns are checked first
}

export interface CacheEntry {
  url: string;
  result: ScrapingResult;
  cachedAt: number;
  expiresAt: number;
  hits: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: boolean;
}