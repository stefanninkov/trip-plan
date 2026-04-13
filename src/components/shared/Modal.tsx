import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={cn(
          'w-full max-w-[480px] bg-bg-surface border border-border-subtle rounded-2xl',
          'p-6 lg:p-8 shadow-[0_8px_32px_#00000066]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
            {title && (
              <h3 id="modal-title" className="text-[18px] leading-[26px] font-semibold">
                {title}
              </h3>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-auto text-text-secondary hover:text-text-primary p-1 rounded-md"
            >
              <X size={18} />
            </button>
          </div>
        <div className="text-[14px] leading-[22px] text-text-primary">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
