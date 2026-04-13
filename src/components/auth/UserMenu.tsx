import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { signOut } from '@/hooks/useAuth'
import { useUiStore } from '@/store/ui-store'
import { logger } from '@/utils/logger'

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const addToast = useUiStore((s) => s.addToast)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!user) return null

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut()
      addToast('info', 'Signed out')
    } catch (err) {
      logger.error('Sign-out failed:', err)
      addToast('error', 'Failed to sign out')
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        className="w-9 h-9 rounded-full overflow-hidden bg-bg-elevated flex items-center justify-center border border-border-default hover:border-border-strong transition-colors"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
        ) : (
          <User size={16} className="text-text-secondary" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-56 bg-bg-elevated border border-border-default rounded-xl p-2 shadow-[0_8px_24px_#00000066] z-20">
          <div className="px-3 py-2">
            <p className="text-[13px] font-semibold text-text-primary truncate">
              {user.displayName || user.email}
            </p>
            {user.displayName && user.email && (
              <p className="text-[12px] text-text-tertiary truncate">{user.email}</p>
            )}
          </div>
          <div className="h-px bg-border-subtle my-1" />
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-surface hover:text-text-primary rounded-md transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
