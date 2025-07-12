import { Injectable, inject } from '@angular/core';
import { 
  DataSourceProcessor, 
  DataSourceType, 
  DataSourceInput, 
  ProcessingResult,
  ExtendedParsedEventData,
  ParsedEventField
} from './data-source-processor.interface';
import { LLMService } from '@shared/data-access/llm.service';
import { EventCategory } from '@events/utils/event.model';

/**
 * Image-based event data processor
 * Uses LLM (Gemini) to extract data from flyer images
 */
@Injectable({
  providedIn: 'root'
})
export class ImageProcessorService extends DataSourceProcessor {
  readonly sourceType: DataSourceType = 'image';
  readonly priority: number = 80; // High priority - usually very accurate
  
  private readonly _llmService = inject(LLMService);

  getName(): string {
    return 'Image Parser (AI)';
  }

  canProcess(input: DataSourceInput): boolean {
    return input.type === 'image' && 
           input.data instanceof File && 
           input.data.type.startsWith('image/');
  }

  override getDefaultOptions(): Record<string, any> {
    return {
      optimizeImage: true,
      maxWidth: 512,
      maxHeight: 384,
      quality: 0.8
    };
  }

  async process(input: DataSourceInput): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.canProcess(input)) {
        return {
          success: false,
          error: 'Invalid input for image processor - expected image file',
          processingTime: Date.now() - startTime
        };
      }

      const file = input.data as File;
      const extractionResult = await this._llmService.extractEventFromImage(file);
      
      if (!extractionResult.success || !extractionResult.eventData) {
        return {
          success: false,
          error: extractionResult.error || 'Image extraction failed',
          processingTime: Date.now() - startTime,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        };
      }

      // Convert LLM result to our standard format
      const data = this.convertLLMResultToStandardFormat(extractionResult, file.name);
      const warnings = this.validateData(data);
      
      return {
        success: true,
        data,
        warnings: warnings.length > 0 ? warnings : undefined,
        processingTime: Date.now() - startTime,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          llmModel: 'gemini-1.5-flash',
          originalConfidence: extractionResult.confidence
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Image processing failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  private convertLLMResultToStandardFormat(
    llmResult: any, 
    fileName: string
  ): ExtendedParsedEventData {
    const eventData = llmResult.eventData;
    const confidence = llmResult.confidence;
    
    // Helper function to create parsed field
    const createField = (value: string, conf: number): ParsedEventField => ({
      value: value || '',
      confidence: conf || 0,
      source: this.getName(),
      sourceText: value
    });

    return {
      title: createField(eventData.title, confidence.title),
      description: createField(eventData.description, confidence.description),
      date: createField(eventData.date, confidence.date),
      location: createField(eventData.location, confidence.location),
      organizer: createField(eventData.organizer, confidence.organizer),
      ticketInfo: createField(eventData.ticketInfo, confidence.ticketInfo),
      contactInfo: createField(eventData.contactInfo, confidence.contactInfo),
      website: createField(eventData.website, confidence.website),
      categories: eventData.categories || [],
      tags: eventData.tags || [],
      overallConfidence: confidence.overall || 0,
      sourceType: 'image',
      metadata: {
        fileName,
        llmModel: 'gemini-1.5-flash',
        originalLLMResult: llmResult,
        venueId: eventData.venueId // Preserve venue matching from LLM
      }
    };
  }

  /**
   * Enhanced validation for image-extracted data
   */
  protected override validateData(data: ExtendedParsedEventData): string[] {
    const warnings = super.validateData(data);
    
    // Image-specific validations
    if (data.overallConfidence < 60) {
      warnings.push('Overall extraction confidence is low - manual review recommended');
    }
    
    // Check for common OCR issues
    if (data.title.value && /[^\w\s.,!?-]/.test(data.title.value)) {
      warnings.push('Title contains unusual characters - possible OCR artifacts');
    }
    
    if (data.date.value && !/\d/.test(data.date.value)) {
      warnings.push('Date appears to contain no numbers - possible extraction error');
    }
    
    // Check for incomplete extractions that suggest poor image quality
    const fieldsWithData = [
      data.title.value,
      data.description.value,
      data.date.value,
      data.location?.value,
      data.organizer?.value
    ].filter(Boolean).length;
    
    if (fieldsWithData < 3) {
      warnings.push('Few fields extracted - image quality may be poor or flyer format unusual');
    }
    
    return warnings;
  }
}