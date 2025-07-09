import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
  streamId: string | null;
}

/**
 * Centralized Camera Management Service
 * 
 * Based on research from:
 * - MDN MediaDevices.getUserMedia() best practices
 * - Stack Overflow solutions for persistent camera issues
 * - Angular singleton service patterns
 * 
 * Addresses common issue where camera light stays on after getUserMedia usage
 */
@Injectable({
  providedIn: 'root'
})
export class CameraService {
  // REACTIVE STATE: BehaviorSubject to track camera state changes
  // Components can subscribe to this to react to camera status changes
  private readonly _state = new BehaviorSubject<CameraState>({
    isActive: false,        // Whether camera is currently streaming
    hasPermission: false,   // Whether user has granted camera permission
    error: null,           // Any error message from camera operations
    streamId: null         // ID of current MediaStream (for debugging)
  });

  // STREAM MANAGEMENT: Keep reference to the active MediaStream
  // This ensures we only have ONE MediaStream active at a time (prevents camera light issue)
  private _currentStream: MediaStream | null = null;
  
  // VIDEO ELEMENT TRACKING: Keep reference to attached video element for cleanup
  // Allows us to properly clean up video element when releasing camera
  private _videoElement: HTMLVideoElement | null = null;
  
  // CLEANUP TRACKING: Count cleanup attempts to prevent infinite loops
  // Helps debug persistent camera issues and limits emergency cleanup attempts
  private _cleanupAttempts = 0;
  
  // SAFETY LIMIT: Maximum cleanup attempts before giving up
  // Prevents infinite emergency cleanup loops that could affect performance
  private readonly MAX_CLEANUP_ATTEMPTS = 3;
  
  // TIMEOUT PROTECTION: Timeout for cleanup operations
  private readonly CLEANUP_TIMEOUT = 10000; // 10 seconds
  
  // COMPONENT TRACKING: Track components using the camera for automatic cleanup
  private _activeComponents = new Set<string>();
  
  // CLEANUP VALIDATION: Track cleanup completion state
  private _isCleaningUp = false;

  // Public observables
  readonly state$: Observable<CameraState> = this._state.asObservable();
  
  get currentState(): CameraState {
    return this._state.value;
  }

  get isActive(): boolean {
    return this._state.value.isActive;
  }

  get currentStream(): MediaStream | null {
    return this._currentStream;
  }

  /**
   * Request rear-facing camera for document scanning
   * Ideal for flyer/document capture
   */
  async requestRearCamera(): Promise<MediaStream> {
    console.log('[Camera] Requesting rear-facing camera with environment facing mode');
    
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' } // Prefer rear camera, fallback to any
      },
      audio: false
    };

    return this.requestCamera(constraints);
  }

  /**
   * Request front-facing camera for selfies/video calls
   */
  async requestFrontCamera(): Promise<MediaStream> {
    console.log('[Camera] Requesting front-facing camera with user facing mode');
    
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'user' } // Prefer front camera, fallback to any
      },
      audio: false
    };

    return this.requestCamera(constraints);
  }

  /**
   * Get available camera devices
   */
  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('[Camera] Failed to enumerate camera devices:', error);
      return [];
    }
  }

  /**
   * Check if device has rear camera
   */
  async hasRearCamera(): Promise<boolean> {
    const cameras = await this.getAvailableCameras();
    return cameras.some(camera => 
      camera.label.toLowerCase().includes('back') || 
      camera.label.toLowerCase().includes('rear') ||
      camera.label.toLowerCase().includes('environment')
    );
  }

  /**
   * Request camera access with proper error handling
   * Based on MDN getUserMedia best practices
   */
  async requestCamera(constraints: MediaStreamConstraints = { video: true, audio: false }): Promise<MediaStream> {
    console.log('[Camera] Requesting camera access with constraints:', JSON.stringify(constraints));
    
    try {
      // OPTIMIZATION: Reuse existing stream if already active to avoid multiple getUserMedia calls
      // This prevents the "multiple MediaStream" issue that causes camera light persistence
      if (this._currentStream && this.isActive) {
        console.log('[Camera] Reusing existing stream:', this._currentStream.id);
        return this._currentStream;
      }

      // CLEANUP: Ensure any previous streams are properly stopped before requesting new one
      // This prevents orphaned MediaStreams that keep camera light on
      await this.releaseCamera();

      // CORE: Request new MediaStream from browser - this is the main camera access point
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // STATE: Store the stream reference so we can manage it later
      this._currentStream = stream;
      
      // RESET: Reset cleanup attempt counter for fresh start
      this._cleanupAttempts = 0;

      // STATE UPDATE: Update reactive state to reflect camera is now active
      this._state.next({
        isActive: true,           // Camera is now actively streaming
        hasPermission: true,      // User granted camera permission
        error: null,              // Clear any previous errors
        streamId: stream.id       // Store stream ID for debugging
      });

      console.log('[Camera] Camera access granted - stream:', stream.id, 'tracks:', stream.getTracks().length);

      return stream;

    } catch (error: any) {
      console.error('[Camera] Failed to get camera access:', error.message);
      
      // STATE UPDATE: Update state to reflect camera access failed
      this._state.next({
        isActive: false,          // Camera is not active
        hasPermission: false,     // Permission was denied or unavailable
        error: error.message,     // Store error message for UI display
        streamId: null            // No stream available
      });

      // PROPAGATE: Re-throw error so calling code can handle it
      throw error;
    }
  }

  /**
   * Release camera with aggressive cleanup strategy and timeout protection
   * Based on research into browser camera persistence issues
   */
  async releaseCamera(force = false): Promise<void> {
    const streamId = this._currentStream?.id || 'none';
    console.log(`[Camera] Releasing camera - stream: ${streamId}, force: ${force}`);
    
    // PREVENT CONCURRENT CLEANUP: Avoid multiple cleanup operations running simultaneously
    if (this._isCleaningUp && !force) {
      console.log('[Camera] Cleanup already in progress');
      return;
    }
    
    // EARLY EXIT: Skip if no stream to clean up (unless forced)
    // This avoids unnecessary cleanup work when camera isn't active
    if (!this._currentStream && !force) {
      console.log('[Camera] No active stream to release');
      return;
    }

    this._isCleaningUp = true;
    
    // TIMEOUT PROTECTION: Ensure cleanup doesn't hang indefinitely
    const cleanupPromise = this._performCleanup();
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Cleanup timeout')), this.CLEANUP_TIMEOUT);
    });

    try {
      await Promise.race([cleanupPromise, timeoutPromise]);
      console.log('[Camera] Camera release complete');
    } catch (error: any) {
      console.error('[Camera] Error during release:', error.message);
      
      // Force emergency cleanup if normal cleanup failed
      if (error.message === 'Cleanup timeout') {
        console.log('[Camera] Cleanup timed out, forcing emergency cleanup');
        await this._forceEmergencyCleanup();
      }
      
      // Always mark camera as inactive, even if cleanup failed
      this._state.next({
        isActive: false,
        hasPermission: false,
        error: error.message,
        streamId: null
      });
    } finally {
      this._isCleaningUp = false;
    }
  }

  /**
   * Perform the actual cleanup operations
   */
  private async _performCleanup(): Promise<void> {
    // TRACKING: Increment cleanup attempts for debugging persistent issues
    this._cleanupAttempts++;
    console.log(`[Camera] Cleanup attempt ${this._cleanupAttempts}/${this.MAX_CLEANUP_ATTEMPTS}`);

    // STRATEGY 1: Stop all tracks in the main MediaStream
    if (this._currentStream) {
      await this._stopStreamTracks(this._currentStream);
      this._currentStream = null;
    }

    // STRATEGY 2: Clean up any attached video element
    if (this._videoElement) {
      this._cleanupVideoElement(this._videoElement);
      this._videoElement = null;
    }

    // STRATEGY 3: Find and clean up any orphaned video elements
    this._cleanupOrphanedVideoElements();

    // STRATEGY 4: Emergency cleanup (with attempt limit)
    if (this._cleanupAttempts <= this.MAX_CLEANUP_ATTEMPTS) {
      await this._emergencyCleanup();
    }

    // VALIDATION: Verify cleanup was successful
    const isCleanupSuccessful = await this._validateCleanup();
    if (!isCleanupSuccessful) {
      throw new Error('Cleanup validation failed - camera may still be active');
    }

    // STATE UPDATE: Mark camera as inactive
    this._state.next({
      isActive: false,
      hasPermission: true, // Keep permission status
      error: null,
      streamId: null
    });
  }

  /**
   * Register a component as using the camera
   * Components should call this in their constructor/init and detachFromComponent in ngOnDestroy
   */
  registerComponent(componentId: string): void {
    this._activeComponents.add(componentId);
    console.log(`[Camera] Component '${componentId}' registered (${this._activeComponents.size} active components)`);
  }

  /**
   * Detach component from camera service with automatic cleanup
   * Components should call this in ngOnDestroy to ensure proper cleanup
   */
  async detachFromComponent(componentId: string): Promise<void> {
    this._activeComponents.delete(componentId);
    console.log(`[Camera] Component '${componentId}' detached (${this._activeComponents.size} active components)`);
    
    // If no components are using the camera, automatically clean up
    if (this._activeComponents.size === 0 && this.isActive) {
      console.log('[Camera] No active components, auto-cleaning up');
      await this.releaseCamera();
    }
  }

  /**
   * Attach stream to video element with proper management
   */
  attachToVideoElement(videoElement: HTMLVideoElement, stream: MediaStream): void {
    console.log(`[Camera] Attaching stream ${stream.id} to video element`);
    
    // Clean up previous video element
    if (this._videoElement && this._videoElement !== videoElement) {
      this._cleanupVideoElement(this._videoElement);
    }

    this._videoElement = videoElement;
    videoElement.srcObject = stream;
  }

  /**
   * Detach from video element without full camera cleanup
   */
  detachFromVideoElement(videoElement: HTMLVideoElement): void {
    console.log('[Camera] Detaching from video element');
    
    if (this._videoElement === videoElement) {
      this._cleanupVideoElement(videoElement);
      this._videoElement = null;
    }
  }

  /**
   * Emergency cleanup for persistent camera issues
   * Based on Stack Overflow solutions for browser camera bugs
   */
  async emergencyCleanup(): Promise<void> {
    console.log('[Camera] EMERGENCY CLEANUP - clearing all components and forcing release');
    
    // Clear all component references
    this._activeComponents.clear();
    
    // Force cleanup regardless of current state
    await this.releaseCamera(true);
    
    console.log('[Camera] Emergency cleanup complete');
  }

  /**
   * Force emergency cleanup without normal cleanup procedures
   * Used when normal cleanup times out or fails
   */
  private async _forceEmergencyCleanup(): Promise<void> {
    console.log('[Camera] FORCE EMERGENCY CLEANUP - resetting all state');
    
    try {
      // Stop everything we can find
      this._cleanupOrphanedVideoElements();
      
      // Try the "get fresh stream and stop it" technique
      await this._emergencyCleanup();
      
      // Reset internal state completely
      this._currentStream = null;
      this._videoElement = null;
      this._cleanupAttempts = 0;
      this._activeComponents.clear();
      
      this._state.next({
        isActive: false,
        hasPermission: false,
        error: null,
        streamId: null
      });
      
      console.log('[Camera] Force emergency cleanup complete');
    } catch (error) {
      console.error('[Camera] Force emergency cleanup failed:', error);
    }
  }

  /**
   * Validate that cleanup was successful
   */
  private async _validateCleanup(): Promise<boolean> {
    try {
      // Check if we can access camera again (if we can, cleanup was successful)
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      // Immediately stop the test stream
      testStream.getTracks().forEach(track => track.stop());
      
      console.log('[Camera] Cleanup validation successful');
      return true;
    } catch (error) {
      // If we can't access camera, it might mean:
      // 1. Camera is still in use (bad)
      // 2. User revoked permission (neutral)
      // 3. No camera available (neutral)
      const errorMessage = (error as Error).message.toLowerCase();
      if (errorMessage.includes('use') || errorMessage.includes('busy') || errorMessage.includes('already')) {
        console.log('[Camera] Cleanup validation failed - camera still in use:', errorMessage);
        return false; // Camera likely still in use
      }
      
      // Other errors (permission, no camera) are acceptable
      console.log('[Camera] Cleanup validation - camera unavailable (acceptable):', errorMessage);
      return true;
    }
  }

  // Private helper methods

  private async _stopStreamTracks(stream: MediaStream): Promise<void> {
    // GET ALL TRACKS: Both video and audio tracks need to be stopped
    // This is the most important step - any active track will keep camera light on
    const tracks = stream.getTracks();
    console.log(`[Camera] Stopping ${tracks.length} tracks from stream ${stream.id}`);
    
    // STOP EACH TRACK: Iterate through all tracks and stop them individually
    tracks.forEach((track, index) => {
      const beforeState = track.readyState;
      track.stop();
      console.log(`[Camera] Track ${index} (${track.kind}) stopped: ${beforeState} -> ${track.readyState}`);
    });
  }

  private _cleanupVideoElement(videoElement: HTMLVideoElement): void {
    try {
      // CHECK FOR ATTACHED STREAM: Video elements can hold MediaStream references
      // Even after we stop our main stream, video elements might still reference it
      if (videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        if (stream && stream.getTracks) {
          const tracks = stream.getTracks();
          console.log(`[Camera] Cleaning video element with ${tracks.length} tracks`);
          // STOP VIDEO ELEMENT TRACKS: Stop any tracks attached to this specific video element
          tracks.forEach(track => {
            track.stop();
          });
        }
      }
      
      // CLEAR VIDEO ELEMENT: Reset the video element to remove all stream references
      videoElement.pause();
      videoElement.srcObject = null;
      videoElement.load();
      
    } catch (error) {
      // LOG BUT CONTINUE: Video element cleanup errors shouldn't break the whole cleanup process
      console.error('[Camera] Error cleaning video element:', error);
    }
  }

  private _cleanupOrphanedVideoElements(): void {
    // FIND ALL VIDEO ELEMENTS: Search the entire DOM for video elements
    // Other components might have created video elements that weren't properly cleaned up
    const videoElements = document.querySelectorAll('video');
    const orphanedElements = Array.from(videoElements).filter(video => video.srcObject);
    
    if (orphanedElements.length > 0) {
      console.log(`[Camera] Found ${orphanedElements.length} orphaned video elements from ${videoElements.length} total`);
      
      // CLEAN EACH VIDEO ELEMENT: Check each video element for attached MediaStreams
      orphanedElements.forEach((video, index) => {
        console.log(`[Camera] Cleaning orphaned video element ${index + 1}/${orphanedElements.length}`);
        this._cleanupVideoElement(video);
      });
    }
  }

  private async _emergencyCleanup(): Promise<void> {
    try {
      // EMERGENCY TECHNIQUE: Request a fresh MediaStream and immediately stop it
      // This is a workaround for browser bugs where camera hardware doesn't release properly
      // Based on Stack Overflow research: some browsers need this to clear internal camera state
      
      // Add timeout protection for emergency cleanup
      const emergencyStreamPromise = navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const timeoutPromise = new Promise<MediaStream>((_, reject) => {
        setTimeout(() => reject(new Error('Emergency cleanup timeout')), 5000);
      });
      
      const emergencyStream = await Promise.race([emergencyStreamPromise, timeoutPromise]);
      
      // IMMEDIATE STOP: Stop all tracks in the emergency stream right away
      // The goal isn't to use this stream, but to force browser to reset camera state
      const tracks = emergencyStream.getTracks();
      tracks.forEach(track => track.stop());
      
      console.log(`[Camera] Emergency cleanup successful - stopped ${tracks.length} fresh tracks`);
    } catch (error) {
      // ERROR IS OKAY: If this fails, it might mean camera is already properly released
      // Some browsers throw errors when camera isn't available, which can be a good sign
      console.log('[Camera] Emergency cleanup failed (camera may already be released):', (error as Error).message);
    }
  }
}