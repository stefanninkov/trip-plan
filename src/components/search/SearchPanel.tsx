import { useState } from 'react'
import {
  Search,
  Loader2,
  ExternalLink,
  Star,
  Clock,
  Phone,
  Globe,
  MapPin,
  Plus,
  Ticket,
} from 'lucide-react'
import {
  useFlightSearch,
  useHotelSearch,
  usePlaceSearch,
} from '@/hooks/useSearch'
import type {
  FlightResult,
  HotelResult,
  PlaceResult,
} from '@/types/search'
import type { DayPlan, TravelMode } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import { Modal } from '@/components/shared/Modal'
import { useUiStore } from '@/store/ui-store'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format-currency'
import { formatDate } from '@/utils/date-helpers'

type Tab = 'flights' | 'hotels' | 'places' | 'activities'

const TABS: { id: Tab; label: string }[] = [
  { id: 'flights', label: 'Flights' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'places', label: 'Places' },
  { id: 'activities', label: 'Activities' },
]

export interface SearchPanelProps {
  editor?: TripEditor
  days?: DayPlan[]
  currency?: string
}

export function SearchPanel({ editor, days, currency }: SearchPanelProps) {
  const [tab, setTab] = useState<Tab>('flights')

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-accent" />
        <h3 className="mb-0">Search the web</h3>
      </div>
      <div className="flex items-center gap-1 border-b border-border-subtle overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'flights' && <FlightsTab editor={editor} days={days} />}
      {tab === 'hotels' && <HotelsTab editor={editor} days={days} />}
      {tab === 'places' && <PlacesTab editor={editor} days={days} currency={currency} />}
      {tab === 'activities' && <ActivitiesTab editor={editor} days={days} currency={currency} />}
    </Card>
  )
}

// ---- AddToPlan modal shared logic ----
interface AddToPlanCtx {
  editor?: TripEditor
  days?: DayPlan[]
}

function useDayPicker(ctx: AddToPlanCtx) {
  const [pendingAdd, setPendingAdd] = useState<null | ((dayId: string) => void)>(null)

  const request = (addFn: (dayId: string) => void) => {
    if (!ctx.editor || !ctx.days || ctx.days.length === 0) return
    setPendingAdd(() => addFn)
  }
  const cancel = () => setPendingAdd(null)
  const pick = (dayId: string) => {
    pendingAdd?.(dayId)
    setPendingAdd(null)
  }

  const modal = (
    <Modal open={pendingAdd !== null} onClose={cancel} title="Add to which day?">
      <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
        {ctx.days?.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => pick(d.id)}
            className="text-left px-3 py-2.5 rounded-md hover:bg-bg-surface border border-transparent hover:border-border-default transition-colors flex items-center gap-3"
          >
            <span className="w-7 h-7 rounded-full bg-accent-muted text-accent font-cost font-bold flex items-center justify-center shrink-0 text-[12px]">
              {d.dayNumber}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold text-text-primary truncate">
                {d.title}
              </span>
              <span className="block text-[11px] text-text-tertiary">
                {formatDate(d.date)} \u00B7 {d.location}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )

  return { request, modal, canAdd: Boolean(ctx.editor && ctx.days && ctx.days.length > 0) }
}

// ---- Flights ----
function FlightsTab({ editor, days }: AddToPlanCtx) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const { results, loading, error, run } = useFlightSearch()
  const addToast = useUiStore((s) => s.addToast)
  const dayPicker = useDayPicker({ editor, days })

  const addFlight = (flight: FlightResult, dayId: string) => {
    if (!editor) return
    editor.addCost(dayId, {
      item: `Flight: ${flight.airline} (${flight.departure} \u2192 ${flight.arrival})`,
      category: 'transport',
      amount: { min: flight.price, max: flight.price },
      currency: flight.currency,
      note: `${flight.duration}${flight.stops === 0 ? ', nonstop' : `, ${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`,
    })
    editor.addBlock(dayId, {
      time: `${flight.departure}-${flight.arrival}`,
      title: `Flight ${flight.airline}`,
      description: `${flight.departure} \u2192 ${flight.arrival}, ${flight.duration}`,
      tip: null,
      warning: null,
      whyPicked: null,
      historicalContext: null,
      travelMode: 'plane' as TravelMode,
    })
    addToast('success', 'Flight added to trip')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="From (airport code)" value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} />
        <Input placeholder="To (airport code)" value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="date" value={returnDate} placeholder="Return (optional)" onChange={(e) => setReturnDate(e.target.value)} />
      </div>
      <Button
        disabled={!origin || !destination || !date || loading}
        onClick={() => run({ origin, destination, date, returnDate: returnDate || undefined })}
        className="self-start flex items-center gap-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Search flights
      </Button>
      {error && <p className="text-[13px] text-error">{error}</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r, i) => (
            <li key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-subtle flex flex-col md:flex-row md:items-center gap-2 text-[13px]">
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{r.airline}</div>
                <div className="text-text-tertiary text-[12px]">
                  {r.departure} \u2192 {r.arrival} \u00B7 {r.duration} \u00B7{' '}
                  {r.stops === 0 ? 'nonstop' : `${r.stops} stop${r.stops > 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="cost font-semibold text-[14px]">{formatCurrency(r.price, r.currency)}</div>
                {dayPicker.canAdd && (
                  <Button
                    variant="secondary"
                    onClick={() => dayPicker.request((dayId) => addFlight(r, dayId))}
                    className="flex items-center gap-1"
                  >
                    <Plus size={12} /> Add
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {dayPicker.modal}
    </div>
  )
}

// ---- Hotels ----
function HotelsTab({ editor, days }: AddToPlanCtx) {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const { results, loading, error, run } = useHotelSearch()
  const addToast = useUiStore((s) => s.addToast)
  const dayPicker = useDayPicker({ editor, days })

  const addHotel = (hotel: HotelResult, dayId: string) => {
    if (!editor) return
    editor.addHotel(dayId, {
      name: hotel.name,
      stars: hotel.stars,
      pricePerNight: hotel.pricePerNight,
      currency: hotel.currency,
      highlight:
        hotel.highlights.slice(0, 3).join(' \u00B7 ') ||
        (hotel.rating > 0 ? `Rated ${hotel.rating.toFixed(1)} from ${hotel.reviewCount} reviews` : ''),
      tier: hotel.pricePerNight < 80 ? 'budget' : hotel.pricePerNight < 200 ? 'mid' : 'comfortable',
    })
    addToast('success', 'Hotel added to trip')
  }

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Destination (city)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
      </div>
      <Button
        disabled={!location || !checkIn || !checkOut || loading}
        onClick={() => run({ location, checkIn, checkOut })}
        className="self-start flex items-center gap-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Search hotels
      </Button>
      {error && <p className="text-[13px] text-error">{error}</p>}
      {results.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {results.map((r, i) => (
            <li
              key={i}
              className="rounded-lg bg-bg-secondary border border-border-subtle flex flex-col overflow-hidden text-[13px]"
            >
              {r.thumbnailUrl ? (
                <img
                  src={r.thumbnailUrl}
                  alt={r.name}
                  loading="lazy"
                  className="w-full h-36 object-cover bg-bg-elevated"
                />
              ) : (
                <div className="w-full h-36 bg-bg-elevated flex items-center justify-center text-text-tertiary text-[11px]">
                  No image
                </div>
              )}
              <div className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{r.name}</span>
                  {r.rating > 0 && (
                    <span className="flex items-center gap-1 text-text-tertiary text-[12px]">
                      <Star size={12} fill="currentColor" /> {r.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-text-tertiary text-[12px]">
                  {r.stars > 0 ? `${r.stars}-star` : 'Unrated'}
                  {r.reviewCount > 0 && ` \u00B7 ${r.reviewCount} reviews`}
                </div>
                {r.highlights && r.highlights.length > 0 && (
                  <ul className="text-[12px] text-text-secondary leading-snug flex flex-wrap gap-x-2 gap-y-0.5">
                    {r.highlights.slice(0, 4).map((h, j) => (
                      <li key={j} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="cost font-semibold">
                    {formatCurrency(r.pricePerNight, r.currency)}/night
                  </span>
                  <div className="flex items-center gap-2">
                    {r.bookingUrl && (
                      <a
                        href={r.bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent text-[12px] flex items-center gap-1"
                      >
                        View <ExternalLink size={10} />
                      </a>
                    )}
                    {dayPicker.canAdd && (
                      <Button
                        variant="secondary"
                        onClick={() => dayPicker.request((dayId) => addHotel(r, dayId))}
                        className="flex items-center gap-1"
                      >
                        <Plus size={12} /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dayPicker.modal}
    </div>
  )
}

// ---- Places ----
function PlacesTab({
  editor,
  days,
  currency = 'EUR',
}: AddToPlanCtx & { currency?: string }) {
  return (
    <SearchPlaceForm
      editor={editor}
      days={days}
      currency={currency}
      defaultQuery=""
      prompt="e.g. best trattorias, rooftop bars, museums"
    />
  )
}

// ---- Activities ----
function ActivitiesTab({
  editor,
  days,
  currency = 'EUR',
}: AddToPlanCtx & { currency?: string }) {
  return (
    <SearchPlaceForm
      editor={editor}
      days={days}
      currency={currency}
      defaultQuery="things to do"
      prompt="e.g. walking tours, day trips, free things to do"
    />
  )
}

function SearchPlaceForm({
  editor,
  days,
  currency,
  defaultQuery,
  prompt,
}: AddToPlanCtx & { currency: string; defaultQuery: string; prompt: string }) {
  const [query, setQuery] = useState(defaultQuery)
  const [location, setLocation] = useState('')
  const { results, loading, error, run } = usePlaceSearch()
  const addToast = useUiStore((s) => s.addToast)
  const dayPicker = useDayPicker({ editor, days })

  const canSearch = query.trim().length > 0 && location.trim().length > 0

  const addPlace = (place: PlaceResult, dayId: string) => {
    if (!editor) return
    editor.addBlock(dayId, {
      time: '10:00-12:00',
      title: place.name,
      description:
        place.description ||
        `${place.type || 'Place'}${place.address ? ` \u2014 ${place.address}` : ''}`,
      tip: place.hours || null,
      warning: null,
      whyPicked: null,
      historicalContext: null,
      travelMode: null,
    })
    addToast('success', `${place.name} added to trip`)
  }

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder={prompt} value={query} onChange={(e) => setQuery(e.target.value)} />
      <Input
        placeholder="Location (required) \u2014 city, neighborhood"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Button
        disabled={!canSearch || loading}
        onClick={() => run({ query, location })}
        className="self-start flex items-center gap-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Search
      </Button>
      {!canSearch && !loading && (
        <p className="text-[12px] text-text-tertiary">
          Add both a query and a location to avoid getting generic results.
        </p>
      )}
      {error && <p className="text-[13px] text-error">{error}</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r, i) => (
            <li
              key={i}
              className="rounded-lg bg-bg-secondary border border-border-subtle overflow-hidden flex text-[13px]"
            >
              {r.thumbnailUrl && (
                <img
                  src={r.thumbnailUrl}
                  alt={r.name}
                  loading="lazy"
                  className="w-24 h-24 object-cover bg-bg-elevated shrink-0"
                />
              )}
              <div className="p-3 flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="font-semibold truncate">{r.name}</span>
                    <div className="text-text-tertiary text-[12px]">
                      {r.type}
                      {r.priceLevel && ` \u00B7 ${r.priceLevel}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    {r.rating > 0 && (
                      <span className="flex items-center gap-1 text-text-tertiary text-[12px]">
                        <Star size={12} fill="currentColor" /> {r.rating.toFixed(1)}
                      </span>
                    )}
                    {r.openNow !== null && (
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded"
                        style={{
                          color: r.openNow ? 'var(--color-success)' : 'var(--color-error)',
                          backgroundColor: r.openNow
                            ? 'var(--cat-activity-muted)'
                            : '#D9555520',
                        }}
                      >
                        {r.openNow ? 'Open' : 'Closed'}
                      </span>
                    )}
                  </div>
                </div>
                {r.description && (
                  <p className="text-text-secondary text-[12px] leading-snug">{r.description}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-text-tertiary">
                  {r.address && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} /> {r.address}
                    </span>
                  )}
                  {r.hours && (
                    <span className="flex items-center gap-1 truncate">
                      <Clock size={11} /> {r.hours}
                    </span>
                  )}
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="flex items-center gap-1">
                      <Phone size={11} /> {r.phone}
                    </a>
                  )}
                  {r.website && (
                    <a
                      href={r.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-accent"
                    >
                      <Globe size={11} />
                      {new URL(r.website).hostname.replace(/^www\./, '')}
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  {r.mapsUrl ? (
                    <a
                      href={r.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent text-[11px] flex items-center gap-1"
                    >
                      <Ticket size={11} /> Open in Google Maps
                    </a>
                  ) : (
                    <span />
                  )}
                  {dayPicker.canAdd && (
                    <Button
                      variant="secondary"
                      onClick={() => dayPicker.request((dayId) => addPlace(r, dayId))}
                      className="flex items-center gap-1"
                    >
                      <Plus size={12} /> Add
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dayPicker.modal}
      {currency !== currency && null}
    </div>
  )
}
