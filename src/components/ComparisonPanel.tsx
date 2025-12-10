import { ArrowRight, Trophy, Target } from 'lucide-react';
import { RgbSwatch } from '@/components/RgbSwatch';
import { cn } from '@/lib/utils';
import { calculateRgbDelta, type RGBColor } from '@/lib/api';

interface ComparisonPanelProps {
  studentRgb: RGBColor;
  aiRgb: RGBColor;
  className?: string;
}

export function ComparisonPanel({ studentRgb, aiRgb, className }: ComparisonPanelProps) {
  const delta = calculateRgbDelta(studentRgb, aiRgb);
  const accuracy = Math.max(0, 100 - (delta / 4.42)); // 442 is max possible delta (sqrt(3*255^2))
  
  const isExcellent = delta < 30;
  const isGood = delta < 60;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      {/* Color Swatches */}
      <div className="flex items-center justify-center gap-6 md:gap-12 mb-8">
        <RgbSwatch 
          rgb={studentRgb} 
          label="Your Prediction" 
          size="lg" 
        />
        
        <div className="flex flex-col items-center gap-2">
          <ArrowRight className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">vs</span>
        </div>
        
        <RgbSwatch 
          rgb={aiRgb} 
          label="AI Result" 
          size="lg" 
        />
      </div>

      {/* Delta Score */}
      <div className="text-center space-y-4 mb-6">
        <div className={cn(
          "inline-flex items-center gap-3 px-6 py-3 rounded-full font-bold text-2xl",
          isExcellent ? "bg-accent/10 text-accent" :
          isGood ? "bg-warning/10 text-warning" :
          "bg-destructive/10 text-destructive"
        )}>
          {isExcellent ? (
            <Trophy className="w-7 h-7" />
          ) : (
            <Target className="w-7 h-7" />
          )}
          <span>Δ = {delta.toFixed(1)}</span>
        </div>
        
        <p className="text-muted-foreground">
          Color distance (lower is better)
        </p>
      </div>

      {/* Accuracy Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Accuracy</span>
          <span className={cn(
            "font-bold text-lg",
            isExcellent ? "text-accent" :
            isGood ? "text-warning" :
            "text-destructive"
          )}>
            {accuracy.toFixed(1)}%
          </span>
        </div>
        
        <div className="h-4 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              isExcellent ? "bg-accent" :
              isGood ? "bg-warning" :
              "bg-destructive"
            )}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Feedback Message */}
      <div className={cn(
        "mt-6 p-4 rounded-lg",
        isExcellent ? "bg-accent/10" :
        isGood ? "bg-warning/10" :
        "bg-destructive/10"
      )}>
        <p className={cn(
          "font-medium",
          isExcellent ? "text-accent" :
          isGood ? "text-warning" :
          "text-destructive"
        )}>
          {isExcellent ? "🎉 Excellent prediction!" :
           isGood ? "👍 Good job! Getting close!" :
           "🎯 Keep practicing!"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isExcellent 
            ? "Your color prediction is very close to the AI's calculated value. Great understanding of the coordinate-to-color mapping!"
            : isGood
            ? "You're on the right track! The RGB values are related to the robot's X, Y, Z coordinates. Try to see the pattern."
            : "Remember: X→Red, Y→Green, Z→Blue. The position in 3D space maps directly to color values."}
        </p>
      </div>

      {/* Detailed Breakdown */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        {[
          { label: 'Red Δ', value: Math.abs(studentRgb.r - aiRgb.r), color: 'text-destructive' },
          { label: 'Green Δ', value: Math.abs(studentRgb.g - aiRgb.g), color: 'text-accent' },
          { label: 'Blue Δ', value: Math.abs(studentRgb.b - aiRgb.b), color: 'text-primary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 rounded-lg bg-secondary/50">
            <p className={cn("text-2xl font-mono font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
