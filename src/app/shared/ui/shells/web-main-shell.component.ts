import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../layout/header.component';
import { FooterComponent } from '../layout/footer.component';
import { UserInfoComponent } from '../user-info/user-info.component';

@Component({
  selector: 'app-web-main-shell',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, UserInfoComponent],
  template: `
    <div class="app">
      <app-header></app-header>
      <app-user-info></app-user-info>

      <main class="main">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>
    </div>
  `
})
export class WebMainShell {}
