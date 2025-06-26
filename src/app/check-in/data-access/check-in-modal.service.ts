// src/app/check-in/data-access/check-in-modal.service.ts
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { OverlayService } from '@shared/data-access/overlay.service';
import { UserProgressionService } from '@shared/data-access/user-progression.service';
import { ModalCheckinSuccessComponent } from '../ui/modal-checkin-success/modal-checkin-success.component';
import { CheckInResultData } from '../utils/check-in.models';

@Injectable({ providedIn: 'root' })
export class CheckInModalService {
  private readonly overlayService = inject(OverlayService);
  private readonly userProgressionService = inject(UserProgressionService);
  private readonly router = inject(Router);

  /**
   * Show consecutive modals for check-in results
   */
  showCheckInResults(data: CheckInResultData): void {
    console.log('[CheckInModalService] Starting modal flow:', data);

    if (!data.success) {
      // Show error in first modal only
      this.showCheckinSuccess(data);
      return;
    }

    // Start success flow
    this.showCheckinSuccess(data);
  }

  /**
   * First Modal: Check-in Success/Failure
   */
  private showCheckinSuccess(data: CheckInResultData): void {
    console.log('[CheckInModalService] Opening success modal');

    const { componentRef, close } = this.overlayService.open(
      ModalCheckinSuccessComponent,
      {},
      {
        data,
        UserExperienceLevel: this.userProgressionService.userExperienceLevel()
      }
    );

    // Handle modal events
    componentRef.instance.navigate.subscribe(() => {
      console.log('[CheckInModalService] Navigate requested');
      close();
      this.navigateToPub(data.pub?.id);
    });

    componentRef.instance.dismiss.subscribe(() => {
      console.log('[CheckInModalService] Success modal dismissed');
      close();
    });

  }


  /**
   * Navigate to pub details
   */
  private navigateToPub(pubId?: string): void {
    if (pubId) {
      console.log('[CheckInModalService] Navigating to pub:', pubId);
      this.router.navigate(['/pubs', pubId]);
    }
  }
}
