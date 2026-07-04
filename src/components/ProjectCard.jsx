import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Ban, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import ProgressBar from './ui/ProgressBar'

function computeProgress(tasks, subtasks, doneStageIds) {
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => doneStageIds.has(t.stage_id)).length
  const totalSubs = subtasks.length
  const doneSubs = subtasks.filter(s => s.done).length
  const total = totalTasks + totalSubs
  if (total === 0) return 0
  return ((doneTasks + doneSubs) / total) * 100
}

export default function ProjectCard({ project, tasks, subtasks, stages, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const today = new Date().toISOString().split('T')[0]

  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const blockedStageIds = new Set(stages.filter(s => s.name === 'Bloccato').map(s => s.id))

  const projectTasks = tasks.filter(t => t.project_id === project.id)
  const projectSubtasks = subtasks.filter(s => projectTasks.some(t => t.id === s.task_id))

  const openTasks = projectTasks.filter(t => !doneStageIds.has(t.stage_id))
  const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < today)
  const blockedTasks = projectTasks.filter(t => blockedStageIds.has(t.stage_id))

  const progress = computeProgress(projectTasks, projectSubtasks, doneStageIds)

  const stageDistrib = stages.map(s => ({
    stage: s,
    count: projectTasks.filter(t => t.stage_id === s.id).length,
  })).filter(s => s.count > 0)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="bg-card rounded-xl border border-edge p-4 cursor-pointer hover:shadow-md transition-shadow group relative"
    >
      {(onEdit || onDelete) && (
        <div
          ref={menuRef}
          className="absolute top-2 right-2"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 rounded-md text-faint hover:text-dim hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 bg-card border border-edge rounded-lg shadow-lg z-20 w-36 py-1">
              {onEdit && (
                <button
                  onClick={() => { setMenuOpen(false); onEdit(project) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-dim hover:bg-gray-50 hover:text-ink transition-colors"
                >
                  <Pencil size={12} /> Modifica
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { setMenuOpen(false); onDelete(project) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} /> Elimina
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: project.color + '22' }}
        >
          {project.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink text-sm group-hover:text-primary transition-colors pr-6">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-faint mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      <ProgressBar value={progress} color={project.color} height={4} className="mb-3" />

      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="text-dim">{openTasks.length} aperte</span>
        {overdueTasks.length > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <Clock size={11} /> {overdueTasks.length} in ritardo
          </span>
        )}
        {blockedTasks.length > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <Ban size={11} /> {blockedTasks.length} bloccate
          </span>
        )}
      </div>

      {stageDistrib.length > 0 && (
        <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
          {stageDistrib.map(({ stage, count }) => (
            <div
              key={stage.id}
              className="h-full"
              style={{ backgroundColor: stage.color, flex: count }}
              title={`${stage.name}: ${count}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
