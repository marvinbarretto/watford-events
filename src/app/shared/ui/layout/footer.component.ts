import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import packageJson from '../../../../../package.json';
import { environment } from '../../../../environments/environment';
import { DevDebugComponent } from '../dev-debug/dev-debug.component';
import { AuthStore } from '../../../auth/data-access/auth.store';
import { Roles } from '../../../auth/utils/roles.enum';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, DevDebugComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private readonly authStore = inject(AuthStore);

  readonly currentYear = new Date().getFullYear();
  readonly version = packageJson.version;
  readonly showDevDebug = !environment.production && this.isAdminUser();

  private isAdminUser(): boolean {
    const user = this.authStore.user();
    return user?.role === Roles.Admin;
  }
}
