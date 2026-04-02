import { useState } from 'react'
import type { Resource } from '../types'
import { ResourceAddForm } from './ResourceAddForm'

const TYPE_ICONS: Record<Resource['type'], string> = {
  file: '📁',
  url: '🔗',
  chat: '💬',
  memo: '📝',
}

interface Props {
  resources: Resource[]
  onAdd: (type: Resource['type'], value: string, label: string) => void
  onUpdate: (resource: Resource) => void
  onDelete: (id: string) => void
}

export function ResourceList({ resources, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const startEdit = (r: Resource) => {
    setEditingId(r.id)
    setEditValue(r.label)
  }

  const submitEdit = (r: Resource) => {
    if (editValue.trim() && editValue.trim() !== r.label) {
      onUpdate({ ...r, label: editValue.trim() })
    }
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="resource-list">
      <div className="section-header">
        <h3>Resources</h3>
        {!adding && (
          <button className="btn-sm" onClick={() => setAdding(true)}>+ Add</button>
        )}
      </div>

      {resources.length === 0 && !adding && (
        <p className="empty-hint">No resources yet</p>
      )}

      {resources.map(r => (
        <div key={r.id} className="resource-item">
          <span className="resource-icon">{TYPE_ICONS[r.type]}</span>
          {editingId === r.id ? (
            <input
              className={`resource-edit-input ${r.type === 'file' ? 'mono' : ''}`}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitEdit(r)
                if (e.key === 'Escape') { setEditingId(null); setEditValue('') }
              }}
              onBlur={() => submitEdit(r)}
              autoFocus
            />
          ) : (
            <span
              className={`resource-value ${r.type === 'file' ? 'mono' : ''}`}
              title={r.value}
              onDoubleClick={() => startEdit(r)}
            >
              {r.label}
            </span>
          )}
          <div className="resource-actions">
            {(r.type === 'url' || r.type === 'chat') && (
              <a href={r.value} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Open">
                ↗
              </a>
            )}
            <button
              className="btn-icon"
              title={r.type === 'file' ? 'Copy path — Finder: Cmd+Shift+G' : 'Copy'}
              onClick={() => copyToClipboard(r.value, r.id)}
            >
              {copiedId === r.id ? '✓' : '⧉'}
            </button>
            <button
              className="btn-icon btn-danger"
              title="Delete"
              onClick={() => onDelete(r.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {adding && (
        <ResourceAddForm
          onAdd={(type, value, label) => { onAdd(type, value, label); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}
