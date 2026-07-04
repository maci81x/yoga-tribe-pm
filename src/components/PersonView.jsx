import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronRight, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { useProjects } from '../hooks/useProjects'
import Avatar from './ui/Avatar'
import { PriorityBadge, StageBadge } from './ui/Badge'
import ProgressBar from './ui/ProgressBar'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

function InlineEdit({ value, onSave, className = '', placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  useEffect(() => { setVal(value) }, [value])

  const save = async () => {
    if (val.trim() !== value) await onSave(val.trim())
    setEditing(false)
  }

  const cancel = () => { setVal(value); setEditing(false) }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          className={`border-b border-accent focus:outline-none bg-transparent ${className}`}
          placeholder={placeholder}
        />
        <button onClick={save} className="text-accent hover:text-accent p-0.5"><Check size={13} /></button>
        <button onClick={cancel} className="text-faint hover:text-dim p-0.5"><X size={13} /></button>
      </span>
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-text hover:underline decoration-dashed underline-offset-2 ${className}`}
      title="Clicca per modificare"
    >
      {value || <span className="text-faint italic">{placeholder}</span>}
    </span>
  )
}

export default function PersonView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { people, stages, updatePerson } = useApp()
  const { projects } = useProjects()
  const [tasks, setTasks] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)

  const person = people.find(p => p.id === id)

  const loadTasks = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data: t } = await supabase.from('yt_tasks').select('*').eq('assignee_id', id).order('due_date', { nullsFirst: false })
    setTasks(t ?? [])
    if (t && t.length > 0) {
      const { data: s } = await supabase.from('yt_subtasks').select('*').in('task_id', t.map(r => r.id))
      setSubtasks(s ?? [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadTasks() }, [loadTasks])

  if (!person) return (
    <div className="text-faint text-center py-16">Persona non trovata</div>
  )

  const today = new Date().toISOString().split('T')[0]
  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const openTasks = tasks.filter(t => !doneStageIds.has(t.stage_id))
  const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < today)

  const byProject = projects
    .map(proj => ({
      project: proj,
      tasks: tasks.filter(t => t.project_id === proj.id),
    }))
    .filter(g => g.tasks.length > 0)

  const removeAssignment = async (taskId) => {
    await supabase.from('yt_tasks').update({ assignee_id: null }).eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const reassignTask = async (taskId, newPersonId) => {
    await supabase.from('yt_tasks').update({ assignee_id: newPersonId || null }).eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

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
          <h1 className="text-xl font-bold text-ink">
            <InlineEdit
              value={person.name}
              onSave={v => updatePerson(person.id, { name: v })}
              className="text-xl font-bold"
              placeholder="Nome"
            />
          </h1>
          <p className="text-sm text-faint mt-0.5">
            <InlineEdit
              value={person.role ?? ''}
              onSave={v => updatePerson(person.id, { role: v })}
              className="text-sm text-faint"
              placeholder="Aggiungi ruolo..."
            />
          </p>
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
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3 border-b border-edge last:border-0 hover:bg-gray-50 transition-colors">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="text-sm font-medium text-ink truncate">{task.title}</div>
                        {task.tag && <span className="text-[10px] text-faint">{task.tag}</span>}
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
                      <select
                        value=""
                        onChange={e => e.target.value === '__remove__' ? removeAssignment(task.id) : reassignTask(task.id, e.target.value)}
                        className="text-xs border border-edge rounded px-1.5 py-1 text-dim focus:outline-none focus:border-accent bg-white"
                        onClick={e => e.stopPropagation()}
                        title="Riassegna o rimuovi"
                      >
                        <option value="" disabled>Riassegna</option>
                        <option value="__remove__">— Rimuovi assegnazione</option>
                        {people.filter(p => p.id !== id && p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
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
