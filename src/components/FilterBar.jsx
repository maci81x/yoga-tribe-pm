import { useState } from 'react'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'

const DUE_OPTIONS = [
  { value: '', label: 'Tutte le date' },
  { value: 'overdue', label: 'In ritardo' },
  { value: '7', label: 'Prossimi 7 giorni' },
  { value: '30', label: 'Prossimi 30 giorni' },
  { value: 'none', label: 'Senza scadenza' },
]

const selectClass = "text-xs px-3 py-1.5 border border-edge rounded-lg bg-white text-dim focus:outline-none focus:border-accent"

export default function FilterBar({ filters, onChange, people, stages, tags = [] }) {
  const [expanded, setExpanded] = useState(false)
  const hasFilters = filters.assignee || filters.priority || filters.stage || filters.due || filters.tag
  const activeCount = [filters.stage, filters.priority, filters.assignee, filters.due, filters.tag].filter(Boolean).length
  const set = (key, val) => onChange({ ...filters, [key]: val })

  const renderSelects = () => (
    <>
      <select value={filters.stage ?? ''} onChange={e => set('stage', e.target.value)} className={selectClass}>
        <option value="">Tutti gli stati</option>
        {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={filters.priority ?? ''} onChange={e => set('priority', e.target.value)} className={selectClass}>
        <option value="">Tutte le priorità</option>
        <option value="alta">Alta</option>
        <option value="media">Media</option>
        <option value="bassa">Bassa</option>
      </select>
      <select value={filters.assignee ?? ''} onChange={e => set('assignee', e.target.value)} className={selectClass}>
        <option value="">Tutte le persone</option>
        {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={filters.due ?? ''} onChange={e => set('due', e.target.value)} className={selectClass}>
        {DUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {tags.length > 0 && (
        <select value={filters.tag ?? ''} onChange={e => set('tag', e.target.value)} className={selectClass}>
          <option value="">Tutti i tag</option>
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      {hasFilters && (
        <button
          onClick={() => onChange({ stage: '', priority: '', assignee: '', due: '', tag: '' })}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent px-2 py-1.5"
        >
          <X size={12} /> Rimuovi filtri
        </button>
      )}
    </>
  )

  return (
    <div className="flex-1 min-w-0">
      <button
        className="sm:hidden flex items-center gap-1.5 text-xs px-3 py-1.5 border border-edge rounded-lg text-dim"
        onClick={() => setExpanded(v => !v)}
      >
        <SlidersHorizontal size={12} />
        Filtri{activeCount > 0 ? ` (${activeCount})` : ''}
        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="sm:hidden flex flex-wrap items-center gap-2 mt-2">
          {renderSelects()}
        </div>
      )}
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        {renderSelects()}
      </div>
    </div>
  )
}

export function applyFilters(tasks, filters) {
  const today = new Date().toISOString().split('T')[0]
  const in7 = new Date(); in7.setDate(in7.getDate() + 7)
  const in30 = new Date(); in30.setDate(in30.getDate() + 30)

  return tasks.filter(t => {
    if (filters.stage && t.stage_id !== filters.stage) return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.assignee && t.assignee_id !== filters.assignee) return false
    if (filters.tag && t.tag !== filters.tag) return false
    if (filters.due) {
      if (filters.due === 'overdue' && (!t.due_date || t.due_date >= today)) return false
      if (filters.due === '7' && (!t.due_date || t.due_date < today || t.due_date > in7.toISOString().split('T')[0])) return false
      if (filters.due === '30' && (!t.due_date || t.due_date < today || t.due_date > in30.toISOString().split('T')[0])) return false
      if (filters.due === 'none' && t.due_date) return false
    }
    return true
  })
}
