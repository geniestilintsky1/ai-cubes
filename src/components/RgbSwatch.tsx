import { cn } from '@/lib/utils';
import { rgbToHex, type RGBColor } from '@/lib/api';

interface RgbSwatchProps {
  rgb: RGBColor;
  label?: string;
  showValues?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RgbSwatch({ 
  rgb, 
  label, 
  showValues = true, 
  size = 'md',
  className 
}: RgbSwatchProps) {
  const hex = rgbToHex(rgb);
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && (
        <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
          {label}
        </span>
      )}
      
      <div
        className={cn(
          "rounded-xl shadow-lg border-4 border-card transition-transform hover:scale-105",
          sizeClasses[size]
        )}
        style={{ backgroundColor: hex }}
        aria-label={`Color swatch: ${hex}`}
      />
      
      {showValues && (
        <div className={cn("flex flex-col items-center gap-1", textSizeClasses[size])}>
          <span className="font-mono font-semibold text-foreground">{hex.toUpperCase()}</span>
          <div className="flex gap-2 text-muted-foreground font-mono">
            <span className="text-destructive">R:{rgb.r}</span>
            <span className="text-accent">G:{rgb.g}</span>
            <span className="text-primary">B:{rgb.b}</span>
          </div>
        </div>
      )}
    </div>
  );
}
