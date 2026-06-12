import { useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  className?: string
  prefix?: string
}

export default function NumInput({ value, onChange, placeholder, className = 'input', prefix }: Props) {
  const [raw, setRaw] = useState<string>('')
  const [focused, setFocused] = useState(false)

  const display = focused ? raw : (value === 0 ? '' : String(value))

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-slate-400 text-sm select-none">{prefix}</span>
      )}
      <input
        type="text"
        inputMode="decimal"
        className={`${className}${prefix ? ' pl-8' : ''}`}
        placeholder={placeholder ?? '0'}
        value={display}
        onFocus={() => {
          setFocused(true)
          setRaw(value === 0 ? '' : String(value))
        }}
        onBlur={() => {
          setFocused(false)
          const n = parseFloat(raw.replace(',', '.')) || 0
          onChange(n)
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.,]/g, '')
          setRaw(v)
          const n = parseFloat(v.replace(',', '.')) || 0
          onChange(n)
        }}
      />
    </div>
  )
}
