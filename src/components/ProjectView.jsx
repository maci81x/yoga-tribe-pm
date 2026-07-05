import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, LayoutGrid, List, Settings, ChevronRight, Pencil, Download, ChevronDown, Lightbulb } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useTemplates } from '../hooks/useTemplates'
import { useStrategy } from '../hooks/useStrategy'
import { downloadMarkdown, exportProjectCSV, exportProjectXLSX } from '../lib/exportUtils'
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

const menuItemClass = "flex items-center gap-2 w-full px-3 py-2 text-xs text-dim hover:bg-gray-50 hover:text-ink transition-colors"

export default function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { people, stages } = useApp()
  const { projects, update: updateProject, remove: removeProject } = useProjects()
  const taskOps = useTasks(id)
  const { tasks, subtasks, loading } = taskOps
  const { templates, applyTemplateToProject } = useTemplates()
  const strategy = useStrategy(id)

  const [view, setView] = useState('kanban')
  const [filters, setFilters] = useState({ stage: '', priority: '', assignee: '', due: '', tag: '' })
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [defaultStageId, setDefaultStageId] = useState(null)
  const [stageManagerOpen, setStageManagerOpen] = useState(false)
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    if (!exportOpen) return
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [exportOpen])

  const project = projects.find(p => p.id === id)
  if (!project) return <div className="text-faint text-center py-16">Progetto non trovato</div>

  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const progress = computeProgress(tasks, subtasks, doneStageIds)
  const availableTags = [...new Set(tasks.map(t => t.tag).filter(Boolean))].sort()
  const filteredTasks = applyFilters(tasks, filters)

  const openNewTask = (stageId = null) => { setSelectedTask(null); setDefaultStageId(stageId); setTaskModalOpen(true) }
  const openEditTask = (task) => { setSelectedTask(task); setDefaultStageId(null); setTaskModalOpen(true) }

  const handleApplyTemplate = async (templateId, options) => {
    const firstStage = stages[0]
    if (!firstStage) return
    await applyTemplateToProject(templateId, id, firstStage.id, options)
    taskOps.reload()
    setApplyTemplateOpen(false)
  }

  const isStrategy = view === 'strategy'
  const isKanban = view === 'kanban'

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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: project.color + '22' }}>
              {project.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">{project.name}</h1>
                <button onClick={() => setEditProjectOpen(true)} className="text-faint hover:text-accent transition-colors" title="Modifica progetto">
                  <Pencil size={13} />
                </button>
              </div>
              {project.description && <p className="text-sm text-faint">{project.description}</p>}
            </div>
          </div>
          {!isStrategy && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-faint mb-1">
                <span>Avanzamento</span><span>{Math.round(progress)}%</span>
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
          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <Button variant="ghost" size="sm" onClick={() => setExportOpen(v => !v)} title="Esporta">
              <Download size={14} />
              <ChevronDown size={11} />
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-edge rounded-lg shadow-lg z-30 w-40 py-1">
                <button className={menuItemClass} onClick={() => { downloadMarkdown(project, tasks, subtasks, stages, people); setExportOpen(false) }}>
                  📄 Markdown (.md)
                </button>
                <button className={menuItemClass} onClick={() => { exportProjectCSV(project, tasks, subtasks, stages, people); setExportOpen(false) }}>
                  📊 CSV (.csv)
                </button>
                <button className={menuItemClass} onClick={() => { exportProjectXLSX(project, tasks, subtasks, stages, people); setExportOpen(false) }}>
                  📗 Excel (.xlsx)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {!isStrategy && (
          <FilterBar filters={filters} onChange={setFilters} people={people} stages={stages} tags={availableTags} />
        )}
        <div className="flex items-center gap-1 ml-auto border border-edge rounded-lg p-0.5">
          <button onClick={() => setView('kanban')} className={`p-1.5 rounded ${isKanban ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`} title="Kanban">
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`} title="Lista">
            <List size={15} />
          </button>
          <button onClick={() => setView('strategy')} className={`p-1.5 rounded ${isStrategy ? 'bg-primary text-white' : 'text-faint hover:text-dim'}`} title="Strategia">
            <Lightbulb size={15} />
          </button>
        </div>
      </div>

      {isStrategy ? (
        <StrategyView projectId={id} strategy={strategy} />
      ) : loading ? (
        <div className="text-faint text-center py-16">Caricamento...</div>
      ) : isKanban ? (
        <KanbanBoard stages={stages} tasks={filteredTasks} subtasks={subtasks} people={people} taskOps={taskOps} onCardClick={openEditTask} onAddTask={openNewTask} />
      ) : (
        <TaskListView tasks={filteredTasks} subtasks={subtasks} people={people} stages={stages} onTaskClick={openEditTask} />
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
      <ApplyTemplateModal open={applyTemplateOpen} onClose={() => setApplyTemplateOpen(false)} templates={templates} onApply={handleApplyTemplate} people={people} />
      <ProjectEditModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
        onSave={(form) => updateProject(id, form)}
        onDelete={async (projId) => { await removeProject(projId); navigate('/') }}
      />
    </div>
  )
}
