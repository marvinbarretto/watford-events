import { InjectionToken } from '@angular/core';
import { ThemeType, themes } from '../../app/shared/utils/theme.tokens';

export function generateInlineThemeCss(themeType: ThemeType): string {
  const theme = themes[themeType] ?? themes['nebula'];
  const vars = Object.entries(theme.colors)
    .map(([key, value]) => {
      return `--${key}: ${value};`;
    })
    .join('\n');

  return `<style id="server-theme">
    :root {
      ${vars}
    }
  </style>`;
}

export const USER_THEME_TOKEN = new InjectionToken<ThemeType>('UserTheme');
