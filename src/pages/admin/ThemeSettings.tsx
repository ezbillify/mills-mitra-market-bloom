
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { applyThemeColors, saveTheme, resetTheme, getDefaultColors } from '@/utils/themeUtils';

const ThemeSettings = () => {
  const { toast } = useToast();
  const [themeColors, setThemeColors] = useState(getDefaultColors());
  const [previewMode, setPreviewMode] = useState(false);
  const [originalColors, setOriginalColors] = useState(getDefaultColors());

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('customer-theme');
    if (savedTheme) {
      try {
        const colors = JSON.parse(savedTheme);
        setThemeColors(colors);
        setOriginalColors(colors);
      } catch (error) {
        console.error('Error loading saved theme:', error);
        const defaults = getDefaultColors();
        setThemeColors(defaults);
        setOriginalColors(defaults);
      }
    }
  }, []);

  const handleColorChange = (colorKey: keyof typeof themeColors, value: string) => {
    const newColors = { ...themeColors, [colorKey]: value };
    setThemeColors(newColors);
    
    // Apply changes immediately for real-time preview
    applyThemeColors(newColors);
  };

  const handleSaveTheme = () => {
    saveTheme(themeColors);
    setOriginalColors(themeColors);
    setPreviewMode(false);
    toast({
      title: "Theme saved successfully!",
      description: "Your theme changes have been applied and saved.",
    });
  };

  const handleResetTheme = () => {
    const defaultColors = resetTheme();
    setThemeColors(defaultColors);
    setOriginalColors(defaultColors);
    setPreviewMode(false);
    toast({
      title: "Theme reset to defaults",
      description: "All theme settings have been restored to their original values.",
    });
  };

  const togglePreview = () => {
    if (previewMode) {
      // Stop preview, revert to saved theme
      applyThemeColors(originalColors);
      setThemeColors(originalColors);
    } else {
      // Start preview mode
      setOriginalColors({ ...themeColors });
    }
    setPreviewMode(!previewMode);
  };

  const cancelPreview = () => {
    applyThemeColors(originalColors);
    setThemeColors(originalColors);
    setPreviewMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Settings</h1>
          <p className="text-muted-foreground">
            Customize the customer-facing theme colors. Changes apply in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={togglePreview}
            className={previewMode ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? "Exit Preview" : "Preview Mode"}
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
                  className="w-16 h-10 p-1 border-2"
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
                  className="w-16 h-10 p-1 border-2"
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
                  className="w-16 h-10 p-1 border-2"
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
                  className="w-16 h-10 p-1 border-2"
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
                  className="w-16 h-10 p-1 border-2"
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
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="p-6 rounded-lg border-2 transition-all duration-300"
                style={{ 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.primary + '40'
                }}
              >
                <h3 
                  className="font-bold text-xl mb-3"
                  style={{ color: themeColors.primary }}
                >
                  MILLS MITRA
                </h3>
                <p className="mb-4" style={{ color: themeColors.foreground }}>
                  This is how your customer interface will look with the current theme settings.
                </p>
                <div className="space-y-3">
                  <div 
                    className="px-4 py-3 rounded-md text-white text-sm font-medium transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    Primary Button Example
                  </div>
                  <div 
                    className="px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 hover:opacity-90"
                    style={{ 
                      backgroundColor: themeColors.secondary,
                      color: themeColors.foreground
                    }}
                  >
                    Secondary Button Example
                  </div>
                  <div 
                    className="px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 hover:opacity-90"
                    style={{ 
                      backgroundColor: themeColors.accent,
                      color: themeColors.foreground
                    }}
                  >
                    Accent Button Example
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveTheme} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Theme
                </Button>
                <Button variant="outline" onClick={handleResetTheme} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>

              {previewMode && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        🎨 Preview Mode Active
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Changes are being applied in real-time. Save to make them permanent.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={cancelPreview}>
                      Cancel
                    </Button>
                  </div>
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
