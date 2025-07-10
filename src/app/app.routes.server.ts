import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'events/:id',
    renderMode: RenderMode.Client  // Dynamic route, render on client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
