import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { trackSave } from '../lib/saveTracker'

export function useStrategy(projectId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data } = await supabase
      .from('yt_strategy_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { load() }, [load])

  const create = async (data) => {
    const { data: row, error } = await trackSave(
      supabase.from('yt_strategy_notes')
        .insert({ ...data, project_id: projectId })
        .select().single()
    )
    if (!error) setNotes(prev => [row, ...prev].sort((a, b) => b.pinned - a.pinned))
    return { data: row, error }
  }

  const update = async (id, updates) => {
    const { data: row, error } = await trackSave(
      supabase.from('yt_strategy_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    )
    if (!error) setNotes(prev =>
      prev.map(n => n.id === id ? row : n).sort((a, b) => b.pinned - a.pinned)
    )
    return { data: row, error }
  }

  const remove = async (id) => {
    const { error } = await trackSave(
      supabase.from('yt_strategy_notes').delete().eq('id', id)
    )
    if (!error) setNotes(prev => prev.filter(n => n.id !== id))
    return { error }
  }

  return { notes, loading, reload: load, create, update, remove }
}
