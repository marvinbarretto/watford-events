import { Injectable, signal } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../../environments/environment';
import { LLMRequest, LLMResponse } from '../utils/llm-types';

@Injectable({
  providedIn: 'root'
})
export class LLMService {
  private readonly _genAI = new GoogleGenerativeAI(environment.llm?.gemini || '');
  private readonly _model = this._genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
   * General purpose method for any LLM request
   */
  async processRequest(request: LLMRequest): Promise<LLMResponse> {
    console.log('[LLMService] Processing request:', request.type || 'general');

    this._isProcessing.set(true);

    try {
      const parts: any[] = [{ text: request.prompt }];

      if (request.image) {
        // ✅ Optimize images for all requests
        const optimizedImage = await this.optimizeImageForAnalysis(request.image);
        parts.push(this.prepareImagePart(optimizedImage));
      }

      const result = await this._model.generateContent(parts);
      const response = result.response.text();

      this._requestCount.update(count => count + 1);

      return {
        success: true,
        data: response,
        cached: false
      };

    } catch (error: any) {
      console.error('[LLMService] ❌ Request failed:', error);

      return {
        success: false,
        data: null,
        error: error?.message || 'Request failed',
        cached: false
      };
    } finally {
      this._isProcessing.set(false);
    }
  }

  // ===== PRIVATE HELPER METHODS =====

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

}
