import { Component, inject, Injectable } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SsrPlatformService } from './shared/utils/ssr/ssr-platform.service';
import { BaseStore } from './shared/data-access/base.store';
import { ToastService } from './shared/data-access/toast.service';
import { AuthStore } from './auth/data-access/auth.store';
import { CommonModule } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TestStore extends BaseStore<TestItem> {
  protected async fetchData(): Promise<TestItem[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: '1', name: 'Test Item 1', value: 100 },
      { id: '2', name: 'Test Item 2', value: 200 },
      { id: '3', name: 'Test Item 3', value: 300 }
    ];
  }
}

interface TestItem {
  id: string;
  name: string;
  value: number;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'watford-events';
  protected readonly platform = inject(SsrPlatformService);
  protected readonly toastService = inject(ToastService);
  protected readonly authStore = inject(AuthStore);
  protected readonly testStore = inject(TestStore);

  get browserOnlyMessage(): string {
  return this.platform.onlyOnBrowser(() =>
      'This message only appears in the browser!'
    ) ?? 'dfdf';
  }

  get serverOnlyMessage(): string {
    return this.platform.onlyOnServer(() =>
      'This message only appears on the server!'
    ) ?? 'sdfdsf';
  }

  showSuccessToast() {
    this.toastService.success('Success toast test!');
  }

  showErrorToast() {
    this.toastService.error('Error toast test!');
  }

  showWarningToast() {
    this.toastService.warning('Warning toast test!');
  }

  showInfoToast() {
    this.toastService.info('Info toast test!');
  }

  showStickyToast() {
    this.toastService.error('Sticky error toast (won\'t auto-dismiss)', 0, true);
  }

  clearAllToasts() {
    this.toastService.clearAll();
  }

  loginWithGoogle() {
    this.authStore.loginWithGoogle();
  }

  logout() {
    this.authStore.logout();
  }

  async loadTestStore() {
    await this.testStore.load();
  }

  async addTestItem() {
    const newItem = await this.testStore.add({
      name: `New Item ${Date.now()}`,
      value: Math.floor(Math.random() * 1000)
    });
    this.toastService.success(`Added item: ${newItem.name}`);
  }

  async updateFirstItem() {
    const items = this.testStore.data();
    if (items.length > 0) {
      await this.testStore.update(items[0].id, {
        name: `Updated at ${new Date().toLocaleTimeString()}`,
        value: Math.floor(Math.random() * 1000)
      });
      this.toastService.info('Updated first item');
    } else {
      this.toastService.warning('No items to update');
    }
  }

  async removeFirstItem() {
    const items = this.testStore.data();
    if (items.length > 0) {
      await this.testStore.remove(items[0].id);
      this.toastService.error(`Removed item: ${items[0].name}`);
    } else {
      this.toastService.warning('No items to remove');
    }
  }

  resetTestStore() {
    this.testStore.reset();
    this.toastService.info('Test store reset');
  }

  getStoreDebugInfo() {
    const debugInfo = this.testStore.getDebugInfo();
    console.log('Test Store Debug Info:', debugInfo);
    this.toastService.info('Debug info logged to console');
  }
}
