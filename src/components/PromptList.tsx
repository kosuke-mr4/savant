import { useState, useRef, useEffect } from 'react'
import type { Prompt } from '../types'

interface Props {
  prompts: Prompt[]
  onAdd: (content: string) => void
  onUpdate: (prompt: Prompt) => void
  onDelete: (id: string) => void
}

function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export function PromptList({ prompts, onAdd, onUpdate, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (adding) autoSize(textareaRef.current) }, [value, adding])
  useEffect(() => { if (editingId) autoSize(editTextareaRef.current) }, [editValue, editingId])

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim())
    }
    setValue('')
    setAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) handleAdd()
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
        <button className="section-toggle" onClick={() => setCollapsed(c => !c)}>
          <span className="section-chevron">{collapsed ? '▸' : '▾'}</span>
          <h3>Prompts{collapsed && prompts.length > 0 ? ` (${prompts.length})` : ''}</h3>
        </button>
        {!collapsed && !adding && (
          <button className="btn-sm" onClick={() => { setAdding(true); setTimeout(() => textareaRef.current?.focus(), 0) }}>
            + Add
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          {adding && (
            <div className="multiline-add-form">
              <textarea
                ref={textareaRef}
                className="autosize-textarea"
                placeholder="Draft a prompt..."
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
              />
              <div className="multiline-add-actions">
                <span className="submit-hint">⌘+Enter to submit</span>
                <button className="btn-sm" disabled={!value.trim()} onClick={handleAdd}>Add</button>
                <button className="btn-sm btn-ghost" onClick={() => { setAdding(false); setValue('') }}>Cancel</button>
              </div>
            </div>
          )}

          {prompts.length === 0 && !adding && (
            <p className="empty-hint">No prompts yet</p>
          )}

          {prompts.map(p => (
            <div key={p.id} className="prompt-item">
              {editingId === p.id ? (
                <textarea
                  ref={editTextareaRef}
                  className="multiline-edit-input autosize-textarea"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) submitEdit(p)
                    if (e.key === 'Escape') { setEditingId(null); setEditValue('') }
                  }}
                  onBlur={() => submitEdit(p)}
                  autoFocus
                />
              ) : (
                <span className="prompt-content multiline" onDoubleClick={() => startEdit(p)}>
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
        </>
      )}
    </div>
  )
}
