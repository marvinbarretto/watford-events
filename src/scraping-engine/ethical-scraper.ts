/**
 * Main ethical scraper that orchestrates the entire scraping process
 */

import { PuppeteerEngine } from './puppeteer-engine';
import { IFrameHandler } from './iframe-handler';
import { siteMatcherService } from '../scraping-configs/site-matcher';
import { configLoaderService } from '../scraping-configs/config-loader';
import { ScrapingRequest, ScrapingResult, SiteConfig } from '../scraping-configs/types';
import robotsParser from 'robots-parser';

export class EthicalScraper {
  private puppeteerEngine: PuppeteerEngine;
  private iframeHandler: IFrameHandler;
  private cache = new Map<string, { result: ScrapingResult; expiresAt: number }>();

  constructor() {
    this.puppeteerEngine = new PuppeteerEngine();
    this.iframeHandler = new IFrameHandler();
  }

  /**
   * Main scraping method
   */
  async scrape(request: ScrapingRequest): Promise<ScrapingResult> {
    const startTime = Date.now();
    console.log(`🕷️  [SCRAPER] Starting scrape for: ${request.url}`);
    
    try {
      // Check cache first
      if (request.useCache !== false) {
        const cachedResult = this.getCachedResult(request.url);
        if (cachedResult) {
          console.log(`💾 [CACHE] Returning cached result for: ${request.url}`);
          return cachedResult;
        }
      }

      // Check robots.txt
      const robotsAllowed = await this.checkRobotsTxt(request.url);
      if (!robotsAllowed) {
        throw new Error('Scraping blocked by robots.txt');
      }

      // Load site configuration
      const config = await this.loadSiteConfig(request.url);
      if (!config || !config.enabled) {
        throw new Error(`Site configuration not found or disabled for: ${request.url}`);
      }

      // Apply politeness delay
      await this.applyPolitenessDelay(config.options.politenessDelay || 1000);

      // Initialize browser
      await this.puppeteerEngine.initialize(config.options);
      const page = await this.puppeteerEngine.createPage(config.options);

      // Set initial URL for navigation
      const instructions = [...config.instructions];
      if (instructions.length > 0 && instructions[0].action === 'navigate') {
        instructions[0].target = request.url;
      }

      // Execute instructions
      let actionsExecuted = 0;
      for (const instruction of instructions) {
        if (instruction.action === 'extract') {
          continue; // Skip extract instructions, handled separately
        }

        const success = await this.puppeteerEngine.executeInstruction(page, instruction);
        if (success) {
          actionsExecuted++;
        } else if (!instruction.optional) {
          throw new Error(`Critical instruction failed: ${instruction.description}`);
        }
      }

      // Extract data from main page
      console.log(`📊 [SCRAPER] Extracting data from main page`);
      const mainData = await this.puppeteerEngine.extractData(page, config.extractors);

      // Handle iframes if configured
      let iframeData: Record<string, any> = {};
      let iframesProcessed = 0;
      
      if (request.options?.includeIframes !== false) {
        console.log(`🖼️  [SCRAPER] Processing iframes...`);
        const iframes = await this.iframeHandler.getAllIFrames(page);
        
        for (let i = 0; i < iframes.length; i++) {
          const frame = iframes[i];
          const frameUrl = frame.url();
          
          if (frameUrl && frameUrl !== 'about:blank') {
            try {
              console.log(`🖼️  [SCRAPER] Processing iframe ${i + 1}: ${frameUrl}`);
              await this.iframeHandler.waitForIFrameLoad(frame, 5000);
              
              const frameData = await this.iframeHandler.extractFromIFrame(frame, config.extractors);
              if (Object.keys(frameData).length > 0) {
                iframeData[`iframe_${i + 1}`] = {
                  url: frameUrl,
                  data: frameData
                };
                iframesProcessed++;
              }
            } catch (error: any) {
              console.error(`💥 [IFRAME] Error processing iframe ${i + 1}: ${error.message}`);
            }
          }
        }
      }

      // Take screenshot if requested or on error
      let screenshotTaken = false;
      if (request.options?.screenshot || config.options.screenshotOnError) {
        try {
          await this.puppeteerEngine.executeInstruction(page, {
            step: -1,
            action: 'screenshot',
            value: `scrape-${Date.now()}.png`,
            description: 'Capture final state'
          });
          screenshotTaken = true;
        } catch (error: any) {
          console.error(`📸 [SCREENSHOT] Failed to take screenshot: ${error.message}`);
        }
      }

      // Get memory usage
      const memoryUsage = await this.puppeteerEngine.getMemoryUsage();

      // Combine all extracted data
      const allData = {
        ...mainData,
        ...(Object.keys(iframeData).length > 0 && { iframes: iframeData })
      };

      const totalTime = Date.now() - startTime;
      
      const result: ScrapingResult = {
        url: request.url,
        success: true,
        data: allData,
        metadata: {
          processingTime: totalTime,
          actionsExecuted,
          extractorsRun: config.extractors.length,
          iframesProcessed,
          screenshotTaken,
          cacheUsed: false,
          robotsTxtChecked: true,
          userAgent: config.options.userAgent,
          finalUrl: page.url(),
          memoryUsage: memoryUsage.usedJSHeapSize
        },
        extractedAt: new Date().toISOString()
      };

      // Cache the result
      if (request.useCache !== false) {
        this.cacheResult(request.url, result, request.cacheTTL || 300);
      }

      console.log(`✅ [SCRAPER] Scraping completed successfully in ${totalTime}ms`);
      console.log(`📊 [PERF] Memory usage: ${Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024)}MB`);
      
      return result;

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 [SCRAPER] Scraping failed after ${totalTime}ms: ${error.message}`);

      // Take error screenshot if configured
      if (this.puppeteerEngine && (request.options?.screenshot || configLoaderService.loadConfig('generic-article')?.options.screenshotOnError)) {
        try {
          console.log(`📸 [SCREENSHOT] Taking error screenshot...`);
          // Implementation would need access to current page
        } catch (screenshotError) {
          console.error(`📸 [SCREENSHOT] Failed to take error screenshot: ${screenshotError}`);
        }
      }

      return {
        url: request.url,
        success: false,
        data: {},
        metadata: {
          processingTime: totalTime,
          actionsExecuted: 0,
          extractorsRun: 0,
          iframesProcessed: 0,
          cacheUsed: false
        },
        errors: [error.message],
        extractedAt: new Date().toISOString()
      };

    } finally {
      // Clean up
      try {
        await this.puppeteerEngine.close();
      } catch (closeError) {
        console.error(`🔚 [CLEANUP] Error closing browser: ${closeError}`);
      }
    }
  }

  /**
   * Load site configuration for URL
   */
  private async loadSiteConfig(url: string): Promise<SiteConfig | null> {
    const configName = siteMatcherService.findConfigForUrl(url);
    if (!configName) {
      console.log(`❌ [CONFIG] No configuration found for URL: ${url}`);
      return null;
    }

    const config = configLoaderService.loadConfig(configName);
    if (!config) {
      console.log(`❌ [CONFIG] Failed to load configuration: ${configName}`);
      return null;
    }

    console.log(`✅ [CONFIG] Loaded configuration: ${config.name} (${config.version})`);
    return config;
  }

  /**
   * Check robots.txt compliance
   */
  private async checkRobotsTxt(url: string): Promise<boolean> {
    console.log(`🤖 [ROBOTS] Checking robots.txt for: ${url}`);
    
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      console.log(`🤖 [ROBOTS] Fetching: ${robotsUrl}`);
      
      const response = await fetch(robotsUrl, { 
        headers: { 'User-Agent': 'EthicalScraper/1.0' }
      });
      
      if (!response.ok) {
        console.log(`🤖 [ROBOTS] No robots.txt found (${response.status}), proceeding...`);
        return true;
      }
      
      const robotsTxt = await response.text();
      const robots = robotsParser(robotsUrl, robotsTxt);
      
      const userAgent = 'EthicalScraper';
      const allowed = robots.isAllowed(url, userAgent) ?? true;
      
      if (allowed) {
        console.log(`✅ [ROBOTS] Scraping allowed by robots.txt`);
      } else {
        console.log(`🛡️  [ROBOTS] Scraping blocked by robots.txt`);
      }
      
      return allowed;
      
    } catch (error: any) {
      console.error(`💥 [ROBOTS] Error checking robots.txt: ${error.message}`);
      // If we can't check robots.txt, err on the side of caution but allow scraping
      console.log(`⚠️  [ROBOTS] Proceeding due to robots.txt check failure`);
      return true;
    }
  }

  /**
   * Apply politeness delay
   */
  private async applyPolitenessDelay(delay: number): Promise<void> {
    if (delay > 0) {
      console.log(`⏳ [POLITENESS] Waiting ${delay}ms before scraping...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Cache result
   */
  private cacheResult(url: string, result: ScrapingResult, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(url, { result, expiresAt });
    console.log(`💾 [CACHE] Cached result for ${url} (expires in ${ttlSeconds}s)`);
  }

  /**
   * Get cached result
   */
  private getCachedResult(url: string): ScrapingResult | null {
    const cached = this.cache.get(url);
    if (!cached) {
      console.log(`❌ [CACHE] No cached result for: ${url}`);
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(url);
      console.log(`⏰ [CACHE] Cached result expired for: ${url}`);
      return null;
    }

    const age = Math.round((Date.now() - (cached.expiresAt - 300000)) / 1000);
    console.log(`✅ [CACHE] Found cached result for: ${url} (${age}s old)`);
    return { ...cached.result, metadata: { ...cached.result.metadata, cacheUsed: true } };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️  [CACHE] Cleared ${size} cached results`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    };
  }
}