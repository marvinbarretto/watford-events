import { Injectable, inject, signal } from '@angular/core';
import { 
  DataSourceInput, 
  DataSourceProcessor, 
  ProcessingResult,
  DataSourceProcessorRegistry,
  ExtendedParsedEventData
} from './data-source-processor.interface';
import { TextProcessorService } from './text-processor.service';
import { ImageProcessorService } from './image-processor.service';
import { URLProcessorService } from './url-processor.service';
import { DataFusionService, FusionConfig, FusionResult } from './data-fusion.service';

/**
 * Configuration for multi-modal parsing
 */
export interface MultiModalConfig {
  enableParallelProcessing: boolean;
  maxConcurrentProcessors: number;
  fusionConfig: Partial<FusionConfig>;
  timeoutMs: number;
  enableProgressTracking: boolean;
}

/**
 * Progress information for multi-modal parsing
 */
export interface ParsingProgress {
  stage: 'initializing' | 'processing' | 'fusing' | 'complete' | 'error';
  completedSources: number;
  totalSources: number;
  currentSource?: string;
  estimatedTimeRemaining?: number;
}

/**
 * Complete result from multi-modal parsing
 */
export interface MultiModalResult {
  success: boolean;
  finalData?: ExtendedParsedEventData;
  fusionResult?: FusionResult;
  individualResults: ProcessingResult[];
  processingTime: number;
  error?: string;
  progress: ParsingProgress;
}

/**
 * Service for orchestrating multi-modal event data parsing
 * Combines multiple data sources and fusion strategies
 */
@Injectable({
  providedIn: 'root'
})
export class MultiModalParserService {
  private readonly _registry = new DataSourceProcessorRegistry();
  private readonly _fusionService = inject(DataFusionService);
  
  // Progress tracking
  private readonly _progress = signal<ParsingProgress>({
    stage: 'initializing',
    completedSources: 0,
    totalSources: 0
  });
  
  readonly progress = this._progress.asReadonly();
  
  private readonly defaultConfig: MultiModalConfig = {
    enableParallelProcessing: true,
    maxConcurrentProcessors: 3,
    fusionConfig: {
      defaultStrategy: 'highest_confidence',
      confidenceThreshold: 30,
      enableSmartMerging: true
    },
    timeoutMs: 30000,
    enableProgressTracking: true
  };
  
  constructor() {
    this.initializeProcessors();
  }
  
  private initializeProcessors(): void {
    // Register all available processors
    this._registry.register(inject(TextProcessorService));
    this._registry.register(inject(ImageProcessorService));
    this._registry.register(inject(URLProcessorService));
    
    console.log('[MultiModalParser] Initialized with processors:', 
      this._registry.getAllProcessors().map(p => p.getName())
    );
  }
  
  /**
   * Parse event data from multiple sources simultaneously
   */
  async parseFromMultipleSources(
    sources: DataSourceInput[],
    config: Partial<MultiModalConfig> = {}
  ): Promise<MultiModalResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      this.updateProgress({
        stage: 'initializing',
        completedSources: 0,
        totalSources: sources.length
      });
      
      // Validate inputs
      const validatedSources = this.validateSources(sources);
      if (validatedSources.length === 0) {
        throw new Error('No valid sources provided for parsing');
      }
      
      // Process all sources
      this.updateProgress({
        stage: 'processing',
        completedSources: 0,
        totalSources: validatedSources.length
      });
      
      const results = await this.processAllSources(validatedSources, finalConfig);
      
      // Fuse results if multiple sources
      this.updateProgress({
        stage: 'fusing',
        completedSources: validatedSources.length,
        totalSources: validatedSources.length
      });
      
      const fusionResult = await this._fusionService.fuseMultipleSources(
        results,
        finalConfig.fusionConfig
      );
      
      this.updateProgress({
        stage: 'complete',
        completedSources: validatedSources.length,
        totalSources: validatedSources.length
      });
      
      return {
        success: true,
        finalData: fusionResult.fusedData,
        fusionResult,
        individualResults: results,
        processingTime: Date.now() - startTime,
        progress: this._progress()
      };
      
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        completedSources: 0,
        totalSources: sources.length
      });
      
      return {
        success: false,
        individualResults: [],
        processingTime: Date.now() - startTime,
        error: `Multi-modal parsing failed: ${error}`,
        progress: this._progress()
      };
    }
  }
  
  /**
   * Parse from a single source (convenience method)
   */
  async parseFromSingleSource(
    source: DataSourceInput,
    config: Partial<MultiModalConfig> = {}
  ): Promise<MultiModalResult> {
    return this.parseFromMultipleSources([source], config);
  }
  
  /**
   * Get list of supported source types
   */
  getSupportedSourceTypes(): string[] {
    return this._registry.getAllProcessors().map(p => p.sourceType);
  }
  
  /**
   * Check if a source can be processed
   */
  canProcessSource(source: DataSourceInput): boolean {
    const processor = this._registry.findBestProcessor(source);
    return !!processor;
  }
  
  /**
   * Get processor information for a source type
   */
  getProcessorInfo(sourceType: string): { name: string; priority: number } | null {
    const processor = this._registry.getProcessor(sourceType as any);
    if (!processor) return null;
    
    return {
      name: processor.getName(),
      priority: processor.priority
    };
  }
  
  private validateSources(sources: DataSourceInput[]): DataSourceInput[] {
    return sources.filter(source => {
      try {
        const processor = this._registry.findBestProcessor(source);
        if (!processor) {
          console.warn(`[MultiModalParser] No processor found for source type: ${source.type}`);
          return false;
        }
        
        if (!processor.canProcess(source)) {
          console.warn(`[MultiModalParser] Processor cannot handle source:`, source);
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn(`[MultiModalParser] Error validating source:`, error);
        return false;
      }
    });
  }
  
  private async processAllSources(
    sources: DataSourceInput[],
    config: MultiModalConfig
  ): Promise<ProcessingResult[]> {
    if (config.enableParallelProcessing) {
      return this.processSourcesInParallel(sources, config);
    } else {
      return this.processSourcesSequentially(sources, config);
    }
  }
  
  private async processSourcesInParallel(
    sources: DataSourceInput[],
    config: MultiModalConfig
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const batches = this.createBatches(sources, config.maxConcurrentProcessors);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (source, index) => {
        try {
          const processor = this._registry.findBestProcessor(source);
          if (!processor) {
            throw new Error(`No processor available for ${source.type}`);
          }
          
          this.updateProgress({
            stage: 'processing',
            completedSources: results.length,
            totalSources: sources.length,
            currentSource: processor.getName()
          });
          
          const result = await this.processWithTimeout(
            processor.process(source),
            config.timeoutMs,
            `${processor.getName()} processing`
          );
          
          return result;
          
        } catch (error) {
          return {
            success: false,
            error: `Processing failed: ${error}`,
            processingTime: 0
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      this.updateProgress({
        stage: 'processing',
        completedSources: results.length,
        totalSources: sources.length
      });
    }
    
    return results;
  }
  
  private async processSourcesSequentially(
    sources: DataSourceInput[],
    config: MultiModalConfig
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      
      try {
        const processor = this._registry.findBestProcessor(source);
        if (!processor) {
          throw new Error(`No processor available for ${source.type}`);
        }
        
        this.updateProgress({
          stage: 'processing',
          completedSources: i,
          totalSources: sources.length,
          currentSource: processor.getName()
        });
        
        const result = await this.processWithTimeout(
          processor.process(source),
          config.timeoutMs,
          `${processor.getName()} processing`
        );
        
        results.push(result);
        
      } catch (error) {
        results.push({
          success: false,
          error: `Processing failed: ${error}`,
          processingTime: 0
        });
      }
    }
    
    return results;
  }
  
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  private async processWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
  
  private updateProgress(update: Partial<ParsingProgress>): void {
    this._progress.update(current => ({ ...current, ...update }));
  }
  
  /**
   * Advanced parsing methods
   */
  
  /**
   * Parse with automatic source detection
   * Attempts to determine the best way to process ambiguous input
   */
  async parseWithAutoDetection(
    input: string | File | URL,
    config: Partial<MultiModalConfig> = {}
  ): Promise<MultiModalResult> {
    const sources = this.detectSourceTypes(input);
    return this.parseFromMultipleSources(sources, config);
  }
  
  /**
   * Batch parse multiple inputs
   */
  async batchParse(
    inputs: Array<{ data: any; type?: string; options?: Record<string, any> }>,
    config: Partial<MultiModalConfig> = {}
  ): Promise<MultiModalResult[]> {
    const allResults: MultiModalResult[] = [];
    
    for (const input of inputs) {
      try {
        const sources: DataSourceInput[] = input.type 
          ? [{ type: input.type as any, data: input.data, options: input.options }]
          : this.detectSourceTypes(input.data);
          
        const result = await this.parseFromMultipleSources(sources, config);
        allResults.push(result);
        
      } catch (error) {
        allResults.push({
          success: false,
          individualResults: [],
          processingTime: 0,
          error: `Batch parsing failed: ${error}`,
          progress: { stage: 'error', completedSources: 0, totalSources: 0 }
        });
      }
    }
    
    return allResults;
  }
  
  private detectSourceTypes(input: any): DataSourceInput[] {
    const sources: DataSourceInput[] = [];
    
    if (typeof input === 'string') {
      // Try to detect if it's a URL
      try {
        const url = new URL(input);
        if (['http:', 'https:'].includes(url.protocol)) {
          sources.push({ type: 'url', data: input, priority: 70 });
        }
      } catch {
        // Not a URL, treat as text
        sources.push({ type: 'text', data: input, priority: 50 });
      }
    } else if (input instanceof File) {
      if (input.type.startsWith('image/')) {
        sources.push({ type: 'image', data: input, priority: 80 });
      } else if (input.type === 'text/plain' || input.name.endsWith('.txt')) {
        // For text files, we'd need to read the content first
        sources.push({ type: 'text', data: input, priority: 50 });
      }
    } else if (input instanceof URL) {
      sources.push({ type: 'url', data: input.toString(), priority: 70 });
    }
    
    return sources;
  }
  
  /**
   * Get processing statistics
   */
  getStats() {
    const processors = this._registry.getAllProcessors();
    return {
      availableProcessors: processors.length,
      processorTypes: processors.map(p => ({
        type: p.sourceType,
        name: p.getName(),
        priority: p.priority
      })),
      currentProgress: this._progress()
    };
  }
}