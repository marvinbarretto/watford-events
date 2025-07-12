import { Injectable, inject } from '@angular/core';
import { 
  DataSourceProcessor, 
  DataSourceType, 
  DataSourceInput, 
  ProcessingResult,
  ExtendedParsedEventData,
  ParsedEventField
} from './data-source-processor.interface';
import { TextProcessorService } from './text-processor.service';
import { EventCategory } from '@events/utils/event.model';

/**
 * URL-based event data processor
 * Scrapes web pages and extracts event information
 */
@Injectable({
  providedIn: 'root'
})
export class URLProcessorService extends DataSourceProcessor {
  readonly sourceType: DataSourceType = 'url';
  readonly priority: number = 70; // High priority for structured data sources
  
  private readonly _textProcessor = inject(TextProcessorService);

  getName(): string {
    return 'Web Scraper';
  }

  canProcess(input: DataSourceInput): boolean {
    if (input.type !== 'url' || typeof input.data !== 'string') return false;
    
    try {
      const url = new URL(input.data);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  override getDefaultOptions(): Record<string, any> {
    return {
      timeout: 10000,
      followRedirects: true,
      respectRobotsTxt: true,
      userAgent: 'Watford Events Parser Bot'
    };
  }

  async process(input: DataSourceInput): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.canProcess(input)) {
        return {
          success: false,
          error: 'Invalid input for URL processor - expected valid HTTP(S) URL',
          processingTime: Date.now() - startTime
        };
      }

      const url = input.data as string;
      const options = { ...this.getDefaultOptions(), ...input.options };
      
      // Fetch the web page content
      const content = await this.fetchWebPageContent(url, options);
      
      if (!content.success) {
        return {
          success: false,
          error: content.error,
          processingTime: Date.now() - startTime,
          metadata: { url }
        };
      }
      
      // Extract event data from the scraped content
      const eventData = await this.extractEventDataFromWebContent(
        content.data!,
        url,
        options
      );
      
      const warnings = this.validateData(eventData);
      
      return {
        success: true,
        data: eventData,
        warnings: warnings.length > 0 ? warnings : undefined,
        processingTime: Date.now() - startTime,
        metadata: {
          url,
          contentLength: content.data!.text.length,
          contentType: content.data!.contentType,
          statusCode: content.data!.statusCode
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `URL processing failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  private async fetchWebPageContent(
    url: string, 
    options: Record<string, any>
  ): Promise<{ success: boolean; data?: WebContent; error?: string }> {
    try {
      // For client-side, we'll need to use a proxy or CORS-enabled service
      // In a real implementation, this would go through a backend service
      
      // For now, simulate fetching with a simple fetch call
      // This will only work for CORS-enabled sites
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': options['userAgent']
        },
        signal: AbortSignal.timeout(options['timeout'])
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const text = await response.text();
      const contentType = response.headers.get('content-type') || 'text/html';
      
      return {
        success: true,
        data: {
          text,
          contentType,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
      
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return {
          success: false,
          error: 'Request timeout - page took too long to load'
        };
      }
      
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  private async extractEventDataFromWebContent(
    content: WebContent,
    sourceUrl: string,
    options: Record<string, any>
  ): Promise<ExtendedParsedEventData> {
    // Extract text content from HTML
    const textContent = this.extractTextFromHTML(content.text);
    
    // Check for structured data (JSON-LD, microdata, etc.)
    const structuredData = this.extractStructuredData(content.text);
    
    // Use text processor as fallback for general content
    const textResult = await this._textProcessor.process({
      type: 'text',
      data: textContent,
      priority: 50
    });
    
    let baseData = textResult.success ? textResult.data! : this.createEmptyData('url');
    
    // Enhance with structured data if available
    if (structuredData) {
      baseData = this.mergeStructuredData(baseData, structuredData);
    }
    
    // Enhance with URL-specific metadata
    baseData.sourceType = 'url';
    baseData.sourceUrl = sourceUrl;
    baseData.metadata = {
      ...baseData.metadata,
      hasStructuredData: !!structuredData,
      contentType: content.contentType,
      extractedTextLength: textContent.length
    };
    
    // URL-specific confidence adjustments
    if (structuredData) {
      baseData.overallConfidence = Math.min(baseData.overallConfidence + 20, 100);
    }
    
    return baseData;
  }

  private extractTextFromHTML(html: string): string {
    // Create a temporary DOM element to extract text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style, noscript');
    scripts.forEach(element => element.remove());
    
    // Extract text content
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up the text
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  private extractStructuredData(html: string): StructuredEventData | null {
    try {
      // Look for JSON-LD structured data
      const jsonLdMatches = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/gis);
      
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
          try {
            const data = JSON.parse(jsonContent);
            const eventData = this.extractEventFromJsonLd(data);
            if (eventData) return eventData;
          } catch (e) {
            // Continue to next match
          }
        }
      }
      
      // Look for microdata (basic implementation)
      const microdataEvent = this.extractMicrodata(html);
      if (microdataEvent) return microdataEvent;
      
      // Look for meta tags
      const metaData = this.extractMetaTags(html);
      if (metaData) return metaData;
      
    } catch (error) {
      console.warn('[URLProcessor] Error extracting structured data:', error);
    }
    
    return null;
  }

  private extractEventFromJsonLd(data: any): StructuredEventData | null {
    // Handle array of items
    if (Array.isArray(data)) {
      for (const item of data) {
        const eventData = this.extractEventFromJsonLd(item);
        if (eventData) return eventData;
      }
      return null;
    }
    
    // Check if this is an Event type
    if (data['@type'] === 'Event' || data.type === 'Event') {
      return {
        title: data.name || data.title,
        description: data.description,
        date: data.startDate || data.dateTime,
        location: data.location?.name || data.location?.address?.streetAddress || data.location,
        organizer: data.organizer?.name || data.organizer,
        website: data.url,
        ticketInfo: data.offers?.price || data.offers?.url,
        contactInfo: data.organizer?.email || data.organizer?.telephone
      };
    }
    
    return null;
  }

  private extractMicrodata(html: string): StructuredEventData | null {
    // Basic microdata extraction for events
    // This would need a proper HTML parser for production use
    const eventRegex = /itemtype=["\']http:\/\/schema\.org\/Event["\'][^>]*>(.*?)<\/[^>]*>/gis;
    const matches = html.match(eventRegex);
    
    if (matches && matches.length > 0) {
      // Extract properties from the first event found
      const eventHtml = matches[0];
      
      return {
        title: this.extractMicrodataProperty(eventHtml, 'name'),
        description: this.extractMicrodataProperty(eventHtml, 'description'),
        date: this.extractMicrodataProperty(eventHtml, 'startDate'),
        location: this.extractMicrodataProperty(eventHtml, 'location'),
        organizer: this.extractMicrodataProperty(eventHtml, 'organizer')
      };
    }
    
    return null;
  }

  private extractMicrodataProperty(html: string, property: string): string | undefined {
    const regex = new RegExp(`itemprop=["\']${property}["\'][^>]*content=["\']([^"\']*)["\']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : undefined;
  }

  private extractMetaTags(html: string): StructuredEventData | null {
    const metaData: any = {};
    
    // Extract various meta tags that might contain event info
    const metaPatterns = [
      { name: 'title', patterns: ['og:title', 'twitter:title', 'title'] },
      { name: 'description', patterns: ['og:description', 'twitter:description', 'description'] },
      { name: 'date', patterns: ['event:start_time', 'article:published_time'] },
      { name: 'location', patterns: ['event:location', 'geo:placename'] },
      { name: 'website', patterns: ['og:url', 'canonical'] }
    ];
    
    for (const { name, patterns } of metaPatterns) {
      for (const pattern of patterns) {
        const regex = new RegExp(`<meta[^>]*(?:name|property)=["\']${pattern}["\'][^>]*content=["\']([^"\']*)["\']`, 'i');
        const match = html.match(regex);
        if (match && match[1]) {
          metaData[name] = match[1];
          break;
        }
      }
    }
    
    // Only return if we found meaningful data
    if (Object.keys(metaData).length > 1) {
      return metaData;
    }
    
    return null;
  }

  private mergeStructuredData(
    baseData: ExtendedParsedEventData, 
    structuredData: StructuredEventData
  ): ExtendedParsedEventData {
    // Merge structured data with higher confidence
    const mergeField = (field: keyof StructuredEventData, confidence: number = 90) => {
      if (structuredData[field] && structuredData[field].trim()) {
        return {
          value: structuredData[field]!,
          confidence,
          source: `${this.getName()} (Structured Data)`,
          sourceText: structuredData[field]!
        };
      }
      return baseData[field as keyof ExtendedParsedEventData] as ParsedEventField;
    };
    
    return {
      ...baseData,
      title: mergeField('title', 95),
      description: mergeField('description', 90),
      date: mergeField('date', 85),
      location: mergeField('location', 90),
      organizer: mergeField('organizer', 85),
      website: mergeField('website', 95),
      ticketInfo: mergeField('ticketInfo', 80),
      contactInfo: mergeField('contactInfo', 85)
    };
  }

  protected override validateData(data: ExtendedParsedEventData): string[] {
    const warnings = super.validateData(data);
    
    // URL-specific validations
    if (!data.sourceUrl) {
      warnings.push('No source URL recorded');
    }
    
    if (data.overallConfidence < 50) {
      warnings.push('Low confidence extraction from web page - content may be poorly structured');
    }
    
    // Check for common web scraping issues
    if (data.title.value && data.title.value.includes('403') || data.title.value.includes('404')) {
      warnings.push('Title suggests page access error');
    }
    
    return warnings;
  }
}

// Supporting interfaces
interface WebContent {
  text: string;
  contentType: string;
  statusCode: number;
  headers: Record<string, string>;
}

interface StructuredEventData {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  organizer?: string;
  website?: string;
  ticketInfo?: string;
  contactInfo?: string;
}