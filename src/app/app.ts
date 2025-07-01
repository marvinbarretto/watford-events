import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SsrPlatformService } from './shared/utils/ssr/ssr-platform.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'watford-events';
  protected readonly platform = inject(SsrPlatformService);

  get browserOnlyMessage(): string {
  return this.platform.onlyOnBrowser(() =>
      'This message only appears in the browser!'
    ) ?? 'dfdf';
  }

  get serverOnlyMessage(): string {
    return this.platform.onlyOnServer(() =>
      'This message only appears on the server!'
    ) ?? 'sdfdsf';
  }
}
