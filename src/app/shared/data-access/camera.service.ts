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
    console.log('%c*** CAMERA: Requesting rear-facing camera...', 'color: blue; font-weight: bold;');
    
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
    console.log('%c*** CAMERA: Requesting front-facing camera...', 'color: blue; font-weight: bold;');
    
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
      console.error('Failed to enumerate camera devices:', error);
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
    console.log('%c*** CAMERA: Service requesting camera access...', 'color: blue; font-weight: bold;');
    console.log('%c*** CAMERA: Using constraints:', 'color: blue;', constraints);
    
    try {
      // OPTIMIZATION: Reuse existing stream if already active to avoid multiple getUserMedia calls
      // This prevents the "multiple MediaStream" issue that causes camera light persistence
      if (this._currentStream && this.isActive) {
        console.log('%c*** CAMERA: Reusing existing stream', 'color: blue; font-weight: bold;');
        return this._currentStream;
      }

      // CLEANUP: Ensure any previous streams are properly stopped before requesting new one
      // This prevents orphaned MediaStreams that keep camera light on
      await this.releaseCamera();

      // CORE: Request new MediaStream from browser - this is the main camera access point
      console.log('%c*** CAMERA: Calling navigator.mediaDevices.getUserMedia', 'color: blue; font-weight: bold;');
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

      // DEBUG: Log success info for troubleshooting
      console.log('%c*** CAMERA: Camera access granted, stream ID:', 'color: green; font-weight: bold;', stream.id);
      console.log('%c*** CAMERA: Stream has', 'color: green; font-weight: bold;', stream.getTracks().length, 'tracks');

      return stream;

    } catch (error: any) {
      // ERROR HANDLING: Log the specific error for debugging
      console.log('%c*** CAMERA: Failed to get camera access:', 'color: red; font-weight: bold;', error.message);
      
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
    console.log('%c*** CAMERA: Service releasing camera...', 'color: red; font-weight: bold; font-size: 14px;');
    
    // PREVENT CONCURRENT CLEANUP: Avoid multiple cleanup operations running simultaneously
    if (this._isCleaningUp && !force) {
      console.log('%c*** CAMERA: Cleanup already in progress', 'color: orange; font-weight: bold;');
      return;
    }
    
    // EARLY EXIT: Skip if no stream to clean up (unless forced)
    // This avoids unnecessary cleanup work when camera isn't active
    if (!this._currentStream && !force) {
      console.log('%c*** CAMERA: No active stream to release', 'color: orange; font-weight: bold;');
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
      console.log('%c*** CAMERA: Camera release complete', 'color: green; font-weight: bold;');
    } catch (error: any) {
      console.log('%c*** CAMERA: Error during release:', 'color: red; font-weight: bold;', error);
      
      // Force emergency cleanup if normal cleanup failed
      if (error.message === 'Cleanup timeout') {
        console.log('%c*** CAMERA: Cleanup timed out, forcing emergency cleanup...', 'color: red; font-weight: bold;');
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
    console.log('%c*** CAMERA: Cleanup attempt #' + this._cleanupAttempts, 'color: red; font-weight: bold;');

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
    console.log('%c*** CAMERA: Registering component:', 'color: blue; font-weight: bold;', componentId);
    this._activeComponents.add(componentId);
  }

  /**
   * Detach component from camera service with automatic cleanup
   * Components should call this in ngOnDestroy to ensure proper cleanup
   */
  async detachFromComponent(componentId: string): Promise<void> {
    console.log('%c*** CAMERA: Detaching component:', 'color: blue; font-weight: bold;', componentId);
    
    this._activeComponents.delete(componentId);
    
    // If no components are using the camera, automatically clean up
    if (this._activeComponents.size === 0 && this.isActive) {
      console.log('%c*** CAMERA: No active components, auto-cleaning up...', 'color: orange; font-weight: bold;');
      await this.releaseCamera();
    }
  }

  /**
   * Attach stream to video element with proper management
   */
  attachToVideoElement(videoElement: HTMLVideoElement, stream: MediaStream): void {
    console.log('%c*** CAMERA: Attaching stream to video element', 'color: blue; font-weight: bold;');
    
    // Clean up previous video element
    if (this._videoElement && this._videoElement !== videoElement) {
      this._cleanupVideoElement(this._videoElement);
    }

    this._videoElement = videoElement;
    videoElement.srcObject = stream;
    
    console.log('%c*** CAMERA: Video element attached', 'color: blue; font-weight: bold;');
  }

  /**
   * Detach from video element without full camera cleanup
   */
  detachFromVideoElement(videoElement: HTMLVideoElement): void {
    console.log('%c*** CAMERA: Detaching from video element', 'color: blue; font-weight: bold;');
    
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
    console.log('%c*** CAMERA: 🚨 EMERGENCY CLEANUP 🚨', 'color: red; font-weight: bold; font-size: 16px;');
    
    // Clear all component references
    this._activeComponents.clear();
    
    // Force cleanup regardless of current state
    await this.releaseCamera(true);
    
    console.log('%c*** CAMERA: Emergency cleanup complete', 'color: red; font-weight: bold;');
  }

  /**
   * Force emergency cleanup without normal cleanup procedures
   * Used when normal cleanup times out or fails
   */
  private async _forceEmergencyCleanup(): Promise<void> {
    console.log('%c*** CAMERA: 🚨 FORCE EMERGENCY CLEANUP 🚨', 'color: red; font-weight: bold; font-size: 16px;');
    
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
      
      console.log('%c*** CAMERA: Force emergency cleanup complete', 'color: red; font-weight: bold;');
    } catch (error) {
      console.log('%c*** CAMERA: Force emergency cleanup failed:', 'color: red; font-weight: bold;', error);
    }
  }

  /**
   * Validate that cleanup was successful
   */
  private async _validateCleanup(): Promise<boolean> {
    console.log('%c*** CAMERA: Validating cleanup...', 'color: orange; font-weight: bold;');
    
    try {
      // Check if we can access camera again (if we can, cleanup was successful)
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      // Immediately stop the test stream
      testStream.getTracks().forEach(track => track.stop());
      
      console.log('%c*** CAMERA: Cleanup validation successful', 'color: green; font-weight: bold;');
      return true;
    } catch (error) {
      // If we can't access camera, it might mean:
      // 1. Camera is still in use (bad)
      // 2. User revoked permission (neutral)
      // 3. No camera available (neutral)
      console.log('%c*** CAMERA: Cleanup validation failed:', 'color: orange; font-weight: bold;', error);
      
      // Check if error indicates camera is still in use
      const errorMessage = (error as Error).message.toLowerCase();
      if (errorMessage.includes('use') || errorMessage.includes('busy') || errorMessage.includes('already')) {
        return false; // Camera likely still in use
      }
      
      // Other errors (permission, no camera) are acceptable
      return true;
    }
  }

  // Private helper methods

  private async _stopStreamTracks(stream: MediaStream): Promise<void> {
    console.log('%c*** CAMERA: Stopping stream tracks...', 'color: red; font-weight: bold;');
    
    // GET ALL TRACKS: Both video and audio tracks need to be stopped
    // This is the most important step - any active track will keep camera light on
    const tracks = stream.getTracks();
    console.log('%c*** CAMERA: Found', 'color: red; font-weight: bold;', tracks.length, 'tracks to stop');
    
    // STOP EACH TRACK: Iterate through all tracks and stop them individually
    // We log before/after readyState to verify the track actually stopped
    tracks.forEach((track, index) => {
      console.log(`%c*** CAMERA: Stopping track #${index}: ${track.kind} (${track.label}) - readyState: ${track.readyState}`, 'color: red; font-weight: bold;');
      
      // CORE STOP: This is the main browser API call that releases camera hardware
      track.stop();
      
      // VERIFICATION: Log the new state to confirm track was stopped
      // readyState should change from 'live' to 'ended'
      console.log(`%c*** CAMERA: Track #${index} stopped - new readyState: ${track.readyState}`, 'color: red; font-weight: bold;');
    });
  }

  private _cleanupVideoElement(videoElement: HTMLVideoElement): void {
    console.log('%c*** CAMERA: Cleaning up video element...', 'color: red; font-weight: bold;');
    
    try {
      // CHECK FOR ATTACHED STREAM: Video elements can hold MediaStream references
      // Even after we stop our main stream, video elements might still reference it
      if (videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        if (stream && stream.getTracks) {
          // STOP VIDEO ELEMENT TRACKS: Stop any tracks attached to this specific video element
          // This catches cases where video element has a different stream reference
          stream.getTracks().forEach(track => {
            console.log('%c*** CAMERA: Stopping video element track:', 'color: red; font-weight: bold;', track.kind);
            track.stop();  // Stop track associated with this video element
          });
        }
      }
      
      // CLEAR VIDEO ELEMENT: Reset the video element to remove all stream references
      videoElement.pause();           // Stop video playback
      videoElement.srcObject = null;  // Remove MediaStream reference
      videoElement.load();            // Reset video element to initial state
      
      console.log('%c*** CAMERA: Video element cleaned up', 'color: red; font-weight: bold;');
    } catch (error) {
      // LOG BUT CONTINUE: Video element cleanup errors shouldn't break the whole cleanup process
      console.log('%c*** CAMERA: Error cleaning video element:', 'color: red; font-weight: bold;', error);
    }
  }

  private _cleanupOrphanedVideoElements(): void {
    console.log('%c*** CAMERA: Searching for orphaned video elements...', 'color: red; font-weight: bold;');
    
    // FIND ALL VIDEO ELEMENTS: Search the entire DOM for video elements
    // Other components might have created video elements that weren't properly cleaned up
    const videoElements = document.querySelectorAll('video');
    console.log('%c*** CAMERA: Found', 'color: red; font-weight: bold;', videoElements.length, 'video elements');
    
    // CLEAN EACH VIDEO ELEMENT: Check each video element for attached MediaStreams
    videoElements.forEach((video, index) => {
      if (video.srcObject) {
        // ORPHANED STREAM FOUND: This video element has a MediaStream attached
        // Clean it up using our standard video element cleanup method
        console.log(`%c*** CAMERA: Cleaning orphaned video element #${index}`, 'color: red; font-weight: bold;');
        this._cleanupVideoElement(video);
      }
    });
  }

  private async _emergencyCleanup(): Promise<void> {
    console.log('%c*** CAMERA: Attempting emergency fresh stream cleanup...', 'color: red; font-weight: bold;');
    
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
      console.log('%c*** CAMERA: Got emergency stream, stopping immediately...', 'color: red; font-weight: bold;');
      
      // IMMEDIATE STOP: Stop all tracks in the emergency stream right away
      // The goal isn't to use this stream, but to force browser to reset camera state
      emergencyStream.getTracks().forEach(track => {
        console.log('%c*** CAMERA: Emergency stopping track:', 'color: red; font-weight: bold;', track.kind);
        track.stop();  // Stop the emergency track immediately
      });
      
      console.log('%c*** CAMERA: Emergency cleanup successful', 'color: green; font-weight: bold;');
    } catch (error) {
      // ERROR IS OKAY: If this fails, it might mean camera is already properly released
      // Some browsers throw errors when camera isn't available, which can be a good sign
      console.log('%c*** CAMERA: Emergency cleanup failed (this might be good):', 'color: orange; font-weight: bold;', error);
    }
  }
}