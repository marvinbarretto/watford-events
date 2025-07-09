/**
 * Types for automated scraping scheduler system
 */

export interface SiteConfiguration {
  /** Unique identifier for this site configuration */
  id: string;
  
  /** Human-readable name for the site */
  name: string;
  
  /** Base domain or URL pattern to monitor */
  domain: string;
  
  /** Target URLs to scrape (can include wildcards) */
  targetUrls: string[];
  
  /** How often to check this site (in days) */
  checkIntervalDays: number;
  
  /** Path to the scraping rules file */
  rulesPath: string;
  
  /** Whether this site monitoring is active */
  enabled: boolean;
  
  /** Priority level for scheduling (high, medium, low) */
  priority: 'high' | 'medium' | 'low';
  
  /** Maximum time to allow for scraping (in minutes) */
  timeoutMinutes: number;
  
  /** Tags for categorizing/filtering sites */
  tags: string[];
  
  /** Notification settings */
  notifications?: {
    onNewContent: boolean;
    onError: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
  };
  
  /** Custom scraping options */
  scrapingOptions?: {
    respectRobotsTxt: boolean;
    politenessDelayMs: number;
    includeIframes: boolean;
    takeScreenshots: boolean;
    maxRetries: number;
  };
  
  /** Scheduling metadata (managed by system) */
  schedule: {
    lastCheckedAt: string | null;
    nextCheckAt: string;
    lastSuccessAt: string | null;
    consecutiveFailures: number;
    totalRuns: number;
  };
  
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

export interface ScrapingJob {
  /** Unique job identifier */
  id: string;
  
  /** Site configuration ID this job belongs to */
  siteConfigId: string;
  
  /** Current status of the job */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  /** When this job was created */
  createdAt: string;
  
  /** When this job started running */
  startedAt: string | null;
  
  /** When this job finished */
  finishedAt: string | null;
  
  /** Processing time in milliseconds */
  processingTimeMs: number | null;
  
  /** Results from the scraping */
  results?: {
    urlsScraped: number;
    itemsExtracted: number;
    errorsEncountered: number;
    newContentFound: boolean;
    dataHash: string; // For detecting changes
  };
  
  /** Any errors that occurred */
  errors: string[];
  
  /** Debug logs for troubleshooting */
  logs: string[];
}

export interface SchedulerConfiguration {
  /** How often the scheduler runs (in minutes) */
  runIntervalMinutes: number;
  
  /** Maximum concurrent scraping jobs */
  maxConcurrentJobs: number;
  
  /** Global timeout for individual jobs (in minutes) */
  globalTimeoutMinutes: number;
  
  /** Whether to store debug logs */
  enableDebugLogs: boolean;
  
  /** Retry configuration */
  retrySettings: {
    maxRetries: number;
    retryDelayMinutes: number;
    backoffMultiplier: number;
  };
  
  /** Storage settings */
  storage: {
    firebaseCollection: string;
    keepResultsForDays: number;
    compressOldResults: boolean;
  };
}

export interface ScrapingResult {
  /** Job ID this result belongs to */
  jobId: string;
  
  /** Site configuration ID */
  siteConfigId: string;
  
  /** URL that was scraped */
  url: string;
  
  /** Whether scraping was successful */
  success: boolean;
  
  /** Extracted data */
  data: Record<string, any>;
  
  /** Content hash for change detection */
  contentHash: string;
  
  /** Whether this is new content since last check */
  isNewContent: boolean;
  
  /** Metadata about the scraping process */
  metadata: {
    processingTimeMs: number;
    userAgent: string;
    screenshotTaken: boolean;
    iframesProcessed: number;
    finalUrl: string;
  };
  
  /** When this result was created */
  extractedAt: string;
  
  /** Firestore document ID for storage */
  firestoreId?: string;
}