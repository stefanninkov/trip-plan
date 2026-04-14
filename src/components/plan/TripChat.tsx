import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, MessageSquare, X, Check, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TripPlan } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { useTripChat } from '@/hooks/useTripChat'
import { applyPatches, summarizePatches } from '@/utils/apply-patch'
import { useUiStore } from '@/store/ui-store'
import { cn } from '@/utils/cn'

export interface TripChatProps {
  plan: TripPlan
  editor: TripEditor
}

/**
 * Persistent chat pane for iterative plan editing. Collapsed as a
 * floating bubble by default; expands to a side panel on click.
 */
export function TripChat({ plan, editor }: TripChatProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, loading, send, markApplied } = useTripChat(plan)
  const addToast = useUiStore((s) => s.addToast)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSubmit = async (): Promise<void> => {
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    await send(text)
  }

  const applyOps = (msgId: string, ops: Parameters<typeof applyPatches>[1]): void => {
    const next = applyPatches(plan, ops)
    editor.replacePlan(next)
    markApplied(msgId)
    addToast('success', t('chat.applied'))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-bg-primary font-semibold shadow-[0_6px_24px_rgba(0,0,0,0.4)] hover:opacity-90 transition-opacity print:hidden"
      >
        <Sparkles size={16} />
        {t('chat.openLabel')}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        'fixed z-40 print:hidden',
        'bottom-4 right-4 left-4 md:left-auto md:bottom-5 md:right-5',
        'flex flex-col bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
        'h-[min(640px,80dvh)] w-auto md:w-[420px]'
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-[13px] font-semibold">{t('chat.title')}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('common.close')}
          className="text-text-tertiary hover:text-text-primary p-1"
        >
          <X size={14} />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0"
      >
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 text-[12px] text-text-tertiary leading-[18px]">
            <p>{t('chat.introLede')}</p>
            <ul className="flex flex-col gap-1 pl-3">
              <li className="relative pl-3">
                <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-accent" />
                {t('chat.example1')}
              </li>
              <li className="relative pl-3">
                <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-accent" />
                {t('chat.example2')}
              </li>
              <li className="relative pl-3">
                <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-accent" />
                {t('chat.example3')}
              </li>
            </ul>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'max-w-[90%] rounded-xl px-3 py-2 text-[13px] leading-[19px] whitespace-pre-wrap',
              m.role === 'user'
                ? 'self-end bg-accent text-bg-primary'
                : m.error
                  ? 'self-start bg-[#D9555520] text-error'
                  : 'self-start bg-bg-secondary text-text-primary'
            )}
          >
            <div>{m.text}</div>
            {m.ops && m.ops.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 pt-2 border-t border-border-subtle/60">
                <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                  <MessageSquare size={10} />
                  {summarizePatches(m.ops)}
                </div>
                {m.applied ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-success">
                    <Check size={11} />
                    {t('chat.applied')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => applyOps(m.id, m.ops!)}
                    className="self-start px-2.5 py-1 rounded-lg bg-bg-primary text-text-primary text-[11px] font-semibold border border-border-subtle hover:border-border-strong transition-colors"
                  >
                    {t('chat.applyChanges')}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="self-start inline-flex items-center gap-2 text-[12px] text-text-tertiary px-3 py-2">
            <Loader2 size={12} className="animate-spin" />
            {t('chat.thinking')}
          </div>
        )}
      </div>

      <form
        className="flex gap-2 p-3 border-t border-border-subtle"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSubmit()
            }
          }}
          rows={2}
          placeholder={t('chat.placeholder')}
          className="flex-1 bg-bg-secondary text-text-primary placeholder:text-text-tertiary border border-border-default rounded-lg px-3 py-2 text-[13px] leading-[18px] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-[var(--accent-muted)] resize-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label={t('chat.send')}
          className="shrink-0 w-10 self-stretch flex items-center justify-center rounded-lg bg-accent text-bg-primary font-semibold disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send size={14} />
        </button>
      </form>
    </aside>
  )
}
