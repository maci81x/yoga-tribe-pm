import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input, { Textarea } from './ui/Input'
import Select from './ui/Select'
import SubtaskList from './SubtaskList'
import { useApp } from '../context/AppContext'

const PRIORITY_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'bassa', label: 'Bassa' },
]

export default function TaskModal({ open, onClose, task, projectId, taskOps }) {
  const { people, stages } = useApp()
  const {
    createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask, reorderSubtasks,
    getSubtasksForTask,
  } = taskOps

  const [form, setForm] = useState({
    title: '', description: '', stage_id: '', priority: 'media',
    assignee_id: '', due_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return }
    if (task) {
      setForm({
        title: task.title ?? '',
        description: task.description ?? '',
        stage_id: task.stage_id ?? '',
        priority: task.priority ?? 'media',
        assignee_id: task.assignee_id ?? '',
        due_date: task.due_date ?? '',
      })
    } else {
      const defaultStage = stages[0]
      setForm({ title: '', description: '', stage_id: defaultStage?.id ?? '', priority: 'media', assignee_id: '', due_date: '' })
    }
  }, [open, task, stages])

  const subtasks = task ? getSubtasksForTask(task.id) : []

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description,
      stage_id: form.stage_id || null,
      priority: form.priority,
      assignee_id: form.assignee_id || null,
      due_date: form.due_date || null,
    }
    if (task) await updateTask(task.id, payload)
    else await createTask(payload)
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteTask(task.id)
    onClose()
  }

  const stageOptions = stages.map(s => ({ value: s.id, label: s.name }))
  const peopleOptions = people.filter(p => p.active).map(p => ({ value: p.id, label: p.name }))

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Modifica attività' : 'Nuova attività'} size="lg">
      <div className="space-y-4">
        <Input
          label="Titolo"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Titolo attività..."
          autoFocus
        />
        <Textarea
          label="Descrizione"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Descrizione (opzionale)..."
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Stato"
            value={form.stage_id}
            onChange={e => set('stage_id', e.target.value)}
            options={stageOptions}
            placeholder="Scegli stato"
          />
          <Select
            label="Priorità"
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assegnatario"
            value={form.assignee_id}
            onChange={e => set('assignee_id', e.target.value)}
            options={peopleOptions}
            placeholder="Nessuno"
          />
          <Input
            label="Scadenza"
            type="date"
            value={form.due_date}
            onChange={e => set('due_date', e.target.value)}
          />
        </div>

        {task && (
          <div>
            <div className="text-xs font-medium text-dim mb-2">Sotto-attività</div>
            <SubtaskList
              subtasks={subtasks}
              onAdd={text => createSubtask(task.id, text)}
              onToggle={(id, done) => updateSubtask(id, { done })}
              onDelete={id => deleteSubtask(id)}
              onReorder={reordered => reorderSubtasks(task.id, reordered)}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-edge">
          {task ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
              {confirmDelete ? 'Conferma eliminazione' : 'Elimina'}
            </Button>
          ) : <div />}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
            <Button variant="accent" onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
