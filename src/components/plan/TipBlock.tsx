import { Lightbulb, AlertTriangle, Sparkles, BookOpen, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type TipKind = 'tip' | 'warning' | 'why' | 'history'

export interface TipBlockProps {
  kind: TipKind
  text: string
  className?: string
}

interface KindConfig {
  icon: LucideIcon
  color: string
  bgClass: string
  label: string
}

const KINDS: Record<TipKind, KindConfig> = {
  tip: {
    icon: Lightbulb,
    color: 'var(--color-tip-teal)',
    bgClass: 'bg-tip',
    label: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    color: 'var(--color-warn-coral)',
    bgClass: 'bg-warn',
    label: 'Heads up',
  },
  why: {
    icon: Sparkles,
    color: 'var(--color-accent)',
    bgClass: 'bg-accent-muted',
    label: 'Why this pick',
  },
  history: {
    icon: BookOpen,
    color: 'var(--color-cat-hotel)',
    bgClass: 'bg-cat-hotel-muted',
    label: 'Context',
  },
}

export function TipBlock({ kind, text, className }: TipBlockProps) {
  const { icon: Icon, color, bgClass, label } = KINDS[kind]
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
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.8px]"
          style={{ color }}
        >
          {label}
        </span>
        <p>{text}</p>
      </div>
    </div>
  )
}
