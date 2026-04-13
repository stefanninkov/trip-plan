import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Sun,
  CloudSun,
  CloudFog,
  Droplets,
  type LucideIcon,
} from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { Skeleton } from '@/components/shared/Skeleton'

export interface DayWeatherProps {
  location: string
  date: string
  /** Compact variant: just icon + high/low temp. No label/precip/tag. */
  compact?: boolean
}

function iconFor(code: number): LucideIcon {
  if (code === 0) return Sun
  if (code === 1 || code === 2) return CloudSun
  if (code === 3 || code === 45 || code === 48) return code >= 45 ? CloudFog : Cloud
  if (code >= 51 && code <= 57) return CloudDrizzle
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return CloudSnow
  if (code >= 95) return CloudLightning
  return Cloud
}

/**
 * Short practical note derived from the forecast: what to wear / bring,
 * whether outdoor plans are safe, etc. Kept to one or two sentences.
 */
function advisory(highC: number, lowC: number, code: number, precip: number): string {
  const bits: string[] = []
  // Temperature advice
  if (highC >= 30) bits.push('Hot — light layers, shade breaks, lots of water')
  else if (highC >= 24) bits.push('Warm — short sleeves comfortable all day')
  else if (highC >= 18) bits.push('Mild — long sleeves or a light layer is ideal')
  else if (highC >= 10) bits.push('Cool — jacket or sweater for outdoor time')
  else if (highC >= 0) bits.push('Cold — warm coat, hat and gloves')
  else bits.push('Freezing — heavy winter gear, watch for icy pavements')

  if (lowC <= 5 && highC - lowC >= 10) {
    bits.push('Mornings and evenings noticeably colder than midday — bring a layer you can peel off')
  }

  // Precipitation / condition advice
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82)
  const isSnow = (code >= 71 && code <= 77) || (code >= 85 && code <= 86)
  const isThunder = code >= 95
  const isFog = code === 45 || code === 48
  if (isThunder) bits.push('Thunderstorms possible — plan indoor alternatives')
  else if (isSnow) bits.push('Snow expected — waterproof boots and grip')
  else if (isRain || precip >= 60) bits.push('Rain likely — umbrella and a waterproof layer')
  else if (precip >= 30) bits.push('Showers possible — umbrella just in case')
  else if (isFog) bits.push('Foggy conditions — allow extra time for transfers')
  else if (code === 0 && highC >= 20) bits.push('Clear and sunny — sunscreen and sunglasses')

  return bits.join('. ') + '.'
}

export function DayWeatherNote({ location, date }: { location: string; date: string }) {
  const weather = useWeather(location, date)
  if (weather === 'loading') {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex flex-col gap-2">
        <Skeleton width="220px" height="14px" />
        <Skeleton width="360px" height="14px" />
      </div>
    )
  }
  if (!weather) return null
  const Icon = iconFor(weather.code)
  const advice = advisory(
    weather.highC,
    weather.lowC,
    weather.code,
    weather.precipProbability
  )
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
        <Icon size={18} className="text-accent" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold">
            {weather.label}
            <span className="text-text-tertiary font-normal">
              {' · '}
              {Math.round(weather.highC)}° / {Math.round(weather.lowC)}°C
            </span>
          </span>
          {weather.precipProbability > 20 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
              <Droplets size={11} />
              {weather.precipProbability}% precipitation
            </span>
          )}
          {weather.source === 'historical' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.5px] bg-bg-elevated text-text-tertiary">
              typical
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-secondary leading-[18px]">{advice}</p>
      </div>
    </div>
  )
}

export function DayWeather({ location, date, compact = false }: DayWeatherProps) {
  const weather = useWeather(location, date)
  if (weather === 'loading') {
    return <Skeleton width={compact ? '64px' : '140px'} height="16px" />
  }
  if (!weather) return null
  const Icon = iconFor(weather.code)
  const tooltip =
    weather.source === 'historical'
      ? `Typical ${weather.label} (based on last year)`
      : `Forecast: ${weather.label}`

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary whitespace-nowrap"
        title={tooltip}
      >
        <Icon
          size={13}
          className={weather.source === 'historical' ? 'text-text-tertiary' : 'text-accent'}
        />
        <span className="font-cost">
          {Math.round(weather.highC)}&deg;
          <span className="text-text-tertiary">/{Math.round(weather.lowC)}&deg;</span>
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 text-[12px] text-text-secondary"
      title={tooltip}
    >
      <Icon size={14} className="text-accent" />
      <span className="font-cost">
        {Math.round(weather.highC)}&deg; / {Math.round(weather.lowC)}&deg;C
      </span>
      <span className="text-text-tertiary">&middot; {weather.label}</span>
      {weather.precipProbability > 30 && (
        <span className="flex items-center gap-1 text-text-tertiary">
          <Droplets size={11} />
          {weather.precipProbability}%
        </span>
      )}
    </div>
  )
}
