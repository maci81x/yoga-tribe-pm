import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Ban } from 'lucide-react'
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

export default function ProjectCard({ project, tasks, subtasks, stages }) {
  const navigate = useNavigate()
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

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="bg-card rounded-xl border border-edge p-4 cursor-pointer hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: project.color + '22' }}
        >
          {project.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink text-sm group-hover:text-primary transition-colors">{project.name}</h3>
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
              style={{
                backgroundColor: stage.color,
                flex: count,
              }}
              title={`${stage.name}: ${count}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
