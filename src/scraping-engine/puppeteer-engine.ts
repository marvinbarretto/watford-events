/**
 * Core Puppeteer scraping engine with comprehensive logging and error handling
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { ScrapingInstruction, ScrapingResult, DataExtractor, SiteOptions } from '../scraping-configs/types';

export class PuppeteerEngine {
  private browser: Browser | null = null;
  private currentPage: Page | null = null;

  /**
   * Initialize the Puppeteer browser
   */
  async initialize(options: SiteOptions = {}): Promise<void> {
    console.log(`🚀 [BROWSER] Launching Puppeteer browser...`);
    const startTime = Date.now();

    try {
      this.browser = await puppeteer.launch({
        headless: options.headless ?? true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        defaultViewport: options.viewport ?? { width: 1920, height: 1080 }
      });

      const launchTime = Date.now() - startTime;
      console.log(`✅ [BROWSER] Browser launched successfully in ${launchTime}ms`);

    } catch (error: any) {
      console.error(`💥 [BROWSER] Failed to launch browser: ${error.message}`);
      throw new Error(`Browser launch failed: ${error.message}`);
    }
  }

  /**
   * Create a new page with configured options
   */
  async createPage(options: SiteOptions = {}): Promise<Page> {
    if (!this.browser) {
      await this.initialize(options);
    }

    console.log(`📄 [PAGE] Creating new page...`);
    
    try {
      const page = await this.browser!.newPage();

      // Set user agent
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
        console.log(`🤖 [PAGE] User agent set: ${options.userAgent.substring(0, 50)}...`);
      }

      // Set viewport
      if (options.viewport) {
        await page.setViewport(options.viewport);
        console.log(`📐 [PAGE] Viewport set: ${options.viewport.width}x${options.viewport.height}`);
      }

      // Enable console logging from the page
      page.on('console', (msg) => {
        console.log(`🌐 [PAGE] Console ${msg.type()}: ${msg.text()}`);
      });

      // Track network requests for debugging
      page.on('request', (request) => {
        console.log(`🌍 [NETWORK] Request: ${request.method()} ${request.url()}`);
      });

      // Track responses for errors
      page.on('response', (response) => {
        if (!response.ok()) {
          console.log(`⚠️  [NETWORK] Failed response: ${response.status()} ${response.url()}`);
        }
      });

      this.currentPage = page;
      console.log(`✅ [PAGE] Page created successfully`);
      return page;

    } catch (error: any) {
      console.error(`💥 [PAGE] Failed to create page: ${error.message}`);
      throw new Error(`Page creation failed: ${error.message}`);
    }
  }

  /**
   * Execute a scraping instruction
   */
  async executeInstruction(page: Page, instruction: ScrapingInstruction): Promise<boolean> {
    console.log(`🎯 [ACTION] Step ${instruction.step}: ${instruction.action} - ${instruction.description}`);
    const startTime = Date.now();

    try {
      switch (instruction.action) {
        case 'navigate':
          await this.handleNavigate(page, instruction);
          break;

        case 'click':
          await this.handleClick(page, instruction);
          break;

        case 'wait':
          await this.handleWait(page, instruction);
          break;

        case 'type':
          await this.handleType(page, instruction);
          break;

        case 'scroll':
          await this.handleScroll(page, instruction);
          break;

        case 'screenshot':
          await this.handleScreenshot(page, instruction);
          break;

        case 'extract':
          // Extract is handled separately in the main scraping function
          console.log(`📊 [ACTION] Extract action - will be handled by data extractor`);
          break;

        default:
          console.log(`❌ [ACTION] Unknown action: ${instruction.action}`);
          return false;
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ [ACTION] Step ${instruction.step} completed in ${executionTime}ms`);
      return true;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`💥 [ACTION] Step ${instruction.step} failed after ${executionTime}ms: ${error.message}`);
      
      if (instruction.optional) {
        console.log(`⚠️  [ACTION] Step ${instruction.step} was optional, continuing...`);
        return true;
      }
      
      return false;
    }
  }

  /**
   * Handle navigation action
   */
  private async handleNavigate(page: Page, instruction: ScrapingInstruction): Promise<void> {
    const timeout = instruction.timeout ?? 30000;
    console.log(`🌐 [NAVIGATE] Going to page (timeout: ${timeout}ms)`);

    await page.goto(instruction.target || page.url(), {
      waitUntil: 'networkidle2',
      timeout
    });

    console.log(`🌐 [NAVIGATE] Navigation complete: ${page.url()}`);
  }

  /**
   * Handle click action
   */
  private async handleClick(page: Page, instruction: ScrapingInstruction): Promise<void> {
    if (!instruction.target) {
      throw new Error('Click action requires a target selector');
    }

    console.log(`🖱️  [CLICK] Looking for element: ${instruction.target}`);
    
    const timeout = instruction.timeout ?? 5000;
    await page.waitForSelector(instruction.target, { timeout });
    
    const element = await page.$(instruction.target);
    if (!element) {
      throw new Error(`Element not found: ${instruction.target}`);
    }

    await element.click();
    console.log(`🖱️  [CLICK] Clicked element: ${instruction.target}`);

    // Optional wait after click
    if (instruction.waitFor === 'navigation') {
      console.log(`⏳ [CLICK] Waiting for navigation after click...`);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    }
  }

  /**
   * Handle wait action
   */
  private async handleWait(page: Page, instruction: ScrapingInstruction): Promise<void> {
    const timeout = instruction.timeout ?? 10000;

    switch (instruction.waitFor) {
      case 'selector':
        if (!instruction.target) {
          throw new Error('Wait for selector requires a target selector');
        }
        console.log(`⏳ [WAIT] Waiting for selector: ${instruction.target} (${timeout}ms)`);
        await page.waitForSelector(instruction.target, { timeout });
        break;

      case 'navigation':
        console.log(`⏳ [WAIT] Waiting for navigation (${timeout}ms)`);
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
        break;

      case 'networkidle':
        console.log(`⏳ [WAIT] Waiting for network idle (${timeout}ms)`);
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
        break;

      case 'timeout':
      default:
        console.log(`⏳ [WAIT] Waiting for ${timeout}ms`);
        await new Promise(resolve => setTimeout(resolve, timeout));
        break;
    }

    console.log(`✅ [WAIT] Wait completed`);
  }

  /**
   * Handle type action
   */
  private async handleType(page: Page, instruction: ScrapingInstruction): Promise<void> {
    if (!instruction.target || !instruction.value) {
      throw new Error('Type action requires both target selector and value');
    }

    console.log(`⌨️  [TYPE] Typing into element: ${instruction.target}`);
    
    const timeout = instruction.timeout ?? 5000;
    await page.waitForSelector(instruction.target, { timeout });
    
    await page.type(instruction.target, instruction.value);
    console.log(`⌨️  [TYPE] Typed "${instruction.value}" into ${instruction.target}`);
  }

  /**
   * Handle scroll action
   */
  private async handleScroll(page: Page, instruction: ScrapingInstruction): Promise<void> {
    console.log(`📜 [SCROLL] Scrolling page`);
    
    if (instruction.target) {
      // Scroll to specific element
      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, instruction.target);
      console.log(`📜 [SCROLL] Scrolled to element: ${instruction.target}`);
    } else {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      console.log(`📜 [SCROLL] Scrolled to bottom of page`);
    }
  }

  /**
   * Handle screenshot action
   */
  private async handleScreenshot(page: Page, instruction: ScrapingInstruction): Promise<void> {
    console.log(`📸 [SCREENSHOT] Taking screenshot`);
    
    const filename = instruction.value || `screenshot-${Date.now()}.png`;
    await page.screenshot({ 
      path: filename,
      fullPage: true 
    });
    
    console.log(`📸 [SCREENSHOT] Screenshot saved: ${filename}`);
  }

  /**
   * Extract data using the configured extractors
   */
  async extractData(page: Page, extractors: DataExtractor[]): Promise<Record<string, any>> {
    console.log(`📊 [EXTRACT] Starting data extraction with ${extractors.length} extractors`);
    const data: Record<string, any> = {};
    let successCount = 0;
    let errorCount = 0;

    for (const extractor of extractors) {
      try {
        console.log(`🔍 [EXTRACT] Extracting "${extractor.name}" using selector: ${extractor.selector}`);
        
        const result = await this.runExtractor(page, extractor);
        
        if (result !== null && result !== undefined) {
          data[extractor.name] = result;
          successCount++;
          console.log(`✅ [EXTRACT] "${extractor.name}": ${this.formatExtractedValue(result)}`);
        } else if (extractor.required) {
          errorCount++;
          console.error(`❌ [EXTRACT] Required field "${extractor.name}" returned null/undefined`);
        } else {
          console.log(`⚠️  [EXTRACT] Optional field "${extractor.name}" not found`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`💥 [EXTRACT] Error extracting "${extractor.name}": ${error.message}`);
        
        if (extractor.required) {
          throw new Error(`Required extraction failed for "${extractor.name}": ${error.message}`);
        }
      }
    }

    console.log(`📊 [EXTRACT] Extraction complete: ${successCount} successful, ${errorCount} errors`);
    return data;
  }

  /**
   * Run a single data extractor
   */
  private async runExtractor(page: Page, extractor: DataExtractor): Promise<any> {
    const attribute = extractor.attribute || 'textContent';
    
    if (extractor.multiple) {
      // Extract multiple elements
      return await page.$$eval(extractor.selector, (elements, attr) => {
        return elements.map(el => {
          const value = attr === 'textContent' ? el.textContent : el.getAttribute(attr);
          return value ? value.trim() : null;
        }).filter(Boolean);
      }, attribute);
    } else {
      // Extract single element
      return await page.$eval(extractor.selector, (element, attr) => {
        const value = attr === 'textContent' ? element.textContent : element.getAttribute(attr);
        return value ? value.trim() : null;
      }, attribute);
    }
  }

  /**
   * Format extracted value for logging
   */
  private formatExtractedValue(value: any): string {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    const str = String(value);
    return str.length > 100 ? `${str.substring(0, 100)}...` : str;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log(`🔚 [BROWSER] Closing browser...`);
      await this.browser.close();
      this.browser = null;
      this.currentPage = null;
      console.log(`✅ [BROWSER] Browser closed successfully`);
    }
  }

  /**
   * Get current page memory usage
   */
  async getMemoryUsage(): Promise<{ usedJSHeapSize: number; totalJSHeapSize: number }> {
    if (!this.currentPage) {
      return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
    }

    return await this.currentPage.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
  }
}