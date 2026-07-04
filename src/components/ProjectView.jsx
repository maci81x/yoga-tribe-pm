import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, LayoutGrid, List, Settings, ChevronRight, Pencil, Download, Lightbulb } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useTemplates } from '../hooks/useTemplates'
import { useStrategy } from '../hooks/useStrategy'
import KanbanBoard from './KanbanBoard'
import TaskListView from './TaskListView'
import TaskModal from './TaskModal'
import StageManager from './StageManager'
import FilterBar, { applyFilters } from './FilterBar'
import ApplyTemplateModal from './ApplyTemplateModal'
import ProgressBar from './ui/ProgressBar'
import Button from './ui/Button'
import ProjectEditModal from './ProjectEditModal'
import StrategyView from './StrategyView'

function computeProgress(tasks, subtasks, doneStageIds) {
  const total = tasks.length + subtasks.length
  if (total === 0) return 0
  const done = tasks.filter(t => doneStageIds.has(t.stage_id)).length + subtasks.filter(s => s.done).length
  return (done / total) * 100
}

function buildMarkdown(project, tasks, subtasks, stages, people) {
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s.name]))
  const peopleMap = Object.fromEntries(people.map(p => [p.id, p.name]))
  const subtaskMap = {}
  subtasks.forEach(s => {
    if (!subtaskMap[s.task_id]) subtaskMap[s.task_id] = []
    subtaskMap[s.task_id].push(s)
  })

  const lines = [
    `# ${project.emoji} ${project.name}`,
    project.description ? `\n> ${project.description}` : '',
    `\n_Export del ${format(new Date(), "d MMMM yyyy 'alle' HH:mm", { locale: it })}_`,
    '\n---\n',
  ]

  const byStage = {}
  stages.forEach(s => { byStage[s.id] = [] })
  tasks.forEach(t => {
    if (!byStage[t.stage_id]) byStage[t.stage_id] = []
    byStage[t.stage_id].push(t)
  })

  stages.forEach(stage => {
    const stageTasks = byStage[stage.id] ?? []
    if (stageTasks.length === 0) return
    lines.push(`## ${stage.name} (${stageTasks.length})`)
    stageTasks.forEach(task => {
      const check = stage.is_done_stage ? '[x]' : '[ ]'
      lines.push(`\n- ${check} **${task.title}**`)
      if (task.description) lines.push(`  > ${task.description}`)
      const meta = []
      if (task.assignee_id && peopleMap[task.assignee_id]) meta.push(`👤 ${peopleMap[task.assignee_id]}`)
      if (task.due_date) meta.push(`📅 ${format(new Date(task.due_date), 'd MMM yyyy', { locale: it })}`)
      if (task.priority) meta.push(`🔺 ${task.priority}`)
      if (task.tag) meta.push(`🏷 ${task.tag}`)
      if (meta.length) lines.push(`  ${meta.join(' · ')}`)
      const subs = subtaskMap[task.id] ?? []
      subs.forEach(s => lines.push(`  - [${s.done ? 'x' : ' '}] ${s.title}`))
    })
    lines.push('')
  })

  return lines.filter(l => l !== '').join('\n')
}

export default function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { people, stages } = useApp()
  const { projects, update: updateProject, remove: removeProject } = useProjects()
  const taskOps = useTasks(id)
  const { tasks, subtasks, loading, createTask } = taskOps
  const { templates, getTasksForTemplate, getSubtasksForTemplateTask, applyTemplateToProject } = useTemplates()
  const strategy = useStrategy(id)

  const [view, setView] = useState('kanban')
  const [filters, setFilters] = useState({ stage: '', priority: '', assignee: '', due: '', tag: '' })
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [defaultStageId, setDefaultStageId] = useState(null)
  const [stageManagerOpen, setStageManagerOpen] = useState(false)
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)

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

  const handleProjectSave = async (form) => {
    await updateProject(id, form)
  }

  const handleProjectDelete = async (projId) => {
    await removeProject(projId)
    navigate('/')
  }

  const handleExport = () => {
    const md = buildMarkdown(project, tasks, subtasks, stages, people)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isStrategy = view === 'strategy'
  const isKanban = view === 'kanban'
  const isList = view === 'list'

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
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">{project.name}</h1>
                <button
                  onClick={() => setEditProjectOpen(true)}
                  className="text-faint hover:text-accent transition-colors"
                  title="Modifica progetto"
                >
                  <Pencil size={13} />
                </button>
              </div>
              {project.description && <p className="text-sm text-faint">{project.description}</p>}
            </div>
          </div>
          {!isStrategy && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-faint mb-1">
                <span>Avanzamento</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <ProgressBar value={progress} color={project.color} height={6} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {!isStrategy && (
            <>
              <Button variant="accent" size="sm" onClick={() => openNewTask()}>
                <Plus size={14} /> Nuova attività
              </Button>
              <Button variant="outline" size="sm" onClick={() => setApplyTemplateOpen(true)}>
                Da modello
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStageManagerOpen(true)}>
                <Settings size={14} /> Stati
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleExport} title="Esporta in Markdown">
            <Download size={14} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {!isStrategy && (
          <FilterBar filters={filters} onChange={setFilters} people={people} stages={stages} tags={availableTags} />
        )}
        <div className="flex items-center gap-1 ml-auto border border-edge rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={`p-1.5 rounded ${isKanban ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`}
            title="Vista Kanban"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded ${isList ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`}
            title="Vista Lista"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setView('strategy')}
            className={`p-1.5 rounded ${isStrategy ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`}
            title="Vista Strategia"
          >
            <Lightbulb size={15} />
          </button>
        </div>
      </div>

      {isStrategy ? (
        <StrategyView projectId={id} strategy={strategy} />
      ) : loading ? (
        <div className="text-faint text-center py-16">Caricamento...</div>
      ) : isKanban ? (
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

      <ProjectEditModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onSave={handleProjectSave}
        onDelete={handleProjectDelete}
      />
    </div>
  )
}
