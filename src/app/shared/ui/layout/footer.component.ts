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
  readonly showDevDebug = !environment.production; // Temporarily bypass auth check for development

  private isAdminUser(): boolean {
    const user = this.authStore.user();
    const authState = this.authStore.isAuthenticated();
    console.log('[FooterComponent] Enhanced Debug - Auth State:', {
      isAuthenticated: authState,
      user: user,
      role: user?.role,
      isAdmin: user?.role === Roles.Admin,
      rolesEnum: Roles,
      environment: environment.production,
      showDevDebug: !environment.production,
      userObjectKeys: user ? Object.keys(user) : 'null'
    });
    return user?.role === Roles.Admin;
  }
}
