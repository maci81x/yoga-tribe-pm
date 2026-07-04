import { useState } from 'react'
import { Plus, BookTemplate, CheckSquare } from 'lucide-react'
import { useTemplates } from '../hooks/useTemplates'
import TemplateModal from './TemplateModal'
import Button from './ui/Button'
import { PriorityBadge } from './ui/Badge'

function TemplateCard({ template, tasks, onClick }) {
  const preview = tasks.slice(0, 4)
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-edge p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-sm text-ink">{template.name}</h3>
          {template.description && <p className="text-xs text-faint mt-0.5">{template.description}</p>}
        </div>
        <span className="text-xs text-faint bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
          {tasks.length} attività
        </span>
      </div>
      <div className="space-y-1 mt-3">
        {preview.map(t => (
          <div key={t.id} className="flex items-center gap-2">
            <CheckSquare size={12} className="text-faint flex-shrink-0" />
            <span className="text-xs text-dim truncate flex-1">{t.title}</span>
            <PriorityBadge priority={t.priority} />
          </div>
        ))}
        {tasks.length > 4 && (
          <div className="text-xs text-faint pt-1">+{tasks.length - 4} altre attività...</div>
        )}
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const templateOps = useTemplates()
  const { templates, loading, getTasksForTemplate } = templateOps
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const openEdit = (tmpl) => { setEditing(tmpl); setIsNew(false); setModalOpen(true) }
  const openNew = () => { setEditing(null); setIsNew(true); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">Modelli</h1>
        <Button variant="accent" size="sm" onClick={openNew}>
          <Plus size={14} /> Nuovo modello
        </Button>
      </div>

      {loading ? (
        <div className="text-faint text-center py-12">Caricamento...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-faint">
          <BookTemplate size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-3">Nessun modello ancora.</p>
          <Button variant="outline" onClick={openNew}>Crea il primo modello</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              tasks={getTasksForTemplate(t.id)}
              onClick={() => openEdit(t)}
            />
          ))}
        </div>
      )}

      <TemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        template={isNew ? null : editing}
        templateOps={templateOps}
      />
    </div>
  )
}
