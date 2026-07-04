import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [people, setPeople] = useState([])
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)

  const loadGlobal = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('yt_people').select('*').order('name'),
      supabase.from('yt_stages').select('*').order('sort_order'),
    ])
    if (p) setPeople(p)
    if (s) setStages(s)
    setLoading(false)
  }, [])

  useEffect(() => { loadGlobal() }, [loadGlobal])

  const createPerson = async (data) => {
    const { data: row, error } = await supabase.from('yt_people').insert(data).select().single()
    if (!error) setPeople(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)))
    return { data: row, error }
  }

  const updatePerson = async (id, updates) => {
    const { data: row, error } = await supabase.from('yt_people').update(updates).eq('id', id).select().single()
    if (!error) setPeople(prev => prev.map(p => p.id === id ? row : p))
    return { data: row, error }
  }

  const createStage = async (data) => {
    const { data: row, error } = await supabase.from('yt_stages').insert(data).select().single()
    if (!error) setStages(prev => [...prev, row].sort((a, b) => a.sort_order - b.sort_order))
    return { data: row, error }
  }

  const updateStage = async (id, updates) => {
    const { data: row, error } = await supabase.from('yt_stages').update(updates).eq('id', id).select().single()
    if (!error) setStages(prev => prev.map(s => s.id === id ? row : s))
    return { data: row, error }
  }

  const deleteStage = async (id) => {
    const { error } = await supabase.from('yt_stages').delete().eq('id', id)
    if (!error) setStages(prev => prev.filter(s => s.id !== id))
    return { error }
  }

  const reorderStages = async (newStages) => {
    setStages(newStages)
    await Promise.all(
      newStages.map((s, i) => supabase.from('yt_stages').update({ sort_order: i }).eq('id', s.id))
    )
  }

  return (
    <AppContext.Provider value={{
      people, stages, loading,
      createPerson, updatePerson,
      createStage, updateStage, deleteStage, reorderStages,
      reloadGlobal: loadGlobal,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
