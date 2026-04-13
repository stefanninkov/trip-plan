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
