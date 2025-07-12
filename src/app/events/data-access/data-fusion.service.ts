import { Injectable } from '@angular/core';
import { 
  ExtendedParsedEventData, 
  ParsedEventField, 
  ProcessingResult 
} from './data-source-processor.interface';
import { EventCategory } from '@events/utils/event.model';

/**
 * Fusion strategies for combining conflicting data
 */
export type FusionStrategy = 
  | 'highest_confidence'    // Use field with highest confidence
  | 'source_priority'       // Use field from highest priority source
  | 'consensus'            // Use value that appears in multiple sources
  | 'manual_review';       // Flag for manual review

/**
 * Configuration for data fusion process
 */
export interface FusionConfig {
  defaultStrategy: FusionStrategy;
  fieldStrategies?: Partial<Record<keyof ExtendedParsedEventData, FusionStrategy>>;
  confidenceThreshold: number; // Minimum confidence to consider a field
  consensusThreshold: number;  // Minimum sources needed for consensus
  enableSmartMerging: boolean; // Enable intelligent field combination
}

/**
 * Result of fusion operation
 */
export interface FusionResult {
  fusedData: ExtendedParsedEventData;
  conflicts: FieldConflict[];
  confidence: FusionConfidence;
  recommendations: string[];
  needsReview: boolean;
}

/**
 * Information about conflicting field values
 */
export interface FieldConflict {
  field: string;
  values: Array<{
    value: string;
    confidence: number;
    source: string;
    priority: number;
  }>;
  resolution: 'auto' | 'manual';
  strategy: FusionStrategy;
}

/**
 * Confidence metrics for fused result
 */
export interface FusionConfidence {
  overall: number;
  byField: Record<string, number>;
  sourceAgreement: number; // How much sources agree (0-100)
  dataCompleteness: number; // How complete the final data is (0-100)
}

/**
 * Service for intelligently combining event data from multiple sources
 */
@Injectable({
  providedIn: 'root'
})
export class DataFusionService {
  
  private readonly defaultConfig: FusionConfig = {
    defaultStrategy: 'highest_confidence',
    fieldStrategies: {
      title: 'highest_confidence',
      date: 'consensus',
      location: 'source_priority',
      website: 'highest_confidence'
    },
    confidenceThreshold: 30,
    consensusThreshold: 2,
    enableSmartMerging: true
  };

  /**
   * Fuse multiple processing results into a single event data object
   */
  async fuseMultipleSources(
    results: ProcessingResult[],
    config: Partial<FusionConfig> = {}
  ): Promise<FusionResult> {
    const fusionConfig = { ...this.defaultConfig, ...config };
    
    // Filter successful results
    const successfulResults = results.filter(r => r.success && r.data);
    
    if (successfulResults.length === 0) {
      throw new Error('No successful processing results to fuse');
    }
    
    if (successfulResults.length === 1) {
      // Single source - no fusion needed
      return this.createSingleSourceResult(successfulResults[0].data!, fusionConfig);
    }
    
    // Analyze conflicts and similarities
    const conflicts = this.analyzeConflicts(successfulResults, fusionConfig);
    
    // Fuse the data using appropriate strategies
    const fusedData = await this.performFusion(successfulResults, conflicts, fusionConfig);
    
    // Calculate confidence metrics
    const confidence = this.calculateFusionConfidence(fusedData, successfulResults, conflicts);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(fusedData, conflicts, confidence);
    
    return {
      fusedData,
      conflicts,
      confidence,
      recommendations,
      needsReview: this.shouldFlagForReview(conflicts, confidence, fusionConfig)
    };
  }

  private createSingleSourceResult(
    data: ExtendedParsedEventData, 
    config: FusionConfig
  ): FusionResult {
    const fieldConfidence: Record<string, number> = {};
    
    // Extract confidence from each field
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'confidence' in value) {
        fieldConfidence[key] = (value as ParsedEventField).confidence;
      }
    });
    
    return {
      fusedData: data,
      conflicts: [],
      confidence: {
        overall: data.overallConfidence,
        byField: fieldConfidence,
        sourceAgreement: 100, // Single source = perfect agreement
        dataCompleteness: this.calculateCompleteness(data)
      },
      recommendations: [],
      needsReview: data.overallConfidence < 60
    };
  }

  private analyzeConflicts(
    results: ProcessingResult[],
    config: FusionConfig
  ): FieldConflict[] {
    const conflicts: FieldConflict[] = [];
    const fieldKeys = ['title', 'description', 'date', 'location', 'organizer', 'ticketInfo', 'contactInfo', 'website'];
    
    for (const fieldKey of fieldKeys) {
      const fieldValues = results
        .map((result, index) => {
          const field = (result.data as any)?.[fieldKey] as ParsedEventField | undefined;
          if (!field || !field.value || field.confidence < config.confidenceThreshold) {
            return null;
          }
          
          return {
            value: field.value,
            confidence: field.confidence,
            source: field.source || `Source ${index + 1}`,
            priority: this.getSourcePriority(result.data!.sourceType),
            resultIndex: index
          };
        })
        .filter(Boolean) as any[];
      
      if (fieldValues.length > 1) {
        // Check if values are significantly different
        const uniqueValues = new Set(fieldValues.map(v => this.normalizeValue(v.value)));
        
        if (uniqueValues.size > 1) {
          // We have conflicting values
          const strategy = config.fieldStrategies?.[fieldKey as keyof ExtendedParsedEventData] || config.defaultStrategy;
          
          conflicts.push({
            field: fieldKey,
            values: fieldValues,
            resolution: this.canAutoResolve(fieldValues, strategy, config) ? 'auto' : 'manual',
            strategy
          });
        }
      }
    }
    
    return conflicts;
  }

  private async performFusion(
    results: ProcessingResult[],
    conflicts: FieldConflict[],
    config: FusionConfig
  ): Promise<ExtendedParsedEventData> {
    // Start with the highest priority result as base
    const baseResult = results.reduce((best, current) => 
      this.getSourcePriority(current.data!.sourceType) > this.getSourcePriority(best.data!.sourceType) ? current : best
    );
    
    const fusedData = { ...baseResult.data! };
    
    // Apply fusion strategies for each field
    for (const conflict of conflicts) {
      const resolvedField = await this.resolveFieldConflict(conflict, config);
      if (resolvedField) {
        (fusedData as any)[conflict.field] = resolvedField;
      }
    }
    
    // Fuse arrays (categories, tags)
    fusedData.categories = this.fuseCategories(results);
    fusedData.tags = this.fuseTags(results);
    
    // Update metadata
    fusedData.metadata = {
      ...fusedData.metadata,
      fusedFromSources: results.map(r => r.data!.sourceType),
      fusionStrategy: config.defaultStrategy,
      conflictsResolved: conflicts.length
    };
    
    // Recalculate overall confidence
    fusedData.overallConfidence = this.calculateOverallConfidence(fusedData, results);
    
    return fusedData;
  }

  private async resolveFieldConflict(
    conflict: FieldConflict,
    config: FusionConfig
  ): Promise<ParsedEventField | null> {
    const { values, strategy } = conflict;
    
    switch (strategy) {
      case 'highest_confidence':
        return this.selectByHighestConfidence(values);
        
      case 'source_priority':
        return this.selectBySourcePriority(values);
        
      case 'consensus':
        return this.selectByConsensus(values, config.consensusThreshold);
        
      case 'manual_review':
        // For now, fall back to highest confidence
        // In a full implementation, this would queue for human review
        return this.selectByHighestConfidence(values);
        
      default:
        return this.selectByHighestConfidence(values);
    }
  }

  private selectByHighestConfidence(values: any[]): ParsedEventField {
    const best = values.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return {
      value: best.value,
      confidence: best.confidence,
      source: `Fused (${best.source})`,
      sourceText: best.value
    };
  }

  private selectBySourcePriority(values: any[]): ParsedEventField {
    const best = values.reduce((best, current) => 
      current.priority > best.priority ? current : best
    );
    
    return {
      value: best.value,
      confidence: best.confidence,
      source: `Fused (${best.source})`,
      sourceText: best.value
    };
  }

  private selectByConsensus(values: any[], threshold: number): ParsedEventField {
    // Group by normalized value
    const valueGroups = new Map<string, any[]>();
    
    for (const value of values) {
      const normalized = this.normalizeValue(value.value);
      if (!valueGroups.has(normalized)) {
        valueGroups.set(normalized, []);
      }
      valueGroups.get(normalized)!.push(value);
    }
    
    // Find the value with most support
    let bestGroup: any[] = [];
    for (const group of valueGroups.values()) {
      if (group.length > bestGroup.length) {
        bestGroup = group;
      }
    }
    
    if (bestGroup.length >= threshold) {
      // Use the highest confidence value from the consensus group
      const best = bestGroup.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return {
        value: best.value,
        confidence: Math.min(best.confidence + 10, 100), // Bonus for consensus
        source: `Fused (Consensus from ${bestGroup.length} sources)`,
        sourceText: best.value
      };
    }
    
    // No consensus reached, fall back to highest confidence
    return this.selectByHighestConfidence(values);
  }

  private fuseCategories(results: ProcessingResult[]): EventCategory[] {
    const categoryMap = new Map<EventCategory, number>();
    
    for (const result of results) {
      const categories = result.data?.categories || [];
      for (const category of categories) {
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    }
    
    // Return categories that appear in multiple sources, or top-scoring single source
    const sortedCategories = Array.from(categoryMap.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);
    
    return sortedCategories.slice(0, 3); // Max 3 categories
  }

  private fuseTags(results: ProcessingResult[]): string[] {
    const tagMap = new Map<string, number>();
    
    for (const result of results) {
      const tags = result.data?.tags || [];
      for (const tag of tags) {
        tagMap.set(tag.toLowerCase(), (tagMap.get(tag.toLowerCase()) || 0) + 1);
      }
    }
    
    // Return tags that appear in multiple sources, prioritized by frequency
    return Array.from(tagMap.entries())
      .filter(([, count]) => count >= 1) // Keep all tags for now
      .sort(([,a], [,b]) => b - a)
      .map(([tag]) => tag)
      .slice(0, 10); // Max 10 tags
  }

  private calculateFusionConfidence(
    fusedData: ExtendedParsedEventData,
    results: ProcessingResult[],
    conflicts: FieldConflict[]
  ): FusionConfidence {
    const byField: Record<string, number> = {};
    
    // Extract field confidence
    const fieldKeys = ['title', 'description', 'date', 'location', 'organizer', 'ticketInfo', 'contactInfo', 'website'];
    for (const fieldKey of fieldKeys) {
      const field = (fusedData as any)[fieldKey] as ParsedEventField | undefined;
      if (field && field.confidence) {
        byField[fieldKey] = field.confidence;
      }
    }
    
    // Calculate source agreement (lower when more conflicts)
    const totalFields = fieldKeys.length;
    const sourceAgreement = Math.max(0, 100 - (conflicts.length / totalFields) * 50);
    
    // Calculate data completeness
    const dataCompleteness = this.calculateCompleteness(fusedData);
    
    // Overall confidence considers all factors
    const fieldConfidences = Object.values(byField);
    const avgFieldConfidence = fieldConfidences.length > 0 
      ? fieldConfidences.reduce((sum, conf) => sum + conf, 0) / fieldConfidences.length 
      : 0;
    
    const overall = Math.round(
      (avgFieldConfidence * 0.6) + 
      (sourceAgreement * 0.2) + 
      (dataCompleteness * 0.2)
    );
    
    return {
      overall,
      byField,
      sourceAgreement,
      dataCompleteness
    };
  }

  private calculateCompleteness(data: ExtendedParsedEventData): number {
    const requiredFields = ['title', 'description', 'date'];
    const optionalFields = ['location', 'organizer', 'ticketInfo', 'contactInfo', 'website'];
    
    let score = 0;
    let maxScore = 0;
    
    // Required fields (weight: 3)
    for (const field of requiredFields) {
      maxScore += 3;
      const fieldData = (data as any)[field] as ParsedEventField | undefined;
      if (fieldData && fieldData.value && fieldData.confidence > 30) {
        score += 3;
      }
    }
    
    // Optional fields (weight: 1)
    for (const field of optionalFields) {
      maxScore += 1;
      const fieldData = (data as any)[field] as ParsedEventField | undefined;
      if (fieldData && fieldData.value && fieldData.confidence > 30) {
        score += 1;
      }
    }
    
    return Math.round((score / maxScore) * 100);
  }

  private generateRecommendations(
    fusedData: ExtendedParsedEventData,
    conflicts: FieldConflict[],
    confidence: FusionConfidence
  ): string[] {
    const recommendations: string[] = [];
    
    if (confidence.overall < 70) {
      recommendations.push('Overall confidence is low - consider manual review');
    }
    
    if (conflicts.length > 0) {
      recommendations.push(`${conflicts.length} conflicts were resolved automatically`);
    }
    
    if (confidence.dataCompleteness < 60) {
      recommendations.push('Event data is incomplete - consider additional sources');
    }
    
    if (confidence.sourceAgreement < 70) {
      recommendations.push('Sources show significant disagreement - verify accuracy');
    }
    
    // Field-specific recommendations
    if (!fusedData.location?.value || fusedData.location.confidence < 50) {
      recommendations.push('Location information is uncertain - verify venue details');
    }
    
    if (!fusedData.date?.value || fusedData.date.confidence < 60) {
      recommendations.push('Date/time information needs verification');
    }
    
    return recommendations;
  }

  private shouldFlagForReview(
    conflicts: FieldConflict[],
    confidence: FusionConfidence,
    config: FusionConfig
  ): boolean {
    // Flag for review if:
    return (
      confidence.overall < 60 ||                              // Low overall confidence
      conflicts.some(c => c.resolution === 'manual') ||       // Manual conflicts
      confidence.sourceAgreement < 50 ||                      // High disagreement
      conflicts.filter(c => c.field === 'date').length > 0    // Date conflicts
    );
  }

  private canAutoResolve(values: any[], strategy: FusionStrategy, config: FusionConfig): boolean {
    return strategy !== 'manual_review' && values.length <= 4; // Don't auto-resolve too many conflicts
  }

  private normalizeValue(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private getSourcePriority(sourceType: string): number {
    const priorities = {
      'image': 80,    // AI extraction from images usually accurate
      'url': 70,      // Structured web data
      'social': 60,   // Social media posts
      'text': 50,     // Manual text input
      'email': 40,    // Email parsing
      'calendar': 90  // Calendar files are usually very accurate
    };
    
    return priorities[sourceType as keyof typeof priorities] || 30;
  }

  private calculateOverallConfidence(
    fusedData: ExtendedParsedEventData,
    results: ProcessingResult[]
  ): number {
    // Calculate based on field confidences and number of agreeing sources
    const fieldKeys = ['title', 'description', 'date', 'location'];
    let totalConfidence = 0;
    let fieldCount = 0;
    
    for (const fieldKey of fieldKeys) {
      const field = (fusedData as any)[fieldKey] as ParsedEventField | undefined;
      if (field && field.value) {
        totalConfidence += field.confidence;
        fieldCount++;
      }
    }
    
    const avgConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;
    
    // Bonus for multiple sources
    const sourceBonus = Math.min(results.length * 5, 20);
    
    return Math.min(Math.round(avgConfidence + sourceBonus), 100);
  }
}