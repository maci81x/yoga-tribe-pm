export default function Input({ label, value, onChange, placeholder, type = 'text', className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-dim mb-1">{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-edge rounded-lg text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        {...props}
      />
    </div>
  )
}

export function Textarea({ label, value, onChange, placeholder, rows = 3, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-dim mb-1">{label}</label>}
      <textarea
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm bg-white border border-edge rounded-lg text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
      />
    </div>
  )
}
