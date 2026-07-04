import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Plus } from 'lucide-react'
import ProgressBar from './ui/ProgressBar'

function SortableSubtask({ sub, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1.5 group">
      <button {...attributes} {...listeners} className="cursor-grab text-faint hover:text-dim touch-none flex-shrink-0">
        <GripVertical size={14} />
      </button>
      <input
        type="checkbox"
        checked={sub.done}
        onChange={() => onToggle(sub.id, !sub.done)}
        className="w-4 h-4 rounded accent-accent flex-shrink-0"
      />
      <span className={`flex-1 text-sm ${sub.done ? 'line-through text-faint' : 'text-ink'}`}>{sub.text}</span>
      <button onClick={() => onDelete(sub.id)} className="opacity-0 group-hover:opacity-100 text-faint hover:text-red-500 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

export default function SubtaskList({ subtasks, onAdd, onToggle, onDelete, onReorder }) {
  const [newText, setNewText] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const done = subtasks.filter(s => s.done).length
  const pct = subtasks.length > 0 ? (done / subtasks.length) * 100 : 0

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = subtasks.findIndex(s => s.id === active.id)
    const newIdx = subtasks.findIndex(s => s.id === over.id)
    const reordered = arrayMove(subtasks, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: i }))
    onReorder(reordered)
  }

  const handleAdd = () => {
    const text = newText.trim()
    if (!text) return
    onAdd(text)
    setNewText('')
  }

  return (
    <div>
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <ProgressBar value={pct} height={4} className="flex-1" />
          <span className="text-xs text-faint w-10 text-right">{done}/{subtasks.length}</span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={subtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {subtasks.map(sub => (
            <SortableSubtask key={sub.id} sub={sub} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2 mt-2">
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Aggiungi sotto-attività..."
          className="flex-1 text-sm px-3 py-1.5 border border-edge rounded-lg placeholder:text-faint focus:outline-none focus:border-accent"
        />
        <button onClick={handleAdd} className="p-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-40" disabled={!newText.trim()}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
