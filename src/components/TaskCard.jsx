import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { format, isPast, isWithinInterval, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import Avatar from './ui/Avatar'
import { PriorityBadge } from './ui/Badge'
import ProgressBar from './ui/ProgressBar'

function DueDateChip({ date }) {
  if (!date) return null
  const d = new Date(date + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const in3 = addDays(today, 3)
  const overdue = isPast(d) && d < today
  const soon = !overdue && d <= in3
  const color = overdue ? 'text-red-600 bg-red-50' : soon ? 'text-amber-600 bg-amber-50' : 'text-faint bg-gray-50'
  return (
    <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${color}`}>
      <Clock size={10} />
      {format(d, 'd MMM', { locale: it })}
    </span>
  )
}

export default function TaskCard({ task, subtasks, people, onClick }) {
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const assignee = people.find(p => p.id === task.assignee_id)
  const taskSubs = subtasks.filter(s => s.task_id === task.id)
  const doneSubs = taskSubs.filter(s => s.done).length
  const subPct = taskSubs.length > 0 ? (doneSubs / taskSubs.length) * 100 : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border border-edge p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div onClick={onClick} className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-ink leading-snug flex-1">{task.title}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          <DueDateChip date={task.due_date} />
          {task.tag && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium truncate max-w-[120px]">
              {task.tag}
            </span>
          )}
        </div>

        {taskSubs.length > 0 && (
          <ProgressBar value={subPct} height={3} />
        )}

        <div className="flex items-center justify-between">
          {assignee && <Avatar name={assignee.name} size="xs" />}
          {taskSubs.length > 0 && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              className="ml-auto flex items-center gap-0.5 text-[10px] text-faint hover:text-dim"
            >
              {doneSubs}/{taskSubs.length}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {expanded && taskSubs.length > 0 && (
        <div className="mt-2 pt-2 border-t border-edge space-y-1">
          {taskSubs.map(sub => (
            <div key={sub.id} className="flex items-center gap-2 text-xs">
              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 ${sub.done ? 'bg-accent border-accent' : 'border-edge'}`}>
                {sub.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>}
              </div>
              <span className={sub.done ? 'line-through text-faint' : 'text-dim'}>{sub.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
