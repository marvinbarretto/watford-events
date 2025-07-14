import { Injectable, inject } from '@angular/core';
import { PlatformDetectionService } from '../utils/platform-detection.service';
import { ToastService } from './toast.service';

export interface NotificationOptions {
  /**
   * Auto-dismiss timeout in milliseconds
   * @default 3000 for success, 5000 for error
   */
  timeout?: number;
  
  /**
   * Whether the notification should stick until manually dismissed
   * @default false
   */
  sticky?: boolean;
  
  /**
   * Additional description text (web only)
   */
  description?: string;
  
  /**
   * Title for native dialogs (native only)
   */
  title?: string;
  
  /**
   * Button text for native dialogs (native only)
   * @default 'OK'
   */
  buttonText?: string;
}

/**
 * Platform-aware notification service that provides unified notifications
 * across web and native Capacitor platforms.
 * 
 * - Web: Uses ToastService for elegant toast notifications
 * - Native: Uses Capacitor Dialog API for native modal dialogs
 */
@Injectable({
  providedIn: 'root'
})
export class PlatformNotificationService {
  private readonly platformDetection = inject(PlatformDetectionService);
  private readonly toastService = inject(ToastService);

  /**
   * Shows a success notification
   */
  async showSuccess(message: string, options: NotificationOptions = {}): Promise<void> {
    const { timeout = 3000, sticky = false, description, title = 'Success', buttonText = 'OK' } = options;
    
    if (this.platformDetection.isCapacitorNative) {
      await this.showNativeDialog(title, message, buttonText);
    } else {
      this.toastService.success(message, timeout, sticky);
    }
  }

  /**
   * Shows an error notification
   */
  async showError(message: string, options: NotificationOptions = {}): Promise<void> {
    const { timeout = 5000, sticky = false, description, title = 'Error', buttonText = 'OK' } = options;
    
    if (this.platformDetection.isCapacitorNative) {
      await this.showNativeDialog(title, message, buttonText);
    } else {
      this.toastService.error(message, timeout, sticky);
    }
  }

  /**
   * Shows a warning notification
   */
  async showWarning(message: string, options: NotificationOptions = {}): Promise<void> {
    const { timeout = 4000, sticky = false, description, title = 'Warning', buttonText = 'OK' } = options;
    
    if (this.platformDetection.isCapacitorNative) {
      await this.showNativeDialog(title, message, buttonText);
    } else {
      this.toastService.warning(message, timeout, sticky);
    }
  }

  /**
   * Shows an info notification
   */
  async showInfo(message: string, options: NotificationOptions = {}): Promise<void> {
    const { timeout = 3000, sticky = false, description, title = 'Info', buttonText = 'OK' } = options;
    
    if (this.platformDetection.isCapacitorNative) {
      await this.showNativeDialog(title, message, buttonText);
    } else {
      this.toastService.info(message, timeout, sticky);
    }
  }

  /**
   * Shows a native dialog for Capacitor platforms
   */
  private async showNativeDialog(title: string, message: string, buttonText: string = 'OK'): Promise<void> {
    try {
      // Dynamically import Capacitor Dialog to avoid SSR issues
      const { Dialog } = await import('@capacitor/dialog');
      
      await Dialog.alert({
        title,
        message,
        buttonTitle: buttonText
      });
    } catch (error) {
      console.warn('Failed to show native dialog, falling back to toast:', error);
      // Fallback to toast if native dialog fails
      this.toastService.info(message, 3000, false);
    }
  }

  /**
   * Shows a confirmation dialog (native only feature)
   * Falls back to browser confirm() on web platforms
   */
  async showConfirmation(
    title: string, 
    message: string, 
    confirmText: string = 'Yes', 
    cancelText: string = 'No'
  ): Promise<boolean> {
    if (this.platformDetection.isCapacitorNative) {
      try {
        const { Dialog } = await import('@capacitor/dialog');
        
        const result = await Dialog.confirm({
          title,
          message,
          okButtonTitle: confirmText,
          cancelButtonTitle: cancelText
        });
        
        return result.value;
      } catch (error) {
        console.warn('Failed to show native confirmation, falling back to browser confirm:', error);
        return confirm(`${title}\n\n${message}`);
      }
    } else {
      return confirm(`${title}\n\n${message}`);
    }
  }

  /**
   * Dismisses all active notifications (web only)
   */
  dismissAll(): void {
    if (!this.platformDetection.isCapacitorNative) {
      this.toastService.clearAll();
    }
  }
}