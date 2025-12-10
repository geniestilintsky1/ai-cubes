import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RgbSwatch } from '@/components/RgbSwatch';
import { cn } from '@/lib/utils';
import { rgbToHex, hexToRgb, type RGBColor } from '@/lib/api';

interface RgbPredictFormProps {
  initialValues?: RGBColor;
  onSubmit: (rgb: RGBColor) => void;
  isLoading?: boolean;
  className?: string;
}

export function RgbPredictForm({
  initialValues = { r: 128, g: 128, b: 128 },
  onSubmit,
  isLoading = false,
  className,
}: RgbPredictFormProps) {
  const [rgb, setRgb] = useState<RGBColor>(initialValues);
  const [hexValue, setHexValue] = useState(rgbToHex(initialValues));

  useEffect(() => {
    setHexValue(rgbToHex(rgb));
  }, [rgb]);

  const handleRgbChange = (channel: keyof RGBColor, value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    setRgb(prev => ({ ...prev, [channel]: numValue }));
  };

  const handleHexChange = (value: string) => {
    setHexValue(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setRgb(hexToRgb(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rgb);
  };

  const channelConfig = [
    { key: 'r' as const, label: 'Red', color: 'text-destructive', bgColor: 'bg-destructive/10', sliderBg: 'from-transparent to-red-500' },
    { key: 'g' as const, label: 'Green', color: 'text-accent', bgColor: 'bg-accent/10', sliderBg: 'from-transparent to-emerald-500' },
    { key: 'b' as const, label: 'Blue', color: 'text-primary', bgColor: 'bg-primary/10', sliderBg: 'from-transparent to-blue-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-8", className)}>
      {/* Color Preview */}
      <div className="flex justify-center">
        <RgbSwatch rgb={rgb} label="Your Prediction" size="lg" />
      </div>

      {/* Hex Input */}
      <div className="space-y-2 max-w-xs mx-auto">
        <Label htmlFor="hex-input" className="text-sm font-medium">
          Hex Color Code
        </Label>
        <Input
          id="hex-input"
          type="text"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#RRGGBB"
          className="font-mono text-center text-lg h-12"
          maxLength={7}
        />
      </div>

      {/* RGB Sliders */}
      <div className="space-y-6">
        {channelConfig.map(({ key, label, color, bgColor, sliderBg }) => (
          <div key={key} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className={cn("text-base font-semibold", color)}>
                {label}
              </Label>
              <div className={cn("px-3 py-1 rounded-lg font-mono font-bold text-lg", bgColor, color)}>
                {rgb[key]}
              </div>
            </div>
            
            <div className="relative">
              <div 
                className={cn("absolute inset-0 rounded-full bg-gradient-to-r h-3 top-1/2 -translate-y-1/2", sliderBg)}
                style={{ opacity: 0.3 }}
              />
              <input
                type="range"
                min={0}
                max={255}
                value={rgb[key]}
                onChange={(e) => handleRgbChange(key, e.target.value)}
                className="w-full h-3 bg-secondary rounded-full appearance-none cursor-pointer relative z-10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-card
                  [&::-webkit-slider-thumb]:border-4
                  [&::-webkit-slider-thumb]:border-current
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing"
                style={{ color: key === 'r' ? 'hsl(var(--destructive))' : key === 'g' ? 'hsl(var(--accent))' : 'hsl(var(--primary))' }}
                aria-label={`${label} value`}
              />
            </div>
          </div>
        ))}
      </div>

      <Button 
        type="submit" 
        variant="hero" 
        size="lg" 
        className="w-full"
        disabled={isLoading}
      >
        <Palette className="w-5 h-5 mr-2" />
        {isLoading ? 'Submitting...' : 'Submit RGB Prediction'}
      </Button>
    </form>
  );
}
