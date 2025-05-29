// src/utils/themeUtils.ts
import { SmartphoneDynamicColorPalette } from '../../types';

export const defaultPalette: SmartphoneDynamicColorPalette = {
  primary: '#7C3AED',        // Vibrant Purple
  accent: '#DB2777',         // Pink/Magenta
  background: '#111827',     // Very Dark Blue/Gray (almost black)
  surface: '#1F2937',        // Dark Blue/Gray
  surfaceVariant: '#374151', // Medium Dark Blue/Gray
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',
  textOnBackground: '#E5E7EB', // Light Gray for primary text
  textOnSurface: '#D1D5DB',    // Slightly darker gray for text on cards
  textNeutralSubtle: '#9CA3AF',// Gray for less important text
  textNeutralMedium: '#6B7280', // Darker gray for secondary text
  statusBar: 'rgba(0,0,0,0.3)',
  navBar: 'rgba(0,0,0,0.4)',
  iconDefault: '#9CA3AF',
  iconActive: '#A78BFA', // Lighter purple for active icons
};

export const paletteBlue: SmartphoneDynamicColorPalette = {
  primary: '#2563EB',        // Medium Blue
  accent: '#10B981',         // Emerald Green
  background: '#0F172A',     // Dark Slate Blue
  surface: '#1E293B',        // Medium Slate Blue
  surfaceVariant: '#334155', // Lighter Slate Blue
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',
  textOnBackground: '#E2E8F0',
  textOnSurface: '#CBD5E1',
  textNeutralSubtle: '#94A3B8',
  textNeutralMedium: '#64748B',
  statusBar: 'rgba(17, 24, 39, 0.3)', // Darker blueish
  navBar: 'rgba(17, 24, 39, 0.4)',
  iconDefault: '#94A3B8',
  iconActive: '#60A5FA', // Light Blue
};

export const paletteGreen: SmartphoneDynamicColorPalette = {
  primary: '#059669',        // Emerald Green
  accent: '#F59E0B',         // Amber/Orange
  background: '#064E3B',     // Dark Green
  surface: '#047857',        // Medium Green
  surfaceVariant: '#065F46', // Darker Medium Green
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1F2937',   // Dark text on light accent
  textOnBackground: '#D1FAE5',
  textOnSurface: '#A7F3D0',
  textNeutralSubtle: '#6EE7B7',
  textNeutralMedium: '#34D399',
  statusBar: 'rgba(4, 78, 55, 0.3)', // Darker greenish
  navBar: 'rgba(4, 78, 55, 0.4)',
  iconDefault: '#A7F3D0',
  iconActive: '#FCD34D', // Light Amber
};


export function extractPaletteFromWallpaper(wallpaperUrl: string): SmartphoneDynamicColorPalette {
  if (!wallpaperUrl) return defaultPalette;

  if (wallpaperUrl.includes('wallpaper_blue')) {
    return paletteBlue;
  }
  if (wallpaperUrl.includes('wallpaper_green')) {
    return paletteGreen;
  }
  // Add more conditions for other wallpapers
  return defaultPalette;
}
