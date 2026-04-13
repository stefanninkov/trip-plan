import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { recalcTotals } from '@/utils/skeleton-plan'
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
            plan: latestPlan.current,
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
        const next = recalcTotals(updater(prev))
        persist(next)
        return next
      })
    },
    [persist]
  )

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
    addBlock,
    updateBlock,
    toggleBlockCompleted,
    setAllBlocksCompleted,
    deleteBlock,
    moveBlock,
    addCost,
    updateCost,
    deleteCost,
    addHotel,
    updateHotel,
    deleteHotel,
  }
}

export type TripEditor = ReturnType<typeof useTripEditor>

// Re-exports so consumers can import category / tier without a second import
export type { CostCategory, BudgetTier }
