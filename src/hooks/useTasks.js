import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { trackSave } from '../lib/saveTracker'

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data: t, error: te } = await supabase
      .from('yt_tasks').select('*').eq('project_id', projectId).order('sort_order')
    if (te) { setError(te.message); setLoading(false); return }
    const taskIds = (t ?? []).map(r => r.id)
    const { data: s, error: se } = taskIds.length > 0
      ? await supabase.from('yt_subtasks').select('*').in('task_id', taskIds).order('sort_order')
      : { data: [], error: null }
    if (se) setError(se.message)
    else {
      setTasks(t ?? [])
      setSubtasks(s ?? [])
      setError(null)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const createTask = async (data) => {
    const payload = { ...data, project_id: projectId, sort_order: tasks.filter(t => t.stage_id === data.stage_id).length }
    const { data: row, error: err } = await trackSave(
      supabase.from('yt_tasks').insert(payload).select().single()
    )
    if (!err) setTasks(prev => [...prev, row])
    return { data: row, error: err }
  }

  const updateTask = async (id, updates) => {
    const { data: row, error: err } = await trackSave(
      supabase.from('yt_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    )
    if (!err) setTasks(prev => prev.map(t => t.id === id ? row : t))
    return { data: row, error: err }
  }

  const deleteTask = async (id) => {
    const { error: err } = await trackSave(
      supabase.from('yt_tasks').delete().eq('id', id)
    )
    if (!err) {
      setTasks(prev => prev.filter(t => t.id !== id))
      setSubtasks(prev => prev.filter(s => s.task_id !== id))
    }
    return { error: err }
  }

  const moveTask = async (taskId, newStageId, newSortOrder) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, stage_id: newStageId, sort_order: newSortOrder } : t
    ))
    await trackSave(
      supabase.from('yt_tasks')
        .update({ stage_id: newStageId, sort_order: newSortOrder, updated_at: new Date().toISOString() })
        .eq('id', taskId)
    )
  }

  const reorderTasks = async (reordered) => {
    setTasks(prev => {
      const ids = new Set(reordered.map(t => t.id))
      return [...prev.filter(t => !ids.has(t.id)), ...reordered].sort((a, b) => {
        if (a.stage_id !== b.stage_id) return 0
        return a.sort_order - b.sort_order
      })
    })
    await Promise.all(
      reordered.map(t => supabase.from('yt_tasks').update({ sort_order: t.sort_order }).eq('id', t.id))
    )
  }

  const createSubtask = async (taskId, text) => {
    const order = subtasks.filter(s => s.task_id === taskId).length
    const { data: row, error: err } = await trackSave(
      supabase.from('yt_subtasks').insert({ task_id: taskId, text, sort_order: order }).select().single()
    )
    if (!err) setSubtasks(prev => [...prev, row])
    return { data: row, error: err }
  }

  const updateSubtask = async (id, updates) => {
    const { data: row, error: err } = await trackSave(
      supabase.from('yt_subtasks').update(updates).eq('id', id).select().single()
    )
    if (!err) setSubtasks(prev => prev.map(s => s.id === id ? row : s))
    return { data: row, error: err }
  }

  const deleteSubtask = async (id) => {
    const { error: err } = await trackSave(
      supabase.from('yt_subtasks').delete().eq('id', id)
    )
    if (!err) setSubtasks(prev => prev.filter(s => s.id !== id))
    return { error: err }
  }

  const reorderSubtasks = async (taskId, reordered) => {
    setSubtasks(prev => {
      const ids = new Set(reordered.map(s => s.id))
      return [...prev.filter(s => !ids.has(s.id)), ...reordered]
    })
    await Promise.all(
      reordered.map(s => supabase.from('yt_subtasks').update({ sort_order: s.sort_order }).eq('id', s.id))
    )
  }

  const getSubtasksForTask = (taskId) => subtasks.filter(s => s.task_id === taskId).sort((a, b) => a.sort_order - b.sort_order)

  return {
    tasks, subtasks, loading, error, reload: load,
    createTask, updateTask, deleteTask, moveTask, reorderTasks,
    createSubtask, updateSubtask, deleteSubtask, reorderSubtasks,
    getSubtasksForTask,
  }
}
