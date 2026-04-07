import { useState, useRef, useEffect } from 'react'
import type { ProgressLog as ProgressLogType } from '../types'

interface Props {
  logs: ProgressLogType[]
  onAdd: (content: string) => void
  onUpdate: (log: ProgressLogType) => void
  onDelete: (id: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export function ProgressLog({ logs, onAdd, onUpdate, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
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

  const startEdit = (log: ProgressLogType) => {
    setEditingId(log.id)
    setEditValue(log.content)
  }

  const submitEdit = (log: ProgressLogType) => {
    if (editValue.trim() && editValue.trim() !== log.content) {
      onUpdate({ ...log, content: editValue.trim() })
    }
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="progress-log">
      <div className="section-header">
        <button className="section-toggle" onClick={() => setCollapsed(c => !c)}>
          <span className="section-chevron">{collapsed ? '▸' : '▾'}</span>
          <h3>Progress{collapsed && logs.length > 0 ? ` (${logs.length})` : ''}</h3>
        </button>
        {!collapsed && !adding && (
          <button className="btn-sm" onClick={() => { setAdding(true); setTimeout(() => textareaRef.current?.focus(), 0) }}>
            + Log
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
                placeholder="What did you do?"
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

          {logs.length === 0 && !adding && (
            <p className="empty-hint">No progress logs yet</p>
          )}

          {logs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-date">{formatDate(log.createdAt)}</span>
              {editingId === log.id ? (
                <textarea
                  ref={editTextareaRef}
                  className="multiline-edit-input autosize-textarea"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) submitEdit(log)
                    if (e.key === 'Escape') { setEditingId(null); setEditValue('') }
                  }}
                  onBlur={() => submitEdit(log)}
                  autoFocus
                />
              ) : (
                <span className="log-content multiline" onDoubleClick={() => startEdit(log)}>{log.content}</span>
              )}
              <button
                className="btn-icon btn-danger log-delete"
                title="Delete"
                onClick={() => onDelete(log.id)}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
