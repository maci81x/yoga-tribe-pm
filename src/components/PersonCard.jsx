import Avatar from './ui/Avatar'

export default function PersonCard({ person, taskCount, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl border border-edge p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
    >
      <Avatar name={person.name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-ink">{person.name}</div>
        {person.role && <div className="text-xs text-faint truncate">{person.role}</div>}
      </div>
      {taskCount > 0 && (
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-ink">{taskCount}</div>
          <div className="text-[10px] text-faint">attività</div>
        </div>
      )}
      {!person.active && (
        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-faint rounded-full">Inattivo</span>
      )}
    </div>
  )
}
