import { useEffect, useState } from 'react'
import {
  Luggage,
  Loader2,
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Check,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TripPlan } from '@/types/trip-plan'
import type { PackingList } from '@/types/packing'
import { usePackingList } from '@/hooks/usePackingList'
import { Button } from '@/components/shared/Button'
import { useUiStore } from '@/store/ui-store'
import { cn } from '@/utils/cn'

export interface PackingListPanelProps {
  tripId: string
  plan: TripPlan
  packingList: PackingList | null | undefined
  readOnly?: boolean
}

export function PackingListPanel({
  tripId,
  plan,
  packingList,
  readOnly = false,
}: PackingListPanelProps) {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const { busy, error, generate, toggleItem, addItem, removeItem, clear } =
    usePackingList(tripId)
  const [local, setLocal] = useState<PackingList | null>(packingList ?? null)

  useEffect(() => {
    setLocal(packingList ?? null)
  }, [packingList])

  const runGenerate = async (merge: boolean) => {
    const next = await generate(plan, local, { merge })
    if (next) {
      setLocal(next)
      addToast('success', t('packing.generated'))
    } else if (error) {
      addToast('error', error)
    }
  }

  const onToggle = async (catIdx: number, itemId: string) => {
    if (readOnly || !local) return
    setLocal(await toggleItem(local, catIdx, itemId))
  }

  const onAdd = async (catIdx: number, name: string) => {
    if (readOnly || !local) return
    setLocal(await addItem(local, catIdx, name))
  }

  const onRemove = async (catIdx: number, itemId: string) => {
    if (readOnly || !local) return
    setLocal(await removeItem(local, catIdx, itemId))
  }

  const onClear = async () => {
    if (readOnly) return
    await clear()
    setLocal(null)
    addToast('info', t('packing.cleared'))
  }

  if (!local) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Luggage size={18} className="text-accent" />
          <h2 className="text-[16px] font-semibold m-0">{t('packing.title')}</h2>
        </div>
        <p className="text-[13px] text-text-secondary max-w-2xl leading-[20px]">
          {t('packing.intro')}
        </p>
        {!readOnly && (
          <div>
            <Button
              variant="primary"
              onClick={() => void runGenerate(false)}
              disabled={busy}
              className="flex items-center gap-1.5"
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t('packing.generating')}
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {t('packing.generate')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const totalItems = local.categories.reduce((n, c) => n + c.items.length, 0)
  const checkedItems = local.categories.reduce(
    (n, c) => n + c.items.filter((i) => i.checked).length,
    0
  )
  const progress = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100)

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-5 flex flex-col gap-4 print:border-0 print:p-0">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Luggage size={18} className="text-accent" />
          <h2 className="text-[16px] font-semibold m-0">{t('packing.title')}</h2>
          <span className="text-[12px] text-text-tertiary">
            {checkedItems}/{totalItems} · {progress}%
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="secondary"
              onClick={() => void runGenerate(true)}
              disabled={busy}
              className="flex items-center gap-1.5 text-[12px]"
              title={t('packing.regenerate')}
            >
              {busy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {t('packing.regenerate')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => void onClear()}
              className="flex items-center gap-1.5 text-[12px]"
              title={t('packing.clear')}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>

      {local.reasoning && (
        <p className="text-[12px] text-text-tertiary italic leading-[18px]">
          {local.reasoning}
        </p>
      )}

      <div className="w-full h-1 rounded-full bg-bg-elevated overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {local.categories.map((cat, catIdx) => (
          <PackingCategoryCard
            key={`${cat.title}-${catIdx}`}
            category={cat}
            onToggle={(id) => void onToggle(catIdx, id)}
            onAdd={(name) => void onAdd(catIdx, name)}
            onRemove={(id) => void onRemove(catIdx, id)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

function PackingCategoryCard({
  category,
  onToggle,
  onAdd,
  onRemove,
  readOnly,
}: {
  category: PackingList['categories'][number]
  onToggle: (itemId: string) => void
  onAdd: (name: string) => void
  onRemove: (itemId: string) => void
  readOnly: boolean
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  const submitAdd = () => {
    const v = draft.trim()
    if (!v) return
    onAdd(v)
    setDraft('')
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-2">
      <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[1px] text-text-secondary">
        {category.title}
      </h3>
      <ul className="flex flex-col gap-1">
        {category.items.map((it) => (
          <li key={it.id} className="flex items-start gap-2 group">
            <button
              type="button"
              onClick={() => onToggle(it.id)}
              disabled={readOnly}
              className={cn(
                'shrink-0 mt-[3px] w-4 h-4 rounded border flex items-center justify-center transition-colors',
                it.checked
                  ? 'bg-accent border-accent'
                  : 'bg-bg-primary border-border-default hover:border-border-strong'
              )}
              aria-label={it.checked ? t('packing.uncheck') : t('packing.check')}
            >
              {it.checked && <Check size={11} className="text-bg-primary" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
              <span
                className={cn(
                  'text-[13px] leading-[20px]',
                  it.checked && 'line-through text-text-tertiary'
                )}
              >
                {it.name}
                {it.qty && it.qty > 1 ? (
                  <span className="text-text-tertiary"> × {it.qty}</span>
                ) : null}
              </span>
              {it.note && (
                <span className="text-[11px] text-text-tertiary italic">{it.note}</span>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                className="shrink-0 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                aria-label={t('packing.remove')}
              >
                <Trash2 size={11} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitAdd()
          }}
          className="flex items-center gap-1 pt-1 print:hidden"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('packing.addItemPlaceholder')}
            className="flex-1 min-w-0 bg-transparent border-b border-border-subtle focus:border-border-strong text-[12px] py-1 outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="shrink-0 text-text-tertiary hover:text-text-primary disabled:opacity-40"
            aria-label={t('packing.addItem')}
          >
            <Plus size={14} />
          </button>
        </form>
      )}
    </div>
  )
}
