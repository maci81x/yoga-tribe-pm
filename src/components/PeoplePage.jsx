import { useState, useEffect } from 'react'
import { Plus, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import PersonCard from './PersonCard'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Avatar from './ui/Avatar'

function PersonModal({ open, onClose, person, onSave }) {
  const [form, setForm] = useState({ name: '', role: '', email: '' })
  useEffect(() => {
    if (open) setForm({ name: person?.name ?? '', role: person?.role ?? '', email: person?.email ?? '' })
  }, [open, person])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title={person ? 'Modifica persona' : 'Nuova persona'} size="sm">
      <div className="space-y-3">
        <Input label="Nome" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome e cognome" autoFocus />
        <Input label="Ruolo" value={form.role} onChange={e => set('role', e.target.value)} placeholder="es. Insegnante Vinyasa" />
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@esempio.it" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button variant="accent" onClick={() => { onSave(form); onClose() }} disabled={!form.name.trim()}>Salva</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PeoplePage() {
  const { people, createPerson, updatePerson } = useApp()
  const navigate = useNavigate()
  const [taskCounts, setTaskCounts] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    supabase.from('yt_tasks').select('assignee_id').then(({ data }) => {
      if (!data) return
      const counts = {}
      data.forEach(t => { if (t.assignee_id) counts[t.assignee_id] = (counts[t.assignee_id] ?? 0) + 1 })
      setTaskCounts(counts)
    })
  }, [])

  const handleSave = (form) => {
    if (editing) updatePerson(editing.id, form)
    else createPerson(form)
  }

  const openEdit = (person) => navigate(`/person/${person.id}`)
  const openNew = () => { setEditing(null); setModalOpen(true) }

  const activePeople = people.filter(p => p.active)
  const inactivePeople = people.filter(p => !p.active)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">Persone</h1>
        <Button variant="accent" size="sm" onClick={openNew}>
          <Plus size={14} /> Aggiungi persona
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePeople.map(p => (
          <PersonCard key={p.id} person={p} taskCount={taskCounts[p.id] ?? 0} onClick={() => openEdit(p)} />
        ))}
      </div>

      {inactivePeople.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-faint mb-3 flex items-center gap-2">
            <UserX size={14} /> Inattivi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inactivePeople.map(p => (
              <PersonCard key={p.id} person={p} taskCount={0} onClick={() => openEdit(p)} />
            ))}
          </div>
        </div>
      )}

      {people.length === 0 && (
        <div className="text-center py-16 text-faint">
          <p className="mb-3">Nessuna persona ancora.</p>
          <Button variant="outline" onClick={openNew}>Aggiungi la prima persona</Button>
        </div>
      )}

      <PersonModal open={modalOpen} onClose={() => setModalOpen(false)} person={editing} onSave={handleSave} />
    </div>
  )
}
