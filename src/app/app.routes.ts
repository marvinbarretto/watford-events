import { Routes } from '@angular/router';
import { authGuard } from './auth/data-access/auth.guard';
import { roleGuard } from './auth/data-access/role.guard';
import { Roles } from './auth/utils/roles.enum';

export const routes: Routes = [
  {
    path: '',
    data: { shell: 'main' },
    loadComponent: () => import('./home/feature/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'test',
    data: { shell: 'main' },
    loadComponent: () => import('./shared/feature/test/test.component').then(m => m.TestComponent)
  },
  {
    path: 'test-responsive',
    data: { shell: 'main' },
    loadComponent: () => import('./features/test-responsive/test-responsive.component').then(m => m.TestResponsiveComponent)
  },
  {
    path: 'venues',
    data: { shell: 'main' },
    loadComponent: () => import('./venues/feature/venue-list.component').then(m => m.VenueListComponent)
  },
  {
    path: 'events',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/events-directory.component').then(m => m.EventsDirectoryComponent)
  },
  {
    path: 'events/create',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/event-creator.component').then(m => m.EventCreatorComponent)
  },
  {
    path: 'events/create/confirm',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/event-confirmation.component').then(m => m.EventConfirmationComponent)
  },
  {
    path: 'events/:id/enhance',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/event-enhancement.component').then(m => m.EventEnhancementComponent)
  },
  {
    path: 'events/:id',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: 'login',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./auth/feature/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./auth/feature/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./auth/feature/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'settings',
    data: { shell: 'main' },
    canActivate: [authGuard],
    loadComponent: () => import('./user-preferences/feature/settings.component').then(m => m.SettingsComponent)
  },
  // Admin routes
  {
    path: 'admin',
    data: { shell: 'main' },
    // canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
  },
  {
    path: 'admin/events',
    data: { shell: 'main' },
    canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/admin-event-management/admin-event-management').then(m => m.AdminEventManagement)
  },
  {
    path: 'admin/venues',
    data: { shell: 'main' },
    canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/admin-venue-management/admin-venue-management').then(m => m.AdminVenueManagement)
  },
  {
    path: 'admin/scraping',
    data: { shell: 'main' },
    // canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/admin-scraping/admin-scraping').then(m => m.AdminScraping)
  },
  {
    path: 'admin/data-quality',
    data: { shell: 'main' },
    canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/admin-data-quality/admin-data-quality').then(m => m.AdminDataQualityComponent)
  },
  {
    path: 'admin/venue-reconciliation',
    data: { shell: 'main' },
    canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/venue-reconciliation/venue-reconciliation').then(m => m.VenueReconciliationComponent)
  },
  {
    path: 'admin/reconciliation',
    data: { shell: 'main' },
    canActivate: [authGuard, roleGuard([Roles.Admin])],
    loadComponent: () => import('./admin/feature/entity-reconciliation/entity-reconciliation.component').then(m => m.EntityReconciliationComponent)
  },
  {
    path: 'admin/venues/new',
    data: { shell: 'main' },
    loadComponent: () => import('./venues/feature/venue-form.component').then(m => m.VenueFormComponent)
  },
  {
    path: 'admin/venues/:id/edit',
    data: { shell: 'main' },
    loadComponent: () => import('./venues/feature/venue-form.component').then(m => m.VenueFormComponent)
  },
  // Example pages
  {
    path: 'examples/web-dashboard',
    data: { shell: 'main' },
    loadComponent: () => import('./examples/web-dashboard.component').then(m => m.WebDashboardComponent)
  },
  {
    path: 'examples/web-form',
    data: { shell: 'main' },
    loadComponent: () => import('./examples/web-form.component').then(m => m.WebFormComponent)
  },
  {
    path: 'examples/mobile-dashboard',
    data: { shell: 'main' },
    loadComponent: () => import('./examples/mobile-dashboard.component').then(m => m.MobileDashboardComponent)
  },
  {
    path: 'examples/mobile-form',
    data: { shell: 'main' },
    loadComponent: () => import('./examples/mobile-form.component').then(m => m.MobileFormComponent)
  },
  {
    path: 'examples/mobile-actions',
    data: { shell: 'main' },
    loadComponent: () => import('./examples/mobile-actions.component').then(m => m.MobileActionsComponent)
  },
  {
    path: 'examples/fullscreen-onboarding',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./examples/fullscreen-onboarding.component').then(m => m.FullscreenOnboardingComponent)
  },
  {
    path: 'examples/fullscreen-welcome',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./examples/fullscreen-welcome.component').then(m => m.FullscreenWelcomeComponent)
  },
  {
    path: 'examples/flyer-demo',
    data: { shell: 'flyer-parser' },
    loadComponent: () => import('./examples/flyer-demo.component').then(m => m.FlyerDemoComponent)
  }
];
