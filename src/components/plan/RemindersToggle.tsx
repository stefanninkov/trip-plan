import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  remindersEnabled,
  requestPermission,
  setRemindersEnabled,
  maybeNotifyToday,
} from '@/utils/day-reminders'
import { useUiStore } from '@/store/ui-store'
import type { TripPlan } from '@/types/trip-plan'

/**
 * Pill button that enables / disables day-of trip reminders. Requests
 * Notification permission on first click and fires today's briefing if
 * applicable. Shows a Bell icon with state (on / off / blocked).
 */
export function RemindersToggle({
  tripId,
  plan,
}: {
  tripId: string
  plan: TripPlan
}) {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const [enabled, setEnabled] = useState(() => remindersEnabled())
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unknown'
  )

  // On mount, if reminders are already on, try to fire today's briefing.
  useEffect(() => {
    if (!enabled) return
    maybeNotifyToday(tripId, plan, { t })
  }, [enabled, tripId, plan, t])

  if (typeof Notification === 'undefined') return null

  const onToggle = async () => {
    if (enabled) {
      setRemindersEnabled(false)
      setEnabled(false)
      addToast('info', 'Reminders disabled')
      return
    }
    const perm = await requestPermission()
    setPermission(perm)
    if (perm !== 'granted') {
      addToast('error', t('notifications.denied'))
      return
    }
    setRemindersEnabled(true)
    setEnabled(true)
    addToast('success', t('notifications.enabled'))
    maybeNotifyToday(tripId, plan, { t })
  }

  const Icon = enabled ? BellRing : permission === 'denied' ? BellOff : Bell

  return (
    <button
      type="button"
      onClick={() => void onToggle()}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
        enabled
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary'
      }`}
      title={t('notifications.enable')}
    >
      <Icon size={13} />
      {enabled ? t('notifications.enabled').split('—')[0].trim() : t('notifications.enable')}
    </button>
  )
}
