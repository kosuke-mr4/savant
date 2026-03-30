import { useState, useRef, useEffect } from 'react'
import { detectResourceType } from '../hooks/useStorage'

interface Props {
  onAdd: (type: 'file' | 'url' | 'chat' | 'memo', value: string, label: string) => void
  onCancel: () => void
}

export function ResourceAddForm({ onAdd, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [label, setLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(detectResourceType(value.trim()), value.trim(), label.trim())
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const detectedType = value.trim() ? detectResourceType(value.trim()) : null

  return (
    <div className="resource-add-form">
      <div className="resource-add-inputs">
        <input
          ref={inputRef}
          type="text"
          placeholder="Path, URL, or memo..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resource-label-input"
        />
      </div>
      <div className="resource-add-actions">
        {detectedType && <span className="detected-type">→ {detectedType}</span>}
        <button
          className="btn-sm"
          disabled={!value.trim()}
          onClick={() => onAdd(detectResourceType(value.trim()), value.trim(), label.trim())}
        >
          Add
        </button>
        <button className="btn-sm btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
