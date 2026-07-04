import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input, { Textarea } from './ui/Input'
import Select from './ui/Select'
import { PriorityBadge } from './ui/Badge'

const PRIORITY_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'bassa', label: 'Bassa' },
]

function SortableTaskRow({ task, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const save = () => {
    if (title.trim() && title !== task.title) onUpdate(task.id, { title: title.trim() })
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-2 border-b border-edge last:border-0 group">
      <button {...attributes} {...listeners} className="cursor-grab text-faint hover:text-dim touch-none flex-shrink-0">
        <GripVertical size={14} />
      </button>
      {editing ? (
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 text-sm px-2 py-1 border border-accent rounded"
        />
      ) : (
        <span className="flex-1 text-sm text-ink cursor-pointer hover:text-accent" onClick={() => setEditing(true)}>
          {task.title}
        </span>
      )}
      <select
        value={task.priority}
        onChange={e => onUpdate(task.id, { priority: e.target.value })}
        className="text-xs border border-edge rounded px-1 py-0.5 focus:outline-none"
      >
        {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-faint hover:text-red-500 flex-shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function TemplateModal({ open, onClose, template, templateOps }) {
  const { createTemplate, updateTemplate, deleteTemplate, createTemplateTask, updateTemplateTask, deleteTemplateTask, getTasksForTemplate, reloadTemplates } = templateOps
  const [form, setForm] = useState({ name: '', description: '' })
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (!open) return
    setForm({ name: template?.name ?? '', description: template?.description ?? '' })
  }, [open, template])

  const tasks = template ? getTasksForTemplate(template.id) : []

  const handleSave = async () => {
    setSaving(true)
    if (template) await updateTemplate(template.id, form)
    else await createTemplate(form)
    setSaving(false)
    onClose()
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !template) return
    await createTemplateTask(template.id, { title: newTaskTitle.trim(), priority: 'media' })
    setNewTaskTitle('')
  }

  const handleDelete = async () => {
    await deleteTemplate(template.id)
    onClose()
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    // reorder is handled optimistically in context
  }

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Modifica modello' : 'Nuovo modello'} size="lg">
      <div className="space-y-4">
        <Input label="Nome modello" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="es. Nuovo Plesso Scuola" autoFocus />
        <Textarea label="Descrizione" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrizione del modello..." rows={2} />

        {template && (
          <div>
            <div className="text-xs font-medium text-dim mb-2">Attività del modello ({tasks.length})</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div>
                  {tasks.map(t => (
                    <SortableTaskRow key={t.id} task={t} onUpdate={updateTemplateTask} onDelete={deleteTemplateTask} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex gap-2 mt-2">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Nuova attività..."
                className="flex-1 text-sm px-3 py-1.5 border border-edge rounded-lg focus:outline-none focus:border-accent"
              />
              <Button variant="outline" size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus size={14} /> Aggiungi
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-edge">
          {template ? (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={14} /> Elimina modello
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
            <Button variant="accent" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Salvataggio...' : template ? 'Salva' : 'Crea modello'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
