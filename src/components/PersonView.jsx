import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { useProjects } from '../hooks/useProjects'
import Avatar from './ui/Avatar'
import { PriorityBadge, StageBadge } from './ui/Badge'
import ProgressBar from './ui/ProgressBar'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function PersonView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { people, stages } = useApp()
  const { projects } = useProjects()
  const [tasks, setTasks] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)

  const person = people.find(p => p.id === id)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from('yt_tasks').select('*').eq('assignee_id', id).order('due_date', { nullsFirst: false })
      .then(async ({ data: t }) => {
        setTasks(t ?? [])
        if (t && t.length > 0) {
          const { data: s } = await supabase.from('yt_subtasks').select('*').in('task_id', t.map(r => r.id))
          setSubtasks(s ?? [])
        }
        setLoading(false)
      })
  }, [id])

  if (!person) return (
    <div className="text-faint text-center py-16">Persona non trovata</div>
  )

  const today = new Date().toISOString().split('T')[0]
  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const openTasks = tasks.filter(t => !doneStageIds.has(t.stage_id))
  const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < today)

  // Raggruppa per progetto
  const byProject = projects
    .map(proj => ({
      project: proj,
      tasks: tasks.filter(t => t.project_id === proj.id),
    }))
    .filter(g => g.tasks.length > 0)

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-faint mb-4">
        <Link to="/people" className="hover:text-accent transition-colors">Persone</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">{person.name}</span>
      </div>

      <div className="flex items-center gap-4 mb-6 bg-card rounded-xl border border-edge p-5">
        <Avatar name={person.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-ink">{person.name}</h1>
          {person.role && <p className="text-sm text-faint">{person.role}</p>}
          {person.email && <p className="text-xs text-faint mt-0.5">{person.email}</p>}
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-ink">{openTasks.length}</div>
            <div className="text-xs text-faint">aperte</div>
          </div>
          {overdueTasks.length > 0 && (
            <div>
              <div className="text-2xl font-bold text-red-500">{overdueTasks.length}</div>
              <div className="text-xs text-faint">in ritardo</div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-faint text-center py-12">Caricamento...</div>
      ) : tasks.length === 0 ? (
        <div className="text-faint text-center py-12">Nessuna attività assegnata</div>
      ) : (
        <div className="space-y-6">
          {byProject.map(({ project, tasks: projTasks }) => (
            <div key={project.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: project.color + '22' }}>
                  {project.emoji}
                </div>
                <Link to={`/project/${project.id}`} className="font-semibold text-sm text-ink hover:text-accent transition-colors">
                  {project.name}
                </Link>
                <span className="text-xs text-faint">({projTasks.length})</span>
              </div>

              <div className="bg-card rounded-xl border border-edge overflow-hidden">
                {projTasks.map(task => {
                  const stage = stages.find(s => s.id === task.stage_id)
                  const taskSubs = subtasks.filter(s => s.task_id === task.id)
                  const doneSubs = taskSubs.filter(s => s.done).length
                  const subPct = taskSubs.length > 0 ? (doneSubs / taskSubs.length) * 100 : 0
                  const overdue = task.due_date && task.due_date < today && !stage?.is_done_stage

                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="flex items-center gap-3 px-4 py-3 border-b border-edge last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{task.title}</div>
                        {task.tag && (
                          <span className="text-[10px] text-faint">{task.tag}</span>
                        )}
                      </div>
                      {taskSubs.length > 0 && (
                        <div className="w-16 flex-shrink-0">
                          <ProgressBar value={subPct} height={3} />
                          <div className="text-[10px] text-faint text-center mt-0.5">{doneSubs}/{taskSubs.length}</div>
                        </div>
                      )}
                      <PriorityBadge priority={task.priority} />
                      {stage && <StageBadge stage={stage} />}
                      {task.due_date && (
                        <span className={`text-xs flex-shrink-0 ${overdue ? 'text-red-600 font-medium' : 'text-faint'}`}>
                          {format(new Date(task.due_date + 'T00:00:00'), 'd MMM', { locale: it })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
