/**
 * Frontend service for managing scraping configurations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SsrPlatformService } from '@app/shared/utils/ssr/ssr-platform.service';

export interface ScrapingConfig {
  name: string;
  domain: string;
  description?: string;
  enabled: boolean;
  version: string;
  lastUpdated: string;
  configData?: any; // Full config for advanced users
}

export interface ConfigOption {
  value: string;
  label: string;
  description: string;
  domain: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScrapingConfigService {
  private http = inject(HttpClient);
  private configsSubject = new BehaviorSubject<ConfigOption[]>([]);
  
  readonly configs$ = this.configsSubject.asObservable();

  // Hardcoded available configs (since we can't dynamically read file system in frontend)
  private readonly availableConfigs: ConfigOption[] = [
    {
      value: 'watford-fringe',
      label: 'Watford Fringe Events',
      description: 'Scraper for Watford Fringe festival events with AJAX support',
      domain: 'watfringe.co.uk',
      enabled: true
    },
    {
      value: 'watford-actually',
      label: 'Watford Actually Events',
      description: 'Local Watford events from watfordactually.com',
      domain: 'watfordactually.com',
      enabled: true
    },
    {
      value: 'generic-event',
      label: 'Generic Event Extractor',
      description: 'Universal event extraction for most event websites',
      domain: 'any',
      enabled: true
    },
    {
      value: 'generic-article',
      label: 'Generic Article',
      description: 'Basic article/content extraction for general websites',
      domain: 'any',
      enabled: true
    }
  ];

  constructor() {
    // Initialize with hardcoded configs
    this.configsSubject.next(this.availableConfigs);
  }

  /**
   * Get all available scraping configurations
   */
  getConfigs(): Observable<ConfigOption[]> {
    console.log('📋 [CONFIG-SERVICE] Getting available configs');
    return of(this.availableConfigs);
  }

  /**
   * Get configuration details by name
   */
  getConfigDetails(configName: string): Observable<ScrapingConfig | null> {
    console.log(`🔍 [CONFIG-SERVICE] Getting details for config: ${configName}`);
    
    const config = this.availableConfigs.find(c => c.value === configName);
    if (!config) {
      return of(null);
    }

    // Convert to detailed format
    const details: ScrapingConfig = {
      name: config.label,
      domain: config.domain,
      description: config.description,
      enabled: config.enabled,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };

    return of(details);
  }

  /**
   * Suggest configuration based on URL
   */
  suggestConfigForUrl(url: string): Observable<ConfigOption | null> {
    console.log(`🤖 [CONFIG-SERVICE] Suggesting config for URL: ${url}`);
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Find matching config by domain
      const suggestion = this.availableConfigs.find(config => {
        if (config.domain === 'any') return false;
        return hostname.includes(config.domain.replace('*.', ''));
      });

      if (suggestion) {
        console.log(`✅ [CONFIG-SERVICE] Suggested config: ${suggestion.value} for ${hostname}`);
        return of(suggestion);
      } else {
        console.log(`🔍 [CONFIG-SERVICE] No specific config found, suggesting generic-event`);
        const fallback = this.availableConfigs.find(c => c.value === 'generic-event');
        return of(fallback || null);
      }
    } catch (error) {
      console.error(`💥 [CONFIG-SERVICE] Error parsing URL: ${error}`);
      return of(null);
    }
  }

  /**
   * Validate if a URL is compatible with a config
   */
  validateUrlForConfig(url: string, configName: string): Observable<boolean> {
    console.log(`✅ [CONFIG-SERVICE] Validating URL ${url} for config ${configName}`);
    
    const config = this.availableConfigs.find(c => c.value === configName);
    if (!config) {
      return of(false);
    }

    // Generic configs work with any URL
    if (config.domain === 'any') {
      return of(true);
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const isValid = hostname.includes(config.domain.replace('*.', ''));
      
      console.log(`${isValid ? '✅' : '❌'} [CONFIG-SERVICE] URL validation result: ${isValid}`);
      return of(isValid);
    } catch (error) {
      console.error(`💥 [CONFIG-SERVICE] Error validating URL: ${error}`);
      return of(false);
    }
  }

  /**
   * Get configuration recommendations based on URL analysis
   */
  getConfigRecommendations(url: string): Observable<{
    primary: ConfigOption | null;
    alternatives: ConfigOption[];
    confidence: number;
  }> {
    console.log(`🎯 [CONFIG-SERVICE] Getting recommendations for: ${url}`);
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      let confidence = 0;
      let primary: ConfigOption | null = null;
      const alternatives: ConfigOption[] = [];
      
      // Check for exact domain matches
      for (const config of this.availableConfigs) {
        if (config.domain !== 'any' && hostname.includes(config.domain.replace('*.', ''))) {
          primary = config;
          confidence = 90;
          break;
        }
      }
      
      // Add generic options as alternatives
      const genericConfigs = this.availableConfigs.filter(c => 
        c.domain === 'any' && c !== primary
      );
      alternatives.push(...genericConfigs);
      
      // If no specific match, suggest generic-event as primary
      if (!primary) {
        primary = this.availableConfigs.find(c => c.value === 'generic-event') || null;
        confidence = 60;
      }
      
      console.log(`🎯 [CONFIG-SERVICE] Primary: ${primary?.value}, Confidence: ${confidence}%`);
      
      return of({
        primary,
        alternatives,
        confidence
      });
    } catch (error) {
      console.error(`💥 [CONFIG-SERVICE] Error getting recommendations: ${error}`);
      return of({
        primary: null,
        alternatives: this.availableConfigs.filter(c => c.domain === 'any'),
        confidence: 0
      });
    }
  }
}