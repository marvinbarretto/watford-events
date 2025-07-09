import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/feature/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'test',
    loadComponent: () => import('./shared/feature/test/test.component').then(m => m.TestComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('./events/feature/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'flyer-parser',
    loadComponent: () => import('./events/feature/flyer-parser.component').then(m => m.FlyerParserComponent)
  },
  {
    path: 'events/add',
    loadComponent: () => import('./events/feature/add-event.component').then(m => m.AddEventComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/feature/login.component').then(m => m.LoginComponent)
  }
];
