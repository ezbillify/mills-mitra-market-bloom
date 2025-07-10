
export const initializeTheme = () => {
  // Ensure DOM is ready
  if (typeof document === 'undefined') return;
  
  const savedTheme = localStorage.getItem('customer-theme');
  if (savedTheme) {
    try {
      const colors = JSON.parse(savedTheme);
      applyThemeColors(colors);
    } catch (error) {
      console.error('Error loading saved theme:', error);
      // Apply default theme if saved theme is corrupted
      const defaultColors = getDefaultColors();
      applyThemeColors(defaultColors);
    }
  } else {
    // Apply default theme if no saved theme
    const defaultColors = getDefaultColors();
    applyThemeColors(defaultColors);
  }
  
  // Force style recalculation for mobile devices
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      document.documentElement.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        document.documentElement.style.transform = '';
      });
    }, 100);
  }
};

export const applyThemeColors = (colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}) => {
  const root = document.documentElement;
  
  // Convert hex to HSL for CSS custom properties
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Apply theme colors as CSS custom properties in HSL format
  root.style.setProperty('--primary', hexToHsl(colors.primary));
  root.style.setProperty('--secondary', hexToHsl(colors.secondary));
  root.style.setProperty('--accent', hexToHsl(colors.accent));
  root.style.setProperty('--background', hexToHsl(colors.background));
  root.style.setProperty('--foreground', hexToHsl(colors.foreground));

  // For custom colors - set as HSL for tailwind config compatibility
  root.style.setProperty('--warm-brown', hexToHsl(colors.primary));
  root.style.setProperty('--warm-beige', hexToHsl(colors.secondary));
  root.style.setProperty('--millet-gold', hexToHsl(colors.accent));

  // Keep hex versions for direct usage in components
  root.style.setProperty('--color-warm-brown', colors.primary);
  root.style.setProperty('--color-warm-beige', colors.secondary);
  root.style.setProperty('--color-millet-gold', colors.accent);

  // Force style recalculation to ensure changes are applied immediately
  document.documentElement.offsetHeight;
  
  // Dispatch a custom event to notify other components of theme changes
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: colors }));
  
  // Additional mobile-specific fixes
  if (window.innerWidth <= 768) {
    requestAnimationFrame(() => {
      // Trigger a repaint to ensure mobile browsers apply the styles
      document.body.style.transform = 'translateZ(0)';
      setTimeout(() => {
        document.body.style.transform = '';
      }, 1);
    });
  }
};

export const saveTheme = (colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}) => {
  localStorage.setItem('customer-theme', JSON.stringify(colors));
  applyThemeColors(colors);
};

export const getDefaultColors = () => {
  return {
    primary: '#8B4513',
    secondary: '#D2B48C',
    accent: '#DAA520',
    background: '#FAFAFA',
    foreground: '#1A1A1A',
  };
};

export const resetTheme = () => {
  localStorage.removeItem('customer-theme');
  const defaultColors = getDefaultColors();
  applyThemeColors(defaultColors);
  return defaultColors;
};

// Listen for storage changes from other tabs/windows
export const setupThemeListener = () => {
  window.addEventListener('storage', (e) => {
    if (e.key === 'customer-theme' && e.newValue) {
      try {
        const colors = JSON.parse(e.newValue);
        applyThemeColors(colors);
      } catch (error) {
        console.error('Error applying theme from storage event:', error);
      }
    }
  });
};
