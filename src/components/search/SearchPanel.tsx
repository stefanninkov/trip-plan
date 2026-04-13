import { useState } from 'react'
import { Search, Loader2, ExternalLink, Star } from 'lucide-react'
import {
  useFlightSearch,
  useHotelSearch,
  usePlaceSearch,
  useWebSearch,
} from '@/hooks/useSearch'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/format-currency'

type Tab = 'flights' | 'hotels' | 'places' | 'web'

const TABS: { id: Tab; label: string }[] = [
  { id: 'flights', label: 'Flights' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'places', label: 'Places' },
  { id: 'web', label: 'Web' },
]

export function SearchPanel() {
  const [tab, setTab] = useState<Tab>('flights')

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-accent" />
        <h3 className="mb-0">Search the web</h3>
      </div>
      <div className="flex items-center gap-1 border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'flights' && <FlightsTab />}
      {tab === 'hotels' && <HotelsTab />}
      {tab === 'places' && <PlacesTab />}
      {tab === 'web' && <WebTab />}
    </Card>
  )
}

// ---- Flights ----
function FlightsTab() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const { results, loading, error, run } = useFlightSearch()

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
            <li key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-subtle flex items-center justify-between gap-2 text-[13px]">
              <div>
                <div className="font-semibold">{r.airline}</div>
                <div className="text-text-tertiary text-[12px]">
                  {r.departure} &rarr; {r.arrival} &middot; {r.duration} &middot; {r.stops === 0 ? 'nonstop' : `${r.stops} stop${r.stops > 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="cost font-semibold text-[14px]">{formatCurrency(r.price, r.currency)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Hotels ----
function HotelsTab() {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const { results, loading, error, run } = useHotelSearch()

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
            <li key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-subtle flex flex-col gap-1.5 text-[13px]">
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
              <div className="flex items-center justify-between">
                <span className="cost font-semibold">{formatCurrency(r.pricePerNight, r.currency)}/night</span>
                {r.bookingUrl && (
                  <a href={r.bookingUrl} target="_blank" rel="noreferrer" className="text-accent text-[12px] flex items-center gap-1">
                    View <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Places ----
function PlacesTab() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const { results, loading, error, run } = usePlaceSearch()

  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="e.g. best trattorias, rooftop bars" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Input placeholder="Location (city, neighborhood)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Button
        disabled={!query || loading}
        onClick={() => run({ query, location })}
        className="self-start flex items-center gap-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Search places
      </Button>
      {error && <p className="text-[13px] text-error">{error}</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r, i) => (
            <li key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-subtle flex flex-col gap-1 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{r.name}</span>
                {r.rating > 0 && (
                  <span className="flex items-center gap-1 text-text-tertiary text-[12px]">
                    <Star size={12} fill="currentColor" /> {r.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-text-tertiary text-[12px]">
                {r.type}
                {r.priceLevel && ` \u00B7 ${r.priceLevel}`}
              </div>
              <div className="text-text-tertiary text-[12px]">{r.address}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Web ----
function WebTab() {
  const [query, setQuery] = useState('')
  const { results, loading, error, run } = useWebSearch()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          placeholder="e.g. best time to visit Swiss Alps in July"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button disabled={!query || loading} onClick={() => run({ query })}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
        </Button>
      </div>
      {error && <p className="text-[13px] text-error">{error}</p>}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r, i) => (
            <li key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-subtle flex flex-col gap-1 text-[13px]">
              <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-accent flex items-center gap-1 truncate">
                {r.title} <ExternalLink size={10} className="shrink-0" />
              </a>
              <p className="text-text-secondary text-[12px] leading-snug">{r.snippet}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
