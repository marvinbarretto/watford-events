/**
 * Main scheduler service for automated scraping
 */

import { SiteConfiguration, ScrapingJob, SchedulerConfiguration, ScrapingResult } from './types';
import { EthicalScraper } from '../scraping-engine/ethical-scraper';
import { configLoaderService } from '../scraping-configs/config-loader';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export class SchedulerService {
  private scraper: EthicalScraper;
  private config: SchedulerConfiguration;
  private runningJobs = new Map<string, ScrapingJob>();
  private isRunning = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SchedulerConfiguration>) {
    this.scraper = new EthicalScraper();
    this.config = {
      runIntervalMinutes: 1440, // Check once daily (24 hours = 1440 minutes)
      maxConcurrentJobs: 3,
      globalTimeoutMinutes: 30,
      enableDebugLogs: true,
      retrySettings: {
        maxRetries: 3,
        retryDelayMinutes: 15,
        backoffMultiplier: 2
      },
      storage: {
        firebaseCollection: 'scraping_results',
        keepResultsForDays: 90,
        compressOldResults: true
      },
      ...config
    };
    
    console.log(`🕰️  [SCHEDULER] Service initialized with daily intervals (${this.config.runIntervalMinutes}min)`);
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`⚠️  [SCHEDULER] Already running, skipping start`);
      return;
    }

    this.isRunning = true;
    console.log(`🚀 [SCHEDULER] Starting automated scraping scheduler...`);
    
    // Run immediately on start
    await this.runSchedulerTick();
    
    // Set up recurring interval
    this.intervalTimer = setInterval(async () => {
      await this.runSchedulerTick();
    }, this.config.runIntervalMinutes * 60 * 1000);
    
    console.log(`✅ [SCHEDULER] Started successfully, checking daily (every ${this.config.runIntervalMinutes} minutes)`);
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    console.log(`🛑 [SCHEDULER] Stopping scheduler...`);
    
    this.isRunning = false;
    
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    
    // Wait for running jobs to complete (with timeout)
    const waitStart = Date.now();
    const maxWaitMs = 5 * 60 * 1000; // 5 minutes
    
    while (this.runningJobs.size > 0 && (Date.now() - waitStart) < maxWaitMs) {
      console.log(`⏳ [SCHEDULER] Waiting for ${this.runningJobs.size} jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.runningJobs.size > 0) {
      console.log(`⚠️  [SCHEDULER] Force stopping with ${this.runningJobs.size} jobs still running`);
      this.runningJobs.clear();
    }
    
    console.log(`✅ [SCHEDULER] Stopped successfully`);
  }

  /**
   * Main scheduler tick - checks what needs to be scraped
   */
  private async runSchedulerTick(): Promise<void> {
    const tickStart = Date.now();
    console.log(`🔄 [SCHEDULER] Running scheduler tick at ${new Date().toISOString()}`);
    
    try {
      // Load all site configurations
      const siteConfigs = await this.loadSiteConfigurations();
      console.log(`📋 [SCHEDULER] Loaded ${siteConfigs.length} site configurations`);
      
      // Filter sites that need checking
      const sitesToCheck = siteConfigs.filter(site => this.shouldCheckSite(site));
      console.log(`🎯 [SCHEDULER] ${sitesToCheck.length} sites need checking`);
      
      // Create jobs for sites that need checking
      for (const site of sitesToCheck) {
        if (this.runningJobs.size >= this.config.maxConcurrentJobs) {
          console.log(`⏸️  [SCHEDULER] Max concurrent jobs reached (${this.config.maxConcurrentJobs}), queuing remaining sites`);
          break;
        }
        
        await this.createAndRunJob(site);
      }
      
      const tickTime = Date.now() - tickStart;
      console.log(`✅ [SCHEDULER] Tick completed in ${tickTime}ms`);
      
    } catch (error: any) {
      console.error(`💥 [SCHEDULER] Error in scheduler tick: ${error.message}`);
    }
  }

  /**
   * Load all site configurations from the configs directory
   */
  private async loadSiteConfigurations(): Promise<SiteConfiguration[]> {
    const configsDir = join(process.cwd(), 'src', 'site-configs');
    
    try {
      const files = await fs.readdir(configsDir);
      const configFiles = files.filter(file => file.endsWith('.json'));
      
      const configs: SiteConfiguration[] = [];
      
      for (const file of configFiles) {
        try {
          const configPath = join(configsDir, file);
          const configData = await fs.readFile(configPath, 'utf-8');
          const config: SiteConfiguration = JSON.parse(configData);
          
          if (config.enabled) {
            configs.push(config);
          }
          
        } catch (error: any) {
          console.error(`💥 [CONFIG] Error loading ${file}: ${error.message}`);
        }
      }
      
      return configs;
      
    } catch (error: any) {
      console.error(`💥 [CONFIG] Error reading configs directory: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if a site needs to be scraped based on its schedule
   */
  private shouldCheckSite(site: SiteConfiguration): boolean {
    const now = new Date();
    const nextCheck = new Date(site.schedule.nextCheckAt);
    
    const shouldCheck = now >= nextCheck;
    
    if (shouldCheck) {
      console.log(`✅ [SCHEDULE] ${site.name} is due for checking (next: ${site.schedule.nextCheckAt})`);
    }
    
    return shouldCheck;
  }

  /**
   * Create and run a scraping job for a site
   */
  private async createAndRunJob(site: SiteConfiguration): Promise<void> {
    const job: ScrapingJob = {
      id: this.generateJobId(),
      siteConfigId: site.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      processingTimeMs: null,
      errors: [],
      logs: []
    };
    
    console.log(`🎬 [JOB] Created job ${job.id} for site: ${site.name}`);
    this.runningJobs.set(job.id, job);
    
    // Run job asynchronously
    this.executeJob(job, site).catch(error => {
      console.error(`💥 [JOB] Unhandled error in job ${job.id}: ${error.message}`);
    });
  }

  /**
   * Execute a scraping job
   */
  private async executeJob(job: ScrapingJob, site: SiteConfiguration): Promise<void> {
    const jobStart = Date.now();
    
    try {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      
      console.log(`🏃 [JOB] Starting job ${job.id} for ${site.name}`);
      
      // Update site's last checked time
      await this.updateSiteSchedule(site, 'started');
      
      // Load scraping rules
      const rulesConfig = configLoaderService.loadConfig(site.rulesPath.replace('./rules/', '').replace('.json', ''));
      if (!rulesConfig) {
        throw new Error(`Failed to load scraping rules: ${site.rulesPath}`);
      }
      
      const results: ScrapingResult[] = [];
      let totalItemsExtracted = 0;
      let errorsCount = 0;
      
      // Scrape each target URL
      for (const url of site.targetUrls) {
        try {
          console.log(`🌐 [JOB] Scraping URL: ${url}`);
          
          const scrapingResult = await this.scraper.scrape({
            url,
            options: {
              ...site.scrapingOptions,
              screenshot: site.scrapingOptions?.takeScreenshots || false
            },
            useCache: false // Don't use cache for scheduled runs
          });
          
          if (scrapingResult.success) {
            const contentHash = this.generateContentHash(scrapingResult.data);
            const isNewContent = await this.isContentNew(site.id, url, contentHash);
            
            const result: ScrapingResult = {
              jobId: job.id,
              siteConfigId: site.id,
              url,
              success: true,
              data: scrapingResult.data,
              contentHash,
              isNewContent,
              metadata: {
                processingTimeMs: scrapingResult.metadata?.processingTime || 0,
                userAgent: scrapingResult.metadata?.userAgent || 'Unknown',
                screenshotTaken: scrapingResult.metadata?.screenshotTaken || false,
                iframesProcessed: scrapingResult.metadata?.iframesProcessed || 0,
                finalUrl: scrapingResult.metadata?.finalUrl || url
              },
              extractedAt: new Date().toISOString()
            };
            
            results.push(result);
            totalItemsExtracted += Object.keys(scrapingResult.data).length;
            
            // Store result in Firestore
            await this.storeResult(result);
            
            if (isNewContent && site.notifications?.onNewContent) {
              await this.sendNotification(site, 'new_content', { url, data: scrapingResult.data });
            }
            
          } else {
            errorsCount++;
            job.errors.push(`Failed to scrape ${url}: ${scrapingResult.errors?.join(', ')}`);
          }
          
        } catch (urlError: any) {
          errorsCount++;
          job.errors.push(`Error scraping ${url}: ${urlError.message}`);
          console.error(`💥 [JOB] Error scraping ${url}: ${urlError.message}`);
        }
      }
      
      // Job completed successfully
      job.status = 'completed';
      job.results = {
        urlsScraped: site.targetUrls.length,
        itemsExtracted: totalItemsExtracted,
        errorsEncountered: errorsCount,
        newContentFound: results.some(r => r.isNewContent),
        dataHash: this.generateContentHash(results)
      };
      
      await this.updateSiteSchedule(site, 'completed');
      console.log(`✅ [JOB] Job ${job.id} completed successfully`);
      
    } catch (error: any) {
      job.status = 'failed';
      job.errors.push(error.message);
      
      await this.updateSiteSchedule(site, 'failed');
      console.error(`💥 [JOB] Job ${job.id} failed: ${error.message}`);
      
      if (site.notifications?.onError) {
        await this.sendNotification(site, 'error', { error: error.message });
      }
      
    } finally {
      job.finishedAt = new Date().toISOString();
      job.processingTimeMs = Date.now() - jobStart;
      
      // Remove from running jobs
      this.runningJobs.delete(job.id);
      
      console.log(`🏁 [JOB] Job ${job.id} finished in ${job.processingTimeMs}ms`);
    }
  }

  /**
   * Update site's schedule information
   */
  private async updateSiteSchedule(site: SiteConfiguration, status: 'started' | 'completed' | 'failed'): Promise<void> {
    const now = new Date();
    
    switch (status) {
      case 'started':
        site.schedule.lastCheckedAt = now.toISOString();
        site.schedule.totalRuns++;
        break;
        
      case 'completed':
        site.schedule.lastSuccessAt = now.toISOString();
        site.schedule.consecutiveFailures = 0;
        break;
        
      case 'failed':
        site.schedule.consecutiveFailures++;
        break;
    }
    
    // Calculate next check time
    const nextCheck = new Date(now);
    nextCheck.setDate(nextCheck.getDate() + site.checkIntervalDays);
    site.schedule.nextCheckAt = nextCheck.toISOString();
    
    // TODO: Save updated site configuration back to file or database
    console.log(`📅 [SCHEDULE] Updated ${site.name} - next check: ${site.schedule.nextCheckAt}`);
  }

  /**
   * Generate content hash for change detection
   */
  private generateContentHash(data: any): string {
    const content = JSON.stringify(data, Object.keys(data).sort());
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Check if content is new by comparing hashes
   */
  private async isContentNew(siteConfigId: string, url: string, contentHash: string): Promise<boolean> {
    // TODO: Implement by checking last stored hash in Firestore
    // For now, assume all content is new
    return true;
  }

  /**
   * Store scraping result to local file
   */
  private async storeResult(result: ScrapingResult): Promise<void> {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]; // HHMMSS
      
      // Create directory structure: scraping-results/YYYY-MM-DD/
      const resultsDir = join(process.cwd(), 'scraping-results', dateStr);
      await fs.mkdir(resultsDir, { recursive: true });
      
      // Generate filename: siteId_YYYYMMDD-HHMMSS.json
      const siteId = result.siteConfigId.replace(/[^a-zA-Z0-9-]/g, '-');
      const filename = `${siteId}_${dateStr.replace(/-/g, '')}-${timeStr.replace(/-/g, '')}.json`;
      const filepath = join(resultsDir, filename);
      
      // Prepare result data with metadata
      const resultData = {
        ...result,
        savedAt: now.toISOString(),
        filename: filename,
        filesize: 0 // Will be calculated after writing
      };
      
      // Write pretty-printed JSON
      const jsonContent = JSON.stringify(resultData, null, 2);
      await fs.writeFile(filepath, jsonContent, 'utf-8');
      
      // Update filesize
      const stats = await fs.stat(filepath);
      resultData.filesize = stats.size;
      
      console.log(`💾 [STORAGE] Saved result to: ${filename} (${Math.round(stats.size / 1024)}KB)`);
      console.log(`📁 [STORAGE] Location: ${filepath}`);
      
      // Also save the updated data with filesize
      await fs.writeFile(filepath, JSON.stringify(resultData, null, 2), 'utf-8');
      
    } catch (error: any) {
      console.error(`💥 [STORAGE] Failed to save result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send notification about scraping results
   */
  private async sendNotification(site: SiteConfiguration, type: 'new_content' | 'error', data: any): Promise<void> {
    console.log(`🔔 [NOTIFICATION] ${type} notification for ${site.name}: ${JSON.stringify(data)}`);
    // TODO: Implement webhook/email notifications
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get current scheduler status
   */
  getStatus(): { running: boolean; activeJobs: number; config: SchedulerConfiguration } {
    return {
      running: this.isRunning,
      activeJobs: this.runningJobs.size,
      config: this.config
    };
  }
}