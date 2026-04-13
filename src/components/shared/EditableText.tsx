import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

export interface EditableTextProps {
  value: string
  onCommit: (next: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

/**
 * Click-to-edit text. Saves on blur or Enter (Shift+Enter in multiline).
 */
export function EditableText({
  value,
  onCommit,
  placeholder = 'Click to edit\u2026',
  multiline = false,
  className,
  as = 'p',
}: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed !== value.trim()) onCommit(trimmed)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') cancel()
    if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
      e.preventDefault()
      commit()
    }
  }

  if (editing) {
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        rows={3}
        placeholder={placeholder}
        className={cn(
          'w-full bg-bg-secondary text-text-primary border border-accent rounded-md px-2 py-1.5 text-inherit focus:outline-none resize-y',
          className
        )}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          'w-full bg-bg-secondary text-text-primary border border-accent rounded-md px-2 py-1.5 text-inherit focus:outline-none',
          className
        )}
      />
    )
  }

  const Tag = as
  const empty = !value
  return (
    <Tag
      tabIndex={0}
      role="button"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setEditing(true)
        }
      }}
      className={cn(
        'cursor-text rounded-md hover:bg-bg-elevated/60 transition-colors px-1 -mx-1',
        empty && 'text-text-tertiary italic',
        className
      )}
    >
      {empty ? placeholder : value}
    </Tag>
  )
}
