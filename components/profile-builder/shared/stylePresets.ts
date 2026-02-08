import { ProfileBlock, ProfileBlockStylePreset } from '../../../types';

/**
 * Determine if a color is "light" or "dark" based on luminance
 */
export const isLightColor = (hex: string): boolean => {
  // Handle gradient format
  if (hex.startsWith('gradient:')) {
    const [, from] = hex.split(':');
    hex = from;
  }
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

/**
 * Get inline styles for custom colors
 */
export const getCustomColorStyles = (block: ProfileBlock): React.CSSProperties => {
  if (block.stylePreset !== 'custom' || !block.customBgColor) {
    return {};
  }
  
  const isGradient = block.customBgColor.startsWith('gradient:');
  
  if (isGradient) {
    const [, from, to] = block.customBgColor.split(':');
    return {
      background: `linear-gradient(135deg, ${from}, ${to})`,
    };
  }
  
  return {
    backgroundColor: block.customBgColor,
  };
};

/**
 * Determine if text should be light or dark based on block settings
 */
export const shouldUseLightText = (block: ProfileBlock): boolean => {
  if (block.stylePreset !== 'custom' || !block.customBgColor) {
    return false;
  }
  
  // If user specified a preference, use it
  if (block.customTextColor === 'light') return true;
  if (block.customTextColor === 'dark') return false;
  
  // Auto-detect based on background color
  return !isLightColor(block.customBgColor);
};

/**
 * Get text color classes for custom colored blocks
 */
export const getCustomTextClasses = (block: ProfileBlock): {
  text: string;
  heading: string;
  subtext: string;
} => {
  const useLightText = shouldUseLightText(block);
  
  if (useLightText) {
    return {
      text: 'text-white/90',
      heading: 'text-white',
      subtext: 'text-white/70',
    };
  }
  
  return {
    text: 'text-deep-700',
    heading: 'text-deep-900',
    subtext: 'text-surface-500',
  };
};

/**
 * Get CSS classes for a given style preset
 * These classes define the background, border, and text colors for blocks
 */
export const getStylePresetClasses = (preset: ProfileBlockStylePreset = 'clean'): {
  container: string;
  text: string;
  heading: string;
  subtext: string;
  border: string;
  isDark: boolean;
} => {
  switch (preset) {
    case 'clean':
      return {
        container: 'bg-white dark:bg-deep-900',
        text: 'text-deep-700 dark:text-surface-200',
        heading: 'text-deep-900 dark:text-surface-50',
        subtext: 'text-surface-500 dark:text-surface-400',
        border: 'border-surface-200 dark:border-deep-700',
        isDark: false,
      };
    case 'cream':
      return {
        container: 'bg-surface-50 dark:bg-deep-800',
        text: 'text-deep-700 dark:text-surface-200',
        heading: 'text-deep-900 dark:text-surface-50',
        subtext: 'text-surface-500 dark:text-surface-400',
        border: 'border-surface-200 dark:border-deep-700',
        isDark: false,
      };
    case 'glass':
      return {
        container: 'bg-white/50 dark:bg-deep-900/50 backdrop-blur-lg',
        text: 'text-deep-700 dark:text-surface-200',
        heading: 'text-deep-900 dark:text-surface-50',
        subtext: 'text-surface-500 dark:text-surface-400',
        border: 'border-white/30 dark:border-deep-600/30',
        isDark: false,
      };
    case 'primary':
      return {
        container: 'bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800',
        text: 'text-white/90',
        heading: 'text-white',
        subtext: 'text-white/70',
        border: 'border-primary-500/30',
        isDark: true,
      };
    case 'dark':
      return {
        container: 'bg-deep-900 dark:bg-deep-950',
        text: 'text-surface-200',
        heading: 'text-white',
        subtext: 'text-surface-400',
        border: 'border-deep-700 dark:border-deep-600',
        isDark: true,
      };
    case 'custom':
      // Custom colors are handled via inline styles
      // Return neutral classes that won't conflict
      return {
        container: '',
        text: '',
        heading: '',
        subtext: '',
        border: 'border-transparent',
        isDark: false,
      };
    default:
      return {
        container: 'bg-white dark:bg-deep-900',
        text: 'text-deep-700 dark:text-surface-200',
        heading: 'text-deep-900 dark:text-surface-50',
        subtext: 'text-surface-500 dark:text-surface-400',
        border: 'border-surface-200 dark:border-deep-700',
        isDark: false,
      };
  }
};

/**
 * Blocks that should use their own inherent styling rather than style presets
 * These blocks have specific visual designs that shouldn't be overridden
 */
export const blocksWithInherentStyling = [
  'STATS',
  'MAP',
  'VIDEO',
];

/**
 * Check if a block type should use its inherent styling
 */
export const hasInherentStyling = (blockType: string): boolean => {
  return blocksWithInherentStyling.includes(blockType);
};
