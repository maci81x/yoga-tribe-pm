export default function Select({ label, value, onChange, options, placeholder, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-dim mb-1">{label}</label>}
      <select
        value={value ?? ''}
        onChange={onChange}
        className="w-full px-3 py-2 text-sm bg-white border border-edge rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
