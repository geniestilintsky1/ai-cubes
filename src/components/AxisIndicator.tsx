import { cn } from '@/lib/utils';

interface AxisIndicatorProps {
  x: number;
  y: number;
  z: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AxisIndicator({ x, y, z, className, size = 'md' }: AxisIndicatorProps) {
  const sizeClasses = {
    sm: 'text-sm gap-2',
    md: 'text-base gap-3',
    lg: 'text-lg gap-4',
  };

  const badgeClasses = {
    sm: 'px-2 py-1 min-w-[60px]',
    md: 'px-3 py-1.5 min-w-[80px]',
    lg: 'px-4 py-2 min-w-[100px]',
  };

  return (
    <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
      <div className={cn(
        "flex items-center justify-between rounded-lg bg-destructive/10 text-destructive font-mono font-semibold",
        badgeClasses[size]
      )}>
        <span className="opacity-60 mr-2">X</span>
        <span>{Math.round(x)}</span>
      </div>
      
      <div className={cn(
        "flex items-center justify-between rounded-lg bg-accent/10 text-accent font-mono font-semibold",
        badgeClasses[size]
      )}>
        <span className="opacity-60 mr-2">Y</span>
        <span>{Math.round(y)}</span>
      </div>
      
      <div className={cn(
        "flex items-center justify-between rounded-lg bg-primary/10 text-primary font-mono font-semibold",
        badgeClasses[size]
      )}>
        <span className="opacity-60 mr-2">Z</span>
        <span>{Math.round(z)}</span>
      </div>
    </div>
  );
}
