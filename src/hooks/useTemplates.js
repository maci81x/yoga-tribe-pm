import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTemplates() {
  const [templates, setTemplates] = useState([])
  const [templateTasks, setTemplateTasks] = useState([])
  const [templateSubtasks, setTemplateSubtasks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: t }, { data: tt }, { data: ts }] = await Promise.all([
      supabase.from('yt_templates').select('*').order('created_at'),
      supabase.from('yt_template_tasks').select('*').order('sort_order'),
      supabase.from('yt_template_subtasks').select('*').order('sort_order'),
    ])
    if (t) setTemplates(t)
    if (tt) setTemplateTasks(tt)
    if (ts) setTemplateSubtasks(ts)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createTemplate = async (data) => {
    const { data: row, error } = await supabase.from('yt_templates').insert(data).select().single()
    if (!error) setTemplates(prev => [...prev, row])
    return { data: row, error }
  }

  const updateTemplate = async (id, updates) => {
    const { data: row, error } = await supabase.from('yt_templates').update(updates).eq('id', id).select().single()
    if (!error) setTemplates(prev => prev.map(t => t.id === id ? row : t))
    return { data: row, error }
  }

  const deleteTemplate = async (id) => {
    const { error } = await supabase.from('yt_templates').delete().eq('id', id)
    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== id))
      const taskIds = templateTasks.filter(t => t.template_id === id).map(t => t.id)
      setTemplateTasks(prev => prev.filter(t => t.template_id !== id))
      setTemplateSubtasks(prev => prev.filter(s => !taskIds.includes(s.template_task_id)))
    }
    return { error }
  }

  const createTemplateTask = async (templateId, data) => {
    const order = templateTasks.filter(t => t.template_id === templateId).length
    const { data: row, error } = await supabase
      .from('yt_template_tasks')
      .insert({ ...data, template_id: templateId, sort_order: order })
      .select().single()
    if (!error) setTemplateTasks(prev => [...prev, row])
    return { data: row, error }
  }

  const updateTemplateTask = async (id, updates) => {
    const { data: row, error } = await supabase.from('yt_template_tasks').update(updates).eq('id', id).select().single()
    if (!error) setTemplateTasks(prev => prev.map(t => t.id === id ? row : t))
    return { data: row, error }
  }

  const deleteTemplateTask = async (id) => {
    const { error } = await supabase.from('yt_template_tasks').delete().eq('id', id)
    if (!error) {
      setTemplateTasks(prev => prev.filter(t => t.id !== id))
      setTemplateSubtasks(prev => prev.filter(s => s.template_task_id !== id))
    }
    return { error }
  }

  const getTasksForTemplate = (templateId) =>
    templateTasks.filter(t => t.template_id === templateId).sort((a, b) => a.sort_order - b.sort_order)

  const getSubtasksForTemplateTask = (taskId) =>
    templateSubtasks.filter(s => s.template_task_id === taskId).sort((a, b) => a.sort_order - b.sort_order)

  const applyTemplateToProject = async (templateId, projectId, stageId, options = {}) => {
    const { startDate = new Date(), daysBetween = 3, assigneeId = null } = options
    const tasks = getTasksForTemplate(templateId)
    const results = []
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i]
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + i * daysBetween)
      const { data: newTask, error } = await supabase
        .from('yt_tasks')
        .insert({
          project_id: projectId,
          stage_id: stageId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          assignee_id: assigneeId,
          due_date: dueDate.toISOString().split('T')[0],
          sort_order: i,
        })
        .select().single()
      if (error) return { error }
      results.push(newTask)
      const subs = getSubtasksForTemplateTask(t.id)
      if (subs.length > 0) {
        await supabase.from('yt_subtasks').insert(
          subs.map((s, j) => ({ task_id: newTask.id, text: s.text, sort_order: j }))
        )
      }
    }
    return { data: results, error: null }
  }

  return {
    templates, templateTasks, templateSubtasks, loading, reload: load,
    createTemplate, updateTemplate, deleteTemplate,
    createTemplateTask, updateTemplateTask, deleteTemplateTask,
    getTasksForTemplate, getSubtasksForTemplateTask,
    applyTemplateToProject,
  }
}
