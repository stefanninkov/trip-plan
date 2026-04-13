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
  /** Origin location from trip inputs (used by Flights tab to pre-fill). */
  origin?: string
}

export function SearchPanel({ editor, days, currency, origin }: SearchPanelProps) {
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

      {tab === 'flights' && <FlightsTab editor={editor} days={days} origin={origin} />}
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
                {formatDate(d.date)} · {d.location}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )

  return { request, modal, canAdd: Boolean(ctx.editor && ctx.days && ctx.days.length > 0) }
}

interface FlightLeg {
  from: string
  to: string
  date: string
  returnDate?: string
  label: string
}

function computeFlightLegs(origin: string | undefined, days: DayPlan[]): FlightLeg[] {
  if (days.length === 0) return []
  const legs: FlightLeg[] = []
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  if (origin && firstDay.location) {
    legs.push({
      from: origin,
      to: firstDay.location,
      date: firstDay.date,
      returnDate: lastDay.date,
      label: `${origin} → ${firstDay.location} (round trip ${firstDay.date} / ${lastDay.date})`,
    })
    legs.push({
      from: origin,
      to: firstDay.location,
      date: firstDay.date,
      label: `${origin} → ${firstDay.location} (one-way ${firstDay.date})`,
    })
    legs.push({
      from: lastDay.location,
      to: origin,
      date: lastDay.date,
      label: `${lastDay.location} → ${origin} (return ${lastDay.date})`,
    })
  }
  // Intra-trip legs: any destination change
  for (let i = 1; i < days.length; i += 1) {
    const prev = days[i - 1]
    const cur = days[i]
    if (prev.location !== cur.location && prev.location && cur.location) {
      legs.push({
        from: prev.location,
        to: cur.location,
        date: cur.date,
        label: `${prev.location} → ${cur.location} (${cur.date})`,
      })
    }
  }
  return legs
}

// ---- Flights ----
function FlightsTab({
  editor,
  days,
  origin: tripOrigin,
}: AddToPlanCtx & { origin?: string }) {
  const legs = days ? computeFlightLegs(tripOrigin, days) : []
  const [legIndex, setLegIndex] = useState(legs.length > 0 ? 0 : -1)
  const [customOrigin, setCustomOrigin] = useState('')
  const [customDest, setCustomDest] = useState('')
  const [customDate, setCustomDate] = useState(days?.[0]?.date ?? '')
  const [customReturn, setCustomReturn] = useState(
    days && days.length > 0 ? days[days.length - 1].date : ''
  )
  const { results, loading, error, run } = useFlightSearch()
  const addToast = useUiStore((s) => s.addToast)
  const dayPicker = useDayPicker({ editor, days })

  const isCustomLeg = legIndex === -1 || legs.length === 0
  const activeLeg = !isCustomLeg ? legs[legIndex] : null
  const origin = activeLeg?.from ?? customOrigin
  const destination = activeLeg?.to ?? customDest
  const date = activeLeg?.date ?? customDate
  const returnDate = activeLeg?.returnDate ?? customReturn

  const addFlight = (flight: FlightResult, dayId: string) => {
    if (!editor) return
    editor.addCost(dayId, {
      item: `Flight: ${flight.airline} (${flight.departure} → ${flight.arrival})`,
      category: 'transport',
      amount: { min: flight.price, max: flight.price },
      currency: flight.currency,
      note: `${flight.duration}${flight.stops === 0 ? ', nonstop' : `, ${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`,
    })
    editor.addBlock(dayId, {
      time: `${flight.departure}-${flight.arrival}`,
      title: `Flight ${flight.airline}`,
      description: `${flight.departure} → ${flight.arrival}, ${flight.duration}`,
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
      {legs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
            Leg (from your trip)
          </label>
          <select
            value={legIndex}
            onChange={(e) => setLegIndex(Number(e.target.value))}
            className="w-full appearance-none bg-bg-secondary text-text-primary border border-border-default rounded-lg px-3 py-2.5 pr-9 text-[14px] focus:outline-none focus:border-accent"
          >
            {legs.map((l, i) => (
              <option key={i} value={i}>
                {l.label}
              </option>
            ))}
            <option value={-1}>Custom route / dates…</option>
          </select>
        </div>
      )}
      {isCustomLeg && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            placeholder="From (airport code)"
            value={customOrigin}
            onChange={(e) => setCustomOrigin(e.target.value.toUpperCase())}
          />
          <Input
            placeholder="To (airport code)"
            value={customDest}
            onChange={(e) => setCustomDest(e.target.value.toUpperCase())}
          />
          <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          <Input
            type="date"
            value={customReturn}
            placeholder="Return (optional)"
            onChange={(e) => setCustomReturn(e.target.value)}
          />
        </div>
      )}
      {!isCustomLeg && activeLeg && (
        <div className="text-[12px] text-text-tertiary">
          {activeLeg.from} → {activeLeg.to} · {activeLeg.date}
          {activeLeg.returnDate ? ` · return ${activeLeg.returnDate}` : ''}
        </div>
      )}
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
                  {r.departure} → {r.arrival} · {r.duration} ·{' '}
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

/**
 * Collapse consecutive days with the same location into "stays" so the
 * Hotels tab can just show a dropdown and fill check-in / check-out.
 */
interface Stay {
  location: string
  checkIn: string
  checkOut: string
  nights: number
}

function computeStays(days: DayPlan[]): Stay[] {
  if (days.length === 0) return []
  const stays: Stay[] = []
  let current: Stay | null = null
  for (const d of days) {
    if (current && current.location === d.location) {
      current.checkOut = addOneDay(d.date)
      current.nights = daysDiff(current.checkIn, current.checkOut)
    } else {
      if (current) stays.push(current)
      current = {
        location: d.location,
        checkIn: d.date,
        checkOut: addOneDay(d.date),
        nights: 1,
      }
    }
  }
  if (current) stays.push(current)
  return stays
}

function addOneDay(iso: string): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function daysDiff(a: string, b: string): number {
  return Math.max(
    1,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
  )
}

// ---- Hotels ----
function HotelsTab({ editor, days }: AddToPlanCtx) {
  const stays = days ? computeStays(days) : []
  const [stayIndex, setStayIndex] = useState(stays.length > 0 ? 0 : -1)
  const [customLocation, setCustomLocation] = useState('')
  const [customCheckIn, setCustomCheckIn] = useState('')
  const [customCheckOut, setCustomCheckOut] = useState('')
  const { results, loading, error, run } = useHotelSearch()
  const addToast = useUiStore((s) => s.addToast)
  const dayPicker = useDayPicker({ editor, days })

  const isCustom = stayIndex === -1 || stays.length === 0
  const activeStay = !isCustom ? stays[stayIndex] : null
  const location = activeStay?.location ?? customLocation
  const checkIn = activeStay?.checkIn ?? customCheckIn
  const checkOut = activeStay?.checkOut ?? customCheckOut

  const addHotel = (hotel: HotelResult, dayId: string) => {
    if (!editor) return
    editor.addHotel(dayId, {
      name: hotel.name,
      stars: hotel.stars,
      pricePerNight: hotel.pricePerNight,
      currency: hotel.currency,
      highlight:
        hotel.highlights.slice(0, 3).join(' · ') ||
        (hotel.rating > 0 ? `Rated ${hotel.rating.toFixed(1)} from ${hotel.reviewCount} reviews` : ''),
      tier:
        hotel.pricePerNight < 80
          ? 'budget'
          : hotel.pricePerNight < 200
            ? 'mid'
            : hotel.pricePerNight < 400
              ? 'comfortable'
              : 'luxury',
    })
    addToast('success', 'Hotel added to trip')
  }

  return (
    <div className="flex flex-col gap-3">
      {stays.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
            Destination (from your trip)
          </label>
          <div className="relative">
            <select
              value={stayIndex}
              onChange={(e) => setStayIndex(Number(e.target.value))}
              className="w-full appearance-none bg-bg-secondary text-text-primary border border-border-default rounded-lg px-3 py-2.5 pr-9 text-[14px] focus:outline-none focus:border-accent"
            >
              {stays.map((s, i) => (
                <option key={i} value={i}>
                  {s.location} — {s.nights} night{s.nights === 1 ? '' : 's'} (
                  {s.checkIn} → {s.checkOut})
                </option>
              ))}
              <option value={-1}>Custom destination / dates…</option>
            </select>
          </div>
        </div>
      )}
      {isCustom && (
        <>
          <Input
            placeholder="Destination (city)"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={customCheckIn}
              onChange={(e) => setCustomCheckIn(e.target.value)}
            />
            <Input
              type="date"
              value={customCheckOut}
              onChange={(e) => setCustomCheckOut(e.target.value)}
            />
          </div>
        </>
      )}
      {!isCustom && activeStay && (
        <div className="text-[12px] text-text-tertiary">
          {activeStay.checkIn} → {activeStay.checkOut} · {activeStay.nights} night
          {activeStay.nights === 1 ? '' : 's'}
        </div>
      )}
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
                  {r.reviewCount > 0 && ` · ${r.reviewCount} reviews`}
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
      defaultQuery=""
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
  // Unique non-empty locations from the trip, ordered as they appear.
  const tripLocations = days
    ? Array.from(new Set(days.map((d) => d.location).filter(Boolean)))
    : []
  const [query, setQuery] = useState(defaultQuery)
  const [selectedLoc, setSelectedLoc] = useState(tripLocations[0] ?? '_custom')
  const [customLocation, setCustomLocation] = useState('')
  const location = selectedLoc === '_custom' ? customLocation : selectedLoc
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
        `${place.type || 'Place'}${place.address ? ` — ${place.address}` : ''}`,
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
      {tripLocations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-secondary tracking-[0.2px]">
            Location (from your trip)
          </label>
          <select
            value={selectedLoc}
            onChange={(e) => setSelectedLoc(e.target.value)}
            className="w-full appearance-none bg-bg-secondary text-text-primary border border-border-default rounded-lg px-3 py-2.5 pr-9 text-[14px] focus:outline-none focus:border-accent"
          >
            {tripLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
            <option value="_custom">Custom location…</option>
          </select>
        </div>
      )}
      {(tripLocations.length === 0 || selectedLoc === '_custom') && (
        <Input
          placeholder="Location (required) — city, neighborhood"
          value={customLocation}
          onChange={(e) => setCustomLocation(e.target.value)}
        />
      )}
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
                      {r.priceLevel && ` · ${r.priceLevel}`}
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
