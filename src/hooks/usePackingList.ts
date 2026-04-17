import { useCallback, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import i18n from 'i18next'
import { db, FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { sanitizeForFirestore } from '@/utils/sanitize'
import { logger } from '@/utils/logger'
import type { TripPlan } from '@/types/trip-plan'
import type { PackingList, PackingCategory, PackingItem } from '@/types/packing'

interface GenerateOpts {
  merge?: boolean
}

function assignIds(raw: unknown): PackingList {
  const base = raw as {
    categories?: Array<{
      title?: string
      items?: Array<{ name?: string; qty?: number | null; note?: string | null }>
    }>
    reasoning?: string
  }
  const categories: PackingCategory[] = (base.categories ?? [])
    .filter((c) => c && Array.isArray(c.items))
    .map((c) => ({
      title: c.title ?? 'Other',
      items: (c.items ?? [])
        .filter((it) => typeof it?.name === 'string' && it.name.trim())
        .map((it) => ({
          id: `pack-${crypto.randomUUID()}`,
          name: it.name!.trim(),
          qty: typeof it.qty === 'number' ? it.qty : null,
          note: typeof it.note === 'string' && it.note.trim() ? it.note.trim() : null,
          checked: false,
        })),
    }))
    .filter((c) => c.items.length > 0)
  return {
    categories,
    reasoning: typeof base.reasoning === 'string' ? base.reasoning : '',
    generatedAt: Date.now(),
  }
}

/**
 * Merge a freshly-generated list with an existing one, preserving checked
 * state on items whose name matches (case-insensitive) within the same
 * category title.
 */
function mergePreservingChecks(next: PackingList, prev: PackingList | null): PackingList {
  if (!prev) return next
  const prevByCat = new Map<string, Map<string, PackingItem>>()
  for (const cat of prev.categories) {
    const items = new Map<string, PackingItem>()
    for (const it of cat.items) items.set(it.name.toLowerCase(), it)
    prevByCat.set(cat.title.toLowerCase(), items)
  }
  const categories = next.categories.map((cat) => {
    const prevItems = prevByCat.get(cat.title.toLowerCase())
    if (!prevItems) return cat
    return {
      ...cat,
      items: cat.items.map((it) => {
        const prior = prevItems.get(it.name.toLowerCase())
        return prior?.checked ? { ...it, checked: true } : it
      }),
    }
  })
  return { ...next, categories }
}

export function usePackingList(tripId: string | undefined) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const persist = useCallback(
    async (list: PackingList | null): Promise<void> => {
      if (!tripId) return
      await updateDoc(doc(db, 'trips', tripId), {
        packingList: list ? sanitizeForFirestore(list) : null,
      })
    },
    [tripId]
  )

  const generate = useCallback(
    async (plan: TripPlan, existing: PackingList | null, opts: GenerateOpts = {}) => {
      if (!FUNCTIONS_BASE_URL) {
        setError('Backend not configured')
        return null
      }
      setBusy(true)
      setError(null)
      try {
        const lang = (i18n.resolvedLanguage ?? 'en').toLowerCase().startsWith('sr')
          ? 'sr'
          : 'en'
        const res = await fetch(`${FUNCTIONS_BASE_URL}/packingList`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, language: lang }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const data = (await res.json()) as { packingList: unknown }
        const fresh = assignIds(data.packingList)
        const final = opts.merge ? mergePreservingChecks(fresh, existing) : fresh
        await persist(final)
        return final
      } catch (err) {
        const m = err instanceof Error ? err.message : 'Packing list generation failed'
        logger.error('packingList failed', err)
        setError(m)
        return null
      } finally {
        setBusy(false)
      }
    },
    [persist]
  )

  const toggleItem = useCallback(
    async (list: PackingList, catIdx: number, itemId: string): Promise<PackingList> => {
      const next: PackingList = {
        ...list,
        categories: list.categories.map((c, i) =>
          i === catIdx
            ? {
                ...c,
                items: c.items.map((it) =>
                  it.id === itemId ? { ...it, checked: !it.checked } : it
                ),
              }
            : c
        ),
      }
      await persist(next)
      return next
    },
    [persist]
  )

  const addItem = useCallback(
    async (list: PackingList, catIdx: number, name: string): Promise<PackingList> => {
      const clean = name.trim()
      if (!clean) return list
      const newItem: PackingItem = {
        id: `pack-${crypto.randomUUID()}`,
        name: clean,
        qty: null,
        note: null,
        checked: false,
      }
      const next: PackingList = {
        ...list,
        categories: list.categories.map((c, i) =>
          i === catIdx ? { ...c, items: [...c.items, newItem] } : c
        ),
      }
      await persist(next)
      return next
    },
    [persist]
  )

  const removeItem = useCallback(
    async (list: PackingList, catIdx: number, itemId: string): Promise<PackingList> => {
      const next: PackingList = {
        ...list,
        categories: list.categories.map((c, i) =>
          i === catIdx ? { ...c, items: c.items.filter((it) => it.id !== itemId) } : c
        ),
      }
      await persist(next)
      return next
    },
    [persist]
  )

  const clear = useCallback(async (): Promise<void> => {
    await persist(null)
  }, [persist])

  return { busy, error, generate, toggleItem, addItem, removeItem, clear }
}
