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
    path: 'events',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'venues',
    data: { shell: 'main' },
    loadComponent: () => import('./venues/feature/venue-list.component').then(m => m.VenueListComponent)
  },
  {
    path: 'events/add/camera',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/camera-add-event.component').then(m => m.CameraAddEventComponent)
  },
  {
    path: 'events/add',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/add-event.component').then(m => m.AddEventComponent)
  },
  {
    path: 'events/:id',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/event-detail.component').then(m => m.EventDetailComponent)
  },
  {
    path: 'flyer-parser',
    data: { shell: 'flyer-parser' },
    loadComponent: () => import('./events/feature/flyer-parser.component').then(m => m.FlyerParserComponent)
  },
  {
    path: 'login',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./auth/feature/login.component').then(m => m.LoginComponent)
  },
  // Admin routes
  {
    path: 'admin',
    data: { shell: 'main' },
    loadComponent: () => import('./admin/feature/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
  },
  {
    path: 'admin/events',
    data: { shell: 'main' },
    loadComponent: () => import('./admin/feature/admin-event-management/admin-event-management').then(m => m.AdminEventManagement)
  },
  {
    path: 'admin/venues',
    data: { shell: 'main' },
    loadComponent: () => import('./admin/feature/admin-venue-management/admin-venue-management').then(m => m.AdminVenueManagement)
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
