import { Check, AlertCircle, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CVResult } from '@/lib/api';

interface CvResultsPanelProps {
  result: CVResult;
  imageUrl: string;
  className?: string;
}

export function CvResultsPanel({ result, imageUrl, className }: CvResultsPanelProps) {
  const isGoodAccuracy = result.accuracy >= 80;
  const isGoodConfidence = result.confidence >= 75;

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Image with overlay */}
      <div className="relative">
        <img
          src={imageUrl}
          alt="Analyzed drawing"
          className="w-full h-48 object-contain bg-muted/50"
        />
        
        {/* Bounding box overlay (simplified visualization) */}
        <div className="absolute inset-0 pointer-events-none">
          {result.boundingBoxes.map((box, i) => (
            <div
              key={i}
              className="absolute border-2 border-primary rounded"
              style={{
                left: `${(box.x / 400) * 100}%`,
                top: `${(box.y / 300) * 100}%`,
                width: `${(box.width / 400) * 100}%`,
                height: `${(box.height / 300) * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Status badge */}
        <div className={cn(
          "absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          isGoodAccuracy 
            ? "bg-accent/90 text-accent-foreground" 
            : "bg-warning/90 text-warning-foreground"
        )}>
          <Eye className="w-4 h-4" />
          CV Analysis Complete
        </div>
      </div>

      {/* Results */}
      <div className="p-6 space-y-6">
        {/* Accuracy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Accuracy Score</span>
            <span className={cn(
              "text-lg font-bold font-mono",
              isGoodAccuracy ? "text-accent" : "text-warning"
            )}>
              {result.accuracy.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={result.accuracy} 
            className="h-2"
          />
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Detection Confidence</span>
            <span className={cn(
              "text-lg font-bold font-mono",
              isGoodConfidence ? "text-accent" : "text-warning"
            )}>
              {result.confidence.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={result.confidence} 
            className="h-2"
          />
        </div>

        {/* Detected Objects */}
        <div>
          <span className="text-sm font-medium text-foreground block mb-3">Detected Objects</span>
          <div className="flex flex-wrap gap-2">
            {result.detectedObjects.map((obj, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
              >
                <Check className="w-3.5 h-3.5 text-accent" />
                {obj}
              </span>
            ))}
          </div>
        </div>

        {/* Status message */}
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-lg",
          isGoodAccuracy ? "bg-accent/10" : "bg-warning/10"
        )}>
          {isGoodAccuracy ? (
            <Check className="w-5 h-5 text-accent mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          )}
          <div>
            <p className={cn(
              "font-medium",
              isGoodAccuracy ? "text-accent" : "text-warning"
            )}>
              {isGoodAccuracy ? "Great drawing!" : "Drawing needs improvement"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isGoodAccuracy 
                ? "Your drawing accurately represents the 3D scene. You can proceed to the next step."
                : "Try to include all elements of the 3D scene clearly. You can continue or try again."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
