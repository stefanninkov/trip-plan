import { useTranslation } from 'react-i18next'
import { User } from 'lucide-react'
import { usePresence } from '@/hooks/usePresence'
import { cn } from '@/utils/cn'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function PresenceAvatars({ tripId }: { tripId: string }) {
  const { t } = useTranslation()
  const others = usePresence(tripId)
  if (others.length === 0) return null
  const visible = others.slice(0, 4)
  const extra = others.length - visible.length

  return (
    <div className="inline-flex items-center gap-2" title={t('presence.viewing', { count: others.length })}>
      <div className="flex -space-x-2">
        {visible.map((p) => (
          <div
            key={p.uid}
            className={cn(
              'w-7 h-7 rounded-full border-2 border-bg-primary overflow-hidden flex items-center justify-center bg-bg-elevated text-[11px] font-semibold'
            )}
            title={p.displayName}
          >
            {p.photoURL ? (
              <img src={p.photoURL} alt={p.displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials(p.displayName)}</span>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-bg-primary bg-bg-elevated flex items-center justify-center text-[10px] font-semibold text-text-secondary">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-[11px] text-text-tertiary inline-flex items-center gap-1">
        <User size={11} />
        {t('presence.viewing', { count: others.length })}
      </span>
    </div>
  )
}
