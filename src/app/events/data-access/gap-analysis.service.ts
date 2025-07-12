import { Injectable } from '@angular/core';
import { ExtendedParsedEventData, DataSourceType } from './data-source-processor.interface';

/**
 * Information about a missing or low-quality data field
 */
export interface DataGap {
  field: string;
  displayName: string;
  confidence: number;
  status: 'missing' | 'low_confidence' | 'partial' | 'good';
  currentValue?: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  suggestions: SourceSuggestion[];
}

/**
 * Suggestion for which data source might help fill a gap
 */
export interface SourceSuggestion {
  sourceType: DataSourceType;
  displayName: string;
  reasoning: string;
  likelihood: 'high' | 'medium' | 'low';
  icon: string;
  examples: string[];
}

/**
 * Complete analysis of data completeness and gaps
 */
export interface GapAnalysisResult {
  overall: {
    completeness: number; // 0-100%
    readiness: 'ready' | 'needs_work' | 'minimal';
    criticalGaps: number;
    totalFields: number;
    filledFields: number;
  };
  gaps: DataGap[];
  recommendations: string[];
  suggestedSources: SourceSuggestion[];
  nextBestAction: {
    type: 'add_source' | 'manual_edit' | 'ready_to_create';
    message: string;
    sourceType?: DataSourceType;
  };
}

/**
 * Service for analyzing data completeness and suggesting improvements
 */
@Injectable({
  providedIn: 'root'
})
export class GapAnalysisService {
  
  private readonly fieldDefinitions = {
    title: {
      displayName: 'Event Title',
      importance: 'critical' as const,
      confidenceThreshold: 70
    },
    description: {
      displayName: 'Description',
      importance: 'important' as const,
      confidenceThreshold: 60
    },
    date: {
      displayName: 'Date & Time',
      importance: 'critical' as const,
      confidenceThreshold: 70
    },
    location: {
      displayName: 'Location/Venue',
      importance: 'important' as const,
      confidenceThreshold: 60
    },
    organizer: {
      displayName: 'Organizer',
      importance: 'nice_to_have' as const,
      confidenceThreshold: 50
    },
    ticketInfo: {
      displayName: 'Ticket Information',
      importance: 'important' as const,
      confidenceThreshold: 60
    },
    contactInfo: {
      displayName: 'Contact Information',
      importance: 'nice_to_have' as const,
      confidenceThreshold: 50
    },
    website: {
      displayName: 'Website/Social Media',
      importance: 'nice_to_have' as const,
      confidenceThreshold: 50
    }
  };

  private readonly sourceCapabilities: Record<DataSourceType, {
    displayName: string;
    icon: string;
    strengths: string[];
    examples: string[];
  }> = {
    text: {
      displayName: 'Text Input',
      icon: '📝',
      strengths: ['title', 'description', 'date', 'location', 'organizer', 'ticketInfo', 'contactInfo'],
      examples: [
        'Copy-paste from emails or messages',
        'Social media post content',
        'Event descriptions from any source'
      ]
    },
    image: {
      displayName: 'Image/Flyer',
      icon: '🖼️',
      strengths: ['title', 'date', 'location', 'ticketInfo', 'website', 'organizer'],
      examples: [
        'Event flyers and posters',
        'Screenshots from social media',
        'Printed advertisements'
      ]
    },
    url: {
      displayName: 'Website URL',
      icon: '🌐',
      strengths: ['title', 'description', 'date', 'location', 'website', 'ticketInfo', 'organizer'],
      examples: [
        'Eventbrite or Facebook event pages',
        'Venue websites with event listings',
        'Ticketing platform pages'
      ]
    },
    social: {
      displayName: 'Social Media',
      icon: '📱',
      strengths: ['title', 'description', 'date', 'location', 'organizer'],
      examples: [
        'Facebook event posts',
        'Instagram announcements',
        'Twitter event threads'
      ]
    },
    calendar: {
      displayName: 'Calendar File',
      icon: '📅',
      strengths: ['title', 'description', 'date', 'location', 'organizer'],
      examples: [
        'ICS calendar invitations',
        'Google Calendar exports',
        'Outlook event files'
      ]
    },
    email: {
      displayName: 'Email Content',
      icon: '📧',
      strengths: ['title', 'description', 'date', 'organizer', 'contactInfo'],
      examples: [
        'Event announcement emails',
        'Newsletter content',
        'Email invitations'
      ]
    }
  };

  /**
   * Analyze data completeness and identify gaps
   */
  analyzeGaps(
    extractedData: ExtendedParsedEventData | null,
    usedSources: DataSourceType[] = []
  ): GapAnalysisResult {
    if (!extractedData) {
      return this.createEmptyAnalysis(usedSources);
    }

    const gaps = this.identifyGaps(extractedData);
    const overall = this.calculateOverallMetrics(gaps);
    const recommendations = this.generateRecommendations(gaps, usedSources);
    const suggestedSources = this.suggestSources(gaps, usedSources);
    const nextBestAction = this.determineNextAction(gaps, usedSources, overall);

    return {
      overall,
      gaps,
      recommendations,
      suggestedSources,
      nextBestAction
    };
  }

  /**
   * Get specific suggestions for a field
   */
  getSuggestionsForField(fieldName: string, usedSources: DataSourceType[] = []): SourceSuggestion[] {
    const suggestions: SourceSuggestion[] = [];
    
    Object.entries(this.sourceCapabilities).forEach(([sourceType, capability]) => {
      if (usedSources.includes(sourceType as DataSourceType)) return;
      
      if (capability.strengths.includes(fieldName)) {
        const likelihood = this.calculateLikelihood(fieldName, sourceType as DataSourceType);
        const reasoning = this.generateReasoning(fieldName, sourceType as DataSourceType);
        
        suggestions.push({
          sourceType: sourceType as DataSourceType,
          displayName: capability.displayName,
          reasoning,
          likelihood,
          icon: capability.icon,
          examples: capability.examples
        });
      }
    });

    return suggestions.sort((a, b) => {
      const likelihoodOrder = { high: 3, medium: 2, low: 1 };
      return likelihoodOrder[b.likelihood] - likelihoodOrder[a.likelihood];
    });
  }

  /**
   * Calculate data completeness score (0-100)
   */
  calculateCompleteness(extractedData: ExtendedParsedEventData | null): number {
    if (!extractedData) return 0;
    
    const gaps = this.identifyGaps(extractedData);
    const totalWeight = gaps.reduce((sum, gap) => {
      const weights = { critical: 3, important: 2, nice_to_have: 1 };
      return sum + weights[gap.importance];
    }, 0);
    
    const achievedWeight = gaps.reduce((sum, gap) => {
      const weights = { critical: 3, important: 2, nice_to_have: 1 };
      const achievement = gap.status === 'good' ? 1 : 
                         gap.status === 'partial' ? 0.5 : 0;
      return sum + (weights[gap.importance] * achievement);
    }, 0);
    
    return Math.round((achievedWeight / totalWeight) * 100);
  }

  private createEmptyAnalysis(usedSources: DataSourceType[]): GapAnalysisResult {
    const allGaps = Object.entries(this.fieldDefinitions).map(([field, def]) => ({
      field,
      displayName: def.displayName,
      confidence: 0,
      status: 'missing' as const,
      importance: def.importance,
      suggestions: this.getSuggestionsForField(field, usedSources)
    }));

    return {
      overall: {
        completeness: 0,
        readiness: 'minimal',
        criticalGaps: allGaps.filter(g => g.importance === 'critical').length,
        totalFields: allGaps.length,
        filledFields: 0
      },
      gaps: allGaps,
      recommendations: [
        'Start by adding your first data source',
        'Text input is great for basic information',
        'Images work well for flyer content',
        'URLs can extract rich structured data'
      ],
      suggestedSources: this.getAllSourceSuggestions(usedSources),
      nextBestAction: {
        type: 'add_source',
        message: 'Add your first data source to begin extraction',
        sourceType: 'text'
      }
    };
  }

  private identifyGaps(extractedData: ExtendedParsedEventData): DataGap[] {
    const gaps: DataGap[] = [];
    
    Object.entries(this.fieldDefinitions).forEach(([field, definition]) => {
      const fieldData = (extractedData as any)[field];
      const confidence = fieldData?.confidence || 0;
      const value = fieldData?.value || '';
      
      let status: DataGap['status'];
      if (!value || value.trim() === '') {
        status = 'missing';
      } else if (confidence < definition.confidenceThreshold) {
        status = 'low_confidence';
      } else if (confidence < 85) {
        status = 'partial';
      } else {
        status = 'good';
      }
      
      if (status !== 'good') {
        gaps.push({
          field,
          displayName: definition.displayName,
          confidence,
          status,
          currentValue: value,
          importance: definition.importance,
          suggestions: this.getSuggestionsForField(field, [extractedData.sourceType])
        });
      }
    });
    
    return gaps;
  }

  private calculateOverallMetrics(gaps: DataGap[]) {
    const totalFields = Object.keys(this.fieldDefinitions).length;
    const filledFields = totalFields - gaps.filter(g => g.status === 'missing').length;
    const criticalGaps = gaps.filter(g => g.importance === 'critical').length;
    
    const completeness = Math.round(((totalFields - gaps.length) / totalFields) * 100);
    
    let readiness: 'ready' | 'needs_work' | 'minimal';
    if (criticalGaps === 0 && gaps.filter(g => g.importance === 'important').length <= 1) {
      readiness = 'ready';
    } else if (criticalGaps <= 1 && completeness >= 60) {
      readiness = 'needs_work';
    } else {
      readiness = 'minimal';
    }
    
    return {
      completeness,
      readiness,
      criticalGaps,
      totalFields,
      filledFields
    };
  }

  private generateRecommendations(gaps: DataGap[], usedSources: DataSourceType[]): string[] {
    const recommendations: string[] = [];
    
    const criticalGaps = gaps.filter(g => g.importance === 'critical');
    const importantGaps = gaps.filter(g => g.importance === 'important');
    
    if (criticalGaps.length > 0) {
      recommendations.push(`${criticalGaps.length} critical field(s) need attention: ${criticalGaps.map(g => g.displayName).join(', ')}`);
    }
    
    if (importantGaps.length > 0) {
      recommendations.push(`Consider filling ${importantGaps.length} important field(s) for better event quality`);
    }
    
    // Source-specific recommendations
    if (!usedSources.includes('image') && gaps.some(g => ['ticketInfo', 'date', 'location'].includes(g.field))) {
      recommendations.push('Adding an event flyer could help extract missing ticket, date, or location info');
    }
    
    if (!usedSources.includes('url') && gaps.some(g => ['website', 'description'].includes(g.field))) {
      recommendations.push('Adding an event website URL could provide rich additional details');
    }
    
    if (gaps.filter(g => g.status === 'low_confidence').length > 2) {
      recommendations.push('Multiple fields have low confidence - consider adding another source to verify information');
    }
    
    return recommendations;
  }

  private suggestSources(gaps: DataGap[], usedSources: DataSourceType[]): SourceSuggestion[] {
    const sourcePriority = new Map<DataSourceType, number>();
    
    // Score each source type based on how many gaps it could help with
    gaps.forEach(gap => {
      gap.suggestions.forEach(suggestion => {
        if (!usedSources.includes(suggestion.sourceType)) {
          const current = sourcePriority.get(suggestion.sourceType) || 0;
          const weight = gap.importance === 'critical' ? 3 : 
                        gap.importance === 'important' ? 2 : 1;
          sourcePriority.set(suggestion.sourceType, current + weight);
        }
      });
    });
    
    // Convert to suggestions and sort by priority
    return Array.from(sourcePriority.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3 suggestions
      .map(([sourceType]) => {
        const capability = this.sourceCapabilities[sourceType];
        const relevantGaps = gaps.filter(gap => 
          gap.suggestions.some(s => s.sourceType === sourceType)
        );
        
        return {
          sourceType,
          displayName: capability.displayName,
          reasoning: `Could help with: ${relevantGaps.map(g => g.displayName).join(', ')}`,
          likelihood: 'high' as const,
          icon: capability.icon,
          examples: capability.examples
        };
      });
  }

  private determineNextAction(
    gaps: DataGap[], 
    usedSources: DataSourceType[], 
    overall: any
  ) {
    const criticalGaps = gaps.filter(g => g.importance === 'critical');
    
    if (criticalGaps.length === 0 && overall.completeness >= 70) {
      return {
        type: 'ready_to_create' as const,
        message: 'Event data looks good! Ready to create the event.'
      };
    }
    
    if (criticalGaps.length > 0) {
      const missingCritical = criticalGaps.filter(g => g.status === 'missing');
      if (missingCritical.length > 0) {
        const suggestions = this.suggestSources(missingCritical, usedSources);
        return {
          type: 'add_source' as const,
          message: `Add data source to fill critical field: ${missingCritical[0].displayName}`,
          sourceType: suggestions[0]?.sourceType
        };
      } else {
        return {
          type: 'manual_edit' as const,
          message: 'Review and edit critical fields with low confidence'
        };
      }
    }
    
    const topSuggestion = this.suggestSources(gaps, usedSources)[0];
    return {
      type: 'add_source' as const,
      message: `Consider adding ${topSuggestion?.displayName || 'another source'} to improve completeness`,
      sourceType: topSuggestion?.sourceType
    };
  }

  private getAllSourceSuggestions(usedSources: DataSourceType[]): SourceSuggestion[] {
    return Object.entries(this.sourceCapabilities)
      .filter(([sourceType]) => !usedSources.includes(sourceType as DataSourceType))
      .map(([sourceType, capability]) => ({
        sourceType: sourceType as DataSourceType,
        displayName: capability.displayName,
        reasoning: `Good for: ${capability.strengths.slice(0, 3).join(', ')}`,
        likelihood: 'medium' as const,
        icon: capability.icon,
        examples: capability.examples
      }));
  }

  private calculateLikelihood(fieldName: string, sourceType: DataSourceType): 'high' | 'medium' | 'low' {
    const capability = this.sourceCapabilities[sourceType];
    const strongFields = capability.strengths;
    
    if (strongFields.includes(fieldName)) {
      // Specific source-field combinations that are particularly good
      if (sourceType === 'image' && ['title', 'date', 'ticketInfo'].includes(fieldName)) return 'high';
      if (sourceType === 'url' && ['website', 'description', 'title'].includes(fieldName)) return 'high';
      if (sourceType === 'text' && ['description', 'organizer'].includes(fieldName)) return 'high';
      
      return 'medium';
    }
    
    return 'low';
  }

  private generateReasoning(fieldName: string, sourceType: DataSourceType): string {
    const reasons: Record<string, Record<string, string>> = {
      text: {
        title: 'Event titles are commonly found in text descriptions',
        description: 'Text input is ideal for detailed event descriptions',
        date: 'Dates are often mentioned in text announcements',
        location: 'Venue information is typically included in text',
        organizer: 'Organizer details are commonly mentioned in text',
        ticketInfo: 'Pricing information often appears in text descriptions',
        contactInfo: 'Contact details are frequently shared in text format',
        website: 'URLs and social handles may be mentioned in text'
      },
      image: {
        title: 'Event titles are prominently displayed on flyers',
        description: 'Flyer descriptions provide good event context',
        date: 'Dates and times are clearly shown on event flyers',
        location: 'Venue information is typically featured on flyers',
        organizer: 'Organizer logos and names appear on promotional materials',
        ticketInfo: 'Ticket prices and links are often prominently displayed',
        contactInfo: 'Contact details may appear on flyers',
        website: 'QR codes and URLs are commonly found on flyers'
      },
      url: {
        title: 'Event pages have structured title information',
        description: 'Websites provide detailed event descriptions',
        date: 'Event pages contain structured date/time data',
        location: 'Venue information is well-structured on event pages',
        organizer: 'Organizer information is typically available',
        ticketInfo: 'Ticket platforms provide comprehensive pricing info',
        contactInfo: 'Contact details are often available on event sites',
        website: 'Primary source for official event URLs'
      },
      social: {
        title: 'Social posts often feature event titles prominently',
        description: 'Social media provides informal event descriptions',
        date: 'Event dates are commonly shared in social posts',
        location: 'Venue tags and location info appear in social media',
        organizer: 'Organizer profiles and mentions are common',
        contactInfo: 'Social handles and contact info may be shared',
        website: 'Links to event pages are often included'
      },
      calendar: {
        title: 'Calendar entries contain structured event titles',
        description: 'Calendar descriptions provide event details',
        date: 'Calendar files have precise date/time information',
        location: 'Location data is structured in calendar entries',
        organizer: 'Organizer information is included in calendar data',
        contactInfo: 'Contact details may be embedded in calendar files',
        website: 'Event URLs are often included in calendar entries'
      },
      email: {
        title: 'Email subjects often contain event titles',
        description: 'Email content provides detailed event information',
        date: 'Event dates are mentioned in email announcements',
        location: 'Venue details are typically included in emails',
        organizer: 'Sender information indicates event organizer',
        contactInfo: 'Email content often includes contact details',
        website: 'Event links are commonly shared in emails'
      }
    };
    
    return reasons[sourceType]?.[fieldName] || 
           `${sourceType} sources can help provide ${fieldName} information`;
  }
}