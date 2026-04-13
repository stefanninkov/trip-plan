import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface BlockCheckboxProps {
  completed: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  label?: string
  className?: string
}

export function BlockCheckbox({
  completed,
  onToggle,
  size = 'md',
  label = 'Mark as done',
  className,
}: BlockCheckboxProps) {
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const icon = size === 'sm' ? 10 : 13
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        dim,
        'rounded border flex items-center justify-center shrink-0 transition-colors',
        completed
          ? 'bg-success border-success text-bg-primary'
          : 'bg-transparent border-border-default hover:border-border-strong text-transparent hover:text-text-tertiary',
        className
      )}
      style={completed ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined}
    >
      <Check size={icon} strokeWidth={3} />
    </button>
  )
}
