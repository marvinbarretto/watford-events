// src/app/home/feature/home/home.component.ts
import { Component, computed, inject, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '@shared/data-access/base.component';
import { AuthStore } from '@auth/data-access/auth.store';
import { UserStore } from '@users/data-access/user.store';
import { MissionStore } from '@missions/data-access/mission.store';
import { OverlayService } from '@shared/data-access/overlay.service';
import { PointsStore } from '@points/data-access/points.store';
import { CheckinStore } from '@check-in/data-access/check-in.store';
import { NewCheckinStore } from '../../../new-checkin/data-access/new-checkin.store';

// Import micro-widget components
import { MissionsSectionComponent } from '../../ui/missions-widget/missions-widget.component';
import { UserProfileWidgetComponent } from '@home/ui/user-profile-widget/user-profile-widget.component';
import { ProfileCustomisationModalComponent } from '@home/ui/profile-customisation-modal/profile-customisation-modal.component';
import { CarpetPhotoData, PhotoStats } from '@shared/utils/carpet-photo.models';



@Component({
  selector: 'app-home-three',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MissionsSectionComponent,
    UserProfileWidgetComponent,
    RouterModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent extends BaseComponent {
  private readonly overlayService = inject(OverlayService);

  constructor() {
    super();

    // Watch for when check-in needs carpet scanning
    effect(() => {
      const needsCarpetForPub = this.newCheckinStore.needsCarpetScan();
      if (needsCarpetForPub) {
        console.log('[Home] Check-in needs carpet scan for pub:', needsCarpetForPub);
        this.showCarpetTest.set(true);
      }
    });
  }




    // Signal for controlling carpet scanner display
    protected readonly showCarpetTest = signal(false);









  // ✅ Store Injections
  protected readonly authStore = inject(AuthStore);
  protected readonly userStore = inject(UserStore);
  protected readonly missionStore = inject(MissionStore, { optional: true });
  protected readonly pointsStore = inject(PointsStore);
  protected readonly checkinStore = inject(CheckinStore);
  protected readonly newCheckinStore = inject(NewCheckinStore);



   protected readonly carpetsLoading = signal(false);


  // ✅ Data Signals
  readonly user = this.userStore.user;



  readonly activeMissions = computed(() => {
    const user = this.user();
    const allMissions = this.missionStore?.missions?.() || [];

    if (!user?.joinedMissionIds?.length || !allMissions.length) return [];

    return allMissions
      .filter(mission => user.joinedMissionIds!.includes(mission.id))
      .map(mission => ({
        id: mission.id,
        title: mission.name,
        description: mission.description,
        progress: mission.pubIds?.filter(id =>
          user.checkedInPubIds?.includes(id)
        ).length || 0,
        total: mission.pubIds?.length || 0
      }))
      .slice(0, 3); // Show max 3 active missions
  });

  readonly isNewUser = computed(() => {
    const user = this.user();
    return !user || (user.checkedInPubIds?.length || 0) === 0;
  });


  // ✅ Development helper
  readonly isDevelopment = computed(() => {
    return true; // Always show debug in development
  });

  // ✅ Event Handlers
  handleOpenSettings(): void {
    console.log('[Home] Opening profile settings');
    this.showInfo('Profile customization coming soon!');
  }

  handleOpenGuide(): void {
    console.log('[Home] Opening how-to-play guide');
    this.showInfo('How to play guide coming soon!');
  }

  handleStartMission(): void {
    console.log('[Home] Navigating to missions');
    this.router.navigate(['/missions']);
  }

  handleViewMission(missionId: string): void {
    console.log('[Home] Viewing mission:', missionId);
    this.router.navigate(['/missions', missionId]);
  }


// ✅ Event Handlers
handleOpenProfile(): void {
  console.log('[Home] Opening profile customization modal');

  const { componentRef, close } = this.overlayService.open(
    ProfileCustomisationModalComponent,
    {
      maxWidth: '600px',
      maxHeight: '90vh'
    }
  );

  // ✅ No need to subscribe to modal events - the close function handles everything
  console.log('[Home] Profile modal opened, close function available');
}

  // ✅ Debug Information
  readonly debugUserInfo = computed(() => {
    const user = this.user();
    if (!user) return { status: 'No user logged in' };

    return {
      uid: user.uid,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
      pubsVisited: user.checkedInPubIds?.length || 0,
      missions: user.joinedMissionIds?.length || 0
    };
  });

  readonly debugStoresInfo = computed(() => ({
    auth: {
      hasUser: !!this.authStore.user(),
      userType: this.authStore.user()?.isAnonymous ? 'anonymous' : 'authenticated'
    },
    userStore: {
      hasUser: !!this.userStore.user(),
      loading: this.userStore.loading?.() || false
    },
    missionStore: {
      available: !!this.missionStore,
      activeMissions: this.activeMissions().length
    }
  }));




  // ✅ Data Loading
  protected override async onInit() {
    console.log('[Home] Initializing home component...');


    console.log('[Home] Component initialized');
  }
}

// TODO: DO i need to do this?
// // Clean up object URLs when component destroys
// ngOnDestroy() {
//   // Revoke object URLs to free memory
//   this.carpets().forEach(carpet => {
//     URL.revokeObjectURL(carpet.imageUrl);
//   });
// }
