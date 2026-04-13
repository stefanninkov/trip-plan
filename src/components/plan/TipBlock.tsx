import { Lightbulb, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface TipBlockProps {
  kind: 'tip' | 'warning'
  text: string
  className?: string
}

export function TipBlock({ kind, text, className }: TipBlockProps) {
  const Icon = kind === 'tip' ? Lightbulb : AlertTriangle
  const color = kind === 'tip' ? 'var(--color-tip-teal)' : 'var(--color-warn-coral)'
  const bgClass = kind === 'tip' ? 'bg-tip' : 'bg-warn'
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-4 py-3 rounded-r-lg text-[13px] text-text-secondary',
        bgClass,
        className
      )}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
      <p>{text}</p>
    </div>
  )
}
