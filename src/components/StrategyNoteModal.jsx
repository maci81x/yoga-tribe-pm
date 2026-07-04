import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input, { Textarea } from './ui/Input'

const CATEGORIES = [
  { value: 'idea', label: 'Idea' },
  { value: 'analisi', label: 'Analisi' },
  { value: 'contatto', label: 'Contatto' },
  { value: 'nota', label: 'Nota' },
  { value: 'todo', label: 'Todo' },
]

export default function StrategyNoteModal({ open, onClose, note, defaultCategory = 'nota', onSave, onDelete }) {
  const [form, setForm] = useState({ category: 'nota', title: '', content: '', pinned: false, contact_name: '', contact_email: '', contact_phone: '', contact_role: '', contact_structure: '' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return }
    if (note) {
      setForm({
        category: note.category ?? 'nota',
        title: note.title ?? '',
        content: note.content ?? '',
        pinned: note.pinned ?? false,
        contact_name: note.contact_name ?? '',
        contact_email: note.contact_email ?? '',
        contact_phone: note.contact_phone ?? '',
        contact_role: note.contact_role ?? '',
        contact_structure: note.contact_structure ?? '',
      })
    } else {
      setForm({ category: defaultCategory, title: '', content: '', pinned: false, contact_name: '', contact_email: '', contact_phone: '', contact_role: '', contact_structure: '' })
    }
  }, [open, note, defaultCategory])

  const isContact = form.category === 'contatto'
  const title = note ? (isContact ? 'Modifica contatto' : 'Modifica nota') : (isContact ? 'Nuovo contatto' : 'Nuova nota')

  const handleSave = async () => {
    if (!form.title.trim()) return
    await onSave(form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-dim mb-1">Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:border-accent">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {!isContact && (
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-dim">
                <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} className="accent-accent" />
                Fissa in alto
              </label>
            </div>
          )}
        </div>

        <Input label={isContact ? 'Nome / Azienda' : 'Titolo'} value={form.title} onChange={e => set('title', e.target.value)} autoFocus />

        {isContact ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Ruolo" value={form.contact_role} onChange={e => set('contact_role', e.target.value)} placeholder="es. HR Manager" />
              <Input label="Struttura / Azienda" value={form.contact_structure} onChange={e => set('contact_structure', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
              <Input label="Telefono" type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
            <Textarea label="Note" value={form.content} onChange={e => set('content', e.target.value)} rows={3} placeholder="Note sul contatto..." />
          </>
        ) : (
          <Textarea label="Contenuto" value={form.content} onChange={e => set('content', e.target.value)} rows={5} placeholder="Scrivi qui..." />
        )}

        <div className="flex items-center justify-between pt-2 border-t border-edge">
          {note ? (
            <Button variant="danger" size="sm" onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return } onDelete(note.id); onClose() }}>
              <Trash2 size={14} /> {confirmDelete ? 'Conferma' : 'Elimina'}
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Annulla</Button>
            <Button variant="accent" onClick={handleSave} disabled={!form.title.trim()}>Salva</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
