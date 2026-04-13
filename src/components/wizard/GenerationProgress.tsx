import { AiProgress } from '@/components/shared/AiProgress'

const STAGES = [
  { at: 0, label: 'Warming up Claude\u2026' },
  { at: 10, label: 'Mapping your route' },
  { at: 25, label: 'Picking hotels for each stop' },
  { at: 45, label: 'Filling in day-by-day activities' },
  { at: 65, label: 'Estimating costs and budget' },
  { at: 80, label: 'Polishing the final plan' },
  { at: 92, label: 'Almost there\u2026' },
]

export function GenerationProgress() {
  return (
    <AiProgress
      stages={STAGES}
      timeConstant={22}
      hint="Takes about 30\u201360 seconds. You can keep this tab open or leave \u2014 the plan saves automatically."
    />
  )
}
