import { Injectable } from '@angular/core';
import { EventCategory } from '../utils/event.model';

export interface EventInference {
  categories: EventCategory[];
  defaultDuration: number | null;
  confidence: number;
  suggestedTags: string[];
}

/**
 * Service for inferring event details from event titles and descriptions
 * Uses pattern matching and keyword analysis to suggest categories, duration, and tags
 */
@Injectable({
  providedIn: 'root'
})
export class EventInferenceService {
  
  private readonly categoryPatterns: Record<EventCategory, string[]> = {
    music: [
      'concert', 'gig', 'band', 'orchestra', 'choir', 'jazz', 'blues', 'rock', 'pop', 'classical',
      'acoustic', 'live music', 'performance', 'musician', 'singer', 'dj', 'disco', 'rave',
      'festival', 'open mic', 'karaoke', 'album launch', 'music night'
    ],
    comedy: [
      'comedy', 'comedian', 'stand up', 'standup', 'funny', 'laugh', 'jokes', 'humour', 'humor',
      'comic', 'improv', 'sketch', 'satire', 'parody', 'roast', 'comedy night', 'comedy show'
    ],
    theatre: [
      'theatre', 'theater', 'play', 'drama', 'musical', 'performance', 'acting', 'stage',
      'rehearsal', 'audition', 'opera', 'ballet', 'dance', 'choreography', 'production',
      'show', 'matinee', 'evening performance'
    ],
    sports: [
      'football', 'soccer', 'rugby', 'cricket', 'tennis', 'basketball', 'hockey', 'golf',
      'swimming', 'athletics', 'running', 'cycling', 'gym', 'fitness', 'workout', 'marathon',
      'tournament', 'match', 'game', 'championship', 'league', 'training', 'sports'
    ],
    food: [
      'food', 'restaurant', 'cafe', 'bar', 'pub', 'dining', 'lunch', 'dinner', 'breakfast',
      'tasting', 'wine', 'beer', 'cocktail', 'cooking', 'chef', 'cuisine', 'menu',
      'feast', 'banquet', 'supper', 'brunch', 'buffet', 'takeaway'
    ],
    nightlife: [
      'club', 'nightclub', 'bar', 'pub', 'drinks', 'cocktails', 'party', 'night out',
      'late night', 'dj', 'dancing', 'disco', 'rave', 'clubbing', 'social', 'mixer'
    ],
    arts: [
      'art', 'gallery', 'exhibition', 'painting', 'sculpture', 'artist', 'creative',
      'craft', 'workshop', 'pottery', 'drawing', 'photography', 'installation',
      'contemporary', 'modern art', 'fine art', 'visual arts'
    ],
    education: [
      'workshop', 'seminar', 'lecture', 'course', 'class', 'training', 'learning',
      'education', 'school', 'university', 'college', 'tutorial', 'masterclass',
      'session', 'study', 'academic', 'conference'
    ],
    community: [
      'community', 'local', 'neighbourhood', 'volunteer', 'charity', 'fundraising',
      'social', 'meeting', 'group', 'club', 'society', 'residents', 'council',
      'civic', 'public', 'town hall', 'community centre'
    ],
    family: [
      'family', 'children', 'kids', 'child', 'baby', 'toddler', 'parent', 'family friendly',
      'playground', 'story time', 'activities for kids', 'family fun', 'all ages'
    ],
    business: [
      'business', 'networking', 'corporate', 'professional', 'meeting', 'conference',
      'summit', 'expo', 'trade show', 'startup', 'entrepreneur', 'commerce',
      'industry', 'b2b', 'corporate event'
    ],
    charity: [
      'charity', 'fundraising', 'donation', 'volunteer', 'cause', 'nonprofit',
      'foundation', 'benefit', 'awareness', 'support', 'help', 'aid', 'relief'
    ],
    outdoor: [
      'outdoor', 'park', 'garden', 'nature', 'hiking', 'walking', 'cycling',
      'camping', 'picnic', 'barbecue', 'bbq', 'beach', 'outdoor activities',
      'fresh air', 'countryside'
    ],
    other: ['event', 'gathering', 'occasion', 'celebration', 'party', 'meet']
  };

  private readonly durationPatterns: Record<string, number> = {
    // Events with typical durations in hours
    'quiz': 2,
    'trivia': 2,
    'bingo': 2,
    'karaoke': 3,
    'open mic': 2,
    'comedy': 1.5,
    'standup': 1.5,
    'concert': 2.5,
    'gig': 2,
    'performance': 2,
    'show': 2,
    'play': 2.5,
    'musical': 3,
    'workshop': 3,
    'seminar': 2,
    'lecture': 1,
    'meeting': 1,
    'lunch': 1.5,
    'dinner': 2,
    'breakfast': 1,
    'brunch': 2,
    'party': 4,
    'celebration': 3,
    'festival': 8,
    'conference': 8,
    'expo': 6,
    'fair': 6,
    'market': 4,
    'sale': 4
  };

  /**
   * Infer event details from event name/title
   */
  inferFromEventName(title: string): EventInference {
    const normalizedTitle = title.toLowerCase().trim();
    
    const categories = this.inferCategories(normalizedTitle);
    const duration = this.inferDuration(normalizedTitle);
    const tags = this.inferTags(normalizedTitle);
    const confidence = this.calculateConfidence(normalizedTitle, categories, duration);

    return {
      categories,
      defaultDuration: duration,
      confidence,
      suggestedTags: tags
    };
  }

  /**
   * Infer event details from both title and description
   */
  inferFromEventContent(title: string, description?: string): EventInference {
    const combinedText = `${title} ${description || ''}`.toLowerCase().trim();
    
    const categories = this.inferCategories(combinedText);
    const duration = this.inferDuration(combinedText);
    const tags = this.inferTags(combinedText);
    const confidence = this.calculateConfidence(combinedText, categories, duration);

    return {
      categories,
      defaultDuration: duration,
      confidence,
      suggestedTags: tags
    };
  }

  /**
   * Infer categories from text content
   */
  private inferCategories(text: string): EventCategory[] {
    const matches: { category: EventCategory; score: number }[] = [];

    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      let score = 0;
      
      for (const pattern of patterns) {
        // Exact word match gets higher score
        const exactMatch = new RegExp(`\\b${pattern}\\b`, 'i').test(text);
        if (exactMatch) {
          score += 2;
        }
        // Partial match gets lower score
        else if (text.includes(pattern)) {
          score += 1;
        }
      }

      if (score > 0) {
        matches.push({ category: category as EventCategory, score });
      }
    }

    // Sort by score and return top categories
    matches.sort((a, b) => b.score - a.score);
    
    // Return top 2 categories, or fallback to 'other' if no matches
    const topCategories = matches.slice(0, 2).map(m => m.category);
    return topCategories.length > 0 ? topCategories : ['other'];
  }

  /**
   * Infer typical duration from text content
   */
  private inferDuration(text: string): number | null {
    let maxDuration = 0;
    let foundMatch = false;

    for (const [pattern, duration] of Object.entries(this.durationPatterns)) {
      if (new RegExp(`\\b${pattern}\\b`, 'i').test(text)) {
        maxDuration = Math.max(maxDuration, duration);
        foundMatch = true;
      }
    }

    // Look for explicit time mentions (e.g., "2 hours", "90 minutes")
    const hourMatch = text.match(/(\d+)\s*hours?/i);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      maxDuration = Math.max(maxDuration, hours);
      foundMatch = true;
    }

    const minuteMatch = text.match(/(\d+)\s*minutes?/i);
    if (minuteMatch) {
      const minutes = parseInt(minuteMatch[1]);
      maxDuration = Math.max(maxDuration, minutes / 60);
      foundMatch = true;
    }

    return foundMatch ? maxDuration : null;
  }

  /**
   * Infer relevant tags from text content
   */
  private inferTags(text: string): string[] {
    const tags: string[] = [];

    // Time-based tags
    if (/evening|night/i.test(text)) tags.push('evening');
    if (/afternoon/i.test(text)) tags.push('afternoon');
    if (/morning/i.test(text)) tags.push('morning');
    if (/weekend/i.test(text)) tags.push('weekend');
    if (/weekday/i.test(text)) tags.push('weekday');

    // Audience tags
    if (/family|kids|children/i.test(text)) tags.push('family-friendly');
    if (/adult|18\+|over 18/i.test(text)) tags.push('adults-only');
    if (/senior|elderly/i.test(text)) tags.push('seniors');

    // Cost tags
    if (/free|no charge|complimentary/i.test(text)) tags.push('free');
    if (/paid|ticket|admission|£|\$/i.test(text)) tags.push('paid');

    // Location tags
    if (/outdoor|outside|garden|park/i.test(text)) tags.push('outdoor');
    if (/indoor|inside/i.test(text)) tags.push('indoor');

    // Social tags
    if (/social|networking|meet/i.test(text)) tags.push('social');
    if (/beginner|intro|basic/i.test(text)) tags.push('beginner-friendly');
    if (/advanced|expert|professional/i.test(text)) tags.push('advanced');

    return tags.slice(0, 5); // Limit to 5 tags
  }

  /**
   * Calculate confidence score based on matches found
   */
  private calculateConfidence(text: string, categories: EventCategory[], duration: number | null): number {
    let confidence = 0;

    // Base confidence for finding categories
    if (categories.length > 0 && !categories.includes('other')) {
      confidence += 40;
    }
    if (categories.length > 1) {
      confidence += 20;
    }

    // Confidence for finding duration
    if (duration !== null) {
      confidence += 30;
    }

    // Confidence based on text length and specificity
    if (text.length > 20) {
      confidence += 10;
    }

    // Penalty for vague titles
    if (/^(event|party|gathering|meeting)$/i.test(text.trim())) {
      confidence -= 20;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get a human-readable type label from categories
   */
  getEventTypeFromCategories(categories: EventCategory[]): string | null {
    if (categories.length === 0) return null;
    
    const typeLabels: Record<EventCategory, string> = {
      music: 'music',
      comedy: 'comedy', 
      theatre: 'theatre',
      sports: 'sports',
      food: 'food & drink',
      nightlife: 'nightlife',
      arts: 'arts & culture',
      education: 'educational',
      community: 'community',
      family: 'family',
      business: 'business',
      charity: 'charity',
      outdoor: 'outdoor',
      other: 'general'
    };

    return typeLabels[categories[0]] || null;
  }

  /**
   * Get category display labels
   */
  getCategoryLabel(category: EventCategory): string {
    const labels: Record<EventCategory, string> = {
      music: 'Music & Live Performance',
      comedy: 'Comedy & Entertainment',
      theatre: 'Theatre & Drama',
      sports: 'Sports & Fitness',
      food: 'Food & Drink',
      nightlife: 'Nightlife & Social',
      arts: 'Arts & Culture',
      education: 'Education & Learning',
      community: 'Community & Social',
      family: 'Family & Children',
      business: 'Business & Professional',
      charity: 'Charity & Fundraising',
      outdoor: 'Outdoor & Recreation',
      other: 'Other Events'
    };
    return labels[category] || category;
  }
}