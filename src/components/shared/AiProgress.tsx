import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

export interface AiProgressStage {
  at: number
  label: string
}

export interface AiProgressProps {
  /** Stages unlocked as pct crosses each `at` threshold, ordered ascending. */
  stages: AiProgressStage[]
  /** Time constant (seconds) controlling the ease-out ramp. Shorter = faster bar. */
  timeConstant?: number
  /** Footer hint text. */
  hint?: string
}

/**
 * Shared indeterminate-ish AI progress bar. Ramps toward 95% asymptotically
 * so it never reaches 100 without truth \u2014 the call completing is what
 * unmounts it. Pass different `stages` + `timeConstant` per caller.
 */
export function AiProgress({ stages, timeConstant = 22, hint }: AiProgressProps) {
  const [pct, setPct] = useState(4)

  useEffect(() => {
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      const target = 95 * (1 - Math.exp(-elapsed / timeConstant))
      setPct((p) => (target > p ? target : p))
    }, 250)
    return () => window.clearInterval(id)
  }, [timeConstant])

  const stage = [...stages].reverse().find((s) => pct >= s.at) ?? stages[0]

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[13px] text-text-primary">
        <Sparkles size={14} className="text-accent animate-pulse" />
        <span className="font-medium">{stage.label}</span>
        <span className="ml-auto font-cost text-[12px] text-text-tertiary">
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="relative h-2 rounded-full overflow-hidden bg-bg-elevated"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 left-0 right-0 animate-shimmer pointer-events-none" />
      </div>
      {hint && <p className="text-[12px] text-text-tertiary">{hint}</p>}
    </div>
  )
}
