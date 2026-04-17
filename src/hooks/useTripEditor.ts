import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { recalcTotals } from '@/utils/skeleton-plan'
import { sanitizeForFirestore } from '@/utils/sanitize'
import { logger } from '@/utils/logger'
import type {
  TripPlan,
  DayPlan,
  TimeBlock,
  CostItem,
  HotelOption,
  CostCategory,
  BudgetTier,
} from '@/types/trip-plan'

/**
 * Stateful editor for a trip plan. Mutations update local state immediately
 * and persist to Firestore via a short debounce.
 */
export function useTripEditor(tripId: string | undefined, initial: TripPlan) {
  const [plan, setPlan] = useState<TripPlan>(initial)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestPlan = useRef(plan)
  const [isSaving, setIsSaving] = useState(false)
  // Bounded undo / redo history for destructive edits.
  const undoStack = useRef<TripPlan[]>([])
  const redoStack = useRef<TripPlan[]>([])
  const MAX_HISTORY = 50

  // Keep latestPlan fresh so the debounced save always writes the newest value
  useEffect(() => {
    latestPlan.current = plan
  }, [plan])

  // Sync when the upstream doc changes externally (e.g. AI finishes generating)
  useEffect(() => {
    setPlan(initial)
    latestPlan.current = initial
  }, [initial])

  const persist = useCallback(
    (next: TripPlan) => {
      if (!tripId) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setIsSaving(true)
      saveTimer.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'trips', tripId), {
            plan: sanitizeForFirestore(latestPlan.current),
            updatedAt: serverTimestamp(),
          })
        } catch (err) {
          logger.error('Trip save failed:', err)
        } finally {
          setIsSaving(false)
        }
      }, 500)
      return next
    },
    [tripId]
  )

  const apply = useCallback(
    (updater: (p: TripPlan) => TripPlan) => {
      setPlan((prev) => {
        // Push the pre-edit snapshot onto the undo stack (cap at MAX_HISTORY).
        undoStack.current.push(prev)
        if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift()
        // Any new edit invalidates the redo stack.
        redoStack.current = []
        const next = recalcTotals(updater(prev))
        persist(next)
        return next
      })
    },
    [persist]
  )

  const undo = useCallback(() => {
    setPlan((prev) => {
      const last = undoStack.current.pop()
      if (!last) return prev
      redoStack.current.push(prev)
      persist(last)
      return last
    })
  }, [persist])

  const redo = useCallback(() => {
    setPlan((prev) => {
      const last = redoStack.current.pop()
      if (!last) return prev
      undoStack.current.push(prev)
      persist(last)
      return last
    })
  }, [persist])

  const canUndo = () => undoStack.current.length > 0
  const canRedo = () => redoStack.current.length > 0

  // === Top-level patches ===
  const setTripTitle = (value: string) => apply((p) => ({ ...p, tripTitle: value }))
  const setSummary = (value: string) => apply((p) => ({ ...p, summary: value }))
  const setWeatherNote = (value: string) => apply((p) => ({ ...p, weatherNote: value }))
  const setListField = (
    field: 'bookAhead' | 'packingTips' | 'documentsNeeded' | 'appsToDownload',
    values: string[]
  ) => apply((p) => ({ ...p, [field]: values }))

  // === Day-level ===
  const updateDay = (dayId: string, patch: Partial<DayPlan>) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
    }))

  // Replace a whole day with a regenerated one (keeps ID stable)
  const replaceDay = (dayId: string, next: DayPlan) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) => (d.id === dayId ? { ...next, id: d.id } : d)),
    }))

  // Replace the entire plan (used by the chat-patch applicator).
  const replacePlan = (next: TripPlan) => apply(() => next)

  // Add a blank day after the given index (or at the end if -1)
  const addDay = (afterIndex = -1) =>
    apply((p) => {
      const lastDate = p.days[p.days.length - 1]?.date ?? new Date().toISOString().slice(0, 10)
      const nextDate = new Date(new Date(lastDate).getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
      const location =
        afterIndex >= 0
          ? p.days[afterIndex]?.location ?? ''
          : p.days[p.days.length - 1]?.location ?? ''
      const newDay: DayPlan = {
        id: `day-${crypto.randomUUID()}`,
        dayNumber: p.days.length + 1,
        date: nextDate,
        title: 'Free day',
        location,
        blocks: [],
        costs: [],
        dailyTotal: { min: 0, max: 0 },
        hotels: [],
      }
      const days = [...p.days]
      const insertAt = afterIndex < 0 ? days.length : afterIndex + 1
      days.splice(insertAt, 0, newDay)
      const renumbered = days.map((d, i) => ({ ...d, dayNumber: i + 1 }))
      return { ...p, days: renumbered }
    })

  const reorderDays = (fromIndex: number, toIndex: number) =>
    apply((p) => {
      if (fromIndex === toIndex) return p
      const days = [...p.days]
      const [moved] = days.splice(fromIndex, 1)
      days.splice(toIndex, 0, moved)
      const renumbered = days.map((d, i) => ({ ...d, dayNumber: i + 1 }))
      return { ...p, days: renumbered }
    })

  const deleteDay = (dayId: string) =>
    apply((p) => {
      const remaining = p.days.filter((d) => d.id !== dayId)
      const renumbered = remaining.map((d, i) => ({ ...d, dayNumber: i + 1 }))
      return { ...p, days: renumbered }
    })

  // Shift every day's date by N days (can be negative).
  const shiftTripDates = (deltaDays: number) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) => {
        const date = new Date(d.date)
        date.setDate(date.getDate() + deltaDays)
        return { ...d, date: date.toISOString().slice(0, 10) }
      }),
    }))

  // === Blocks ===
  const addBlock = (dayId: string, block: Omit<TimeBlock, 'id'>) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, blocks: [...d.blocks, { ...block, id: `block-${crypto.randomUUID()}` }] }
          : d
      ),
    }))

  const updateBlock = (dayId: string, blockId: string, patch: Partial<TimeBlock>) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
            }
          : d
      ),
    }))

  const toggleBlockCompleted = (dayId: string, blockId: string) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              blocks: d.blocks.map((b) =>
                b.id === blockId ? { ...b, completed: !b.completed } : b
              ),
            }
          : d
      ),
    }))

  const setAllBlocksCompleted = (dayId: string, completed: boolean) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, blocks: d.blocks.map((b) => ({ ...b, completed })) }
          : d
      ),
    }))

  const deleteBlock = (dayId: string, blockId: string) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId ? { ...d, blocks: d.blocks.filter((b) => b.id !== blockId) } : d
      ),
    }))

  // Move a block from one day to another (appends to target day)
  const moveBlock = (blockId: string, fromDayId: string, toDayId: string) =>
    apply((p) => {
      const source = p.days.find((d) => d.id === fromDayId)
      const block = source?.blocks.find((b) => b.id === blockId)
      if (!block) return p
      return {
        ...p,
        days: p.days.map((d) => {
          if (d.id === fromDayId) {
            return { ...d, blocks: d.blocks.filter((b) => b.id !== blockId) }
          }
          if (d.id === toDayId) {
            return { ...d, blocks: [...d.blocks, block] }
          }
          return d
        }),
      }
    })

  // === Costs ===
  const addCost = (dayId: string, cost: Omit<CostItem, 'id'>) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, costs: [...d.costs, { ...cost, id: `cost-${crypto.randomUUID()}` }] }
          : d
      ),
    }))

  const updateCost = (dayId: string, costId: string, patch: Partial<CostItem>) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              costs: d.costs.map((c) => (c.id === costId ? { ...c, ...patch } : c)),
            }
          : d
      ),
    }))

  const deleteCost = (dayId: string, costId: string) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId ? { ...d, costs: d.costs.filter((c) => c.id !== costId) } : d
      ),
    }))

  const logActual = (dayId: string, costId: string, actual: number | null) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              costs: d.costs.map((c) =>
                c.id === costId ? { ...c, actual: actual === 0 ? null : actual } : c
              ),
            }
          : d
      ),
    }))

  // === Hotels ===
  const addHotel = (dayId: string, hotel: HotelOption) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId ? { ...d, hotels: [...(d.hotels ?? []), hotel] } : d
      ),
    }))

  const updateHotel = (dayId: string, index: number, patch: Partial<HotelOption>) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              hotels: (d.hotels ?? []).map((h, i) => (i === index ? { ...h, ...patch } : h)),
            }
          : d
      ),
    }))

  const deleteHotel = (dayId: string, index: number) =>
    apply((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id === dayId
          ? { ...d, hotels: (d.hotels ?? []).filter((_, i) => i !== index) }
          : d
      ),
    }))

  return {
    plan,
    isSaving,
    setTripTitle,
    setSummary,
    setWeatherNote,
    setListField,
    updateDay,
    replaceDay,
    replacePlan,
    undo,
    redo,
    canUndo,
    canRedo,
    addDay,
    reorderDays,
    deleteDay,
    shiftTripDates,
    addBlock,
    updateBlock,
    toggleBlockCompleted,
    setAllBlocksCompleted,
    deleteBlock,
    moveBlock,
    addCost,
    updateCost,
    deleteCost,
    logActual,
    addHotel,
    updateHotel,
    deleteHotel,
  }
}

export type TripEditor = ReturnType<typeof useTripEditor>

// Re-exports so consumers can import category / tier without a second import
export type { CostCategory, BudgetTier }
