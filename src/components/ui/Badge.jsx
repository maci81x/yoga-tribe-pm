const PRIORITY_STYLES = {
  alta: { bg: '#fef2f2', text: '#dc2626' },
  media: { bg: '#fffbeb', text: '#d97706' },
  bassa: { bg: '#f8fafc', text: '#64748b' },
}

export function PriorityBadge({ priority }) {
  if (!priority) return null
  const s = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.media
  const labels = { alta: 'Alta', media: 'Media', bassa: 'Bassa' }
  return (
    <span
      className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {labels[priority]}
    </span>
  )
}

export function StageBadge({ stage }) {
  if (!stage) return null
  return (
    <span
      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md"
      style={{ backgroundColor: stage.color + '22', color: stage.color }}
    >
      {stage.name}
    </span>
  )
}

export function ProjectBadge({ project }) {
  if (!project) return null
  return (
    <span
      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md"
      style={{ backgroundColor: project.color + '22', color: project.color }}
    >
      {project.emoji} {project.name}
    </span>
  )
}
