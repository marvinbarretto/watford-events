import { EventCategory } from '@events/utils/event.model';

/**
 * Common interface for all parsed event data
 */
export interface ParsedEventField {
  value: string;
  confidence: number;
  sourceText?: string;
  startIndex?: number;
  endIndex?: number;
  source?: string; // Which processor/source provided this data
}

/**
 * Extended parsed event data with additional fields
 */
export interface ExtendedParsedEventData {
  title: ParsedEventField;
  description: ParsedEventField;
  date: ParsedEventField;
  location?: ParsedEventField;
  organizer?: ParsedEventField;
  ticketInfo?: ParsedEventField;
  contactInfo?: ParsedEventField;
  website?: ParsedEventField;
  categories?: EventCategory[];
  tags?: string[];
  overallConfidence: number;
  sourceType: DataSourceType;
  sourceUrl?: string; // For web sources
  processingTime?: number;
  metadata?: Record<string, any>; // Additional processor-specific data
}

/**
 * Types of data sources we can process
 */
export type DataSourceType = 'text' | 'image' | 'url' | 'social' | 'calendar' | 'email';

/**
 * Input configuration for data source processors
 */
export interface DataSourceInput {
  type: DataSourceType;
  data: any; // File, URL, text, etc.
  priority?: number; // Higher numbers = higher priority for conflicts
  options?: Record<string, any>; // Processor-specific options
}

/**
 * Result from processing a data source
 */
export interface ProcessingResult {
  success: boolean;
  data?: ExtendedParsedEventData;
  error?: string;
  warnings?: string[];
  metadata?: Record<string, any>;
  processingTime: number;
}

/**
 * Abstract base class for all data source processors
 */
export abstract class DataSourceProcessor {
  abstract readonly sourceType: DataSourceType;
  abstract readonly priority: number; // Default priority for this processor type
  
  /**
   * Process the input data and extract event information
   */
  abstract process(input: DataSourceInput): Promise<ProcessingResult>;
  
  /**
   * Validate if this processor can handle the given input
   */
  abstract canProcess(input: DataSourceInput): boolean;
  
  /**
   * Get a human-readable name for this processor
   */
  abstract getName(): string;
  
  /**
   * Get processor-specific configuration options
   */
  getDefaultOptions(): Record<string, any> {
    return {};
  }
  
  /**
   * Validate extracted data quality
   */
  protected validateData(data: ExtendedParsedEventData): string[] {
    const warnings: string[] = [];
    
    // Check for missing required fields
    if (!data.title.value || data.title.confidence < 30) {
      warnings.push('Title extraction has low confidence or is missing');
    }
    
    if (!data.date.value || data.date.confidence < 40) {
      warnings.push('Date extraction has low confidence or is missing');
    }
    
    // Check for future dates
    try {
      const eventDate = new Date(data.date.value);
      const now = new Date();
      if (eventDate < now) {
        warnings.push('Event date appears to be in the past');
      }
    } catch (e) {
      warnings.push('Event date format could not be validated');
    }
    
    return warnings;
  }
  
  /**
   * Create empty/default parsed data structure
   */
  protected createEmptyData(sourceType: DataSourceType): ExtendedParsedEventData {
    return {
      title: { value: '', confidence: 0, source: this.getName() },
      description: { value: '', confidence: 0, source: this.getName() },
      date: { value: '', confidence: 0, source: this.getName() },
      location: { value: '', confidence: 0, source: this.getName() },
      organizer: { value: '', confidence: 0, source: this.getName() },
      ticketInfo: { value: '', confidence: 0, source: this.getName() },
      contactInfo: { value: '', confidence: 0, source: this.getName() },
      website: { value: '', confidence: 0, source: this.getName() },
      categories: [],
      tags: [],
      overallConfidence: 0,
      sourceType,
      metadata: {}
    };
  }
}

/**
 * Registry for managing data source processors
 */
export class DataSourceProcessorRegistry {
  private processors = new Map<DataSourceType, DataSourceProcessor>();
  
  /**
   * Register a processor for a specific source type
   */
  register(processor: DataSourceProcessor): void {
    this.processors.set(processor.sourceType, processor);
  }
  
  /**
   * Get processor for a specific source type
   */
  getProcessor(sourceType: DataSourceType): DataSourceProcessor | undefined {
    return this.processors.get(sourceType);
  }
  
  /**
   * Get all registered processors
   */
  getAllProcessors(): DataSourceProcessor[] {
    return Array.from(this.processors.values());
  }
  
  /**
   * Find the best processor for given input
   */
  findBestProcessor(input: DataSourceInput): DataSourceProcessor | undefined {
    const processor = this.processors.get(input.type);
    if (processor && processor.canProcess(input)) {
      return processor;
    }
    
    // Fallback: try all processors to see if any can handle this input
    for (const p of this.processors.values()) {
      if (p.canProcess(input)) {
        return p;
      }
    }
    
    return undefined;
  }
}