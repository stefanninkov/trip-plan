import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { searchCities, type CitySuggestion } from '@/utils/city-search'

export interface CityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: CitySuggestion) => void
  label?: string
  placeholder?: string
  name?: string
  autoFocus?: boolean
  id?: string
}

export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  label,
  placeholder = 'Start typing a city…',
  name,
  autoFocus,
  id,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CitySuggestion[]>([])
  const [highlighted, setHighlighted] = useState(-1)
  const [touched, setTouched] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debouncedValue = useDebouncedValue(value, 300)
  const inputId = id ?? name ?? 'city-autocomplete'

  // Click-outside closes the dropdown
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Run the search when the debounced value changes (and user has typed)
  useEffect(() => {
    if (!touched) return
    if (debouncedValue.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    searchCities(debouncedValue, ctrl.signal)
      .then((r) => {
        setResults(r)
        setHighlighted(-1)
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [debouncedValue, touched])

  const pick = (s: CitySuggestion) => {
    onChange(s.displayName)
    onSelect?.(s)
    setOpen(false)
    setTouched(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      pick(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-text-secondary tracking-[0.2px]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
        />
        <input
          id={inputId}
          name={name}
          type="text"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setTouched(true)
            setOpen(true)
          }}
          onFocus={() => {
            if (value.length >= 2 || results.length > 0) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full bg-bg-secondary text-text-primary placeholder:text-text-tertiary',
            'border border-border-default rounded-lg pl-9 pr-9 py-2.5',
            'text-[14px] leading-[22px]',
            'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-[var(--accent-muted)]',
            'transition-colors duration-150'
          )}
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary animate-spin"
          />
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-auto bg-bg-elevated border border-border-default rounded-lg shadow-[0_8px_24px_#00000066]"
        >
          {results.map((r, i) => (
            <li key={r.displayName + i}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => pick(r)}
                className={cn(
                  'w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-[14px]',
                  'transition-colors duration-100',
                  i === highlighted
                    ? 'bg-bg-surface text-text-primary'
                    : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                )}
              >
                <MapPin size={14} className="shrink-0 text-text-tertiary" />
                <span className="truncate">{r.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && touched && !loading && debouncedValue.length >= 2 && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-bg-elevated border border-border-default rounded-lg px-3 py-2.5 text-[13px] text-text-tertiary">
          No cities found. You can still type a custom name.
        </div>
      )}
    </div>
  )
}
