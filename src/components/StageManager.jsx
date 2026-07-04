import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Plus, Check } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { useApp } from '../context/AppContext'

const PRESET_COLORS = ['#94a3b8','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#22c55e','#ec4899','#06b6d4']

function SortableStageRow({ stage, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(stage.name)

  const save = () => {
    if (name.trim() && name !== stage.name) onUpdate(stage.id, { name: name.trim() })
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-2 group">
      <button {...attributes} {...listeners} className="cursor-grab text-faint hover:text-dim touch-none">
        <GripVertical size={16} />
      </button>
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 text-sm px-2 py-1 border border-accent rounded"
        />
      ) : (
        <span className="flex-1 text-sm text-ink cursor-pointer hover:text-accent" onClick={() => setEditing(true)}>
          {stage.name}
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate(stage.id, { is_done_stage: !stage.is_done_stage })}
          className={`text-xs px-2 py-0.5 rounded ${stage.is_done_stage ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-faint hover:text-dim'}`}
          title="Segna come fase completata"
        >
          <Check size={12} />
        </button>
        <button onClick={() => onDelete(stage.id)} className="opacity-0 group-hover:opacity-100 text-faint hover:text-red-500">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function StageManager({ open, onClose }) {
  const { stages, createStage, updateStage, deleteStage, reorderStages } = useApp()
  const [newName, setNewName] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = stages.findIndex(s => s.id === active.id)
    const newIdx = stages.findIndex(s => s.id === over.id)
    reorderStages(arrayMove(stages, oldIdx, newIdx).map((s, i) => ({ ...s, sort_order: i })))
  }

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    createStage({ name, color: PRESET_COLORS[stages.length % PRESET_COLORS.length], sort_order: stages.length })
    setNewName('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Gestisci stati" size="sm">
      <p className="text-xs text-faint mb-3">Trascina per riordinare. Il segno di spunta verde indica lo stato "completato".</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-edge">
            {stages.map(s => (
              <SortableStageRow key={s.id} stage={s} onUpdate={updateStage} onDelete={deleteStage} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2 mt-3 pt-3 border-t border-edge">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nuovo stato..."
          className="flex-1 text-sm px-3 py-1.5 border border-edge rounded-lg focus:outline-none focus:border-accent"
        />
        <Button variant="accent" size="sm" onClick={handleAdd} disabled={!newName.trim()}>
          <Plus size={14} /> Aggiungi
        </Button>
      </div>
    </Modal>
  )
}
