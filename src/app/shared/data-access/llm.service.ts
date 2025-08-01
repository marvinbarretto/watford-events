import { Injectable, signal, inject } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../../environments/environment';
import { LLMRequest, LLMResponse } from '../utils/llm-types';
import { EventExtractionResult, EventData, EventConfidence } from '../utils/event-extraction-types';
import { EVENT_CATEGORIES } from '../../events/utils/event.model';
import { VenueService } from '../../venues/data-access/venue.service';
import { Venue } from '../../venues/utils/venue.model';
import { processExtractedEventData, ProcessedEventData } from '../utils/llm-data-processing.utils';

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private readonly _genAI = new GoogleGenerativeAI(environment.llm?.gemini || '');
  private readonly _model = this._genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private readonly _venueService = inject(VenueService);

  // Simple cache for testing - TEMPORARILY DISABLED
  // Cache was causing permanent blocking after rejections due to weak cache key
  // and caching of negative results. Re-enable once improved.
  private readonly _cache = new Map<string, any>();

  // Basic state tracking
  private readonly _isProcessing = signal(false);
  private readonly _requestCount = signal(0);

  readonly isProcessing = this._isProcessing.asReadonly();
  readonly requestCount = this._requestCount.asReadonly();

  /**
   * Test method - simple text prompt
   */
  async testConnection(prompt: string = "Hello, are you working?"): Promise<LLMResponse<string>> {
    console.log('[LLMService] Testing connection with prompt:', prompt);

    this._isProcessing.set(true);

    try {
      const result = await this._model.generateContent(prompt);
      const response = result.response.text();

      this._requestCount.update(count => count + 1);

      console.log('[LLMService] ✅ Connection test successful:', response);

      return {
        success: true,
        data: response,
        cached: false
      };

    } catch (error: any) {
      console.error('[LLMService] ❌ Connection test failed:', error);

      return {
        success: false,
        data: '',
        error: error?.message || 'Connection failed',
        cached: false
      };
    } finally {
      this._isProcessing.set(false);
    }
  }

  /**
   * Extract event data from flyer image
   */
  async extractEventFromImage(imageFile: File): Promise<EventExtractionResult> {
    console.log('[LLMService] Extracting event data from image:', imageFile.name);

    this._isProcessing.set(true);

    try {
      // Convert file to base64 data URL
      const imageDataUrl = await this.fileToBase64(imageFile);
      
      // Optimize image for LLM processing
      const optimizedImage = await this.optimizeImageForAnalysis(imageDataUrl);
      
      // Get venue context for better location matching
      const venues = await this._venueService.getPublishedVenues();
      
      // Create structured prompt for event extraction with venue context
      const prompt = this.createEventExtractionPrompt(venues);
      
      // Send to Gemini with image
      const result = await this._model.generateContent([
        prompt,
        {
          inlineData: {
            data: optimizedImage.split(',')[1], // Remove data URL prefix
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = result.response.text();
      this._requestCount.update(count => count + 1);

      console.log('[LLMService] Raw LLM response:', response);

      // Parse the JSON response
      const extractionResult = await this.parseEventExtractionResponse(response);
      
      // Try to match location to known venues
      if (extractionResult.eventData && extractionResult.eventData.location) {
        const suggestedVenue = await this.findMatchingVenue(extractionResult.eventData.location, venues);
        if (suggestedVenue) {
          extractionResult.eventData.venueId = suggestedVenue.id;
          console.log('[LLMService] 🎯 Matched venue:', suggestedVenue.name);
        }
      }
      
      console.log('[LLMService] ✅ Event extraction successful:', extractionResult);
      
      return extractionResult;

    } catch (error: any) {
      console.error('[LLMService] ❌ Event extraction failed:', error);

      return {
        success: false,
        eventData: null,
        confidence: this.createEmptyConfidence(),
        error: error?.message || 'Event extraction failed'
      };
    } finally {
      this._isProcessing.set(false);
    }
  }


  // ===== PRIVATE HELPER METHODS =====

  /**
   * Convert File to base64 data URL
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create structured prompt for event extraction
   */
  private createEventExtractionPrompt(venues: Venue[] = []): string {
    // Create venue context for better location matching
    const venueContext = venues.length > 0 ? `
KNOWN VENUES IN WATFORD:
The following venues are available in our database. If you recognize any of these locations in the flyer, please use the exact name as it appears below:

${venues.map(venue => `- ${venue.name} (${venue.address})`).join('\n')}

If the location matches any of these venues, extract the location exactly as shown in the venue name above.
` : '';

    // Create category context for better classification
    const categoryContext = `
AVAILABLE CATEGORIES:
Choose up to 3 categories from this list that best describe the event:
${EVENT_CATEGORIES.map(cat => `- ${cat.value}: ${cat.label} (${cat.description})`).join('\n')}
`;

    return `
You are an expert at extracting event information from flyer images. 

${venueContext}

${categoryContext}

Analyze the attached flyer image and extract the following information:

1. **Event title** - The main title/name of the event
2. **Event description** - Brief description of what the event is about
3. **Date and time** - When the event takes place (be specific about format)
4. **Location/venue** - Where the event is happening
5. **Organizer** - Who is organizing/hosting the event
6. **Ticket information** - Price, where to buy, booking details
7. **Contact information** - Phone numbers, email addresses
8. **Website or social media** - URLs, social handles, QR codes
9. **Categories** - Select 1-3 categories from the list above that best describe this event
10. **Tags** - Suggest 3-7 hashtag-style tags that would help people find this event (e.g., #livemusic, #family, #outdoor)

SPECIAL INSTRUCTIONS:
- For **dates**: Keep the original format but be precise (e.g., "Sunday 20th July 2025, 3 PM")
- For **location**: If you recognize the venue from the known venues list above, use the exact name from that list. Otherwise, extract the location as written on the flyer.
- For **QR codes**: If you see a QR code, try to determine what it links to. If it's near ticket info, it's likely a booking URL. If it's near contact info, it might be a website. Describe what the QR code is for (e.g., "QR code for ticket booking", "QR code for website link")
- For **ticket info**: If you see a QR code near ticket information, include it in your response (e.g., "£15 advance, £20 on door - QR code for online booking")
- For **websites**: Look for URLs, social media handles (@username), and describe QR codes that might contain links
- For **categories**: Return an array of category values (not labels) from the list above. Max 3 categories.
- For **tags**: Return an array of lowercase tag strings without # symbol. Focus on specific keywords that would help people find this event (e.g., ["livemusic", "jazz", "weekend", "family"])

For each field, provide:
- The extracted value (keep original formatting when possible)
- A confidence score (0-100) indicating how certain you are about the extraction
- If no information is found, use "Not found" for the value and confidence 0

Return the response as a JSON object with this exact structure:
{
  "eventData": {
    "title": "string",
    "description": "string", 
    "date": "string (keep original format)",
    "location": "string",
    "organizer": "string",
    "ticketInfo": "string (include QR code info if relevant)",
    "contactInfo": "string",
    "website": "string (include social handles and QR code descriptions)",
    "categories": ["array", "of", "category", "values"],
    "tags": ["array", "of", "tag", "strings"]
  },
  "confidence": {
    "title": number,
    "description": number,
    "date": number,
    "location": number,
    "organizer": number,
    "ticketInfo": number,
    "contactInfo": number,
    "website": number,
    "categories": number,
    "tags": number
  }
}

Be thorough but concise. If text is unclear or partially obscured, still provide your best interpretation and lower the confidence score accordingly.
`;
  }

  /**
   * Find matching venue from extracted location text
   */
  private async findMatchingVenue(locationText: string, venues: Venue[]): Promise<Venue | null> {
    if (!locationText || locationText === 'Not found') return null;

    const normalizedLocation = locationText.toLowerCase().trim();

    // Try exact name match first
    let match = venues.find(venue => 
      venue.name.toLowerCase() === normalizedLocation
    );

    if (match) return match;

    // Try partial name match
    match = venues.find(venue => 
      venue.name.toLowerCase().includes(normalizedLocation) ||
      normalizedLocation.includes(venue.name.toLowerCase())
    );

    if (match) return match;

    // Try address match
    match = venues.find(venue => 
      venue.address.toLowerCase().includes(normalizedLocation) ||
      normalizedLocation.includes(venue.address.toLowerCase())
    );

    if (match) return match;

    // Try searching for common venue name patterns
    const venueSearchTerms = [
      locationText,
      locationText.replace(/\b(the|hall|centre|center|club|pub|bar|theatre|theater|stadium|park|museum|restaurant)\b/gi, '').trim(),
      locationText.split(/\s+/).slice(0, 3).join(' ') // First 3 words
    ];

    for (const term of venueSearchTerms) {
      if (term.length > 2) {
        const searchResults = await this._venueService.searchVenues(term);
        if (searchResults.length > 0) {
          return searchResults[0]; // Return first match
        }
      }
    }

    return null;
  }

  /**
   * Parse LLM response into structured event data with enhanced processing
   */
  private async parseEventExtractionResponse(response: string): Promise<EventExtractionResult> {
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate structure
      if (!parsed.eventData || !parsed.confidence) {
        throw new Error('Invalid response structure');
      }

      // Get venues for matching
      const venues = await this._venueService.getPublishedVenues();

      // Process the raw LLM data using our utilities
      const processedData = processExtractedEventData(parsed.eventData, {
        venues,
        venueMatchThreshold: 70,
        normalizeText: true
      });

      console.log('[LLMService] Raw LLM data:', parsed.eventData);
      console.log('[LLMService] Processed data:', processedData);
      console.log('[LLMService] Processing notes:', processedData.processingNotes);

      // Create enhanced event data combining original and processed information
      const enhancedEventData: EventData = {
        // Use processed/normalized data where available
        title: processedData.title || parsed.eventData.title,
        description: processedData.description || parsed.eventData.description,
        date: this.reconstructDateTimeString(processedData) || parsed.eventData.date,
        location: processedData.location || parsed.eventData.location,
        organizer: processedData.organizer || parsed.eventData.organizer,
        ticketInfo: processedData.ticketInfo || parsed.eventData.ticketInfo,
        contactInfo: processedData.contactInfo || parsed.eventData.contactInfo,
        website: processedData.website || parsed.eventData.website,
        categories: processedData.categories || parsed.eventData.categories || [],
        tags: processedData.tags || parsed.eventData.tags || [],
        
        // Add venue ID if we found a match
        venueId: processedData.venueId || parsed.eventData.venueId,
        
        // Include structured date/time data for easy form population
        parsedDate: processedData.date,
        parsedStartTime: processedData.startTime,
        parsedEndTime: processedData.endTime,
        parsedIsAllDay: processedData.isAllDay
      };

      // Update confidence scores based on processing
      const confidence = this.calculateEnhancedConfidence(parsed.confidence, processedData);

      return {
        success: true,
        eventData: enhancedEventData,
        confidence,
        rawText: response,
        // Add processing metadata
        processingNotes: processedData.processingNotes,
        matchedVenue: processedData.matchedVenue
      };

    } catch (error) {
      console.error('[LLMService] Failed to parse LLM response:', error);
      
      return {
        success: false,
        eventData: null,
        confidence: this.createEmptyConfidence(),
        error: `Failed to parse response: ${error}`,
        rawText: response
      };
    }
  }

  /**
   * Create empty confidence object for error cases
   */
  private createEmptyConfidence(): EventConfidence {
    return {
      overall: 0,
      title: 0,
      description: 0,
      date: 0,
      location: 0,
      venueId: 0,
      organizer: 0,
      ticketInfo: 0,
      contactInfo: 0,
      website: 0,
      categories: 0,
      tags: 0
    };
  }

  /**
   * ✅ IMAGE OPTIMIZATION - Major cost savings!
   * Resizes images to optimal size for LLM analysis
   */
  private async optimizeImageForAnalysis(imageData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      // ✅ Optimal dimensions for carpet pattern recognition
      const targetWidth = 512;
      const targetHeight = 384;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      img.onload = () => {
        console.log(`[LLMService] Original image: ${img.width}x${img.height}`);

        // Draw resized image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // ✅ Compress with good quality (0.8 = good balance)
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        console.log(`[LLMService] Optimized to: ${targetWidth}x${targetHeight}`);
        console.log(`[LLMService] Size reduction: ~${Math.round((1 - optimizedDataUrl.length / imageData.length) * 100)}%`);

        resolve(optimizedDataUrl);
      };

      img.onerror = () => {
        console.log('[LLMService] Failed to load image for optimization');
        reject(new Error('Image optimization failed'));
      };

      img.src = imageData;
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // ===== DEBUG/TESTING METHODS =====

  getStats() {
    return {
      requestCount: this._requestCount(),
      cacheSize: this._cache.size,
      isProcessing: this._isProcessing()
    };
  }

  clearCache() {
    this._cache.clear();
    console.log('[LLMService] Cache cleared');
  }

  /**
   * Reconstructs date/time string from processed data for form compatibility
   */
  private reconstructDateTimeString(processedData: ProcessedEventData): string | null {
    if (!processedData.date) return null;

    let dateTimeString = processedData.date;
    
    if (processedData.startTime && !processedData.isAllDay) {
      // Convert 24-hour time to more natural format
      const [hours, minutes] = processedData.startTime.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      
      dateTimeString += ` - ${hour12}${minutes !== '00' ? ':' + minutes : ''}${ampm}`;
    }

    return dateTimeString;
  }

  /**
   * Calculates enhanced confidence scores based on processing results
   */
  private calculateEnhancedConfidence(originalConfidence: any, processedData: ProcessedEventData): EventConfidence {
    const enhanced = { ...originalConfidence };

    // Boost confidence for successfully processed fields
    if (processedData.date && processedData.originalData.date) {
      enhanced.date = Math.min(100, enhanced.date + 10);
    }

    if (processedData.venueId && processedData.venueMatchScore > 80) {
      enhanced.location = Math.min(100, enhanced.location + 15);
    }

    // Boost confidence for normalized text
    if (processedData.title !== processedData.originalData.title) {
      enhanced.title = Math.min(100, enhanced.title + 5);
    }

    // Recalculate overall confidence
    const confidenceValues = Object.values(enhanced).filter(val => typeof val === 'number') as number[];
    enhanced.overall = Math.round(confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length);

    return enhanced;
  }

}
