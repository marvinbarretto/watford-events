import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: { shell: 'main' },
    loadComponent: () => import('./shared/feature/home/home.component').then(m => m.HomeComponent)
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
    path: 'flyer-parser',
    data: { shell: 'flyer-parser' },
    loadComponent: () => import('./events/feature/flyer-parser.component').then(m => m.FlyerParserComponent)
  },
  {
    path: 'events/add',
    data: { shell: 'main' },
    loadComponent: () => import('./events/feature/add-event.component').then(m => m.AddEventComponent)
  },
  {
    path: 'login',
    data: { shell: 'fullscreen' },
    loadComponent: () => import('./auth/feature/login.component').then(m => m.LoginComponent)
  }
];
