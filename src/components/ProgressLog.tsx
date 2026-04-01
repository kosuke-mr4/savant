import { useState, useRef } from 'react'
import type { ProgressLog as ProgressLogType } from '../types'

interface Props {
  logs: ProgressLogType[]
  onAdd: (content: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function ProgressLog({ logs, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim())
    }
    setValue('')
    setAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') { setAdding(false); setValue('') }
  }

  return (
    <div className="progress-log">
      <div className="section-header">
        <h3>Progress</h3>
        {!adding && (
          <button className="btn-sm" onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0) }}>
            + Log
          </button>
        )}
      </div>

      {adding && (
        <div className="log-add-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="What did you do?"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAdd}
          />
          <button className="btn-sm" disabled={!value.trim()} onClick={handleAdd}>Add</button>
          <button className="btn-sm btn-ghost" onClick={() => { setAdding(false); setValue('') }}>Cancel</button>
        </div>
      )}

      {logs.length === 0 && !adding && (
        <p className="empty-hint">No progress logs yet</p>
      )}

      {logs.map(log => (
        <div key={log.id} className="log-entry">
          <span className="log-date">{formatDate(log.createdAt)}</span>
          <span className="log-content">{log.content}</span>
        </div>
      ))}
    </div>
  )
}
