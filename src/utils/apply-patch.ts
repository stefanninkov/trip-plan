import type { TripPlan, DayPlan, TimeBlock, CostItem } from '@/types/trip-plan'
import { recalcTotals } from './skeleton-plan'

export type PatchOp =
  | { op: 'replace_day'; dayId: string; day: DayPlan }
  | {
      op: 'update_day_meta'
      dayId: string
      patch: Partial<Pick<DayPlan, 'title' | 'location' | 'date'>>
    }
  | { op: 'replace_block'; dayId: string; blockId: string; block: TimeBlock }
  | { op: 'delete_block'; dayId: string; blockId: string }
  | { op: 'add_block'; dayId: string; block: TimeBlock }
  | {
      op: 'move_block'
      fromDayId: string
      toDayId: string
      blockId: string
      newTime?: string
    }
  | { op: 'add_cost'; dayId: string; cost: CostItem }
  | { op: 'delete_cost'; dayId: string; costId: string }

/**
 * Apply a list of patch ops to a plan, returning a NEW plan. Silent on
 * malformed ops (logs and continues) so one bad op doesn't poison the rest.
 */
export function applyPatches(plan: TripPlan, ops: PatchOp[]): TripPlan {
  let next = { ...plan, days: plan.days.map((d) => ({ ...d })) }

  for (const op of ops) {
    next = applyOne(next, op)
  }
  return recalcTotals(next)
}

function applyOne(plan: TripPlan, op: PatchOp): TripPlan {
  const days = plan.days.slice()
  const idx = (id: string) => days.findIndex((d) => d.id === id)

  switch (op.op) {
    case 'replace_day': {
      const i = idx(op.dayId)
      if (i >= 0) days[i] = op.day
      return { ...plan, days }
    }
    case 'update_day_meta': {
      const i = idx(op.dayId)
      if (i >= 0) days[i] = { ...days[i], ...op.patch }
      return { ...plan, days }
    }
    case 'replace_block': {
      const i = idx(op.dayId)
      if (i < 0) return plan
      const day = days[i]
      const blocks = day.blocks.map((b) => (b.id === op.blockId ? op.block : b))
      days[i] = { ...day, blocks }
      return { ...plan, days }
    }
    case 'delete_block': {
      const i = idx(op.dayId)
      if (i < 0) return plan
      const day = days[i]
      days[i] = { ...day, blocks: day.blocks.filter((b) => b.id !== op.blockId) }
      return { ...plan, days }
    }
    case 'add_block': {
      const i = idx(op.dayId)
      if (i < 0) return plan
      const day = days[i]
      days[i] = { ...day, blocks: [...day.blocks, op.block] }
      return { ...plan, days }
    }
    case 'move_block': {
      const fromI = idx(op.fromDayId)
      const toI = idx(op.toDayId)
      if (fromI < 0 || toI < 0) return plan
      const block = days[fromI].blocks.find((b) => b.id === op.blockId)
      if (!block) return plan
      const moved = op.newTime ? { ...block, time: op.newTime } : block
      days[fromI] = {
        ...days[fromI],
        blocks: days[fromI].blocks.filter((b) => b.id !== op.blockId),
      }
      days[toI] = { ...days[toI], blocks: [...days[toI].blocks, moved] }
      return { ...plan, days }
    }
    case 'add_cost': {
      const i = idx(op.dayId)
      if (i < 0) return plan
      const day = days[i]
      days[i] = { ...day, costs: [...day.costs, op.cost] }
      return { ...plan, days }
    }
    case 'delete_cost': {
      const i = idx(op.dayId)
      if (i < 0) return plan
      const day = days[i]
      days[i] = { ...day, costs: day.costs.filter((c) => c.id !== op.costId) }
      return { ...plan, days }
    }
    default:
      return plan
  }
}

/**
 * Produce a short human-readable summary of what a set of ops touches, so
 * the chat UI can show "Day 3 · 2 edits" style affordances.
 */
export function summarizePatches(ops: PatchOp[]): string {
  if (ops.length === 0) return ''
  const counts: Record<string, number> = {}
  for (const op of ops) counts[op.op] = (counts[op.op] ?? 0) + 1
  const pretty: Record<string, string> = {
    replace_day: 'day rewritten',
    update_day_meta: 'day info',
    replace_block: 'block edited',
    delete_block: 'block removed',
    add_block: 'block added',
    move_block: 'block moved',
    add_cost: 'cost added',
    delete_cost: 'cost removed',
  }
  return Object.entries(counts)
    .map(([k, n]) => `${n} ${pretty[k] ?? k}`)
    .join(' · ')
}
