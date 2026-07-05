import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Ban, CheckCircle2, Plus, Download } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { exportXLSXMulti } from '../lib/exportUtils'
import { useApp } from '../context/AppContext'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from './ProjectCard'
import ProjectEditModal from './ProjectEditModal'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import Modal from './ui/Modal'
import Input, { Textarea } from './ui/Input'

function StatCard({ label, value, icon: Icon, color = 'text-ink', bg = 'bg-card' }) {
  return (
    <div className={`${bg} rounded-xl border border-edge p-4 flex items-center gap-4`}>
      <div className={`${color} flex-shrink-0`}><Icon size={22} /></div>
      <div>
        <div className="text-2xl font-bold text-ink">{value}</div>
        <div className="text-xs text-faint">{label}</div>
      </div>
    </div>
  )
}

function NewProjectModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', emoji: '📌', color: '#8B5CF6' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const COLORS = ['#FF2D78','#8B5CF6','#3b82f6','#06B6D4','#10B981','#F59E0B','#EC4899','#ef4444']

  const handleCreate = async () => {
    if (!form.name.trim()) return
    await onCreate(form)
    setForm({ name: '', description: '', emoji: '📌', color: '#8B5CF6' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuovo progetto" size="sm">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            value={form.emoji}
            onChange={e => set('emoji', e.target.value)}
            className="w-14 h-14 text-3xl text-center border border-edge rounded-xl focus:outline-none focus:border-accent"
          />
          <Input className="flex-1" label="Nome progetto" value={form.name} onChange={e => set('name', e.target.value)} placeholder="es. Retreat MAREE 2026" autoFocus />
        </div>
        <Textarea label="Descrizione" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrizione (opzionale)" rows={2} />
        <div>
          <label className="block text-xs font-medium text-dim mb-1">Colore</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button variant="accent" onClick={handleCreate} disabled={!form.name.trim()}>Crea progetto</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { people, stages } = useApp()
  const { projects, loading: projLoading, create: createProject, update: updateProject, remove: removeProject } = useProjects()
  const [taskStats, setTaskStats] = useState([])
  const [subtaskStats, setSubtaskStats] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [editProjectTarget, setEditProjectTarget] = useState(null)
  const [exportingAll, setExportingAll] = useState(false)

  useEffect(() => {
    async function loadStats() {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('yt_tasks').select('id, title, project_id, stage_id, due_date, assignee_id, priority, tag'),
        supabase.from('yt_subtasks').select('id, task_id, done, text'),
      ])
      setTaskStats(t ?? [])
      setSubtaskStats(s ?? [])
      setStatsLoading(false)
    }
    loadStats()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const in7 = new Date(); in7.setDate(in7.getDate() + 7)
  const in7str = in7.toISOString().split('T')[0]

  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const blockedStageIds = new Set(stages.filter(s => s.name === 'Bloccato').map(s => s.id))

  const openTasks = taskStats.filter(t => !doneStageIds.has(t.stage_id))
  const doneTasks = taskStats.filter(t => doneStageIds.has(t.stage_id))
  const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < today)
  const blockedTasks = taskStats.filter(t => blockedStageIds.has(t.stage_id))
  const totalPct = taskStats.length > 0 ? Math.round((doneTasks.length / taskStats.length) * 100) : 0

  const upcoming = openTasks
    .filter(t => t.due_date && t.due_date >= today && t.due_date <= in7str)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 10)

  const overdueUpcoming = overdueTasks.sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5)
  const upcomingWithOverdue = [...overdueUpcoming, ...upcoming].slice(0, 12)

  const handleExportAll = async () => {
    setExportingAll(true)
    try {
      const stageMap = Object.fromEntries(stages.map(s => [s.id, s.name]))
      const peopleMap = Object.fromEntries(people.map(p => [p.id, p.name]))
      const subMap = {}
      subtaskStats.forEach(s => { if (!subMap[s.task_id]) subMap[s.task_id] = []; subMap[s.task_id].push(s) })

      // Foglio 1 — Riepilogo
      const riepilogoRows = projects.map(proj => {
        const pt = taskStats.filter(t => t.project_id === proj.id)
        const ps = subtaskStats.filter(s => pt.some(t => t.id === s.task_id))
        const donePt = pt.filter(t => doneStageIds.has(t.stage_id)).length
        const donePs = ps.filter(s => s.done).length
        const total = pt.length + ps.length
        const pct = total > 0 ? Math.round(((donePt + donePs) / total) * 100) : 0
        const overdue = pt.filter(t => !doneStageIds.has(t.stage_id) && t.due_date && t.due_date < today).length
        const blocked = pt.filter(t => blockedStageIds.has(t.stage_id)).length
        return {
          'Progetto': `${proj.emoji} ${proj.name}`,
          'Totale attività': pt.length,
          'Completate': donePt,
          'In ritardo': overdue,
          'Bloccate': blocked,
          '% avanzamento': pct,
        }
      })

      // Foglio 2 — Tutte le attività
      const tutteRows = taskStats.map(task => {
        const proj = projects.find(p => p.id === task.project_id)
        const subs = subMap[task.id] ?? []
        const doneSubs = subs.filter(s => s.done).length
        return {
          'Progetto': proj ? `${proj.emoji} ${proj.name}` : '',
          'Titolo': task.title,
          'Stato': stageMap[task.stage_id] ?? '',
          'Priorità': task.priority ?? '',
          'Assegnatario': task.assignee_id ? (peopleMap[task.assignee_id] ?? '') : '',
          'Scadenza': task.due_date ?? '',
          'Tag': task.tag ?? '',
          '% subtask': subs.length > 0 ? Math.round((doneSubs / subs.length) * 100) : '',
        }
      })

      // Foglio 3 — Persone
      const personeRows = people.filter(p => p.active).map(p => {
        const assigned = taskStats.filter(t => t.assignee_id === p.id)
        const overdue = assigned.filter(t => !doneStageIds.has(t.stage_id) && t.due_date && t.due_date < today).length
        return {
          'Nome': p.name,
          'Ruolo': p.role ?? '',
          'Email': p.email ?? '',
          'Attività assegnate': assigned.length,
          'Attività in ritardo': overdue,
        }
      })

      // Foglio 4 — Contatti strategia
      const { data: contacts } = await supabase.from('yt_strategy_notes').select('*').eq('category', 'contatto')
      const contattiRows = (contacts ?? []).map(c => {
        const proj = projects.find(p => p.id === c.project_id)
        return {
          'Progetto': proj ? `${proj.emoji} ${proj.name}` : '',
          'Nome': c.title,
          'Ruolo': c.contact_role ?? '',
          'Struttura': c.contact_structure ?? '',
          'Email': c.contact_email ?? '',
          'Telefono': c.contact_phone ?? '',
          'Note': c.content ?? '',
        }
      })

      const dateStr = new Date().toISOString().split('T')[0]
      exportXLSXMulti([
        { name: 'Riepilogo', rows: riepilogoRows },
        { name: 'Tutte le attività', rows: tutteRows },
        { name: 'Persone', rows: personeRows },
        { name: 'Contatti strategia', rows: contattiRows },
      ], `yoga-tribe-export-${dateStr}.xlsx`)
    } finally {
      setExportingAll(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">Progetti</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportAll} disabled={exportingAll}>
            <Download size={14} /> {exportingAll ? 'Esportazione...' : 'Esporta tutto'}
          </Button>
          <Button variant="accent" size="sm" onClick={() => setNewProjectOpen(true)}>
            <Plus size={14} /> Nuovo progetto
          </Button>
        </div>
      </div>

      {!statsLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Attività totali" value={taskStats.length} icon={CheckCircle2} />
          <StatCard label={`Completate (${totalPct}%)`} value={doneTasks.length} icon={CheckCircle2} color="text-green-600" />
          <StatCard label="In ritardo" value={overdueTasks.length} icon={Clock} color={overdueTasks.length > 0 ? 'text-red-500' : 'text-faint'} />
          <StatCard label="Bloccate" value={blockedTasks.length} icon={Ban} color={blockedTasks.length > 0 ? 'text-amber-500' : 'text-faint'} />
        </div>
      )}

      {projLoading ? (
        <div className="text-faint text-center py-12">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              tasks={taskStats}
              subtasks={subtaskStats}
              stages={stages}
              onEdit={(proj) => { setEditProjectTarget(proj); setEditProjectOpen(true) }}
              onDelete={(proj) => { setEditProjectTarget(proj); setEditProjectOpen(true) }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {upcomingWithOverdue.length > 0 && (
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink mb-3">Prossime scadenze</h2>
            <div className="bg-card rounded-xl border border-edge overflow-hidden">
              {upcomingWithOverdue.map(task => {
                const proj = projects.find(p => p.id === task.project_id)
                const assignee = people.find(p => p.id === task.assignee_id)
                const overdue = task.due_date < today
                const soon = !overdue && task.due_date <= new Date(today).setDate(new Date(today).getDate() + 3)
                return (
                  <div
                    key={task.id}
                    onClick={() => proj && navigate(`/project/${proj.id}`)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-edge last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {overdue && <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
                    <span className="flex-1 text-sm text-ink truncate">{task.title ?? '—'}</span>
                    {proj && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: proj.color + '22', color: proj.color }}>
                        {proj.emoji} {proj.name}
                      </span>
                    )}
                    {assignee && <Avatar name={assignee.name} size="xs" />}
                    <span className={`text-xs flex-shrink-0 ${overdue ? 'text-red-600 font-medium' : soon ? 'text-amber-600' : 'text-faint'}`}>
                      {format(new Date(task.due_date + 'T00:00:00'), 'd MMM', { locale: it })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {people.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">Attività per persona</h2>
            <div className="bg-card rounded-xl border border-edge overflow-hidden">
              {people
                .filter(p => p.active)
                .map(person => ({
                  person,
                  personTasks: openTasks.filter(t => t.assignee_id === person.id),
                  overdueCount: openTasks.filter(t => t.assignee_id === person.id && t.due_date && t.due_date < today).length,
                  blockedCount: openTasks.filter(t => t.assignee_id === person.id && blockedStageIds.has(t.stage_id)).length,
                }))
                .sort((a, b) => b.personTasks.length - a.personTasks.length || a.person.name.localeCompare(b.person.name))
                .map(({ person, personTasks, overdueCount, blockedCount }) => (
                  <div
                    key={person.id}
                    onClick={() => navigate(`/person/${person.id}`)}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-edge last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Avatar name={person.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-ink truncate">{person.name}</div>
                      {person.role && <div className="text-[10px] text-faint truncate">{person.role}</div>}
                    </div>
                    <span className="text-xs text-dim flex-shrink-0">{personTasks.length} att.</span>
                    {overdueCount > 0 && <span className="text-xs text-red-500 flex-shrink-0">{overdueCount} scad.</span>}
                    {blockedCount > 0 && <span className="text-xs text-amber-500 flex-shrink-0">{blockedCount} blocc.</span>}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      <NewProjectModal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} onCreate={createProject} />
      <ProjectEditModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={editProjectTarget}
        onSave={(form) => updateProject(editProjectTarget.id, form)}
        onDelete={async (id) => { await removeProject(id); setEditProjectOpen(false) }}
      />
    </div>
  )
}
