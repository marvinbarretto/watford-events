import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";
import { GLOBAL } from "./constants";

@Injectable({providedIn: 'root'})
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(
    private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const customTitle = this.buildTitle(routerState) || '';
    const title = this.buildTitle(routerState);

    const companyName = GLOBAL.COMPANY_NAME;

    if (title !== undefined) {
      this.title.setTitle(`${customTitle} - ${companyName}`);
    }
    else {
      this.title.setTitle(`${companyName}`);
    }
  }
}
