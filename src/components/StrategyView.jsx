import { useState } from 'react'
import { Plus, Pin, Mail, Phone, Building2, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import Button from './ui/Button'
import StrategyNoteModal from './StrategyNoteModal'

const CATEGORY_LABELS = {
  idea: 'Idea',
  analisi: 'Analisi',
  contatto: 'Contatto',
  nota: 'Nota',
  todo: 'Todo',
}

const CATEGORY_COLORS = {
  idea: 'bg-yellow-100 text-yellow-700',
  analisi: 'bg-blue-100 text-blue-700',
  contatto: 'bg-purple-100 text-purple-700',
  nota: 'bg-gray-100 text-gray-600',
  todo: 'bg-green-100 text-green-700',
}

const FILTERS = [
  { value: '', label: 'Tutti' },
  { value: 'idea', label: 'Idee' },
  { value: 'analisi', label: 'Analisi' },
  { value: 'contatto', label: 'Contatti' },
  { value: 'nota', label: 'Note' },
  { value: 'todo', label: 'Todo' },
]

function ContactCard({ note, onClick }) {
  return (
    <div
      className="bg-surface border border-edge rounded-xl p-4 cursor-pointer hover:border-accent/50 transition-colors"
      onClick={() => onClick(note)}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-ink text-sm leading-tight">{note.title}</div>
          {note.contact_role && <div className="text-xs text-faint mt-0.5">{note.contact_role}</div>}
        </div>
      </div>

      {note.contact_structure && (
        <div className="flex items-center gap-1.5 text-xs text-dim mb-1.5">
          <Building2 size={11} className="flex-shrink-0" />
          <span className="truncate">{note.contact_structure}</span>
        </div>
      )}
      {note.contact_email && (
        <div className="flex items-center gap-1.5 text-xs mb-1.5">
          <Mail size={11} className="text-accent flex-shrink-0" />
          <a
            href={`mailto:${note.contact_email}`}
            className="text-accent hover:underline truncate"
            onClick={e => e.stopPropagation()}
          >
            {note.contact_email}
          </a>
        </div>
      )}
      {note.contact_phone && (
        <div className="flex items-center gap-1.5 text-xs mb-1.5">
          <Phone size={11} className="text-accent flex-shrink-0" />
          <a
            href={`tel:${note.contact_phone}`}
            className="text-accent hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {note.contact_phone}
          </a>
        </div>
      )}
      {note.content && (
        <p className="text-xs text-faint mt-2 line-clamp-2">{note.content}</p>
      )}
    </div>
  )
}

function NoteCard({ note, onClick }) {
  return (
    <div
      className="bg-surface border border-edge rounded-xl p-4 cursor-pointer hover:border-accent/50 transition-colors"
      onClick={() => onClick(note)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[note.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {CATEGORY_LABELS[note.category] ?? note.category}
          </span>
          {note.pinned && <Pin size={11} className="text-accent" />}
        </div>
        <span className="text-xs text-faint flex-shrink-0 flex items-center gap-1">
          <Calendar size={10} />
          {format(new Date(note.created_at), 'd MMM', { locale: it })}
        </span>
      </div>
      <div className="font-semibold text-ink text-sm mb-1">{note.title}</div>
      {note.content && <p className="text-xs text-dim line-clamp-3">{note.content}</p>}
    </div>
  )
}

export default function StrategyView({ projectId, strategy }) {
  const { notes, create, update, remove } = strategy
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [defaultCategory, setDefaultCategory] = useState('nota')

  const openNew = (cat = 'nota') => {
    setSelectedNote(null)
    setDefaultCategory(cat)
    setModalOpen(true)
  }

  const openEdit = (note) => {
    setSelectedNote(note)
    setDefaultCategory(note.category)
    setModalOpen(true)
  }

  const handleSave = async (form) => {
    if (selectedNote) {
      await update(selectedNote.id, form)
    } else {
      await create(form)
    }
  }

  const filtered = categoryFilter ? notes.filter(n => n.category === categoryFilter) : notes

  const contacts = filtered.filter(n => n.category === 'contatto')
  const otherNotes = filtered.filter(n => n.category !== 'contatto')

  return (
    <div>
      {/* Category filter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setCategoryFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-surface border border-edge text-dim hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contacts section */}
      {(!categoryFilter || categoryFilter === 'contatto') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Contatti</h3>
            <Button variant="outline" size="sm" onClick={() => openNew('contatto')}>
              <Plus size={13} /> Nuovo contatto
            </Button>
          </div>
          {contacts.length === 0 ? (
            <div className="text-xs text-faint text-center py-6 border border-dashed border-edge rounded-xl">
              Nessun contatto. Aggiungi referenti, partner o clienti.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.map(n => <ContactCard key={n.id} note={n} onClick={openEdit} />)}
            </div>
          )}
        </div>
      )}

      {/* Notes / Ideas / Analysis / Todo section */}
      {(!categoryFilter || categoryFilter !== 'contatto') && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink">Note e Idee</h3>
            <Button variant="outline" size="sm" onClick={() => openNew(categoryFilter || 'nota')}>
              <Plus size={13} /> Nuova nota
            </Button>
          </div>
          {otherNotes.length === 0 ? (
            <div className="text-xs text-faint text-center py-6 border border-dashed border-edge rounded-xl">
              Nessuna nota. Aggiungi idee, analisi o todo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherNotes.map(n => <NoteCard key={n.id} note={n} onClick={openEdit} />)}
            </div>
          )}
        </div>
      )}

      <StrategyNoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        note={selectedNote}
        defaultCategory={defaultCategory}
        onSave={handleSave}
        onDelete={remove}
      />
    </div>
  )
}
