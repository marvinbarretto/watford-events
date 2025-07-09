import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-fullscreen-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="fullscreen-shell">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .fullscreen-shell {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class FullScreenShell {}