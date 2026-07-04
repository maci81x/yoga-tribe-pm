import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'

export default function KanbanColumn({ stage, tasks, subtasks, people, onCardClick, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-xs font-semibold text-dim uppercase tracking-wide">{stage.name}</span>
          <span className="text-xs text-faint bg-gray-100 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(stage.id)}
          className="p-1 rounded-lg text-faint hover:text-dim hover:bg-gray-100 transition-colors"
          title="Aggiungi attività"
        >
          <Plus size={14} />
        </button>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 flex flex-col gap-2 min-h-24 p-1 rounded-lg transition-colors ${isOver ? 'bg-accent/5 ring-1 ring-accent/20' : ''}`}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              subtasks={subtasks}
              people={people}
              onClick={() => onCardClick(task)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-xs text-faint text-center py-4">
              Nessuna attività
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
