import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { TimeBlock } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { EditableText } from '@/components/shared/EditableText'
import { TipBlock } from './TipBlock'

interface Props {
  dayId: string
  blocks: TimeBlock[]
  editor: TripEditor
}

export function BlockList({ dayId, blocks, editor }: Props) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b) => (
        <div
          key={b.id}
          className="bg-bg-secondary border border-border-subtle rounded-lg p-3 flex flex-col gap-1.5 group"
        >
          <div className="flex items-baseline justify-between gap-2">
            <EditableText
              value={b.time}
              onCommit={(v) => editor.updateBlock(dayId, b.id, { time: v })}
              placeholder="HH:MM-HH:MM"
              className="font-cost text-[12px] text-text-tertiary"
              as="span"
            />
            <button
              type="button"
              onClick={() => editor.deleteBlock(dayId, b.id)}
              aria-label="Delete block"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-error p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <EditableText
            value={b.title}
            onCommit={(v) => editor.updateBlock(dayId, b.id, { title: v })}
            placeholder="Block title"
            className="text-[14px] font-semibold"
            as="span"
          />
          <EditableText
            value={b.description}
            onCommit={(v) => editor.updateBlock(dayId, b.id, { description: v })}
            placeholder="Describe what happens here"
            multiline
            className="text-[13px] text-text-secondary leading-[20px]"
            as="p"
          />
          {b.tip && <TipBlock kind="tip" text={b.tip} />}
          {b.warning && <TipBlock kind="warning" text={b.warning} />}
        </div>
      ))}

      {adding ? (
        <AddBlockForm
          onCancel={() => setAdding(false)}
          onSubmit={(data) => {
            editor.addBlock(dayId, data)
            setAdding(false)
          }}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setAdding(true)}
          className="self-start flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add block
        </Button>
      )}
    </div>
  )
}

function AddBlockForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: (b: Omit<TimeBlock, 'id'>) => void
}) {
  const [time, setTime] = useState('09:00-10:30')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const canSave = title.trim().length > 0

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 flex flex-col gap-2">
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-2">
        <Input
          placeholder="HH:MM-HH:MM"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <Input
          placeholder="Block title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <textarea
        placeholder="Describe what happens here"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-bg-secondary text-text-primary border border-border-default rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-accent resize-y"
      />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() =>
            onSubmit({
              time: time.trim(),
              title: title.trim(),
              description: description.trim(),
              tip: null,
              warning: null,
            })
          }
        >
          Save block
        </Button>
      </div>
    </div>
  )
}
