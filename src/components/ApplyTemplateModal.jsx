import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Select from './ui/Select'
import Input from './ui/Input'

export default function ApplyTemplateModal({ open, onClose, templates, people, onApply }) {
  const [form, setForm] = useState({ templateId: '', startDate: new Date().toISOString().split('T')[0], daysBetween: '3', assigneeId: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedTemplate = templates.find(t => t.id === form.templateId)
  const peopleOptions = people.filter(p => p.active).map(p => ({ value: p.id, label: p.name }))
  const templateOptions = templates.map(t => ({ value: t.id, label: t.name }))

  const handleApply = () => {
    if (!form.templateId) return
    onApply(form.templateId, {
      startDate: new Date(form.startDate),
      daysBetween: parseInt(form.daysBetween) || 3,
      assigneeId: form.assigneeId || null,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Applica modello" size="sm">
      <div className="space-y-4">
        <Select
          label="Modello"
          value={form.templateId}
          onChange={e => set('templateId', e.target.value)}
          options={templateOptions}
          placeholder="Scegli un modello..."
        />

        {selectedTemplate && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-dim">
            {selectedTemplate.description || 'Nessuna descrizione'}
          </div>
        )}

        <Input
          label="Data di partenza"
          type="date"
          value={form.startDate}
          onChange={e => set('startDate', e.target.value)}
        />

        <Input
          label="Giorni tra attività"
          type="number"
          value={form.daysBetween}
          onChange={e => set('daysBetween', e.target.value)}
          min="0"
          max="30"
        />

        <Select
          label="Assegna tutto a (opzionale)"
          value={form.assigneeId}
          onChange={e => set('assigneeId', e.target.value)}
          options={peopleOptions}
          placeholder="Nessun assegnatario"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button variant="accent" onClick={handleApply} disabled={!form.templateId}>
            Applica modello
          </Button>
        </div>
      </div>
    </Modal>
  )
}
