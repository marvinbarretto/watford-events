import { Injectable } from '@angular/core';
import { EventCategory } from '@events/utils/event.model';
import { 
  DataSourceProcessor, 
  DataSourceType, 
  DataSourceInput, 
  ProcessingResult,
  ExtendedParsedEventData,
  ParsedEventField
} from './data-source-processor.interface';

/**
 * Text-based event data processor
 * Handles plain text input using rule-based parsing
 */
@Injectable({
  providedIn: 'root'
})
export class TextProcessorService extends DataSourceProcessor {
  readonly sourceType: DataSourceType = 'text';
  readonly priority: number = 50; // Medium priority - good for fallback
  
  private readonly categoryKeywords = {
    music: ['concert', 'gig', 'band', 'singer', 'festival', 'music', 'acoustic', 'live music', 'dj', 'disco', 'songwriter'],
    sports: ['football', 'rugby', 'cricket', 'tennis', 'basketball', 'swimming', 'running', 'marathon', 'fitness', 'match', 'game'],
    arts: ['exhibition', 'gallery', 'art', 'painting', 'sculpture', 'craft', 'pottery', 'drawing', 'creative', 'artist'],
    community: ['meeting', 'community', 'residents', 'local', 'neighbourhood', 'council', 'group', 'society', 'social'],
    education: ['workshop', 'course', 'class', 'lecture', 'seminar', 'training', 'learning', 'education', 'talk'],
    food: ['market', 'food', 'restaurant', 'cafe', 'tasting', 'cooking', 'chef', 'dining', 'wine', 'beer', 'meal'],
    nightlife: ['party', 'club', 'bar', 'nightclub', 'late night', 'dancing', 'drinks', 'cocktails', 'evening'],
    theatre: ['theatre', 'theater', 'play', 'drama', 'musical', 'performance', 'acting', 'stage', 'show'],
    comedy: ['comedy', 'comedian', 'stand-up', 'funny', 'laugh', 'humor', 'entertainment', 'jokes'],
    family: ['family', 'children', 'kids', 'playground', 'baby', 'toddler', 'parent', 'child-friendly', 'all ages'],
    business: ['business', 'networking', 'conference', 'meeting', 'corporate', 'professional', 'entrepreneur'],
    charity: ['charity', 'fundraising', 'donation', 'volunteer', 'helping', 'support', 'cause', 'benefit'],
    outdoor: ['park', 'garden', 'outdoor', 'nature', 'walking', 'hiking', 'cycling', 'adventure', 'fresh air']
  };

  private readonly patterns = {
    // Enhanced date patterns
    date: [
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/gi,
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}/gi,
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi,
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}/gi,
      // New patterns for better coverage
      /\d{4}-\d{2}-\d{2}/gi, // ISO format
      /(?:today|tomorrow|next\s+(?:week|month|year))/gi, // Relative dates
      /(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi
    ],
    // Enhanced time patterns  
    time: [
      /\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)/gi,
      /\d{1,2}\s*(?:am|pm|AM|PM)/gi,
      /\d{1,2}:\d{2}/gi,
      /(?:doors?\s+(?:open\s+)?)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/gi,
      // New time patterns
      /(?:starts?\s+(?:at\s+)?)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/gi,
      /(?:from\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/gi
    ],
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    phone: /(?:\+44\s?|0)(?:\d{4}\s?\d{3}\s?\d{3}|\d{3}\s?\d{3}\s?\d{4}|\d{10,11})/gi,
    website: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi,
    price: [
      /£\d+(?:\.\d{2})?(?:\s*-\s*£?\d+(?:\.\d{2})?)?/gi,
      /\d+(?:\.\d{2})?\s*(?:pounds?|quid)/gi,
      /free(?:\s+(?:entry|admission))?/gi,
      /advance\s+£?\d+(?:\.\d{2})?,?\s*door\s+£?\d+(?:\.\d{2})?/gi,
      // New price patterns
      /tickets?\s*:?\s*£?\d+(?:\.\d{2})?/gi,
      /entry\s*:?\s*£?\d+(?:\.\d{2})?/gi,
      /admission\s*:?\s*£?\d+(?:\.\d{2})?/gi
    ],
    hashtag: /#[a-zA-Z0-9_]+/gi,
    location: [
      /(?:at|venue|location|address|held\s+at)\s*:?\s*([^,\n\r]+)/gi,
      /([^,\n\r]*(?:hall|centre|center|church|school|park|road|street|lane|avenue|drive|square|place)[^,\n\r]*)/gi,
      // New location patterns
      /(?:where|venue)\s*:?\s*([^\n\r]+)/gi,
      /([A-Z][a-z]+\s+(?:Hall|Centre|Center|Club|Pub|Bar|Theatre|Theater|Stadium|Park|Museum|Restaurant))/gi
    ]
  };

  getName(): string {
    return 'Text Parser';
  }

  canProcess(input: DataSourceInput): boolean {
    return input.type === 'text' && typeof input.data === 'string' && input.data.trim().length > 0;
  }

  async process(input: DataSourceInput): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.canProcess(input)) {
        return {
          success: false,
          error: 'Invalid input for text processor',
          processingTime: Date.now() - startTime
        };
      }

      const text = input.data as string;
      const data = this.parseEventText(text);
      const warnings = this.validateData(data);
      
      return {
        success: true,
        data,
        warnings: warnings.length > 0 ? warnings : undefined,
        processingTime: Date.now() - startTime,
        metadata: {
          textLength: text.length,
          lineCount: text.split('\n').length
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Text processing failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  private parseEventText(text: string): ExtendedParsedEventData {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let overallConfidence = 0;
    const maxConfidence = 150;

    // Parse all fields
    const title = this.parseTitle(text, lines);
    if (title.value) overallConfidence += 25;

    const description = this.parseDescription(text, lines, title.value);
    if (description.value) overallConfidence += 15;

    const date = this.parseDateTime(text);
    if (date.value) overallConfidence += 25;

    const location = this.parseLocation(text, lines);
    if (location?.value) overallConfidence += 20;

    const contactInfo = this.parseContactInfo(text);
    if (contactInfo?.value) overallConfidence += 10;

    const website = this.parseWebsite(text);
    if (website?.value) overallConfidence += 10;

    const organizer = this.parseOrganizer(text);
    if (organizer?.value) overallConfidence += 15;

    const ticketInfo = this.parseTicketInfo(text);
    if (ticketInfo?.value) overallConfidence += 10;

    const categories = this.parseCategories(text);
    if (categories.length > 0) overallConfidence += 15;

    const tags = this.parseTags(text);
    if (tags.length > 0) overallConfidence += 10;

    return {
      title,
      description,
      date,
      location,
      organizer,
      ticketInfo,
      contactInfo,
      website,
      categories,
      tags,
      overallConfidence: Math.min(Math.round((overallConfidence / maxConfidence) * 100), 100),
      sourceType: 'text',
      processingTime: 0, // Will be set by caller
      metadata: {
        lineCount: lines.length,
        textLength: text.length
      }
    };
  }

  private parseTitle(text: string, lines: string[]): ParsedEventField {
    const candidates = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 3 && 
             trimmed.length < 100 && 
             !trimmed.includes('@') && 
             !trimmed.includes('http') &&
             !trimmed.match(/\d{1,2}[\/\-\.]\d{1,2}/);
    });

    const titleLine = candidates[0] || lines[0];
    if (!titleLine) {
      return { value: '', confidence: 0, source: this.getName() };
    }

    let cleanTitle = titleLine.trim()
      .replace(/^[A-Z\s]+$/, (match) => this.toTitleCase(match))
      .replace(/\s+/g, ' ')
      .slice(0, 100);

    const startIndex = text.indexOf(titleLine);
    
    return {
      value: cleanTitle,
      confidence: cleanTitle.length > 5 ? 90 : 70,
      sourceText: titleLine,
      startIndex,
      endIndex: startIndex + titleLine.length,
      source: this.getName()
    };
  }

  private parseDescription(text: string, lines: string[], titleText: string): ParsedEventField {
    const descriptionLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed !== titleText &&
             trimmed.length > 10 &&
             !trimmed.includes('@') &&
             !trimmed.includes('http') &&
             !trimmed.match(/\d{1,2}[\/\-\.]\d{1,2}/) &&
             !trimmed.match(/\d{1,2}:\d{2}/) &&
             !trimmed.startsWith('#');
    });

    if (descriptionLines.length === 0) {
      return { value: '', confidence: 0, source: this.getName() };
    }

    const description = descriptionLines.join(' ').slice(0, 500);
    const firstDescLine = descriptionLines[0];
    const startIndex = text.indexOf(firstDescLine);

    return {
      value: description,
      confidence: description.length > 20 ? 80 : 60,
      sourceText: descriptionLines.join('\n'),
      startIndex,
      endIndex: startIndex + descriptionLines.join('\n').length,
      source: this.getName()
    };
  }

  private parseDateTime(text: string): ParsedEventField {
    for (const pattern of this.patterns.date) {
      const dateMatches = text.match(pattern);
      if (dateMatches) {
        let timeMatch = '';
        for (const timePattern of this.patterns.time) {
          const timeMatches = text.match(timePattern);
          if (timeMatches) {
            timeMatch = timeMatches[0];
            break;
          }
        }

        try {
          let dateTimeString = dateMatches[0];
          if (timeMatch) {
            dateTimeString += ' ' + timeMatch;
          }
          
          const parsedDate = new Date(dateTimeString);
          if (!isNaN(parsedDate.getTime())) {
            const startIndex = text.indexOf(dateMatches[0]);
            return {
              value: parsedDate.toISOString().slice(0, 16),
              confidence: timeMatch ? 95 : 85,
              sourceText: timeMatch ? `${dateMatches[0]} ${timeMatch}` : dateMatches[0],
              startIndex,
              endIndex: startIndex + dateMatches[0].length + (timeMatch ? timeMatch.length + 1 : 0),
              source: this.getName()
            };
          }
        } catch (e) {
          continue;
        }
      }
    }

    return { value: '', confidence: 0, source: this.getName() };
  }

  private parseLocation(text: string, lines: string[]): ParsedEventField | undefined {
    for (const pattern of this.patterns.location) {
      const match = pattern.exec(text);
      if (match) {
        const location = match[1] || match[0];
        return {
          value: location.trim(),
          confidence: 85,
          sourceText: match[0],
          startIndex: match.index,
          endIndex: match.index! + match[0].length,
          source: this.getName()
        };
      }
    }

    const locationLine = lines.find(line => {
      const lower = line.toLowerCase();
      return /\b(hall|centre|center|church|school|park|road|street|lane|avenue|drive|square|place|venue)\b/.test(lower);
    });

    if (locationLine) {
      const startIndex = text.indexOf(locationLine);
      return {
        value: locationLine.trim(),
        confidence: 75,
        sourceText: locationLine,
        startIndex,
        endIndex: startIndex + locationLine.length,
        source: this.getName()
      };
    }

    return undefined;
  }

  private parseContactInfo(text: string): ParsedEventField | undefined {
    const emails = text.match(this.patterns.email);
    const phones = text.match(this.patterns.phone);
    
    if (!emails && !phones) return undefined;

    const contacts = [emails?.[0], phones?.[0]].filter(Boolean);
    const contactString = contacts.join(' | ');
    
    return {
      value: contactString,
      confidence: 90,
      sourceText: contacts.join(' '),
      source: this.getName()
    };
  }

  private parseWebsite(text: string): ParsedEventField | undefined {
    const websites = text.match(this.patterns.website);
    if (!websites) return undefined;

    let website = websites[0];
    if (!website.startsWith('http')) {
      website = 'https://' + website;
    }

    const startIndex = text.indexOf(websites[0]);
    return {
      value: website,
      confidence: 95,
      sourceText: websites[0],
      startIndex,
      endIndex: startIndex + websites[0].length,
      source: this.getName()
    };
  }

  private parseOrganizer(text: string): ParsedEventField | undefined {
    const patterns = [
      /\b(?:by|from|hosted by|organised by|organized by|presented by)\s+([^\n\r.!?]+)/gi,
      /organizer?\s*:?\s*([^\n\r.!?]+)/gi
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const organizer = match[1].trim();
        return {
          value: organizer,
          confidence: 80,
          sourceText: match[0],
          startIndex: match.index,
          endIndex: match.index! + match[0].length,
          source: this.getName()
        };
      }
    }

    return undefined;
  }

  private parseTicketInfo(text: string): ParsedEventField | undefined {
    for (const pattern of this.patterns.price) {
      const matches = text.match(pattern);
      if (matches) {
        const ticketInfo = matches.join(', ');
        const startIndex = text.indexOf(matches[0]);
        return {
          value: ticketInfo,
          confidence: 85,
          sourceText: matches.join(' '),
          startIndex,
          endIndex: startIndex + matches[0].length,
          source: this.getName()
        };
      }
    }

    return undefined;
  }

  private parseCategories(text: string): EventCategory[] {
    const detectedCategories: { category: EventCategory; score: number }[] = [];
    const lowerText = text.toLowerCase();
    
    Object.entries(this.categoryKeywords).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      
      if (score > 0) {
        detectedCategories.push({ category: category as EventCategory, score });
      }
    });
    
    return detectedCategories
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.category);
  }

  private parseTags(text: string): string[] {
    const tags = new Set<string>();
    const lowerText = text.toLowerCase();
    
    const hashtagMatches = text.match(this.patterns.hashtag);
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => tags.add(tag.slice(1).toLowerCase()));
    }
    
    if (lowerText.includes('watford')) tags.add('watford');
    if (lowerText.includes('free') || lowerText.includes('no charge')) tags.add('free');
    if (lowerText.match(/£\d+/)) tags.add('paid');
    if (lowerText.includes('family') || lowerText.includes('children')) tags.add('family-friendly');
    
    return Array.from(tags).slice(0, 10);
  }

  private toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}