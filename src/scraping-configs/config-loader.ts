/**
 * Configuration loader for site-specific scraping configurations
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SiteConfig } from './types';

export class ConfigLoaderService {
  private configCache = new Map<string, SiteConfig>();
  private readonly configDir: string;

  constructor() {
    // Adjust path based on whether we're running in dev or production
    this.configDir = join(process.cwd(), 'src/scraping-configs/sites');
    console.log(`🗂️  [CONFIG] Config directory: ${this.configDir}`);
  }

  /**
   * Load a site configuration by name
   */
  loadConfig(configName: string): SiteConfig | null {
    console.log(`📋 [CONFIG] Loading configuration: ${configName}`);

    // Check cache first
    if (this.configCache.has(configName)) {
      console.log(`💾 [CACHE] Using cached config for: ${configName}`);
      return this.configCache.get(configName)!;
    }

    try {
      const configPath = join(this.configDir, `${configName}.json`);
      
      if (!existsSync(configPath)) {
        console.log(`❌ [CONFIG] Config file not found: ${configPath}`);
        return null;
      }

      const configData = readFileSync(configPath, 'utf-8');
      const config: SiteConfig = JSON.parse(configData);

      // Validate required fields
      if (!this.validateConfig(config)) {
        console.error(`❌ [CONFIG] Invalid configuration: ${configName}`);
        return null;
      }

      // Cache the config
      this.configCache.set(configName, config);
      console.log(`✅ [CONFIG] Successfully loaded config: ${configName} (${config.instructions.length} instructions, ${config.extractors.length} extractors)`);

      return config;

    } catch (error: any) {
      console.error(`💥 [CONFIG] Error loading config ${configName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate a site configuration
   */
  private validateConfig(config: SiteConfig): boolean {
    const requiredFields = ['domain', 'enabled', 'name', 'instructions', 'extractors', 'options'];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        console.error(`❌ [CONFIG] Missing required field: ${field}`);
        return false;
      }
    }

    // Validate instructions
    if (!Array.isArray(config.instructions)) {
      console.error(`❌ [CONFIG] Instructions must be an array`);
      return false;
    }

    for (const instruction of config.instructions) {
      if (!instruction.action || !instruction.description) {
        console.error(`❌ [CONFIG] Invalid instruction: ${JSON.stringify(instruction)}`);
        return false;
      }
    }

    // Validate extractors
    if (!Array.isArray(config.extractors)) {
      console.error(`❌ [CONFIG] Extractors must be an array`);
      return false;
    }

    for (const extractor of config.extractors) {
      if (!extractor.name || !extractor.selector) {
        console.error(`❌ [CONFIG] Invalid extractor: ${JSON.stringify(extractor)}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get all available configuration names
   */
  getAvailableConfigs(): string[] {
    try {
      const fs = require('fs');
      const files = fs.readdirSync(this.configDir);
      const configs = files
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''));
      
      console.log(`📚 [CONFIG] Available configurations: ${configs.join(', ')}`);
      return configs;
    } catch (error: any) {
      console.error(`💥 [CONFIG] Error reading config directory: ${error.message}`);
      return [];
    }
  }

  /**
   * Clear the configuration cache
   */
  clearCache(): void {
    const cacheSize = this.configCache.size;
    this.configCache.clear();
    console.log(`🗑️  [CACHE] Cleared ${cacheSize} cached configurations`);
  }

  /**
   * Reload a specific configuration (clears from cache and reloads)
   */
  reloadConfig(configName: string): SiteConfig | null {
    console.log(`🔄 [CONFIG] Reloading configuration: ${configName}`);
    this.configCache.delete(configName);
    return this.loadConfig(configName);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; configs: string[] } {
    return {
      size: this.configCache.size,
      configs: Array.from(this.configCache.keys())
    };
  }
}

// Export singleton instance
export const configLoaderService = new ConfigLoaderService();