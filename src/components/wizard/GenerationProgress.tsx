import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * Fake-but-helpful progress bar shown while the AI is generating an itinerary.
 * Since the underlying Cloud Function call is non-streaming, we simulate
 * progress that ramps quickly at first and then slows as it approaches 95%
 * so the bar always appears active without lying about completion.
 */
const STAGES: { at: number; label: string }[] = [
  { at: 0, label: 'Warming up Claude\u2026' },
  { at: 10, label: 'Mapping your route' },
  { at: 25, label: 'Picking hotels for each stop' },
  { at: 45, label: 'Filling in day-by-day activities' },
  { at: 65, label: 'Estimating costs and budget' },
  { at: 80, label: 'Polishing the final plan' },
  { at: 92, label: 'Almost there\u2026' },
]

export function GenerationProgress() {
  const [pct, setPct] = useState(4)

  useEffect(() => {
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000 // seconds
      // Ease-out: approach 95% asymptotically over ~60s, so never reaches 100.
      const target = 95 * (1 - Math.exp(-elapsed / 22))
      setPct((p) => (target > p ? target : p))
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  const stage = [...STAGES].reverse().find((s) => pct >= s.at) ?? STAGES[0]

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
        <div
          className="absolute inset-y-0 left-0 right-0 animate-shimmer pointer-events-none"
        />
      </div>
      <p className="text-[12px] text-text-tertiary">
        Takes about 30&ndash;60 seconds. You can keep this tab open or leave &mdash; the plan
        saves automatically.
      </p>
    </div>
  )
}
