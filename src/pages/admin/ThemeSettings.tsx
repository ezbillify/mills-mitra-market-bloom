
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ThemeSettings = () => {
  const { toast } = useToast();
  const [themeColors, setThemeColors] = useState({
    primary: '#8B4513', // warm-brown
    secondary: '#D2B48C', // warm-beige
    accent: '#DAA520', // millet-gold
    background: '#FAFAFA',
    foreground: '#1A1A1A',
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('customer-theme');
    if (savedTheme) {
      setThemeColors(JSON.parse(savedTheme));
    }
  }, []);

  const applyTheme = (colors: typeof themeColors, preview = false) => {
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

    if (!preview) {
      localStorage.setItem('customer-theme', JSON.stringify(colors));
    }
  };

  const handleColorChange = (colorKey: keyof typeof themeColors, value: string) => {
    const newColors = { ...themeColors, [colorKey]: value };
    setThemeColors(newColors);
    
    if (previewMode) {
      applyTheme(newColors, true);
    }
  };

  const saveTheme = () => {
    applyTheme(themeColors);
    toast({
      title: "Theme saved",
      description: "Customer theme has been updated successfully",
    });
  };

  const resetTheme = () => {
    const defaultColors = {
      primary: '#8B4513',
      secondary: '#D2B48C', 
      accent: '#DAA520',
      background: '#FAFAFA',
      foreground: '#1A1A1A',
    };
    setThemeColors(defaultColors);
    applyTheme(defaultColors);
    localStorage.removeItem('customer-theme');
    toast({
      title: "Theme reset",
      description: "Theme has been reset to default values",
    });
  };

  const togglePreview = () => {
    if (previewMode) {
      // Stop preview, revert to saved theme
      const savedTheme = localStorage.getItem('customer-theme');
      if (savedTheme) {
        applyTheme(JSON.parse(savedTheme));
      } else {
        resetTheme();
      }
    } else {
      // Start preview
      applyTheme(themeColors, true);
    }
    setPreviewMode(!previewMode);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Settings</h1>
          <p className="text-muted-foreground">
            Customize the customer-facing theme colors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={togglePreview}
            className={previewMode ? "bg-blue-50 border-blue-200" : ""}
          >
            <Palette className="h-4 w-4 mr-2" />
            {previewMode ? "Stop Preview" : "Live Preview"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary">Primary Color (Warm Brown)</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={themeColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={themeColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1"
                  placeholder="#8B4513"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary">Secondary Color (Warm Beige)</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={themeColors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={themeColors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1"
                  placeholder="#D2B48C"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent">Accent Color (Millet Gold)</Label>
              <div className="flex gap-2">
                <Input
                  id="accent"
                  type="color"
                  value={themeColors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={themeColors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="flex-1"
                  placeholder="#DAA520"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background"
                  type="color"
                  value={themeColors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={themeColors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="flex-1"
                  placeholder="#FAFAFA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foreground">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="foreground"
                  type="color"
                  value={themeColors.foreground}
                  onChange={(e) => handleColorChange('foreground', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={themeColors.foreground}
                  onChange={(e) => handleColorChange('foreground', e.target.value)}
                  className="flex-1"
                  placeholder="#1A1A1A"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.primary + '20'
                }}
              >
                <h3 
                  className="font-semibold mb-2"
                  style={{ color: themeColors.primary }}
                >
                  MILLS MITRA
                </h3>
                <p style={{ color: themeColors.foreground }}>
                  Sample customer interface text
                </p>
                <div className="mt-3 space-y-2">
                  <div 
                    className="px-3 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="px-3 py-2 rounded text-sm"
                    style={{ 
                      backgroundColor: themeColors.secondary,
                      color: themeColors.foreground
                    }}
                  >
                    Secondary Button
                  </div>
                  <div 
                    className="px-3 py-2 rounded text-sm"
                    style={{ 
                      backgroundColor: themeColors.accent,
                      color: themeColors.foreground
                    }}
                  >
                    Accent Button
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveTheme} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Theme
                </Button>
                <Button variant="outline" onClick={resetTheme}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {previewMode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔍 <strong>Preview Mode Active:</strong> Changes are temporarily applied. Click "Save Theme" to make them permanent.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeSettings;
