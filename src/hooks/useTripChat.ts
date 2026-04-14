import { useCallback, useState } from 'react'
import i18n from 'i18next'
import { FUNCTIONS_BASE_URL } from '@/lib/firebase'
import { logger } from '@/utils/logger'
import type { TripPlan } from '@/types/trip-plan'
import type { PatchOp } from '@/utils/apply-patch'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** If this assistant message included plan edits, what they were. */
  ops?: PatchOp[]
  /** Has the user already accepted these ops into the plan? */
  applied?: boolean
  /** Set when the call failed so we can show a retry option. */
  error?: string
  createdAt: number
}

interface ChatResponse {
  kind: 'apply_patch' | 'reply_only'
  message: string
  ops?: PatchOp[]
}

export function useTripChat(plan: TripPlan) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const send = useCallback(
    async (text: string): Promise<ChatResponse | null> => {
      const trimmed = text.trim()
      if (!trimmed) return null
      if (!FUNCTIONS_BASE_URL) {
        setMessages((m) => [
          ...m,
          userMsg(trimmed),
          assistantErrMsg('Backend not configured'),
        ])
        return null
      }

      const userMessage = userMsg(trimmed)
      setMessages((m) => [...m, userMessage])
      setLoading(true)
      try {
        const history = messages.map((m) => ({ role: m.role, text: m.text }))
        const res = await fetch(`${FUNCTIONS_BASE_URL}/chatWithTrip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            history,
            message: trimmed,
            language: (i18n.resolvedLanguage ?? 'en').startsWith('sr') ? 'sr' : 'en',
          }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const data = (await res.json()) as ChatResponse
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.message || '(no reply)',
            ops: data.kind === 'apply_patch' ? data.ops : undefined,
            applied: false,
            createdAt: Date.now(),
          },
        ])
        return data
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Chat failed'
        logger.error('useTripChat:', msg)
        setMessages((m) => [...m, assistantErrMsg(msg)])
        return null
      } finally {
        setLoading(false)
      }
    },
    [messages, plan]
  )

  const markApplied = useCallback((id: string) => {
    setMessages((m) =>
      m.map((msg) => (msg.id === id ? { ...msg, applied: true } : msg))
    )
  }, [])

  const reset = useCallback(() => setMessages([]), [])

  return { messages, loading, send, markApplied, reset }
}

function userMsg(text: string): ChatMessage {
  return {
    id: `u-${Date.now()}`,
    role: 'user',
    text,
    createdAt: Date.now(),
  }
}

function assistantErrMsg(error: string): ChatMessage {
  return {
    id: `e-${Date.now()}`,
    role: 'assistant',
    text: error,
    error,
    createdAt: Date.now(),
  }
}
