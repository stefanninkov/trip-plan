import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n/config'
import { cn } from '@/utils/cn'

/**
 * Compact language switcher. Renders each supported language as a pill;
 * clicking swaps the i18next language and persists the choice in
 * localStorage (via the LanguageDetector `caches` option).
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? 'en'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-secondary p-0.5',
        className
      )}
    >
      <Globe size={12} className="text-text-tertiary ml-1.5" />
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = current.startsWith(lang.code)
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => void i18n.changeLanguage(lang.code as LanguageCode)}
            aria-pressed={active}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.5px] transition-colors',
              active
                ? 'bg-accent text-bg-primary'
                : 'text-text-tertiary hover:text-text-primary'
            )}
          >
            {lang.code}
          </button>
        )
      })}
    </div>
  )
}
