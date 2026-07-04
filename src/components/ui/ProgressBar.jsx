export default function ProgressBar({ value = 0, color = '#FF2D78', height = 6, showLabel = false, className = '' }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && <span className="text-xs text-faint w-8 text-right">{pct}%</span>}
    </div>
  )
}
