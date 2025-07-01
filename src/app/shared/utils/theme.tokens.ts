// ===== SIMPLIFIED THEME SYSTEM =====
export type ThemeType = 'ocean' | 'sunset' | 'midnight' | 'lavender' | 'emerald';

export type Theme = {
  name: string;
  isDark: boolean;
  colors: {
    // Background & Surface
    background: string;
    surface: string;
    surfaceElevated: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;

    // Interactive States
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primaryText: string;

    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
    secondaryText: string;

    // Semantic States
    success: string;
    successText: string;
    warning: string;
    warningText: string;
    error: string;
    errorText: string;
    info: string;
    infoText: string;

    // Borders & Dividers
    border: string;
    borderSecondary: string;

    // Overlays & Shadows
    overlay: string;
    shadow: string;

    // Links
    link: string;
    linkHover: string;
    linkVisited: string;

    // ✅ Simple color variables for gradients/accents
    light: string;       // For gradients, hover states
    lighter: string;     // Subtle backgrounds
    dark: string;        // For contrast, dark elements
    darker: string;      // Deep contrast
    accent: string;      // Pop color
    accentLight: string; // Light version of accent
  };
};

// ===== THEME DEFINITIONS =====

export const themes: Record<ThemeType, Theme> = {
  ocean: {
    name: 'Ocean',
    isDark: false,
    colors: {
      // Core colors
      background: '#f0f9ff',
      surface: '#ffffff',
      surfaceElevated: '#e0f2fe',

      // Text hierarchy
      text: '#0c1825',
      textSecondary: '#164e63',
      textMuted: '#0891b2',

      // Primary interactions
      primary: '#0ea5e9',
      primaryHover: '#0284c7',
      primaryActive: '#0369a1',
      primaryText: '#ffffff',

      // Secondary interactions
      secondary: '#e0f2fe',
      secondaryHover: '#bae6fd',
      secondaryActive: '#7dd3fc',
      secondaryText: '#0c1825',

      // Semantic states
      success: '#059669',
      successText: '#ffffff',
      warning: '#f59e0b',
      warningText: '#451a03',
      error: '#dc2626',
      errorText: '#ffffff',
      info: '#0ea5e9',
      infoText: '#ffffff',

      // Structure
      border: '#e0f2fe',
      borderSecondary: '#f0f9ff',
      overlay: 'rgba(12, 24, 37, 0.5)',
      shadow: '0 4px 6px -1px rgba(14, 165, 233, 0.1)',

      // Links
      link: '#0ea5e9',
      linkHover: '#0284c7',
      linkVisited: '#7c3aed',

      // ✅ Simple variables for gradients/styling
      light: '#f0f9ff',
      lighter: '#e0f2fe',
      dark: '#0c4a6e',
      darker: '#082f49',
      accent: '#06b6d4',
      accentLight: '#cffafe'
    }
  },

  sunset: {
    name: 'Sunset',
    isDark: false,
    colors: {
      background: '#fff8f1',
      surface: '#ffffff',
      surfaceElevated: '#fef3e2',

      text: '#431407',
      textSecondary: '#9a3412',
      textMuted: '#ea580c',

      primary: '#ff6b35',
      primaryHover: '#f97316',
      primaryActive: '#ea580c',
      primaryText: '#ffffff',

      secondary: '#fed7aa',
      secondaryHover: '#fdba74',
      secondaryActive: '#fb923c',
      secondaryText: '#431407',

      success: '#059669',
      successText: '#ffffff',
      warning: '#f59e0b',
      warningText: '#451a03',
      error: '#dc2626',
      errorText: '#ffffff',
      info: '#0ea5e9',
      infoText: '#ffffff',

      border: '#fed7aa',
      borderSecondary: '#fef3e2',
      overlay: 'rgba(67, 20, 7, 0.5)',
      shadow: '0 4px 6px -1px rgba(255, 107, 53, 0.2)',

      link: '#ea580c',
      linkHover: '#c2410c',
      linkVisited: '#c026d3',

      light: '#fff7ed',
      lighter: '#fed7aa',
      dark: '#c2410c',
      darker: '#9a3412',
      accent: '#f472b6',
      accentLight: '#fce7f3'
    }
  },

  midnight: {
    name: 'Midnight',
    isDark: true,
    colors: {
      background: '#0f0f23',
      surface: '#1a1a2e',
      surfaceElevated: '#16213e',

      text: '#e2e8f0',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',

      primary: '#6366f1',
      primaryHover: '#7c3aed',
      primaryActive: '#8b5cf6',
      primaryText: '#ffffff',

      secondary: '#1e293b',
      secondaryHover: '#334155',
      secondaryActive: '#475569',
      secondaryText: '#e2e8f0',

      success: '#10b981',
      successText: '#ffffff',
      warning: '#f59e0b',
      warningText: '#1f2937',
      error: '#ef4444',
      errorText: '#ffffff',
      info: '#06b6d4',
      infoText: '#ffffff',

      border: '#1e293b',
      borderSecondary: '#16213e',
      overlay: 'rgba(0, 0, 0, 0.8)',
      shadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)',

      link: '#8b5cf6',
      linkHover: '#a78bfa',
      linkVisited: '#06b6d4',

      light: '#334155',
      lighter: '#475569',
      dark: '#0f172a',
      darker: '#020617',
      accent: '#f59e0b',
      accentLight: '#fbbf24'
    }
  },

  lavender: {
    name: 'Lavender',
    isDark: false,
    colors: {
      background: '#faf5ff',
      surface: '#ffffff',
      surfaceElevated: '#f3e8ff',

      text: '#581c87',
      textSecondary: '#7c3aed',
      textMuted: '#a855f7',

      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryActive: '#6d28d9',
      primaryText: '#ffffff',

      secondary: '#e9d5ff',
      secondaryHover: '#ddd6fe',
      secondaryActive: '#c4b5fd',
      secondaryText: '#581c87',

      success: '#059669',
      successText: '#ffffff',
      warning: '#f59e0b',
      warningText: '#451a03',
      error: '#dc2626',
      errorText: '#ffffff',
      info: '#0ea5e9',
      infoText: '#ffffff',

      border: '#e9d5ff',
      borderSecondary: '#f3e8ff',
      overlay: 'rgba(88, 28, 135, 0.5)',
      shadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)',

      link: '#7c3aed',
      linkHover: '#6d28d9',
      linkVisited: '#059669',

      light: '#faf5ff',
      lighter: '#f3e8ff',
      dark: '#5b21b6',
      darker: '#4c1d95',
      accent: '#ec4899',
      accentLight: '#fce7f3'
    }
  },

  emerald: {
    name: 'Emerald',
    isDark: false,
    colors: {
      background: '#f0fdf4',
      surface: '#ffffff',
      surfaceElevated: '#dcfce7',

      text: '#14532d',
      textSecondary: '#166534',
      textMuted: '#059669',

      primary: '#10b981',
      primaryHover: '#059669',
      primaryActive: '#047857',
      primaryText: '#ffffff',

      secondary: '#bbf7d0',
      secondaryHover: '#86efac',
      secondaryActive: '#4ade80',
      secondaryText: '#14532d',

      success: '#10b981',
      successText: '#ffffff',
      warning: '#f59e0b',
      warningText: '#451a03',
      error: '#dc2626',
      errorText: '#ffffff',
      info: '#0ea5e9',
      infoText: '#ffffff',

      border: '#bbf7d0',
      borderSecondary: '#dcfce7',
      overlay: 'rgba(21, 83, 45, 0.5)',
      shadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',

      link: '#059669',
      linkHover: '#047857',
      linkVisited: '#7c3aed',

      light: '#f0fdf4',
      lighter: '#dcfce7',
      dark: '#065f46',
      darker: '#064e3b',
      accent: '#f97316',
      accentLight: '#fed7aa'
    }
  }
};

export const defaultTheme: { type: ThemeType; theme: Theme } = {
  type: 'ocean',
  theme: themes.ocean
};
