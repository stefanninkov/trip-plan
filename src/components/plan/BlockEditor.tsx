import { useState } from 'react'
import { Plus, Trash2, GripVertical, CornerUpRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { TRAVEL_MODES, TRAVEL_MODE_LIST } from '@/constants/travel-modes'
import type { TravelMode } from '@/types/trip-plan'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TimeBlock } from '@/types/trip-plan'
import type { TripEditor } from '@/hooks/useTripEditor'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { EditableText } from '@/components/shared/EditableText'
import { BlockMoreInfo } from './BlockMoreInfo'
import { BlockCheckbox } from './BlockCheckbox'

interface Props {
  dayId: string
  blocks: TimeBlock[]
  editor: TripEditor
  allDays?: { id: string; dayNumber: number; title: string }[]
  location?: string
  dayTitle?: string
}

export function BlockList({ dayId, blocks, editor, allDays, location, dayTitle }: Props) {
  const [adding, setAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(blocks, oldIndex, newIndex)
    editor.updateDay(dayId, { blocks: reordered })
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {blocks.map((b) => (
              <SortableBlock
                key={b.id}
                block={b}
                dayId={dayId}
                editor={editor}
                allDays={allDays}
                location={location ?? ''}
                dayTitle={dayTitle ?? ''}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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

function SortableBlock({
  block,
  dayId,
  editor,
  allDays,
  location,
  dayTitle,
}: {
  block: TimeBlock
  dayId: string
  editor: TripEditor
  allDays?: { id: string; dayNumber: number; title: string }[]
  location: string
  dayTitle: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  const ModeIcon = block.travelMode ? TRAVEL_MODES[block.travelMode].icon : null
  const done = Boolean(block.completed)
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: block.travelMode
          ? `3px solid var(--color-cat-transport)`
          : `3px solid var(--color-cat-activity)`,
      }}
      className={cn(
        'bg-bg-secondary border border-border-subtle rounded-lg p-3 flex gap-2 group transition-opacity',
        done && 'opacity-60'
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className="shrink-0 flex items-start pt-1 text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>
      <div className="pt-0.5">
        <BlockCheckbox
          completed={done}
          onToggle={() => editor.toggleBlockCompleted(dayId, block.id)}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <EditableText
              value={block.time}
              onCommit={(v) => editor.updateBlock(dayId, block.id, { time: v })}
              placeholder="HH:MM-HH:MM"
              className={cn('font-cost text-[12px] text-text-tertiary', done && 'line-through')}
              as="span"
            />
            {ModeIcon && <ModeIcon size={12} className="text-accent" />}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {allDays && allDays.length > 1 && (
              <MoveToDayMenu
                allDays={allDays}
                currentDayId={dayId}
                onSelect={(targetId) => editor.moveBlock(block.id, dayId, targetId)}
              />
            )}
            <button
              type="button"
              onClick={() => editor.deleteBlock(dayId, block.id)}
              aria-label="Delete block"
              className="text-text-tertiary hover:text-error p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <EditableText
          value={block.title}
          onCommit={(v) => editor.updateBlock(dayId, block.id, { title: v })}
          placeholder="Block title"
          className="text-[14px] font-semibold"
          as="span"
        />
        <EditableText
          value={block.description}
          onCommit={(v) => editor.updateBlock(dayId, block.id, { description: v })}
          placeholder="Describe what happens here"
          multiline
          className="text-[13px] text-text-secondary leading-[20px]"
          as="p"
        />
        <TravelModePicker
          current={block.travelMode ?? null}
          onChange={(mode) => editor.updateBlock(dayId, block.id, { travelMode: mode })}
        />
        <BlockMoreInfo
          block={block}
          location={location}
          dayTitle={dayTitle}
          editor={editor}
          dayId={dayId}
        />
      </div>
    </div>
  )
}

function TravelModePicker({
  current,
  onChange,
}: {
  current: TravelMode | null
  onChange: (mode: TravelMode | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 text-[11px]">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'px-2 py-1 rounded-md font-medium transition-colors',
          current === null
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-tertiary hover:text-text-secondary'
        )}
      >
        None
      </button>
      {TRAVEL_MODE_LIST.map((m) => {
        const Icon = m.icon
        const active = current === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            title={m.label}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
              active
                ? 'bg-accent-muted text-accent'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated'
            )}
          >
            <Icon size={12} />
            <span className="hidden md:inline">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MoveToDayMenu({
  allDays,
  currentDayId,
  onSelect,
}: {
  allDays: { id: string; dayNumber: number; title: string }[]
  currentDayId: string
  onSelect: (dayId: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Move to day"
        className="text-text-tertiary hover:text-text-secondary p-1"
      >
        <CornerUpRight size={14} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-7 z-20 bg-bg-elevated border border-border-default rounded-lg p-1 shadow-[0_8px_24px_#00000066] min-w-[180px] flex flex-col"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-2 py-1 text-[11px] uppercase tracking-[0.5px] text-text-tertiary">
            Move to day
          </div>
          {allDays
            .filter((d) => d.id !== currentDayId)
            .map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  onSelect(d.id)
                  setOpen(false)
                }}
                className="text-left px-2 py-1.5 text-[13px] rounded-md hover:bg-bg-surface"
              >
                <span className="text-text-tertiary">Day {d.dayNumber}</span>{' '}
                <span className="text-text-primary">{d.title}</span>
              </button>
            ))}
        </div>
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
              whyPicked: null,
              historicalContext: null,
              travelMode: null,
            })
          }
        >
          Save block
        </Button>
      </div>
    </div>
  )
}
