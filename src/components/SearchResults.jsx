import { useEffect, useRef } from 'react'
import { FileText, FolderOpen, User } from 'lucide-react'

export default function SearchResults({ results, query, onSelect, onClose }) {
  const ref = useRef(null)
  const total = results.tasks.length + results.projects.length + results.people.length

  useEffect(() => {
    const handleClick = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  if (total === 0) {
    return (
      <div ref={ref} className="absolute top-full mt-1 left-0 right-0 bg-card rounded-xl shadow-xl border border-edge py-3 px-4 text-sm text-faint">
        Nessun risultato per "{query}"
      </div>
    )
  }

  return (
    <div ref={ref} className="absolute top-full mt-1 left-0 right-0 bg-card rounded-xl shadow-xl border border-edge overflow-hidden z-50">
      {results.projects.length > 0 && (
        <section>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-faint uppercase tracking-wide bg-gray-50">Progetti</div>
          {results.projects.map(p => (
            <button key={p.id} onClick={() => onSelect('project', p)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
              <FolderOpen size={14} className="text-faint flex-shrink-0" />
              <span className="text-sm text-ink">{p.emoji} {p.name}</span>
            </button>
          ))}
        </section>
      )}
      {results.tasks.length > 0 && (
        <section>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-faint uppercase tracking-wide bg-gray-50">Attività</div>
          {results.tasks.map(t => (
            <button key={t.id} onClick={() => onSelect('task', t)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
              <FileText size={14} className="text-faint flex-shrink-0" />
              <span className="text-sm text-ink truncate">{t.title}</span>
            </button>
          ))}
        </section>
      )}
      {results.people.length > 0 && (
        <section>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-faint uppercase tracking-wide bg-gray-50">Persone</div>
          {results.people.map(p => (
            <button key={p.id} onClick={() => onSelect('person', p)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
              <User size={14} className="text-faint flex-shrink-0" />
              <div>
                <div className="text-sm text-ink">{p.name}</div>
                {p.role && <div className="text-xs text-faint">{p.role}</div>}
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
