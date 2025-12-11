import { useEffect, useRef, useState } from 'react'

type Option = {
  value: string
  label: string
}

interface DarkSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export function DarkSelect({
  label,
  value,
  onChange,
  options,
  placeholder = '— escolher —',
  className = '',
}: DarkSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selected = options.find((o) => o.value === value)

  // fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative text-sm ${className}`}>
      {label && <span className="block text-white/70">{label}</span>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left text-white ring-1 ring-white/10"
      >
        <span className="truncate">
          {selected ? selected.label : <span className="text-white/40">{placeholder}</span>}
        </span>
        <span className="ml-2 text-[10px] text-white/60">▼</span>
      </button>

      {open && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl bg-slate-950/95 py-1 text-sm shadow-lg ring-1 ring-white/10">
          {options.map((option) => {
            const isActive = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`block w-full px-3 py-2 text-left ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
