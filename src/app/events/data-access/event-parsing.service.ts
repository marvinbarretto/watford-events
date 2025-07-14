import { Injectable, inject } from '@angular/core';
import { EventCategory } from '@events/utils/event.model';

export interface ParsedField {
  value: string;
  confidence: number;
  sourceText?: string;
  startIndex?: number;
  endIndex?: number;
}

export interface ParsedEventData {
  title: ParsedField;
  description: ParsedField;
  date: ParsedField;
  location?: ParsedField;
  organizer?: ParsedField;
  ticketInfo?: ParsedField;
  contactInfo?: ParsedField;
  website?: ParsedField;
  categories?: EventCategory[];
  tags?: string[];
  overallConfidence: number;
}

export interface EditableEventData {
  title: string;
  description: string;
  date: string; // ISO string for input compatibility
  location?: string;
  organizer?: string;
  ticketInfo?: string;
  contactInfo?: string;
  website?: string;
  categories?: EventCategory[];
  tags?: string[];
  status: 'draft' | 'published' | 'cancelled';
}

@Injectable({
  providedIn: 'root'
})
export class EventParsingService {
  
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
    // Enhanced date patterns for natural language
    date: [
      // Natural language dates
      /\b(?:next|this)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, // next Friday
      /\b(?:tomorrow|today)\b/gi, // tomorrow
      /\bin\s+\d+\s+days?\b/gi, // in 3 days
      /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(?:next\s+)?week\b/gi, // Monday next week
      
      // Traditional date patterns
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/gi, // 20th December 2024
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}/gi, // December 20th, 2024
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, // 20/12/2024
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}/gi // Friday, 20th December 2024
    ],
    // Enhanced time patterns for natural language
    time: [
      // Natural language times
      /\b(?:morning|afternoon|evening|night)\b/gi, // morning
      /\b(?:noon|midnight)\b/gi, // noon
      /\b(?:lunch\s*time|dinner\s*time|breakfast\s*time)\b/gi, // lunch time
      
      // Traditional time patterns
      /\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)/gi, // 8:00 PM
      /\d{1,2}\s*(?:am|pm|AM|PM)/gi, // 8pm
      /\d{1,2}:\d{2}/gi, // 24-hour format 20:00
      /(?:doors?\s+(?:open\s+)?)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/gi, // doors open 7:30pm
      /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/gi // at 8pm
    ],
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    phone: /(?:\+44\s?|0)(?:\d{4}\s?\d{3}\s?\d{3}|\d{3}\s?\d{3}\s?\d{4}|\d{10,11})/gi,
    website: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi,
    price: [
      /£\d+(?:\.\d{2})?(?:\s*-\s*£?\d+(?:\.\d{2})?)?/gi, // £10 or £10-£15
      /\d+(?:\.\d{2})?\s*(?:pounds?|quid)/gi, // 10 pounds
      /free(?:\s+(?:entry|admission))?/gi, // free entry
      /advance\s+£?\d+(?:\.\d{2})?,?\s*door\s+£?\d+(?:\.\d{2})?/gi // advance £8, door £10
    ],
    hashtag: /#[a-zA-Z0-9_]+/gi,
    location: [
      /(?:at|venue|location|address|held\s+at)\s*:?\s*([^,\n\r]+)/gi,
      /([^,\n\r]*(?:hall|centre|center|church|school|park|road|street|lane|avenue|drive|square|place)[^,\n\r]*)/gi
    ]
  };

  parseEventText(text: string): ParsedEventData {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let overallConfidence = 0;
    const maxConfidence = 150; // Adjusted for new fields

    // Parse title
    const title = this.parseTitle(text, lines);
    if (title.value) overallConfidence += 25;

    // Parse description
    const description = this.parseDescription(text, lines, title.value);
    if (description.value) overallConfidence += 15;

    // Parse date and time
    const date = this.parseDateTime(text);
    if (date.value) overallConfidence += 25;

    // Parse location
    const location = this.parseLocation(text, lines);
    if (location?.value) overallConfidence += 20;

    // Parse contact info
    const contactInfo = this.parseContactInfo(text);
    if (contactInfo?.value) overallConfidence += 10;

    // Parse website
    const website = this.parseWebsite(text);
    if (website?.value) overallConfidence += 10;

    // Parse organizer
    const organizer = this.parseOrganizer(text);
    if (organizer?.value) overallConfidence += 15;

    // Parse ticket info
    const ticketInfo = this.parseTicketInfo(text);
    if (ticketInfo?.value) overallConfidence += 10;

    // Parse categories
    const categories = this.parseCategories(text);
    if (categories.length > 0) overallConfidence += 15;

    // Parse tags
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
      overallConfidence: Math.min(Math.round((overallConfidence / maxConfidence) * 100), 100)
    };
  }

  private parseTitle(text: string, lines: string[]): ParsedField {
    // Find the most substantial line that looks like a title
    const candidates = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 3 && 
             trimmed.length < 100 && 
             !trimmed.includes('@') && 
             !trimmed.includes('http') &&
             !trimmed.match(/\d{1,2}[\/\-\.]\d{1,2}/); // Not a date line
    });

    const titleLine = candidates[0] || lines[0];
    if (!titleLine) {
      return { value: '', confidence: 0 };
    }

    // Clean up the title
    let cleanTitle = titleLine.trim()
      .replace(/^[A-Z\s]+$/, (match) => this.toTitleCase(match)) // Fix ALL CAPS
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 100); // Reasonable length limit

    const startIndex = text.indexOf(titleLine);
    
    return {
      value: cleanTitle,
      confidence: cleanTitle.length > 5 ? 90 : 70,
      sourceText: titleLine,
      startIndex,
      endIndex: startIndex + titleLine.length
    };
  }

  private parseDescription(text: string, lines: string[], titleText: string): ParsedField {
    // Find description by excluding title, date, contact, and short lines
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
      return { value: '', confidence: 0 };
    }

    const description = descriptionLines.join(' ').slice(0, 500);
    const firstDescLine = descriptionLines[0];
    const startIndex = text.indexOf(firstDescLine);

    return {
      value: description,
      confidence: description.length > 20 ? 80 : 60,
      sourceText: descriptionLines.join('\n'),
      startIndex,
      endIndex: startIndex + descriptionLines.join('\n').length
    };
  }

  private parseDateTime(text: string): ParsedField {
    // First try natural language date parsing
    const naturalDate = this.parseNaturalLanguageDate(text);
    if (naturalDate.value) {
      return naturalDate;
    }

    // Try different date patterns
    for (const pattern of this.patterns.date) {
      const dateMatches = text.match(pattern);
      if (dateMatches) {
        // Also look for time in the same vicinity
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
              value: parsedDate.toISOString().slice(0, 16), // Format for datetime-local
              confidence: timeMatch ? 95 : 85,
              sourceText: timeMatch ? `${dateMatches[0]} ${timeMatch}` : dateMatches[0],
              startIndex,
              endIndex: startIndex + dateMatches[0].length + (timeMatch ? timeMatch.length + 1 : 0)
            };
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }

    return { value: '', confidence: 0 };
  }

  private parseNaturalLanguageDate(text: string): ParsedField {
    const lowerText = text.toLowerCase();
    const now = new Date();
    let targetDate: Date | null = null;
    let confidence = 90;
    let sourceText = '';
    let startIndex = -1;

    // Handle "tomorrow"
    if (lowerText.includes('tomorrow')) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      sourceText = 'tomorrow';
      startIndex = lowerText.indexOf('tomorrow');
    }
    // Handle "today"
    else if (lowerText.includes('today')) {
      targetDate = new Date(now);
      sourceText = 'today';
      startIndex = lowerText.indexOf('today');
    }
    // Handle "next [day of week]"
    else if (lowerText.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)) {
      const match = lowerText.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
      if (match) {
        const dayName = match[1];
        targetDate = this.getNextDayOfWeek(dayName);
        sourceText = match[0];
        startIndex = lowerText.indexOf(match[0]);
      }
    }
    // Handle "this [day of week]"
    else if (lowerText.match(/\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)) {
      const match = lowerText.match(/\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
      if (match) {
        const dayName = match[1];
        targetDate = this.getThisDayOfWeek(dayName);
        sourceText = match[0];
        startIndex = lowerText.indexOf(match[0]);
      }
    }
    // Handle "in X days"
    else if (lowerText.match(/\bin\s+(\d+)\s+days?\b/)) {
      const match = lowerText.match(/\bin\s+(\d+)\s+days?\b/);
      if (match) {
        const days = parseInt(match[1]);
        targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + days);
        sourceText = match[0];
        startIndex = lowerText.indexOf(match[0]);
      }
    }

    // Try to find time information
    let timeMatch = '';
    let timeConfidence = 0;
    
    // Check for specific times
    const timeRegex = /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/gi;
    const timeMatches = text.match(timeRegex);
    if (timeMatches) {
      timeMatch = timeMatches[0].replace(/^at\s+/, '');
      timeConfidence = 20;
    }
    // Check for natural language times
    else if (lowerText.includes('morning')) {
      timeMatch = '9:00 AM';
      timeConfidence = 10;
    }
    else if (lowerText.includes('afternoon')) {
      timeMatch = '2:00 PM';
      timeConfidence = 10;
    }
    else if (lowerText.includes('evening')) {
      timeMatch = '7:00 PM';
      timeConfidence = 10;
    }
    else if (lowerText.includes('night')) {
      timeMatch = '8:00 PM';
      timeConfidence = 10;
    }
    else if (lowerText.includes('noon')) {
      timeMatch = '12:00 PM';
      timeConfidence = 15;
    }
    else if (lowerText.includes('lunch')) {
      timeMatch = '12:30 PM';
      timeConfidence = 15;
    }

    if (targetDate) {
      // Apply time if found
      if (timeMatch) {
        try {
          const timeDate = new Date(`1970-01-01 ${timeMatch}`);
          if (!isNaN(timeDate.getTime())) {
            targetDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
            confidence += timeConfidence;
            sourceText += timeMatch ? ` ${timeMatch}` : '';
          }
        } catch (e) {
          // Time parsing failed, but we still have the date
        }
      }

      return {
        value: targetDate.toISOString().slice(0, 16),
        confidence: Math.min(confidence, 95),
        sourceText,
        startIndex: startIndex >= 0 ? startIndex : undefined,
        endIndex: startIndex >= 0 ? startIndex + sourceText.length : undefined
      };
    }

    return { value: '', confidence: 0 };
  }

  private getNextDayOfWeek(dayName: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
  }

  private getThisDayOfWeek(dayName: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7; // This week (if day has passed, go to next week)
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
  }

  private parseLocation(text: string, lines: string[]): ParsedField | undefined {
    // Try explicit location patterns first
    for (const pattern of this.patterns.location) {
      const match = pattern.exec(text);
      if (match) {
        const location = match[1] || match[0];
        return {
          value: location.trim(),
          confidence: 85,
          sourceText: match[0],
          startIndex: match.index,
          endIndex: match.index! + match[0].length
        };
      }
    }

    // Look for lines that contain location indicators
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
        endIndex: startIndex + locationLine.length
      };
    }

    return undefined;
  }

  private parseContactInfo(text: string): ParsedField | undefined {
    const emails = text.match(this.patterns.email);
    const phones = text.match(this.patterns.phone);
    
    if (!emails && !phones) return undefined;

    const contacts = [emails?.[0], phones?.[0]].filter(Boolean);
    const contactString = contacts.join(' | ');
    
    return {
      value: contactString,
      confidence: 90,
      sourceText: contacts.join(' ')
    };
  }

  private parseWebsite(text: string): ParsedField | undefined {
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
      endIndex: startIndex + websites[0].length
    };
  }

  private parseOrganizer(text: string): ParsedField | undefined {
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
          endIndex: match.index! + match[0].length
        };
      }
    }

    return undefined;
  }

  private parseTicketInfo(text: string): ParsedField | undefined {
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
          endIndex: startIndex + matches[0].length
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
    
    // Sort by score and return top 3
    return detectedCategories
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.category);
  }

  private parseTags(text: string): string[] {
    const tags = new Set<string>();
    const lowerText = text.toLowerCase();
    
    // Add hashtags
    const hashtagMatches = text.match(this.patterns.hashtag);
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => tags.add(tag.slice(1).toLowerCase()));
    }
    
    // Add contextual tags
    if (lowerText.includes('watford')) tags.add('watford');
    if (lowerText.includes('free') || lowerText.includes('no charge')) tags.add('free');
    if (lowerText.match(/£\d+/)) tags.add('paid');
    if (lowerText.includes('family') || lowerText.includes('children')) tags.add('family-friendly');
    
    return Array.from(tags).slice(0, 10);
  }

  private toTitleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  convertToEditableFormat(parsed: ParsedEventData): EditableEventData {
    return {
      title: parsed.title.value,
      description: parsed.description.value,
      date: parsed.date.value,
      location: parsed.location?.value || '',
      organizer: parsed.organizer?.value || '',
      ticketInfo: parsed.ticketInfo?.value || '',
      contactInfo: parsed.contactInfo?.value || '',
      website: parsed.website?.value || '',
      categories: parsed.categories || [],
      tags: parsed.tags || [],
      status: 'draft'
    };
  }
}