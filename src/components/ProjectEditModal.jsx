import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input, { Textarea } from './ui/Input'

const COLORS = ['#FF2D78','#8B5CF6','#3b82f6','#06B6D4','#10B981','#F59E0B','#EC4899','#ef4444','#E1306C','#1A0033']

export default function ProjectEditModal({ open, onClose, project, onSave, onDelete }) {
  const [form, setForm] = useState({ name: '', description: '', emoji: '📌', color: '#8B5CF6' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open && project) {
      setForm({ name: project.name, description: project.description ?? '', emoji: project.emoji ?? '📌', color: project.color ?? '#8B5CF6' })
      setConfirmDelete(false)
    }
  }, [open, project])

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await onDelete(project.id)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifica progetto" size="sm">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            value={form.emoji}
            onChange={e => set('emoji', e.target.value)}
            className="w-14 h-14 text-3xl text-center border border-edge rounded-xl focus:outline-none focus:border-accent"
          />
          <Input className="flex-1" label="Nome progetto" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>
        <Textarea label="Descrizione" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
        <div>
          <label className="block text-xs font-medium text-dim mb-2">Colore</label>
          <div className="flex flex-wrap gap-2 items-center">
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0" title="Colore personalizzato" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-edge">
          <Button variant="danger" size="sm" onClick={handleDelete}>
            {confirmDelete ? 'Conferma: elimina progetto e tutte le attività' : 'Elimina progetto'}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
            <Button variant="accent" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
