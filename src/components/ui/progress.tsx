import { cn, formatPercent } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
};

export function Progress({
  value,
  className,
  indicatorClassName,
  label,
}: ProgressProps) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-medium text-foreground">{formatPercent(boundedValue)}</span>
        </div>
      ) : null}
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedValue}
        className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
        role="progressbar"
      >
        <div
          className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
}
