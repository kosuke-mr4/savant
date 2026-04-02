import { useState, useRef } from 'react'
import type { Prompt } from '../types'

interface Props {
  prompts: Prompt[]
  onAdd: (content: string) => void
  onUpdate: (prompt: Prompt) => void
  onDelete: (id: string) => void
}

export function PromptList({ prompts, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim())
    }
    setValue('')
    setAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd()
    if (e.key === 'Escape') { setAdding(false); setValue('') }
  }

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setEditValue(prompt.content)
  }

  const submitEdit = (prompt: Prompt) => {
    if (editValue.trim() && editValue.trim() !== prompt.content) {
      onUpdate({ ...prompt, content: editValue.trim() })
    }
    setEditingId(null)
    setEditValue('')
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="prompt-list">
      <div className="section-header">
        <h3>Prompts</h3>
        {!adding && (
          <button className="btn-sm" onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0) }}>
            + Add
          </button>
        )}
      </div>

      {adding && (
        <div className="prompt-add-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Draft a prompt..."
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAdd}
          />
        </div>
      )}

      {prompts.length === 0 && !adding && (
        <p className="empty-hint">No prompts yet</p>
      )}

      {prompts.map(p => (
        <div key={p.id} className="prompt-item">
          {editingId === p.id ? (
            <input
              className="prompt-edit-input"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submitEdit(p)
                if (e.key === 'Escape') { setEditingId(null); setEditValue('') }
              }}
              onBlur={() => submitEdit(p)}
              autoFocus
            />
          ) : (
            <span className="prompt-content" onDoubleClick={() => startEdit(p)}>
              {p.content}
            </span>
          )}
          <div className="prompt-actions">
            <button
              className="btn-icon"
              title="Copy"
              onClick={() => copyToClipboard(p.content, p.id)}
            >
              {copiedId === p.id ? '✓' : '⧉'}
            </button>
            <button
              className="btn-icon btn-danger"
              title="Delete"
              onClick={() => onDelete(p.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
