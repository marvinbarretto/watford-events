/**
 * Image Processing Utilities
 * 
 * Functions for handling image capture, conversion, and optimization
 */

export interface ImageCaptureOptions {
  quality?: number; // JPEG quality 0-1
  maxWidth?: number;
  maxHeight?: number;
  mimeType?: string;
}

/**
 * Convert data URL to File object
 */
export async function dataUrlToFile(
  dataUrl: string, 
  fileName: string = 'image.jpg'
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

/**
 * Convert File to data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Capture photo from video element
 */
export function capturePhotoFromVideo(
  video: HTMLVideoElement,
  options: ImageCaptureOptions = {}
): string {
  const {
    quality = 0.8,
    maxWidth,
    maxHeight,
    mimeType = 'image/jpeg'
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate dimensions
  let { width, height } = calculateDimensions(
    video.videoWidth,
    video.videoHeight,
    maxWidth,
    maxHeight
  );

  canvas.width = width;
  canvas.height = height;

  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0, width, height);

  // Convert to data URL
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Calculate scaled dimensions while maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  let width = originalWidth;
  let height = originalHeight;
  const aspectRatio = originalWidth / originalHeight;

  if (maxWidth && width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Optimize image for LLM processing
 * Reduces file size while maintaining quality for text extraction
 */
export async function optimizeImageForLLM(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8
  } = options;

  // Convert to data URL first
  const dataUrl = await fileToDataUrl(file);
  
  // Create image element
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // Create canvas for resizing
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw resized image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert back to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      'image/jpeg',
      quality
    );
  });

  return new File([blob], file.name, { type: 'image/jpeg' });
}

/**
 * Get image dimensions from File
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Create thumbnail from image file
 */
export async function createThumbnail(
  file: File,
  thumbnailSize: number = 200
): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    thumbnailSize,
    thumbnailSize
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.7);
}