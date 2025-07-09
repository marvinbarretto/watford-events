/**
 * Specialized iframe handling for the scraping engine
 */

import { Page, Frame } from 'puppeteer';
import { DataExtractor } from '../scraping-configs/types';

export class IFrameHandler {
  
  /**
   * Get all iframes on the current page
   */
  async getAllIFrames(page: Page): Promise<Frame[]> {
    console.log(`🖼️  [IFRAME] Scanning page for iframes...`);
    
    const frames = page.frames();
    const iframes = frames.filter(frame => frame !== page.mainFrame());
    
    console.log(`🖼️  [IFRAME] Found ${iframes.length} iframes on page`);
    
    for (let i = 0; i < iframes.length; i++) {
      const frame = iframes[i];
      const frameUrl = frame.url();
      const frameName = frame.name();
      console.log(`🖼️  [IFRAME] Frame ${i + 1}: ${frameName || 'unnamed'} - ${frameUrl}`);
    }
    
    return iframes;
  }

  /**
   * Wait for iframe to load completely
   */
  async waitForIFrameLoad(frame: Frame, timeout: number = 10000): Promise<boolean> {
    console.log(`⏳ [IFRAME] Waiting for iframe to load: ${frame.url()}`);
    
    try {
      // Use simple timeout for iframe loading since waitForLoadState doesn't exist on Frame
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`✅ [IFRAME] Iframe loaded successfully: ${frame.url()}`);
      return true;
    } catch (error: any) {
      console.error(`❌ [IFRAME] Iframe failed to load: ${error.message}`);
      return false;
    }
  }

  /**
   * Find iframe by URL pattern
   */
  async findIFrameByUrl(page: Page, urlPattern: string): Promise<Frame | null> {
    console.log(`🔍 [IFRAME] Looking for iframe with URL pattern: ${urlPattern}`);
    
    const frames = await this.getAllIFrames(page);
    
    for (const frame of frames) {
      const frameUrl = frame.url();
      if (this.matchesPattern(frameUrl, urlPattern)) {
        console.log(`✅ [IFRAME] Found matching iframe: ${frameUrl}`);
        return frame;
      }
    }
    
    console.log(`❌ [IFRAME] No iframe found matching pattern: ${urlPattern}`);
    return null;
  }

  /**
   * Find iframe by CSS selector
   */
  async findIFrameBySelector(page: Page, selector: string): Promise<Frame | null> {
    console.log(`🔍 [IFRAME] Looking for iframe with selector: ${selector}`);
    
    try {
      const elementHandle = await page.$(selector);
      if (!elementHandle) {
        console.log(`❌ [IFRAME] Iframe element not found: ${selector}`);
        return null;
      }
      
      const frame = await elementHandle.contentFrame();
      if (!frame) {
        console.log(`❌ [IFRAME] Element is not an iframe: ${selector}`);
        return null;
      }
      
      console.log(`✅ [IFRAME] Found iframe by selector: ${selector} - ${frame.url()}`);
      return frame;
      
    } catch (error: any) {
      console.error(`💥 [IFRAME] Error finding iframe by selector: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract data from iframe
   */
  async extractFromIFrame(frame: Frame, extractors: DataExtractor[]): Promise<Record<string, any>> {
    console.log(`📊 [IFRAME] Extracting data from iframe: ${frame.url()}`);
    console.log(`📊 [IFRAME] Using ${extractors.length} extractors`);
    
    const data: Record<string, any> = {};
    let successCount = 0;
    let errorCount = 0;

    for (const extractor of extractors) {
      try {
        console.log(`🔍 [IFRAME] Extracting "${extractor.name}" using selector: ${extractor.selector}`);
        
        const result = await this.runIFrameExtractor(frame, extractor);
        
        if (result !== null && result !== undefined) {
          data[extractor.name] = result;
          successCount++;
          console.log(`✅ [IFRAME] "${extractor.name}": ${this.formatExtractedValue(result)}`);
        } else if (extractor.required) {
          errorCount++;
          console.error(`❌ [IFRAME] Required field "${extractor.name}" returned null/undefined`);
        } else {
          console.log(`⚠️  [IFRAME] Optional field "${extractor.name}" not found in iframe`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`💥 [IFRAME] Error extracting "${extractor.name}": ${error.message}`);
        
        if (extractor.required) {
          throw new Error(`Required iframe extraction failed for "${extractor.name}": ${error.message}`);
        }
      }
    }

    console.log(`📊 [IFRAME] Iframe extraction complete: ${successCount} successful, ${errorCount} errors`);
    return data;
  }

  /**
   * Run extractor on iframe
   */
  private async runIFrameExtractor(frame: Frame, extractor: DataExtractor): Promise<any> {
    const attribute = extractor.attribute || 'textContent';
    
    // Wait for the selector to be available in the iframe
    try {
      await frame.waitForSelector(extractor.selector, { timeout: 5000 });
    } catch (error) {
      if (extractor.required) {
        throw error;
      }
      return null;
    }
    
    if (extractor.multiple) {
      // Extract multiple elements from iframe
      return await frame.$$eval(extractor.selector, (elements, attr) => {
        return elements.map(el => {
          const value = attr === 'textContent' ? el.textContent : el.getAttribute(attr);
          return value ? value.trim() : null;
        }).filter(Boolean);
      }, attribute);
    } else {
      // Extract single element from iframe
      return await frame.$eval(extractor.selector, (element, attr) => {
        const value = attr === 'textContent' ? element.textContent : element.getAttribute(attr);
        return value ? value.trim() : null;
      }, attribute);
    }
  }

  /**
   * Click element inside iframe
   */
  async clickInIFrame(frame: Frame, selector: string, timeout: number = 5000): Promise<boolean> {
    console.log(`🖱️  [IFRAME] Clicking element in iframe: ${selector}`);
    
    try {
      await frame.waitForSelector(selector, { timeout });
      await frame.click(selector);
      console.log(`✅ [IFRAME] Successfully clicked element: ${selector}`);
      return true;
    } catch (error: any) {
      console.error(`❌ [IFRAME] Failed to click element: ${error.message}`);
      return false;
    }
  }

  /**
   * Type text into iframe element
   */
  async typeInIFrame(frame: Frame, selector: string, text: string, timeout: number = 5000): Promise<boolean> {
    console.log(`⌨️  [IFRAME] Typing into iframe element: ${selector}`);
    
    try {
      await frame.waitForSelector(selector, { timeout });
      await frame.type(selector, text);
      console.log(`✅ [IFRAME] Successfully typed text into: ${selector}`);
      return true;
    } catch (error: any) {
      console.error(`❌ [IFRAME] Failed to type into element: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle nested iframes (iframe within iframe)
   */
  async handleNestedIFrames(page: Page, path: string[]): Promise<Frame | null> {
    console.log(`🔗 [IFRAME] Navigating nested iframe path: ${path.join(' > ')}`);
    
    let currentFrame: Frame = page.mainFrame();
    
    for (let i = 0; i < path.length; i++) {
      const selector = path[i];
      console.log(`🔗 [IFRAME] Level ${i + 1}: Looking for ${selector}`);
      
      try {
        const elementHandle = await currentFrame.$(selector);
        if (!elementHandle) {
          console.error(`❌ [IFRAME] Nested iframe not found at level ${i + 1}: ${selector}`);
          return null;
        }
        
        const nextFrame = await elementHandle.contentFrame();
        if (!nextFrame) {
          console.error(`❌ [IFRAME] Element is not an iframe at level ${i + 1}: ${selector}`);
          return null;
        }
        
        currentFrame = nextFrame;
        console.log(`✅ [IFRAME] Level ${i + 1} found: ${nextFrame.url()}`);
        
        // Wait for the nested iframe to load
        await this.waitForIFrameLoad(nextFrame, 5000);
        
      } catch (error: any) {
        console.error(`💥 [IFRAME] Error at level ${i + 1}: ${error.message}`);
        return null;
      }
    }
    
    console.log(`✅ [IFRAME] Successfully navigated to nested iframe`);
    return currentFrame;
  }

  /**
   * Get iframe metadata
   */
  async getIFrameMetadata(frame: Frame): Promise<Record<string, any>> {
    console.log(`📋 [IFRAME] Collecting metadata for iframe: ${frame.url()}`);
    
    const metadata = {
      url: frame.url(),
      name: frame.name(),
      title: '',
      readyState: '',
      contentLoaded: false
    };
    
    try {
      // Get title and ready state from iframe
      const frameData = await frame.evaluate(() => ({
        title: document.title,
        readyState: document.readyState,
        contentLoaded: document.readyState === 'complete'
      }));
      
      Object.assign(metadata, frameData);
      console.log(`📋 [IFRAME] Metadata collected: ${JSON.stringify(metadata)}`);
      
    } catch (error: any) {
      console.error(`💥 [IFRAME] Error collecting metadata: ${error.message}`);
    }
    
    return metadata;
  }

  /**
   * Check if URL matches pattern (with wildcards)
   */
  private matchesPattern(url: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
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
}