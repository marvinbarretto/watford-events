// ===== SIMPLIFIED THEME SYSTEM =====
export type ThemeType = 'aurora' | 'sakura' | 'nebula' | 'sunset' | 'ocean';

export type Theme = {
  name: string;
  isDark: boolean;
  colors: {
    // ===== NEW SEMANTIC PROPERTIES =====
    // Background scales (5 levels)
    background: string;          // Main app background
    backgroundLighter: string;   // Widget backgrounds
    backgroundLightest: string;  // Elevated surfaces
    backgroundDarker: string;    // Recessed areas
    backgroundDarkest: string;   // Deep contrast

    // Text scales (3 levels)
    text: string;                // Primary text
    textSecondary: string;       // Secondary text
    textMuted: string;           // Disabled/muted text

    // Border scales (2 levels)
    border: string;              // Default borders
    borderStrong: string;        // Emphasized borders

    // Interactive colors (primary, secondary, accent)
    primary: string;             // Primary actions
    primaryHover: string;        // Primary hover
    onPrimary: string;     // Text on primary

    secondary: string;           // Secondary actions
    secondaryHover: string;      // Secondary hover
    onSecondary: string;   // Text on secondary

    accent: string;              // Pop color that contrasts with theme
    accentHover: string;         // Accent hover
    onAccent: string;      // Text on accent

    // Semantic colors (status indicators)
    success: string;
    successHover: string;        // Success hover/shade
    warning: string;
    warningHover: string;        // Warning hover/shade
    error: string;
    errorHover: string;          // Error hover/shade
    info: string;
    infoHover: string;           // Info hover/shade

    // ===== DEPRECATED (kept for backward compatibility) =====

    // Overlays & Shadows
    overlay: string;
    shadow: string;
  };
};

// ===== THEME DEFINITIONS =====

export const themes: Record<ThemeType, Theme> = {
  aurora: {
    name: 'Aurora Borealis',
    isDark: false,
    colors: {
      // ===== NEW SEMANTIC PROPERTIES =====
      // Background scales
      background: '#f5f7ff',          // Main app background
      backgroundLighter: '#ffffff',   // Widget backgrounds
      backgroundLightest: '#f0f3ff',  // Elevated surfaces
      backgroundDarker: '#e8edff',    // Recessed areas
      backgroundDarkest: '#dde5ff',   // Deep contrast

      // Text scales
      text: '#1e1b4b',                // Primary text
      textSecondary: '#312e81',       // Secondary text
      textMuted: '#4c4a89',           // Disabled/muted text

      // Border scales
      border: '#c7d2fe',              // Default borders
      borderStrong: '#a5b4fc',        // Emphasized borders

      // Interactive colors
      primary: '#6366f1',             // Primary actions (indigo)
      primaryHover: '#4f46e5',        // Primary hover
      onPrimary: '#ffffff',     // Text on primary

      secondary: '#e0e7ff',           // Secondary actions (very light)
      secondaryHover: '#c7d2fe',      // Secondary hover
      onSecondary: '#312e81',   // Text on secondary

      accent: '#06b6d4',              // Cyan that pops against indigo
      accentHover: '#0891b2',         // Accent hover
      onAccent: '#ffffff',      // Text on accent

      // Semantic colors
      success: '#10b981',
      successHover: '#059669',        // Success hover/shade
      warning: '#f59e0b',
      warningHover: '#d97706',        // Warning hover/shade
      error: '#ef4444',
      errorHover: '#dc2626',          // Error hover/shade
      info: '#3b82f6',
      infoHover: '#2563eb',           // Info hover/shade

      // Overlays & Shadows
      overlay: 'rgba(30, 27, 75, 0.5)',
      shadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
    }
  },

  sakura: {
    name: 'Cherry Blossom',
    isDark: false,
    colors: {
      // ===== NEW SEMANTIC PROPERTIES =====
      // Background scales
      background: '#fff5f7',          // Main app background
      backgroundLighter: '#ffffff',   // Widget backgrounds
      backgroundLightest: '#fff0f3',  // Elevated surfaces
      backgroundDarker: '#ffe4e9',    // Recessed areas
      backgroundDarkest: '#fecdd6',   // Deep contrast

      // Text scales
      text: '#500724',                // Primary text
      textSecondary: '#881337',       // Secondary text
      textMuted: '#be185d',           // Disabled/muted text

      // Border scales
      border: '#fecdd6',              // Default borders
      borderStrong: '#fbbccc',        // Emphasized borders

      // Interactive colors
      primary: '#ec4899',             // Primary actions (pink)
      primaryHover: '#db2777',        // Primary hover
      onPrimary: '#ffffff',     // Text on primary

      secondary: '#fce7f3',           // Secondary actions (very light)
      secondaryHover: '#fbcfe8',      // Secondary hover
      onSecondary: '#831843',   // Text on secondary

      accent: '#14b8a6',              // Teal that contrasts with pink
      accentHover: '#0d9488',         // Accent hover
      onAccent: '#ffffff',      // Text on accent

      // Semantic colors
      success: '#22c55e',
      successHover: '#16a34a',        // Success hover/shade
      warning: '#f59e0b',
      warningHover: '#d97706',        // Warning hover/shade
      error: '#ef4444',
      errorHover: '#dc2626',          // Error hover/shade
      info: '#3b82f6',
      infoHover: '#2563eb',           // Info hover/shade

      // Overlays & Shadows
      overlay: 'rgba(80, 7, 36, 0.5)',
      shadow: '0 4px 6px -1px rgba(236, 72, 153, 0.3)'
    }
  },

  nebula: {
    name: 'Cosmic Nebula',
    isDark: true,
    colors: {
      // ===== NEW SEMANTIC PROPERTIES =====
      // Background scales (darker to lighter for dark theme)
      background: '#0a0e27',          // Main app background
      backgroundLighter: '#0f1338',   // Widget backgrounds
      backgroundLightest: '#1a1f4e',  // Elevated surfaces
      backgroundDarker: '#060919',    // Recessed areas
      backgroundDarkest: '#03040a',   // Deep contrast

      // Text scales
      text: '#f0f4ff',                // Primary text
      textSecondary: '#d4dfff',       // Secondary text
      textMuted: '#a8b8e8',           // Disabled/muted text

      // Border scales
      border: '#2a3564',              // Default borders
      borderStrong: '#3b478f',        // Emphasized borders

      // Interactive colors
      primary: '#818cf8',             // Primary actions (periwinkle)
      primaryHover: '#a5b4fc',        // Primary hover
      onPrimary: '#1e1b4b',     // Text on primary

      secondary: '#2a3564',           // Secondary actions (muted dark)
      secondaryHover: '#3b478f',      // Secondary hover
      onSecondary: '#f0f4ff',   // Text on secondary

      accent: '#f472b6',              // Hot pink that pops against purple
      accentHover: '#ec4899',         // Accent hover
      onAccent: '#ffffff',      // Text on accent

      // Semantic colors
      success: '#34d399',
      successHover: '#10b981',        // Success hover/shade
      warning: '#fbbf24',
      warningHover: '#f59e0b',        // Warning hover/shade
      error: '#f87171',
      errorHover: '#ef4444',          // Error hover/shade
      info: '#60a5fa',
      infoHover: '#3b82f6',           // Info hover/shade

      // Overlays & Shadows
      overlay: 'rgba(10, 14, 39, 0.85)',
      shadow: '0 4px 6px -1px rgba(129, 140, 248, 0.25)'
    }
  },

  sunset: {
    name: 'Tropical Sunset',
    isDark: false,
    colors: {
      // ===== NEW SEMANTIC PROPERTIES =====
      // Background scales
      background: '#fffbf5',          // Main app background
      backgroundLighter: '#ffffff',   // Widget backgrounds
      backgroundLightest: '#fff7ed',  // Elevated surfaces
      backgroundDarker: '#fed7aa',    // Recessed areas
      backgroundDarkest: '#fdba74',   // Deep contrast

      // Text scales
      text: '#431407',                // Primary text
      textSecondary: '#7c2d12',       // Secondary text
      textMuted: '#c2410c',           // Disabled/muted text

      // Border scales
      border: '#fed7aa',              // Default borders
      borderStrong: '#fb923c',        // Emphasized borders

      // Interactive colors
      primary: '#f97316',             // Primary actions (orange)
      primaryHover: '#ea580c',        // Primary hover
      onPrimary: '#ffffff',     // Text on primary

      secondary: '#ffedd5',           // Secondary actions
      secondaryHover: '#fed7aa',      // Secondary hover
      onSecondary: '#7c2d12',   // Text on secondary

      accent: '#a855f7',              // Purple that pops against orange
      accentHover: '#9333ea',         // Accent hover
      onAccent: '#ffffff',      // Text on accent

      // Semantic colors
      success: '#16a34a',
      successHover: '#15803d',        // Success hover/shade
      warning: '#eab308',
      warningHover: '#ca8a04',        // Warning hover/shade
      error: '#dc2626',
      errorHover: '#b91c1c',          // Error hover/shade
      info: '#2563eb',
      infoHover: '#1d4ed8',           // Info hover/shade

      // Overlays & Shadows
      overlay: 'rgba(67, 20, 7, 0.5)',
      shadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)'
    }
  },

  ocean: {
    name: 'Deep Ocean',
    isDark: true,
    colors: {
      // ===== NEW SEMANTIC PROPERTIES =====
      // Background scales (darker to lighter for dark theme)
      background: '#041e2f',          // Main app background
      backgroundLighter: '#0a2540',   // Widget backgrounds
      backgroundLightest: '#0f3654',  // Elevated surfaces
      backgroundDarker: '#021726',    // Recessed areas
      backgroundDarkest: '#010e1a',   // Deep contrast

      // Text scales
      text: '#e0f2fe',                // Primary text
      textSecondary: '#bae6fd',       // Secondary text
      textMuted: '#7dd3fc',           // Disabled/muted text

      // Border scales
      border: '#164e63',              // Default borders
      borderStrong: '#0e7490',        // Emphasized borders

      // Interactive colors
      primary: '#0ea5e9',             // Primary actions (blue)
      primaryHover: '#38bdf8',        // Primary hover
      onPrimary: '#002a3d',     // Text on primary

      secondary: '#164e63',           // Secondary actions
      secondaryHover: '#0e7490',      // Secondary hover
      onSecondary: '#e0f2fe',   // Text on secondary

      accent: '#fbbf24',              // Amber that pops against blue
      accentHover: '#f59e0b',         // Accent hover
      onAccent: '#422006',      // Text on accent

      // Semantic colors
      success: '#4ade80',
      successHover: '#22c55e',        // Success hover/shade
      warning: '#facc15',
      warningHover: '#eab308',        // Warning hover/shade
      error: '#f87171',
      errorHover: '#ef4444',          // Error hover/shade
      info: '#22d3ee',
      infoHover: '#06b6d4',           // Info hover/shade

      // Overlays & Shadows
      overlay: 'rgba(4, 30, 47, 0.8)',
      shadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)'
    }
  }
};

export const defaultTheme: { type: ThemeType; theme: Theme } = {
  type: 'aurora',
  theme: themes.aurora
};
