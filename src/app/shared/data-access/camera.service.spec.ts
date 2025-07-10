import { TestBed } from '@angular/core/testing';
import { CameraService, CameraState } from './camera.service';

describe('CameraService', () => {
  let service: CameraService;
  let mockMediaDevices: jest.Mocked<MediaDevices>;
  let mockStream: jest.Mocked<MediaStream>;
  let mockTrack: jest.Mocked<MediaStreamTrack>;
  let mockVideoElement: jest.Mocked<HTMLVideoElement>;

  beforeEach(() => {
    // Mock MediaStreamTrack
    mockTrack = {
      stop: jest.fn(),
      kind: 'video',
      label: 'mock-camera',
      readyState: 'live'
    } as any;

    // Mock MediaStream
    mockStream = {
      id: 'mock-stream-id',
      getTracks: jest.fn().mockReturnValue([mockTrack]),
      getVideoTracks: jest.fn().mockReturnValue([mockTrack]),
      getAudioTracks: jest.fn().mockReturnValue([])
    } as any;

    // Mock MediaDevices
    mockMediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue(mockStream)
    } as any;

    // Mock HTMLVideoElement
    mockVideoElement = {
      srcObject: null,
      pause: jest.fn(),
      load: jest.fn()
    } as any;

    // Mock global navigator
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: mockMediaDevices,
      writable: true
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(CameraService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should be created with correct initial state', () => {
      expect(service).toBeTruthy();
      expect(service.currentState).toEqual({
        isActive: false,
        hasPermission: false,
        error: null,
        streamId: null
      });
      expect(service.currentStream).toBeNull();
      expect(service.isActive).toBe(false);
    });
  });

  describe('requestCamera()', () => {
    it('should successfully request camera access', async () => {
      const result = await service.requestCamera();

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: false
      });
      expect(result).toBe(mockStream);
      expect(service.currentStream).toBe(mockStream);
      expect(service.currentState).toEqual({
        isActive: true,
        hasPermission: true,
        error: null,
        streamId: 'mock-stream-id'
      });
    });

    it('should reuse existing stream when already active', async () => {
      // First request
      await service.requestCamera();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(1);

      // Second request should reuse stream
      const result = await service.requestCamera();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(1); // Not called again
      expect(result).toBe(mockStream);
    });

    it('should handle camera access errors', async () => {
      const error = new Error('Camera not found');
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(error);

      await expect(service.requestCamera()).rejects.toThrow('Camera not found');

      expect(service.currentState).toEqual({
        isActive: false,
        hasPermission: false,
        error: 'Camera not found',
        streamId: null
      });
    });

    it('should accept custom constraints', async () => {
      const customConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 }
        },
        audio: true
      };

      await service.requestCamera(customConstraints);

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(customConstraints);
    });
  });

  describe('releaseCamera()', () => {
    beforeEach(async () => {
      // Set up active camera
      await service.requestCamera();
      jest.clearAllMocks();
    });

    it('should stop all tracks when releasing camera', async () => {
      await service.releaseCamera();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(service.currentStream).toBeNull();
      expect(service.currentState.isActive).toBe(false);
    });

    it('should handle release when no stream is active', async () => {
      // Release the stream first
      await service.releaseCamera();
      jest.clearAllMocks();

      // Try to release again
      await service.releaseCamera();

      // Should exit early without attempting cleanup
      expect(mockTrack.stop).not.toHaveBeenCalled();
    });

    it('should force cleanup when force=true', async () => {
      // Release the stream first
      await service.releaseCamera();
      jest.clearAllMocks();

      // Force release should proceed even without active stream
      await expect(service.releaseCamera(true)).resolves.toBeUndefined();
    });

    it('should properly stop stream tracks', async () => {
      await service.releaseCamera();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(service.currentStream).toBeNull();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockTrack.stop.mockImplementation(() => {
        throw new Error('Stop failed');
      });

      await service.releaseCamera();

      // Should still update state even if cleanup fails
      expect(service.currentState.isActive).toBe(false);
      expect(service.currentState.hasPermission).toBe(false);
      expect(service.currentState.error).toBe('Stop failed');
    });

    it('should limit cleanup attempts', async () => {
      // Simulate multiple cleanup attempts
      for (let i = 0; i < 5; i++) {
        await service.releaseCamera(true);
      }

      // Should not cause issues even with multiple attempts
      expect(service.currentState.isActive).toBe(false);
    });
  });

  describe('attachToVideoElement()', () => {
    beforeEach(async () => {
      await service.requestCamera();
    });

    it('should attach stream to video element', () => {
      service.attachToVideoElement(mockVideoElement, mockStream);

      expect(mockVideoElement.srcObject).toBe(mockStream);
    });

    it('should clean up previous video element when attaching new one', () => {
      const oldVideoElement = {
        srcObject: mockStream,
        pause: jest.fn(),
        load: jest.fn()
      } as any;

      // Attach to first element
      service.attachToVideoElement(oldVideoElement, mockStream);

      // Attach to second element
      service.attachToVideoElement(mockVideoElement, mockStream);

      expect(oldVideoElement.pause).toHaveBeenCalled();
      expect(oldVideoElement.srcObject).toBeNull();
      expect(mockVideoElement.srcObject).toBe(mockStream);
    });
  });

  describe('emergencyCleanup()', () => {
    it('should perform emergency cleanup', async () => {
      await service.emergencyCleanup();

      // Should call releaseCamera with force=true
      expect(service.currentStream).toBeNull();
      expect(service.currentState).toEqual({
        isActive: false,
        hasPermission: true, // Changed from false to true as per new logic
        error: null,
        streamId: null
      });
    });

    it('should handle emergency cleanup failure', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Emergency failed'));

      // Should not throw error
      await expect(service.emergencyCleanup()).resolves.toBeUndefined();
    });

    it('should clear all active components', async () => {
      service.registerComponent('test-component');
      await service.emergencyCleanup();

      // Adding a component after emergency cleanup should not trigger auto-cleanup
      service.registerComponent('new-component');
      await service.detachFromComponent('new-component');

      // Should not automatically clean up since camera is not active
      expect(service.currentStream).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should emit state changes through observable', (done) => {
      const states: CameraState[] = [];

      service.state$.subscribe(state => {
        states.push(state);

        if (states.length === 2) {
          // Initial state
          expect(states[0]).toEqual({
            isActive: false,
            hasPermission: false,
            error: null,
            streamId: null
          });

          // After camera request
          expect(states[1]).toEqual({
            isActive: true,
            hasPermission: true,
            error: null,
            streamId: 'mock-stream-id'
          });

          done();
        }
      });

      service.requestCamera();
    });
  });

  describe('Stream Reuse Prevention', () => {
    it('should reuse stream when already active', async () => {
      // First request
      const stream1 = await service.requestCamera();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(1);

      // Second request should reuse existing stream
      const stream2 = await service.requestCamera();
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledTimes(1); // Still 1

      expect(stream1).toBe(stream2);
    });
  });

  describe('Component Management', () => {
    it('should register and track components', () => {
      service.registerComponent('test-component-1');
      service.registerComponent('test-component-2');

      // Components should be tracked internally
      expect(service['_activeComponents'].size).toBe(2);
      expect(service['_activeComponents'].has('test-component-1')).toBe(true);
      expect(service['_activeComponents'].has('test-component-2')).toBe(true);
    });

    it('should detach components and auto-cleanup when last component detaches', async () => {
      // Set up active camera
      await service.requestCamera();

      service.registerComponent('test-component');

      // Detach component should trigger auto-cleanup
      await service.detachFromComponent('test-component');

      expect(service['_activeComponents'].has('test-component')).toBe(false);
      expect(service.currentStream).toBeNull();
      expect(service.currentState.isActive).toBe(false);
    });

    it('should not auto-cleanup when other components are still active', async () => {
      await service.requestCamera();

      service.registerComponent('component-1');
      service.registerComponent('component-2');

      // Detach one component
      await service.detachFromComponent('component-1');

      // Should not auto-cleanup since component-2 is still active
      expect(service.currentStream).toBe(mockStream);
      expect(service.currentState.isActive).toBe(true);
    });

    it('should not auto-cleanup when camera is not active', async () => {
      service.registerComponent('test-component');

      // Detach component when camera is not active
      await service.detachFromComponent('test-component');

      // Should not attempt cleanup
      expect(mockTrack.stop).not.toHaveBeenCalled();
    });
  });

  describe('Video Element Management', () => {
    beforeEach(async () => {
      await service.requestCamera();
    });

    it('should detach from specific video element', () => {
      service.attachToVideoElement(mockVideoElement, mockStream);

      service.detachFromVideoElement(mockVideoElement);

      expect(mockVideoElement.pause).toHaveBeenCalled();
      expect(mockVideoElement.srcObject).toBeNull();
    });

    it('should not detach from different video element', () => {
      const otherVideoElement = {
        srcObject: mockStream,
        pause: jest.fn(),
        load: jest.fn()
      } as any;

      service.attachToVideoElement(mockVideoElement, mockStream);

      // Try to detach from different element
      service.detachFromVideoElement(otherVideoElement);

      // Should not affect the tracked video element
      expect(mockVideoElement.pause).not.toHaveBeenCalled();
      expect(otherVideoElement.pause).not.toHaveBeenCalled();
    });
  });

  describe('Timeout Protection', () => {
    it('should handle cleanup timeout', async () => {
      jest.useFakeTimers();

      // Mock a slow cleanup operation
      jest.spyOn(service as any, '_performCleanup').mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
      });

      await service.requestCamera();

      // Start cleanup and advance timers to trigger timeout
      const cleanupPromise = service.releaseCamera();
      jest.advanceTimersByTime(15000);

      // Should timeout after 10 seconds and trigger force emergency cleanup
      await expect(cleanupPromise).resolves.toBeUndefined();

      // Should mark camera as inactive even after timeout
      expect(service.currentState.isActive).toBe(false);

      jest.useRealTimers();
    });

    it('should prevent concurrent cleanup operations', async () => {
      await service.requestCamera();

      // Start first cleanup
      const cleanup1 = service.releaseCamera();

      // Start second cleanup immediately
      const cleanup2 = service.releaseCamera();

      await Promise.all([cleanup1, cleanup2]);

      // Should not cause issues
      expect(service.currentState.isActive).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing navigator.mediaDevices', async () => {
      // Override the mock to simulate missing mediaDevices
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });

      await expect(service.requestCamera()).rejects.toThrow();
    });

    it('should handle stream with no tracks gracefully', async () => {
      // Mock a stream with no tracks
      const emptyStream = {
        id: 'empty-stream',
        getTracks: jest.fn().mockReturnValue([])
      } as any;

      mockMediaDevices.getUserMedia.mockResolvedValueOnce(emptyStream);

      const stream = await service.requestCamera();
      expect(stream).toBe(emptyStream);

      // Should handle cleanup of empty stream without errors
      await expect(service.releaseCamera()).resolves.toBeUndefined();
    });
  });

  describe('New Camera Methods', () => {
    it('should request rear camera with correct constraints', async () => {
      await service.requestRearCamera();

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      });
    });

    it('should request front camera with correct constraints', async () => {
      await service.requestFrontCamera();

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: { ideal: 'user' }
        },
        audio: false
      });
    });
  });
});
