import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slugDate(name) {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}`
}

// Build rows for a project's tasks (CSV / XLSX sheet)
export function buildProjectRows(tasks, subtasks, stages, people) {
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s.name]))
  const peopleMap = Object.fromEntries(people.map(p => [p.id, p.name]))
  const subMap = {}
  subtasks.forEach(s => { if (!subMap[s.task_id]) subMap[s.task_id] = []; subMap[s.task_id].push(s) })

  return tasks.map(task => {
    const subs = subMap[task.id] ?? []
    const doneSubs = subs.filter(s => s.done).length
    return {
      'Titolo': task.title,
      'Stato': stageMap[task.stage_id] ?? '',
      'Priorità': task.priority ?? '',
      'Assegnatario': task.assignee_id ? (peopleMap[task.assignee_id] ?? '') : '',
      'Scadenza': task.due_date ?? '',
      'Tag': task.tag ?? '',
      'Progresso subtask (%)': subs.length > 0 ? Math.round((doneSubs / subs.length) * 100) : '',
      'Sotto-attività': subs.map(s => s.text).join('; '),
    }
  })
}

export function exportCSV(rows, filename) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const esc = v => {
    const s = String(v ?? '')
    return (s.includes(',') || s.includes('\n') || s.includes('"'))
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\r\n')
  downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), filename)
}

export function exportXLSX(rows, sheetName, filename) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), filename)
}

export function exportXLSXMulti(sheets, filename) {
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}])
    XLSX.utils.book_append_sheet(wb, ws, name)
  })
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), filename)
}

export function buildMarkdown(project, tasks, subtasks, stages, people) {
  const doneStageIds = new Set(stages.filter(s => s.is_done_stage).map(s => s.id))
  const peopleMap = Object.fromEntries(people.map(p => [p.id, p.name]))
  const subMap = {}
  subtasks.forEach(s => { if (!subMap[s.task_id]) subMap[s.task_id] = []; subMap[s.task_id].push(s) })

  const byStage = Object.fromEntries(stages.map(s => [s.id, []]))
  tasks.forEach(t => { if (!byStage[t.stage_id]) byStage[t.stage_id] = []; byStage[t.stage_id].push(t) })

  const lines = [
    `# ${project.emoji} ${project.name}`,
    project.description ? `\n> ${project.description}` : '',
    `\n_Export del ${format(new Date(), "d MMMM yyyy 'alle' HH:mm", { locale: it })}_`,
    '\n---\n',
  ]

  stages.forEach(stage => {
    const stageTasks = byStage[stage.id] ?? []
    if (!stageTasks.length) return
    lines.push(`## ${stage.name} (${stageTasks.length})`)
    stageTasks.forEach(task => {
      const check = doneStageIds.has(stage.id) ? '[x]' : '[ ]'
      lines.push(`\n- ${check} **${task.title}**`)
      if (task.description) lines.push(`  > ${task.description}`)
      const meta = []
      if (task.assignee_id && peopleMap[task.assignee_id]) meta.push(`👤 ${peopleMap[task.assignee_id]}`)
      if (task.due_date) meta.push(`📅 ${format(new Date(task.due_date), 'd MMM yyyy', { locale: it })}`)
      if (task.priority) meta.push(`🔺 ${task.priority}`)
      if (task.tag) meta.push(`🏷 ${task.tag}`)
      if (meta.length) lines.push(`  ${meta.join(' · ')}`)
      ;(subMap[task.id] ?? []).forEach(s => lines.push(`  - [${s.done ? 'x' : ' '}] ${s.text}`))
    })
    lines.push('')
  })

  return lines.filter(l => l !== '').join('\n')
}

export function downloadMarkdown(project, tasks, subtasks, stages, people) {
  const md = buildMarkdown(project, tasks, subtasks, stages, people)
  downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${slugDate(project.name)}.md`)
}

export function exportProjectCSV(project, tasks, subtasks, stages, people) {
  exportCSV(buildProjectRows(tasks, subtasks, stages, people), `${slugDate(project.name)}.csv`)
}

export function exportProjectXLSX(project, tasks, subtasks, stages, people) {
  exportXLSX(buildProjectRows(tasks, subtasks, stages, people), project.name.slice(0, 31), `${slugDate(project.name)}.xlsx`)
}
