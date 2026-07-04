import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import Avatar from './ui/Avatar'
import { PriorityBadge, StageBadge } from './ui/Badge'
import ProgressBar from './ui/ProgressBar'

function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors ${active ? 'text-accent' : 'text-faint hover:text-dim'}`}
    >
      {label}
      {active ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={12} />}
    </button>
  )
}

export default function TaskListView({ tasks, subtasks, people, stages, onTaskClick }) {
  const [sort, setSort] = useState({ field: 'sort_order', dir: 'asc' })
  const [expanded, setExpanded] = useState(new Set())

  const today = new Date().toISOString().split('T')[0]

  const handleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const sorted = [...tasks].sort((a, b) => {
    let va, vb
    switch (sort.field) {
      case 'title': va = a.title; vb = b.title; break
      case 'priority': { const o = { alta: 0, media: 1, bassa: 2 }; va = o[a.priority]; vb = o[b.priority]; break }
      case 'due_date': va = a.due_date ?? '9999'; vb = b.due_date ?? '9999'; break
      case 'stage': va = stages.findIndex(s => s.id === a.stage_id); vb = stages.findIndex(s => s.id === b.stage_id); break
      default: va = a.sort_order; vb = b.sort_order
    }
    if (va < vb) return sort.dir === 'asc' ? -1 : 1
    if (va > vb) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  if (sorted.length === 0) {
    return <div className="text-sm text-faint text-center py-8">Nessuna attività</div>
  }

  return (
    <>
      {/* Mobile: card layout */}
      <div className="sm:hidden space-y-2">
        {sorted.map(task => {
          const stage = stages.find(s => s.id === task.stage_id)
          const assignee = people.find(p => p.id === task.assignee_id)
          const taskSubs = subtasks.filter(s => s.task_id === task.id)
          const doneSubs = taskSubs.filter(s => s.done).length
          const subPct = taskSubs.length > 0 ? (doneSubs / taskSubs.length) * 100 : 0
          const overdue = task.due_date && task.due_date < today && !stage?.is_done_stage

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="bg-card border border-edge rounded-xl px-4 py-3 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-ink leading-snug">{task.title}</span>
                {stage && <div className="flex-shrink-0"><StageBadge stage={stage} /></div>}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {assignee && (
                  <div className="flex items-center gap-1">
                    <Avatar name={assignee.name} size="xs" />
                    <span className="text-xs text-dim">{assignee.name.split(' ')[0]}</span>
                  </div>
                )}
                {task.due_date && (
                  <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-dim'}`}>
                    {format(new Date(task.due_date + 'T00:00:00'), 'd MMM', { locale: it })}
                  </span>
                )}
                <PriorityBadge priority={task.priority} />
              </div>
              {taskSubs.length > 0 && (
                <div className="mt-2">
                  <ProgressBar value={subPct} height={3} />
                  <div className="text-[10px] text-faint mt-0.5">{doneSubs}/{taskSubs.length}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block bg-card rounded-xl border border-edge overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_120px_100px_80px_100px] gap-3 px-4 py-2.5 border-b border-edge bg-gray-50">
          <SortHeader label="Titolo" field="title" sort={sort} onSort={handleSort} />
          <SortHeader label="Avanzamento" field="sort_order" sort={sort} onSort={handleSort} />
          <SortHeader label="Assegnatario" field="sort_order" sort={sort} onSort={handleSort} />
          <SortHeader label="Scadenza" field="due_date" sort={sort} onSort={handleSort} />
          <SortHeader label="Priorità" field="priority" sort={sort} onSort={handleSort} />
          <SortHeader label="Stato" field="stage" sort={sort} onSort={handleSort} />
        </div>

        {sorted.map(task => {
          const stage = stages.find(s => s.id === task.stage_id)
          const assignee = people.find(p => p.id === task.assignee_id)
          const taskSubs = subtasks.filter(s => s.task_id === task.id)
          const doneSubs = taskSubs.filter(s => s.done).length
          const subPct = taskSubs.length > 0 ? (doneSubs / taskSubs.length) * 100 : 0
          const overdue = task.due_date && task.due_date < today && !stage?.is_done_stage
          const isExpanded = expanded.has(task.id)

          return (
            <div key={task.id}>
              <div
                className="grid grid-cols-[1fr_80px_120px_100px_80px_100px] gap-3 px-4 py-3 border-b border-edge hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {taskSubs.length > 0 && (
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); toggleExpand(task.id) }}
                      className="text-faint hover:text-dim flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <span className="text-sm text-ink truncate">{task.title}</span>
                </div>
                <div>{taskSubs.length > 0 && <ProgressBar value={subPct} height={4} />}</div>
                <div>
                  {assignee && (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={assignee.name} size="xs" />
                      <span className="text-xs text-dim truncate">{assignee.name.split(' ')[0]}</span>
                    </div>
                  )}
                </div>
                <div>
                  {task.due_date && (
                    <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-dim'}`}>
                      {format(new Date(task.due_date + 'T00:00:00'), 'd MMM', { locale: it })}
                    </span>
                  )}
                </div>
                <div><PriorityBadge priority={task.priority} /></div>
                <div>{stage && <StageBadge stage={stage} />}</div>
              </div>

              {isExpanded && taskSubs.length > 0 && (
                <div className="px-8 py-2 bg-gray-50 border-b border-edge">
                  {taskSubs.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 py-1 text-xs">
                      <div className={`w-3 h-3 rounded-sm border flex-shrink-0 ${sub.done ? 'bg-accent border-accent' : 'border-gray-300'}`} />
                      <span className={sub.done ? 'line-through text-faint' : 'text-dim'}>{sub.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
