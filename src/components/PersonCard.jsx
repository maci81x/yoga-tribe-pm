import { Pencil, Trash2 } from 'lucide-react'
import Avatar from './ui/Avatar'

export default function PersonCard({ person, taskCount, onClick, onEdit, onDelete }) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-edge p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4 group relative"
    >
      <Avatar name={person.name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-ink">{person.name}</div>
        {person.role && <div className="text-xs text-faint truncate">{person.role}</div>}
      </div>
      {taskCount > 0 && (
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-ink">{taskCount}</div>
          <div className="text-[10px] text-faint">attività</div>
        </div>
      )}
      {!person.active && (
        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-faint rounded-full">Inattivo</span>
      )}
      {(onEdit || onDelete) && (
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 rounded-md bg-white/80 text-faint hover:text-accent hover:bg-white border border-edge transition-colors"
              title="Modifica"
            >
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded-md bg-white/80 text-faint hover:text-red-500 hover:bg-white border border-edge transition-colors"
              title="Elimina"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
