import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUiStore } from '@/store/ui-store'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  message: string
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const ACCENT_COLORS: Record<ToastType, string> = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
}

function ToastItem({ toast }: { toast: ToastData }) {
  const removeToast = useUiStore((s) => s.removeToast)
  const Icon = ICONS[toast.type]

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, removeToast])

  return (
    <div
      role="status"
      className={cn(
        'bg-bg-elevated border border-border-default rounded-[10px]',
        'px-4 py-3 max-w-[360px] flex items-start gap-3',
        'shadow-[0_4px_16px_#0000004D]'
      )}
      style={{ borderLeft: `3px solid ${ACCENT_COLORS[toast.type]}` }}
    >
      <Icon size={16} style={{ color: ACCENT_COLORS[toast.type] }} className="mt-0.5 shrink-0" />
      <p className="text-[13px] font-medium text-text-primary">{toast.message}</p>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
