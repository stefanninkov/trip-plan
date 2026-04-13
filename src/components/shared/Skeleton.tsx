import { cn } from '@/utils/cn'

export interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '14px',
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn('rounded bg-bg-elevated animate-shimmer', className)}
      style={{ width, height }}
    />
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-2',
        className
      )}
      style={{ minHeight: 120 }}
    >
      <Skeleton width="80%" />
      <Skeleton width="65%" />
      <Skeleton width="40%" />
    </div>
  )
}
