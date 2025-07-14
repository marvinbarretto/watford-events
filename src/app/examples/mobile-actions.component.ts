import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonActionSheet,
  IonAlert,
  IonToast,
  IonModal,
  IonLoading,
  IonPopover,
  IonBadge,
  IonChip,
  IonSpinner,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  camera,
  image,
  share,
  trash,
  heart,
  star,
  download,
  refresh,
  search,
  notifications,
  settings,
  help,
  ellipsisHorizontal
} from 'ionicons/icons';

@Component({
  selector: 'app-mobile-actions',
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonButtons,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonActionSheet,
    IonAlert,
    IonToast,
    IonModal,
    IonLoading,
    IonPopover,
    IonBadge,
    IonChip,
    IonSpinner,
    IonProgressBar,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mobile Actions</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showMorePopover = true">
            <ion-icon name="ellipsis-horizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Search -->
      <ion-searchbar
        [(ngModel)]="searchTerm"
        (ionInput)="handleSearch($event)"
        placeholder="Search actions..."
        show-clear-button="focus">
      </ion-searchbar>

      <!-- Action Buttons -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Interactive Actions</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <ion-button
                  expand="block"
                  (click)="showActionSheet = true"
                  color="primary">
                  <ion-icon name="share" slot="start"></ion-icon>
                  Action Sheet
                </ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button
                  expand="block"
                  (click)="showAlert = true"
                  color="secondary">
                  <ion-icon name="notifications" slot="start"></ion-icon>
                  Alert
                </ion-button>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="6">
                <ion-button
                  expand="block"
                  (click)="showToast()"
                  color="tertiary">
                  <ion-icon name="heart" slot="start"></ion-icon>
                  Toast
                </ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button
                  expand="block"
                  (click)="showModal = true"
                  color="success">
                  <ion-icon name="star" slot="start"></ion-icon>
                  Modal
                </ion-button>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="6">
                <ion-button
                  expand="block"
                  (click)="showLoading()"
                  color="warning">
                  <ion-icon name="download" slot="start"></ion-icon>
                  Loading
                </ion-button>
              </ion-col>
              <ion-col size="6">
                <ion-button
                  expand="block"
                  (click)="showConfirmAlert = true"
                  color="danger">
                  <ion-icon name="trash" slot="start"></ion-icon>
                  Confirm
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Status Indicators -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Status & Feedback</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>Progress Bar</ion-label>
              <ion-progress-bar
                [value]="progressValue"
                color="primary"
                slot="end">
              </ion-progress-bar>
            </ion-item>

            <ion-item>
              <ion-label>Spinner</ion-label>
              <ion-spinner
                name="crescent"
                color="secondary"
                slot="end">
              </ion-spinner>
            </ion-item>

            <ion-item>
              <ion-label>Badges</ion-label>
              <div slot="end">
                <ion-badge color="primary">New</ion-badge>
                <ion-badge color="secondary">5</ion-badge>
                <ion-badge color="danger">!</ion-badge>
              </div>
            </ion-item>

            <ion-item>
              <ion-label>Chips</ion-label>
              <div slot="end">
                <ion-chip color="primary">
                  <ion-icon name="star"></ion-icon>
                  <ion-label>Featured</ion-label>
                </ion-chip>
                <ion-chip color="secondary">
                  <ion-label>Popular</ion-label>
                </ion-chip>
              </div>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Sample Content -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Sample Content</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            @for (item of sampleItems; track item.title) {
              <ion-item>
              <ion-label>
                <h2>{{ item.title }}</h2>
                <p>{{ item.description }}</p>
              </ion-label>
              <ion-badge [color]="item.color" slot="end">
                {{ item.status }}
              </ion-badge>
              </ion-item>
            }
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Action Sheet -->
      <ion-action-sheet
        [isOpen]="showActionSheet"
        (didDismiss)="showActionSheet = false"
        header="Choose Action"
        [buttons]="actionSheetButtons">
      </ion-action-sheet>

      <!-- Alert -->
      <ion-alert
        [isOpen]="showAlert"
        (didDismiss)="showAlert = false"
        header="Information"
        message="This is an example alert message!"
        [buttons]="['OK']">
      </ion-alert>

      <!-- Confirm Alert -->
      <ion-alert
        [isOpen]="showConfirmAlert"
        (didDismiss)="showConfirmAlert = false"
        header="Confirm Action"
        message="Are you sure you want to delete this item?"
        [buttons]="confirmButtons">
      </ion-alert>

      <!-- Toast -->
      <ion-toast
        [isOpen]="showToastMessage"
        (didDismiss)="showToastMessage = false"
        message="Action completed successfully!"
        duration="2000"
        position="bottom"
        color="success">
      </ion-toast>

      <!-- Modal -->
      <ion-modal [isOpen]="showModal" (didDismiss)="showModal = false">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Modal Example</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showModal = false">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <div style="padding: 20px;">
              <h2>Modal Content</h2>
              <p>This is an example modal with custom content.</p>
              <ion-button expand="block" (click)="showModal = false">
                Close Modal
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Loading -->
      <ion-loading
        [isOpen]="showLoadingIndicator"
        message="Loading..."
        duration="3000"
        (didDismiss)="showLoadingIndicator = false">
      </ion-loading>

      <!-- Popover -->
      <ion-popover
        [isOpen]="showMorePopover"
        (didDismiss)="showMorePopover = false"
        side="bottom"
        alignment="end">
        <ng-template>
          <ion-content>
            <ion-list>
              <ion-item button (click)="handlePopoverAction('settings')">
                <ion-icon name="settings" slot="start"></ion-icon>
                <ion-label>Settings</ion-label>
              </ion-item>
              <ion-item button (click)="handlePopoverAction('help')">
                <ion-icon name="help" slot="start"></ion-icon>
                <ion-label>Help</ion-label>
              </ion-item>
              <ion-item button (click)="handlePopoverAction('refresh')">
                <ion-icon name="refresh" slot="start"></ion-icon>
                <ion-label>Refresh</ion-label>
              </ion-item>
            </ion-list>
          </ion-content>
        </ng-template>
      </ion-popover>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 16px;
    }

    ion-progress-bar {
      width: 100px;
    }

    ion-badge {
      margin-left: 8px;
    }

    ion-chip {
      margin-left: 8px;
    }

    ion-spinner {
      width: 20px;
      height: 20px;
    }

    ion-searchbar {
      padding: 16px;
    }
  `]
})
export class MobileActionsComponent {
  showActionSheet = false;
  showAlert = false;
  showConfirmAlert = false;
  showToastMessage = false;
  showModal = false;
  showLoadingIndicator = false;
  showMorePopover = false;

  searchTerm = '';
  progressValue = 0.7;

  sampleItems = [
    {
      title: 'Summer Festival',
      description: 'Annual music festival in the park',
      status: 'Active',
      color: 'success'
    },
    {
      title: 'Tech Conference',
      description: 'Latest technology trends and innovations',
      status: 'Pending',
      color: 'warning'
    },
    {
      title: 'Art Exhibition',
      description: 'Contemporary art showcase',
      status: 'Sold Out',
      color: 'danger'
    },
    {
      title: 'Food Festival',
      description: 'Local cuisine and food trucks',
      status: 'New',
      color: 'primary'
    }
  ];

  actionSheetButtons = [
    {
      text: 'Share',
      icon: 'share',
      handler: () => {
        console.log('Share clicked');
      }
    },
    {
      text: 'Favorite',
      icon: 'heart',
      handler: () => {
        console.log('Favorite clicked');
      }
    },
    {
      text: 'Delete',
      icon: 'trash',
      role: 'destructive',
      handler: () => {
        console.log('Delete clicked');
      }
    },
    {
      text: 'Cancel',
      icon: 'close',
      role: 'cancel'
    }
  ];

  confirmButtons = [
    {
      text: 'Cancel',
      role: 'cancel'
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => {
        console.log('Item deleted');
        this.showToast();
      }
    }
  ];

  constructor() {
    addIcons({
      camera,
      image,
      share,
      trash,
      heart,
      star,
      download,
      refresh,
      search,
      notifications,
      settings,
      help,
      ellipsisHorizontal
    });
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      console.log('Refreshed');
      event.target.complete();
    }, 2000);
  }

  handleSearch(event: any) {
    console.log('Searching:', event.target.value);
  }

  showToast() {
    this.showToastMessage = true;
  }

  showLoading() {
    this.showLoadingIndicator = true;
  }

  handlePopoverAction(action: string) {
    console.log('Popover action:', action);
    this.showMorePopover = false;
  }
}
