import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { trackSave } from '../lib/saveTracker'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('yt_projects')
      .select('*')
      .eq('archived', false)
      .order('sort_order')
    if (err) setError(err.message)
    else { setProjects(data); setError(null) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (proj) => {
    const payload = { ...proj, sort_order: projects.length }
    const { data, error: err } = await trackSave(
      supabase.from('yt_projects').insert(payload).select().single()
    )
    if (!err) setProjects(prev => [...prev, data])
    return { data, error: err }
  }

  const update = async (id, updates) => {
    const { data, error: err } = await trackSave(
      supabase.from('yt_projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    )
    if (!err) setProjects(prev => prev.map(p => p.id === id ? data : p))
    return { data, error: err }
  }

  const archive = async (id) => {
    const { error: err } = await trackSave(
      supabase.from('yt_projects').update({ archived: true }).eq('id', id)
    )
    if (!err) setProjects(prev => prev.filter(p => p.id !== id))
    return { error: err }
  }

  return { projects, loading, error, reload: load, create, update, archive }
}
