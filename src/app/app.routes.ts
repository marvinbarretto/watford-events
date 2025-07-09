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
    loadComponent: () => import('./shared/feature/home/home.component').then(m => m.HomeComponent) // Placeholder until events component is created
  },
  {
    path: 'flyer-parser',
    loadComponent: () => import('./events/feature/flyer-parser.component').then(m => m.FlyerParserComponent)
  }
];
