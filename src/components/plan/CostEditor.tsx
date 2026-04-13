import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CostItem, CostCategory } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { CATEGORIES } from '@/constants/categories'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Select } from '@/components/shared/Select'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'

interface Props {
  dayId: string
  costs: CostItem[]
  editor: TripEditor
  defaultCurrency: string
}

const CATEGORY_OPTIONS = Object.values(CATEGORIES).map((c) => ({
  value: c.id,
  label: c.label,
}))

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: c.code,
}))

export function CostList({ dayId, costs, editor, defaultCurrency }: Props) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
        Costs
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {costs.map((c) => (
          <div
            key={c.id}
            className="group flex items-center justify-between gap-3 py-2 text-[13px]"
            style={{ borderLeft: `3px solid var(--color-cat-${c.category})`, paddingLeft: 8 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{c.item}</span>
              <span
                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded"
                style={{
                  color: `var(--color-cat-${c.category})`,
                  backgroundColor: `var(--cat-${c.category}-muted)`,
                }}
              >
                {CATEGORIES[c.category].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyDisplay
                min={c.amount.min}
                max={c.amount.max}
                currency={c.currency}
                size="sm"
              />
              <button
                type="button"
                onClick={() => editor.deleteCost(dayId, c.id)}
                aria-label="Delete cost"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-error p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <AddCostForm
          defaultCurrency={defaultCurrency}
          onCancel={() => setAdding(false)}
          onSubmit={(data) => {
            editor.addCost(dayId, data)
            setAdding(false)
          }}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setAdding(true)}
          className="self-start flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add cost
        </Button>
      )}
    </div>
  )
}

function AddCostForm({
  defaultCurrency,
  onCancel,
  onSubmit,
}: {
  defaultCurrency: string
  onCancel: () => void
  onSubmit: (c: Omit<CostItem, 'id'>) => void
}) {
  const [item, setItem] = useState('')
  const [category, setCategory] = useState<CostCategory>('transport')
  const [minAmount, setMinAmount] = useState('0')
  const [maxAmount, setMaxAmount] = useState('0')
  const [currency, setCurrency] = useState(defaultCurrency || DEFAULT_CURRENCY)

  const canSave = item.trim().length > 0

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 flex flex-col gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          placeholder="What's this?"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as CostCategory)}
          options={CATEGORY_OPTIONS}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
        />
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={CURRENCY_OPTIONS}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => {
            const min = Math.max(0, Number(minAmount) || 0)
            const max = Math.max(min, Number(maxAmount) || min)
            onSubmit({
              item: item.trim(),
              category,
              amount: { min, max },
              currency,
              note: null,
            })
          }}
        >
          Add cost
        </Button>
      </div>
    </div>
  )
}
