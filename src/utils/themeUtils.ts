
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('customer-theme');
  if (savedTheme) {
    try {
      const colors = JSON.parse(savedTheme);
      applyThemeColors(colors);
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
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

  // Apply theme colors as CSS custom properties
  root.style.setProperty('--primary', hexToHsl(colors.primary));
  root.style.setProperty('--secondary', hexToHsl(colors.secondary));
  root.style.setProperty('--background', hexToHsl(colors.background));
  root.style.setProperty('--foreground', hexToHsl(colors.foreground));

  // For warm-brown and other custom colors
  root.style.setProperty('--warm-brown', colors.primary);
  root.style.setProperty('--warm-beige', colors.secondary);
  root.style.setProperty('--millet-gold', colors.accent);
};
