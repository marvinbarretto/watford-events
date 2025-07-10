import { signal, computed, effect, Injectable, inject, Inject } from '@angular/core';
import { CookieService } from './cookie.service';
import { SsrPlatformService } from '../utils/ssr/ssr-platform.service';
import { themes, defaultTheme, type ThemeType, type Theme } from '../utils/theme.tokens';
import { USER_THEME_TOKEN } from '../../../libs/tokens/user-theme.token';

const THEME_COOKIE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _cookie = inject(CookieService);
  private readonly _platform = inject(SsrPlatformService);

  // ✅ Follow your signal conventions
  private readonly _themeType = signal<ThemeType>(defaultTheme.type);
  private readonly _isLoaded = signal(false);

  // ✅ Public readonly signals
  readonly themeType = this._themeType.asReadonly();
  readonly theme = computed(() => themes[this._themeType()]);
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly isDark = computed(() => this.theme().isDark);

  constructor(@Inject(USER_THEME_TOKEN) serverTheme?: string) {
    // Validate and set initial theme
    const safeTheme = this._validateTheme(serverTheme);
    this._themeType.set(safeTheme);

    // Only run browser-specific code on client
    this._platform.onlyOnBrowser(() => {
      this._initializeBrowserTheme(safeTheme);
      this._isLoaded.set(true);
    });

    // Apply theme to DOM whenever it changes
    effect(() => {
      this._platform.onlyOnBrowser(() => {
        this._applyThemeToDOM(this.theme());
      });
    });
  }

  setTheme(type: ThemeType): void {
    if (!themes[type]) {
      console.warn(`[ThemeStore] Unknown theme type: ${type}`);
      return;
    }

    this._themeType.set(type);
    this._cookie.setCookie(THEME_COOKIE_KEY, type);

    // TODO: Save to user profile if authenticated
  }

  toggleTheme(): void {
    const current = this._themeType();

    // ✅ NEW: Smart toggle between light and dark themes
    const availableThemes = Object.entries(themes);
    const lightThemes = availableThemes.filter(([_, theme]) => !theme.isDark);
    const darkThemes = availableThemes.filter(([_, theme]) => theme.isDark);

    if (this.isDark()) {
      // Switch to a light theme (default to first light theme)
      const newTheme = lightThemes[0]?.[0] as ThemeType || 'aurora';
      this.setTheme(newTheme);
    } else {
      // Switch to a dark theme (default to first dark theme)
      const newTheme = darkThemes[0]?.[0] as ThemeType || 'nebula';
      this.setTheme(newTheme);
    }
  }

  // ✅ NEW: Get themes grouped by light/dark
  getLightThemes(): Array<{ type: ThemeType; theme: Theme }> {
    return Object.entries(themes)
      .filter(([_, theme]) => !theme.isDark)
      .map(([type, theme]) => ({ type: type as ThemeType, theme }));
  }

  getDarkThemes(): Array<{ type: ThemeType; theme: Theme }> {
    return Object.entries(themes)
      .filter(([_, theme]) => theme.isDark)
      .map(([type, theme]) => ({ type: type as ThemeType, theme }));
  }

  getAllThemes(): Array<{ type: ThemeType; theme: Theme }> {
    return Object.entries(themes)
      .map(([type, theme]) => ({ type: type as ThemeType, theme }));
  }

  // Generate CSS custom properties for current theme
  getCSSVariables(): Record<string, string> {
    const theme = this.theme();
    const variables: Record<string, string> = {};

    // ✅ NEW: Add all theme colors directly (flat structure)
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables[`--${this._kebabCase(key)}`] = value;
    });

    return variables;
  }

  private _validateTheme(themeInput?: string): ThemeType {
    if (!themeInput) return defaultTheme.type;

    // ✅ UPDATED: Handle new theme names and legacy names
    const themeMap: Record<string, ThemeType> = {
      // Current themes
      'aurora': 'aurora',
      'sakura': 'sakura',
      'nebula': 'nebula',
      'sunset': 'sunset',
      'ocean': 'ocean',
      // Legacy mappings
      'fresh': 'aurora',
      'sunshine': 'sunset',
      'midnight': 'nebula',
      'coral': 'sakura',
      'forest': 'ocean',
    };

    const normalized = themeInput.toLowerCase();
    const mappedTheme = themeMap[normalized];

    return mappedTheme && themes[mappedTheme] ? mappedTheme : defaultTheme.type;
  }

  private _initializeBrowserTheme(initialTheme: ThemeType): void {
    const cookieTheme = this._cookie.getCookie(THEME_COOKIE_KEY) as ThemeType;

    if (cookieTheme && cookieTheme !== initialTheme && themes[cookieTheme]) {
      this._themeType.set(cookieTheme);
      return;
    }

    // ✅ UPDATED: Respect user's system preference with new themes
    if (!cookieTheme && this.hasSystemThemePreference()) {
      this._platform.onlyOnBrowser(() => {
        const window = this._platform.getWindow();
        const systemPrefersDark = window?.matchMedia('(prefers-color-scheme: dark)').matches;

        if (systemPrefersDark) {
          const darkThemes = this.getDarkThemes();
          const systemTheme = darkThemes[0]?.type || 'nebula';
          this._themeType.set(systemTheme);
        } else {
          const lightThemes = this.getLightThemes();
          const systemTheme = lightThemes[0]?.type || 'aurora';
          this._themeType.set(systemTheme);
        }
      });
    }
  }

  hasSystemThemePreference(): boolean {
    return this._platform.onlyOnBrowser(() => {
      const window = this._platform.getWindow();
      return window?.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
    }) ?? false;
  }

  private _applyThemeToDOM(theme: Theme): void {
    this._platform.onlyOnBrowser(() => {
      const root = this._platform.getDocument()?.documentElement;
      if (!root) return;

      // Apply CSS custom properties
      const variables = this.getCSSVariables();
      Object.entries(variables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      // ✅ UPDATED: Use theme type instead of theme name for classes
      const themeClasses = Object.keys(themes).map(t => `theme--${t}`);
      root.classList.remove(...themeClasses);
      root.classList.add(`theme--${this._themeType()}`);

      // Add dark mode class for easier CSS targeting
      root.classList.toggle('dark', theme.isDark);

      // ✅ NEW: Add theme-specific classes for advanced styling
      root.setAttribute('data-theme', this._themeType());
      root.setAttribute('data-theme-mode', theme.isDark ? 'dark' : 'light');
    });
  }

  private _kebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/gi, '')
      .toLowerCase();
  }
}
