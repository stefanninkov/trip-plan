import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { HotelOption, BudgetTier } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Select } from '@/components/shared/Select'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies'

interface Props {
  dayId: string
  hotels: HotelOption[] | null
  editor: TripEditor
  defaultCurrency: string
}

const TIER_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid', label: 'Mid-range' },
  { value: 'comfortable', label: 'Comfortable' },
]

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c.code, label: c.code }))

export function HotelList({ dayId, hotels, editor, defaultCurrency }: Props) {
  const [adding, setAdding] = useState(false)

  if (hotels === null) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-text-secondary">
        Hotels
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {hotels.map((h, i) => (
          <div
            key={i}
            className="group rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-1 relative"
          >
            <button
              type="button"
              onClick={() => editor.deleteHotel(dayId, i)}
              aria-label="Delete hotel"
              className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-error p-1"
            >
              <Trash2 size={12} />
            </button>
            <div className="flex items-center justify-between gap-2 pr-5">
              <span className="text-[13px] font-semibold truncate">{h.name}</span>
              <Badge>{h.tier}</Badge>
            </div>
            <div className="text-[12px] text-text-tertiary">
              {h.stars > 0 ? `${h.stars}-star` : 'Hostel'}
            </div>
            <p className="text-[12px] text-text-secondary leading-[18px]">{h.highlight}</p>
            <div className="pt-1 border-t border-border-subtle mt-1">
              <CurrencyDisplay min={h.pricePerNight} currency={h.currency} size="sm" />
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <AddHotelForm
          defaultCurrency={defaultCurrency}
          onCancel={() => setAdding(false)}
          onSubmit={(data) => {
            editor.addHotel(dayId, data)
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
          Add hotel option
        </Button>
      )}
    </div>
  )
}

function AddHotelForm({
  defaultCurrency,
  onCancel,
  onSubmit,
}: {
  defaultCurrency: string
  onCancel: () => void
  onSubmit: (h: HotelOption) => void
}) {
  const [name, setName] = useState('')
  const [tier, setTier] = useState<BudgetTier>('mid')
  const [stars, setStars] = useState('3')
  const [price, setPrice] = useState('0')
  const [currency, setCurrency] = useState(defaultCurrency || DEFAULT_CURRENCY)
  const [highlight, setHighlight] = useState('')

  const canSave = name.trim().length > 0

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 flex flex-col gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="Hotel name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          value={tier}
          onChange={(e) => setTier(e.target.value as BudgetTier)}
          options={TIER_OPTIONS}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          placeholder="Stars (0-5)"
          value={stars}
          onChange={(e) => setStars(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Price / night"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          options={CURRENCY_OPTIONS}
        />
      </div>
      <Input
        placeholder="One-line highlight"
        value={highlight}
        onChange={(e) => setHighlight(e.target.value)}
      />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() =>
            onSubmit({
              name: name.trim(),
              tier,
              stars: Math.max(0, Math.min(5, Number(stars) || 0)),
              pricePerNight: Math.max(0, Number(price) || 0),
              currency,
              highlight: highlight.trim(),
            })
          }
        >
          Add hotel
        </Button>
      </div>
    </div>
  )
}
