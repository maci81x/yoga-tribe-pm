import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, LayoutGrid, List, Settings, Edit, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useTemplates } from '../hooks/useTemplates'
import KanbanBoard from './KanbanBoard'
import TaskListView from './TaskListView'
import TaskModal from './TaskModal'
import StageManager from './StageManager'
import FilterBar, { applyFilters } from './FilterBar'
import ApplyTemplateModal from './ApplyTemplateModal'
import ProgressBar from './ui/ProgressBar'
import Button from './ui/Button'

function computeProgress(tasks, subtasks, doneStageIds) {
  const total = tasks.length + subtasks.length
  if (total === 0) return 0
  const done = tasks.filter(t => doneStageIds.has(t.stage_id)).length + subtasks.filter(s => s.done).length
  return (done / total) * 100
}

export default function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { people, stages } = useApp()
  const { projects } = useProjects()
  const taskOps = useTasks(id)
  const { tasks, subtasks, loading, createTask } = taskOps
  const { templates, getTasksForTemplate, getSubtasksForTemplateTask, applyTemplateToProject } = useTemplates()

  const [view, setView] = useState('kanban')
  const [filters, setFilters] = useState({ stage: '', priority: '', assignee: '', due: '', tag: '' })
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [defaultStageId, setDefaultStageId] = useState(null)
  const [stageManagerOpen, setStageManagerOpen] = useState(false)
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false)

  const project = projects.find(p => p.id === id)
  if (!project) {
    return <div className="text-faint text-center py-16">Progetto non trovato</div>
  }

  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const progress = computeProgress(tasks, subtasks, doneStageIds)

  const availableTags = [...new Set(tasks.map(t => t.tag).filter(Boolean))].sort()
  const filteredTasks = applyFilters(tasks, filters)

  const openNewTask = (stageId = null) => {
    setSelectedTask(null)
    setDefaultStageId(stageId)
    setTaskModalOpen(true)
  }

  const openEditTask = (task) => {
    setSelectedTask(task)
    setDefaultStageId(null)
    setTaskModalOpen(true)
  }

  const handleApplyTemplate = async (templateId, options) => {
    const firstStage = stages[0]
    if (!firstStage) return
    await applyTemplateToProject(templateId, id, firstStage.id, options)
    taskOps.reload()
    setApplyTemplateOpen(false)
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-faint mb-4">
        <Link to="/" className="hover:text-accent transition-colors">Progetti</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">{project.emoji} {project.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: project.color + '22' }}
            >
              {project.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">{project.name}</h1>
              {project.description && <p className="text-sm text-faint">{project.description}</p>}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-faint mb-1">
              <span>Avanzamento</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} color={project.color} height={6} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <Button variant="accent" size="sm" onClick={() => openNewTask()}>
            <Plus size={14} /> Nuova attività
          </Button>
          <Button variant="outline" size="sm" onClick={() => setApplyTemplateOpen(true)}>
            Da modello
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStageManagerOpen(true)}>
            <Settings size={14} /> Stati
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <FilterBar filters={filters} onChange={setFilters} people={people} stages={stages} tags={availableTags} />
        <div className="flex items-center gap-1 ml-auto border border-edge rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded ${view === 'kanban' ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`}
            title="Vista Kanban"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded ${view === 'list' ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`}
            title="Vista Lista"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-faint text-center py-16">Caricamento...</div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          stages={stages}
          tasks={filteredTasks}
          subtasks={subtasks}
          people={people}
          taskOps={taskOps}
          onCardClick={openEditTask}
          onAddTask={openNewTask}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          subtasks={subtasks}
          people={people}
          stages={stages}
          onTaskClick={openEditTask}
        />
      )}

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        projectId={id}
        taskOps={{
          ...taskOps,
          createTask: (data) => taskOps.createTask({ ...data, stage_id: data.stage_id || defaultStageId || stages[0]?.id }),
        }}
      />

      <StageManager open={stageManagerOpen} onClose={() => setStageManagerOpen(false)} />

      <ApplyTemplateModal
        open={applyTemplateOpen}
        onClose={() => setApplyTemplateOpen(false)}
        templates={templates}
        onApply={handleApplyTemplate}
        people={people}
      />
    </div>
  )
}
