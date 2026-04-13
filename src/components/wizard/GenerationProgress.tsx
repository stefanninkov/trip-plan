import { AiProgress } from '@/components/shared/AiProgress'

const STAGES = [
  { at: 0, label: 'Warming up Claude…' },
  { at: 10, label: 'Mapping your route' },
  { at: 25, label: 'Picking hotels for each stop' },
  { at: 45, label: 'Filling in day-by-day activities' },
  { at: 65, label: 'Estimating costs and budget' },
  { at: 80, label: 'Polishing the final plan' },
  { at: 92, label: 'Almost there…' },
]

export function GenerationProgress() {
  return (
    <AiProgress
      stages={STAGES}
      timeConstant={22}
      hint="Takes about 30–60 seconds. You can keep this tab open or leave — the plan saves automatically."
    />
  )
}
