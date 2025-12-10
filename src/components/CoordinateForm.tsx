import { useState } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { RobotCoordinates } from '@/lib/api';

interface CoordinateFormProps {
  initialValues?: RobotCoordinates;
  onSubmit: (coords: RobotCoordinates) => void;
  isLoading?: boolean;
  className?: string;
}

export function CoordinateForm({
  initialValues = { x: 0, y: 0, z: 0 },
  onSubmit,
  isLoading = false,
  className,
}: CoordinateFormProps) {
  const [coords, setCoords] = useState<RobotCoordinates>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof RobotCoordinates, string>>>({});

  const validateValue = (value: number): string | null => {
    if (isNaN(value)) return 'Must be a number';
    if (value < 0) return 'Must be at least 0';
    if (value > 255) return 'Must be at most 255';
    return null;
  };

  const handleChange = (axis: keyof RobotCoordinates, value: string) => {
    const numValue = parseInt(value) || 0;
    setCoords(prev => ({ ...prev, [axis]: numValue }));
    
    const error = validateValue(numValue);
    setErrors(prev => ({ ...prev, [axis]: error || undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<Record<keyof RobotCoordinates, string>> = {};
    let hasErrors = false;

    (['x', 'y', 'z'] as const).forEach(axis => {
      const error = validateValue(coords[axis]);
      if (error) {
        newErrors[axis] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    onSubmit(coords);
  };

  const axisConfig = [
    { key: 'x' as const, label: 'X Coordinate', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'focus-visible:ring-destructive' },
    { key: 'y' as const, label: 'Y Coordinate', color: 'text-accent', bgColor: 'bg-accent/10', borderColor: 'focus-visible:ring-accent' },
    { key: 'z' as const, label: 'Z Coordinate', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'focus-visible:ring-primary' },
  ];

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="grid gap-6 sm:grid-cols-3">
        {axisConfig.map(({ key, label, color, bgColor, borderColor }) => (
          <div key={key} className="space-y-2">
            <Label 
              htmlFor={`coord-${key}`}
              className={cn("text-base font-semibold", color)}
            >
              {label}
            </Label>
            <div className={cn("relative rounded-lg", bgColor)}>
              <Input
                id={`coord-${key}`}
                type="number"
                min={0}
                max={255}
                value={coords[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className={cn(
                  "h-14 text-2xl font-mono font-bold text-center bg-transparent border-2",
                  borderColor,
                  errors[key] && "border-destructive"
                )}
                aria-describedby={errors[key] ? `${key}-error` : undefined}
                aria-invalid={!!errors[key]}
              />
            </div>
            {errors[key] && (
              <p id={`${key}-error`} className="text-sm text-destructive">
                {errors[key]}
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Range: 0 - 255
            </p>
          </div>
        ))}
      </div>

      <Button 
        type="submit" 
        variant="hero" 
        size="lg" 
        className="w-full"
        disabled={isLoading || Object.values(errors).some(Boolean)}
      >
        <Target className="w-5 h-5 mr-2" />
        {isLoading ? 'Submitting...' : 'Submit Coordinates'}
      </Button>
    </form>
  );
}
