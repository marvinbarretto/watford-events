/**
 * Transforms raw scraped data into EventModel objects
 * Handles various date formats, data cleaning, and field mapping
 */

import { EventModel, EventCategory, createEventDefaults } from '@app/events/utils/event.model';
import { ScrapingResult } from '../data-access/ethical-scraper.service';

export interface EventExtractionResult {
  events: EventModel[];
  errors: string[];
  warnings: string[];
}

export class EventDataTransformer {
  private static readonly DATE_PATTERNS = [
    // ISO formats
    /(\d{4}-\d{2}-\d{2})/,
    // Watford Fringe format: "Thu 17 Jul 2025"
    /((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i,
    // DD Month YYYY
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
    // Month DD, YYYY
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
  ];

  private static readonly TIME_PATTERNS = [
    // HH:MM or HH:MM AM/PM
    /(\d{1,2}:\d{2}(?:\s*[ap]m)?)/i,
    // HH.MM or HH AM/PM
    /(\d{1,2}(?:\.\d{2})?(?:\s*[ap]m)?)/i
  ];

  private static readonly CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
    music: ['concert', 'gig', 'band', 'music', 'festival', 'acoustic', 'live music', 'dj'],
    sports: ['football', 'rugby', 'cricket', 'tennis', 'match', 'tournament', 'fitness', 'yoga', 'gym'],
    arts: ['art', 'exhibition', 'gallery', 'craft', 'workshop', 'painting', 'sculpture', 'creative'],
    community: ['community', 'local', 'residents', 'neighbourhood', 'meeting', 'social'],
    education: ['course', 'lesson', 'workshop', 'training', 'class', 'seminar', 'lecture', 'learn'],
    food: ['food', 'restaurant', 'cafe', 'market', 'tasting', 'dinner', 'lunch', 'cooking'],
    nightlife: ['club', 'bar', 'pub', 'party', 'nightclub', 'drinks', 'cocktail'],
    theatre: ['theatre', 'play', 'drama', 'musical', 'performance', 'show', 'acting'],
    comedy: ['comedy', 'stand-up', 'comedian', 'funny', 'laugh', 'humor', 'improv'],
    family: ['family', 'children', 'kids', 'child', 'playground', 'activities'],
    business: ['business', 'networking', 'conference', 'meeting', 'professional', 'corporate'],
    charity: ['charity', 'fundraising', 'volunteer', 'donation', 'cause', 'support'],
    outdoor: ['park', 'outdoor', 'walking', 'hiking', 'nature', 'garden', 'adventure'],
    other: []
  };

  /**
   * Transform scraped data into EventModel objects
   */
  static transformScrapingResult(
    result: ScrapingResult,
    defaultCreatedBy: string = 'scraper-system',
    defaultOwnerId: string = 'scraper-system'
  ): EventExtractionResult {
    console.log(`🔄 [TRANSFORMER] Starting transformation for URL: ${result.url}`);
    console.log(`📊 [TRANSFORMER] Scraping success: ${result.success}`);
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const events: EventModel[] = [];

    if (!result.success) {
      console.error(`❌ [TRANSFORMER] Scraping failed, cannot transform data`);
      errors.push(`Scraping failed: ${result.errors?.join(', ')}`);
      return { events, errors, warnings };
    }

    console.log(`📋 [TRANSFORMER] Available data keys: ${Object.keys(result.data).join(', ')}`);
    console.log(`🖼️  [TRANSFORMER] Has iframes: ${!!result.data['iframes']}`);

    try {
      // Try to extract single event from main data
      console.log(`🎯 [TRANSFORMER] Attempting single event extraction from main data`);
      const mainEvent = this.extractSingleEvent(result.data, result.url, defaultCreatedBy, defaultOwnerId);
      if (mainEvent) {
        console.log(`✅ [TRANSFORMER] Successfully extracted main event: "${mainEvent.title}"`);
        events.push(mainEvent);
      } else {
        console.log(`⚠️  [TRANSFORMER] No main event could be extracted`);
      }

      // Try to extract events from iframes
      if (result.data['iframes']) {
        const iframeKeys = Object.keys(result.data['iframes']);
        console.log(`🖼️  [TRANSFORMER] Processing ${iframeKeys.length} iframes: ${iframeKeys.join(', ')}`);
        
        Object.entries(result.data['iframes']).forEach(([key, iframeData]: [string, any]) => {
          console.log(`🖼️  [TRANSFORMER] Processing iframe: ${key}`);
          if (iframeData?.data) {
            console.log(`📋 [TRANSFORMER] Iframe data keys: ${Object.keys(iframeData.data).join(', ')}`);
            const iframeEvent = this.extractSingleEvent(iframeData.data, iframeData.url || result.url, defaultCreatedBy, defaultOwnerId);
            if (iframeEvent) {
              console.log(`✅ [TRANSFORMER] Extracted iframe event: "${iframeEvent.title}"`);
              events.push(iframeEvent);
            } else {
              console.log(`⚠️  [TRANSFORMER] No event extracted from iframe: ${key}`);
            }
          } else {
            console.log(`⚠️  [TRANSFORMER] Iframe ${key} has no data`);
          }
        });
      }

      // Try to extract multiple events if data contains arrays
      console.log(`📋 [TRANSFORMER] Attempting multiple events extraction`);
      const multipleEvents = this.extractMultipleEvents(result.data, result.url, defaultCreatedBy, defaultOwnerId);
      if (multipleEvents.length > 0) {
        console.log(`✅ [TRANSFORMER] Extracted ${multipleEvents.length} events from arrays`);
        events.push(...multipleEvents);
      } else {
        console.log(`⚠️  [TRANSFORMER] No events found in array data`);
      }

      if (events.length === 0) {
        console.warn(`❌ [TRANSFORMER] Final result: No events extracted from any source`);
        warnings.push('No events could be extracted from scraped data');
      } else {
        console.log(`🎉 [TRANSFORMER] Final result: Successfully extracted ${events.length} total events`);
        events.forEach((event, index) => {
          console.log(`📅 [EVENT ${index + 1}] "${event.title}" | ${event.date} | ${event.location || 'No location'}`);
        });
      }

    } catch (error: any) {
      console.error(`💥 [TRANSFORMER] Error during transformation: ${error.message}`);
      console.error(`🔍 [TRANSFORMER] Error stack:`, error.stack);
      errors.push(`Error transforming data: ${error.message}`);
    }

    console.log(`📊 [TRANSFORMER] Transformation complete - Events: ${events.length}, Errors: ${errors.length}, Warnings: ${warnings.length}`);
    return { events, errors, warnings };
  }

  /**
   * Extract a single event from scraped data
   */
  private static extractSingleEvent(
    data: Record<string, any>,
    sourceUrl: string,
    createdBy: string,
    ownerId: string
  ): EventModel | null {
    console.log(`🔍 [EXTRACT] Attempting to extract single event from data`);
    console.log(`📋 [EXTRACT] Data keys available: ${Object.keys(data).join(', ')}`);
    
    const title = this.extractTitle(data);
    console.log(`📝 [EXTRACT] Title extraction result: "${title || 'NOT_FOUND'}"`);
    if (!title) {
      console.warn(`❌ [EXTRACT] Cannot create event - no title found`);
      return null; // Title is required
    }

    const date = this.extractDate(data);
    console.log(`📅 [EXTRACT] Date extraction result: "${date || 'NOT_FOUND'}"`);
    if (!date) {
      console.warn(`❌ [EXTRACT] Cannot create event - no date found`);
      return null; // Date is required
    }

    const now = new Date();
    const eventDefaults = createEventDefaults();

    // Extract all other fields with logging
    const description = this.extractDescription(data);
    console.log(`📄 [EXTRACT] Description: ${description ? `"${description.substring(0, 50)}..."` : 'NOT_FOUND'}`);
    
    const startTime = this.extractStartTime(data);
    console.log(`⏰ [EXTRACT] Start time: ${startTime || 'NOT_FOUND'}`);
    
    const endTime = this.extractEndTime(data);
    console.log(`⏰ [EXTRACT] End time: ${endTime || 'NOT_FOUND'}`);
    
    const location = this.extractLocation(data);
    console.log(`📍 [EXTRACT] Location: ${location || 'NOT_FOUND'}`);
    
    const organizer = this.extractOrganizer(data);
    console.log(`👤 [EXTRACT] Organizer: ${organizer || 'NOT_FOUND'}`);
    
    const website = this.extractWebsite(data);
    console.log(`🌐 [EXTRACT] Website: ${website || `Using source URL: ${sourceUrl}`}`);
    
    const ticketInfo = this.extractTicketInfo(data);
    console.log(`🎫 [EXTRACT] Ticket info: ${ticketInfo || 'NOT_FOUND'}`);
    
    const contactInfo = this.extractContactInfo(data);
    console.log(`📞 [EXTRACT] Contact info: ${contactInfo || 'NOT_FOUND'}`);
    
    const categories = this.classifyEvent(title, data);
    console.log(`🏷️  [EXTRACT] Categories: ${categories.join(', ')}`);

    const eventId = this.generateEventId(title, date);
    console.log(`🆔 [EXTRACT] Generated ID: ${eventId}`);

    const event: EventModel = {
      ...eventDefaults,
      id: eventId,
      title,
      date,
      description,
      startTime,
      endTime,
      location,
      organizer,
      website: website || sourceUrl,
      ticketInfo,
      contactInfo,
      categories,
      createdAt: now,
      updatedAt: now,
      createdBy,
      ownerId,
      status: 'draft',
      attendeeIds: [],
      eventType: 'single'
    };

    console.log(`✅ [EXTRACT] Successfully created event object for: "${title}"`);
    return event;
  }

  /**
   * Extract multiple events from array data
   */
  private static extractMultipleEvents(
    data: Record<string, any>,
    sourceUrl: string,
    createdBy: string,
    ownerId: string
  ): EventModel[] {
    console.log(`📋 [MULTI-EXTRACT] Searching for multiple events in array data`);
    const events: EventModel[] = [];

    // Look for array fields that might contain event data
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        console.log(`📋 [MULTI-EXTRACT] Found array field "${key}" with ${value.length} items`);
        
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            console.log(`🔍 [MULTI-EXTRACT] Processing array item ${index + 1} from "${key}"`);
            console.log(`📋 [MULTI-EXTRACT] Item keys: ${Object.keys(item).join(', ')}`);
            
            const event = this.extractSingleEvent(item, sourceUrl, createdBy, ownerId);
            if (event) {
              console.log(`✅ [MULTI-EXTRACT] Successfully extracted event from array item ${index + 1}: "${event.title}"`);
              events.push(event);
            } else {
              console.log(`⚠️  [MULTI-EXTRACT] No event extracted from array item ${index + 1}`);
            }
          } else {
            console.log(`⚠️  [MULTI-EXTRACT] Array item ${index + 1} is not an object, skipping`);
          }
        });
      } else {
        console.log(`🔍 [MULTI-EXTRACT] Field "${key}" is not an array (${typeof value}), skipping`);
      }
    });

    console.log(`📊 [MULTI-EXTRACT] Total events extracted from arrays: ${events.length}`);
    return events;
  }

  /**
   * Extract title from various possible fields
   */
  private static extractTitle(data: Record<string, any>): string | null {
    const titleFields = ['title', 'name', 'event_title', 'event_name', 'heading', 'h1'];
    
    console.log(`📝 [TITLE] Searching for title in fields: ${titleFields.join(', ')}`);
    
    for (const field of titleFields) {
      const value = data[field];
      console.log(`📝 [TITLE] Checking field "${field}": ${value ? `"${value}"` : 'NOT_FOUND'}`);
      
      if (typeof value === 'string' && value.trim().length > 0) {
        const cleanTitle = value.trim();
        console.log(`✅ [TITLE] Found title in field "${field}": "${cleanTitle}"`);
        return cleanTitle;
      }
    }

    console.log(`❌ [TITLE] No title found in any expected fields`);
    return null;
  }

  /**
   * Extract date and convert to YYYY-MM-DD format
   */
  private static extractDate(data: Record<string, any>): string | null {
    const dateFields = ['date', 'event_date', 'start_date', 'when', 'datetime', 'publishDate', 'date_range'];
    
    console.log(`📅 [DATE] Searching for date in fields: ${dateFields.join(', ')}`);
    
    for (const field of dateFields) {
      const value = data[field];
      console.log(`📅 [DATE] Checking field "${field}": ${value ? `"${value}"` : 'NOT_FOUND'}`);
      
      if (value) {
        const dateStr = this.parseDate(value.toString());
        if (dateStr) {
          console.log(`✅ [DATE] Found date in field "${field}": "${dateStr}"`);
          return dateStr;
        } else {
          console.log(`⚠️  [DATE] Field "${field}" has value but couldn't parse date from: "${value}"`);
        }
      }
    }

    // Try to extract date from any string field
    console.log(`🔍 [DATE] No date found in expected fields, searching all text content`);
    const allText = Object.values(data).join(' ');
    console.log(`📄 [DATE] All text content (first 200 chars): "${allText.substring(0, 200)}..."`);
    
    const parsedDate = this.parseDate(allText);
    if (parsedDate) {
      console.log(`✅ [DATE] Found date in text content: "${parsedDate}"`);
    } else {
      console.log(`❌ [DATE] No date found anywhere in the data`);
    }
    
    return parsedDate;
  }

  /**
   * Parse date from text using various patterns
   */
  private static parseDate(text: string): string | null {
    console.log(`🔍 [PARSE-DATE] Attempting to parse date from: "${text.substring(0, 100)}..."`);
    
    for (let i = 0; i < this.DATE_PATTERNS.length; i++) {
      const pattern = this.DATE_PATTERNS[i];
      console.log(`🔍 [PARSE-DATE] Trying pattern ${i + 1}: ${pattern}`);
      
      const match = text.match(pattern);
      if (match) {
        console.log(`🎯 [PARSE-DATE] Pattern ${i + 1} matched: "${match[1]}"`);
        
        try {
          const dateStr = match[1];
          const date = new Date(dateStr);
          
          if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().split('T')[0];
            console.log(`✅ [PARSE-DATE] Successfully parsed date: "${formattedDate}"`);
            return formattedDate; // YYYY-MM-DD format
          } else {
            console.log(`⚠️  [PARSE-DATE] Pattern matched but invalid date: "${dateStr}"`);
          }
        } catch (error: any) {
          console.log(`⚠️  [PARSE-DATE] Pattern matched but parsing failed: ${error.message}`);
          continue;
        }
      } else {
        console.log(`❌ [PARSE-DATE] Pattern ${i + 1} did not match`);
      }
    }
    
    console.log(`❌ [PARSE-DATE] No date patterns matched in text`);
    return null;
  }

  /**
   * Extract start time
   */
  private static extractStartTime(data: Record<string, any>): string | undefined {
    const timeFields = ['start_time', 'time', 'startTime', 'when'];
    
    for (const field of timeFields) {
      const value = data[field];
      if (value) {
        const timeStr = this.parseTime(value.toString());
        if (timeStr) {
          return timeStr;
        }
      }
    }

    // Try to extract time from description or title
    const allText = [data['title'], data['description'], data['when']].join(' ');
    return this.parseTime(allText);
  }

  /**
   * Extract end time
   */
  private static extractEndTime(data: Record<string, any>): string | undefined {
    const timeFields = ['end_time', 'endTime', 'until'];
    
    for (const field of timeFields) {
      const value = data[field];
      if (value) {
        const timeStr = this.parseTime(value.toString());
        if (timeStr) {
          return timeStr;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse time from text and convert to HH:MM format
   */
  private static parseTime(text: string): string | undefined {
    for (const pattern of this.TIME_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        let timeStr = match[1].toLowerCase();
        
        // Handle AM/PM
        const isAM = timeStr.includes('am');
        const isPM = timeStr.includes('pm');
        timeStr = timeStr.replace(/[ap]m/g, '').trim();
        
        // Handle dots instead of colons
        timeStr = timeStr.replace('.', ':');
        
        // Parse hour and minute
        const [hourStr, minuteStr = '00'] = timeStr.split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);
        
        if (isPM && hour !== 12) {
          hour += 12;
        } else if (isAM && hour === 12) {
          hour = 0;
        }
        
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract description
   */
  private static extractDescription(data: Record<string, any>): string | undefined {
    const descFields = ['description', 'content', 'details', 'summary', 'about'];
    
    for (const field of descFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Extract location
   */
  private static extractLocation(data: Record<string, any>): string | undefined {
    const locationFields = ['location', 'venue', 'address', 'where', 'place'];
    
    for (const field of locationFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Extract organizer
   */
  private static extractOrganizer(data: Record<string, any>): string | undefined {
    const organizerFields = ['organizer', 'organiser', 'host', 'by', 'author'];
    
    for (const field of organizerFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Extract website URL
   */
  private static extractWebsite(data: Record<string, any>): string | undefined {
    const websiteFields = ['website', 'url', 'link', 'more_info'];
    
    for (const field of websiteFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        try {
          new URL(value); // Validate URL
          return value.trim();
        } catch {
          continue;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract ticket information
   */
  private static extractTicketInfo(data: Record<string, any>): string | undefined {
    const ticketFields = ['tickets', 'price', 'cost', 'booking', 'ticketInfo'];
    
    for (const field of ticketFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Extract contact information
   */
  private static extractContactInfo(data: Record<string, any>): string | undefined {
    const contactFields = ['contact', 'email', 'phone', 'contactInfo'];
    
    for (const field of contactFields) {
      const value = data[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Classify event based on title and content
   */
  private static classifyEvent(title: string, data: Record<string, any>): EventCategory[] {
    const allText = [title, data['description'], data['content']].join(' ').toLowerCase();
    const categories: EventCategory[] = [];

    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        categories.push(category as EventCategory);
        if (categories.length >= 3) break; // Limit to max 3 categories
      }
    }

    return categories.length > 0 ? categories : ['other'];
  }

  /**
   * Generate a unique event ID based on title and date
   */
  private static generateEventId(title: string, date: string): string {
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    return `${titleSlug}-${date}`;
  }
}