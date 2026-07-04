import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BookTemplate, Search, X, HelpCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSaveState } from '../lib/saveTracker'
import SearchResults from './SearchResults'

function SaveIndicator() {
  const [state, setState] = useState({ pending: 0, hasError: false })
  useEffect(() => {
    const { subscribe, current } = useSaveState(setState)
    setState(current())
    return subscribe()
  }, [])

  if (state.hasError) return <span className="w-2 h-2 rounded-full bg-red-400" title="Errore salvataggio" />
  if (state.pending > 0) return <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Salvataggio in corso..." />
  return <span className="w-2 h-2 rounded-full bg-green-400" title="Salvato" />
}

export default function Layout({ children }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const q = query.trim()
      const [{ data: tasks }, { data: projects }, { data: people }] = await Promise.all([
        supabase.from('yt_tasks').select('id, title, project_id').ilike('title', `%${q}%`).limit(10),
        supabase.from('yt_projects').select('id, name, emoji, color').ilike('name', `%${q}%`).eq('archived', false).limit(5),
        supabase.from('yt_people').select('id, name, role').ilike('name', `%${q}%`).limit(5),
      ])
      setResults({ tasks: tasks ?? [], projects: projects ?? [], people: people ?? [] })
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const handleResultClick = (type, item) => {
    setQuery('')
    setResults(null)
    if (type === 'project') navigate(`/project/${item.id}`)
    if (type === 'task') navigate(`/project/${item.project_id}`)
    if (type === 'person') navigate(`/person/${item.id}`)
  }

  const navClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
      ? 'bg-white/20 text-white'
      : 'text-white/70 hover:text-white hover:bg-white/10'
    }`

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-primary text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-white rounded-lg px-2 py-1 flex items-center">
              <img src="/yoga-tribe-pm/logo.jpg" alt="Yoga Tribe" className="h-7 w-auto object-contain" />
            </div>
            <span className="text-white/80 text-xs font-semibold tracking-wider uppercase hidden sm:block">PM</span>
          </NavLink>

          <div className="flex-1 relative hidden sm:block max-w-sm" ref={searchRef}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca attività, progetti, persone..."
              className="w-full pl-8 pr-8 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 focus:border-white/40"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <X size={14} />
              </button>
            )}
            {results && (
              <SearchResults results={results} query={query} onSelect={handleResultClick} onClose={() => { setQuery(''); setResults(null) }} />
            )}
          </div>

          <nav className="hidden sm:flex items-center gap-1 ml-auto">
            <NavLink to="/" className={navClass} end>
              <LayoutDashboard size={15} /> Progetti
            </NavLink>
            <NavLink to="/people" className={navClass}>
              <Users size={15} /> Persone
            </NavLink>
            <NavLink to="/templates" className={navClass}>
              <BookTemplate size={15} /> Modelli
            </NavLink>
            <NavLink to="/guide" className={navClass} title="Guida">
              <HelpCircle size={15} />
            </NavLink>
          </nav>

          <div className="ml-auto sm:ml-2 flex items-center gap-2">
            <SaveIndicator />
            <button className="sm:hidden p-1 text-white/70 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h14M3 12h14M3 18h14" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 px-4 py-2 flex flex-col gap-1">
            <NavLink to="/" className={navClass} end onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={15} /> Progetti
            </NavLink>
            <NavLink to="/people" className={navClass} onClick={() => setMenuOpen(false)}>
              <Users size={15} /> Persone
            </NavLink>
            <NavLink to="/templates" className={navClass} onClick={() => setMenuOpen(false)}>
              <BookTemplate size={15} /> Modelli
            </NavLink>
            <NavLink to="/guide" className={navClass} onClick={() => setMenuOpen(false)}>
              <HelpCircle size={15} /> Guida
            </NavLink>
            <div className="relative mt-2 mb-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cerca..."
                className="w-full pl-8 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
