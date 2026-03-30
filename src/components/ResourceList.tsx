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
  onDelete: (id: string) => void
}

export function ResourceList({ resources, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
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
          <span className={`resource-value ${r.type === 'file' ? 'mono' : ''}`} title={r.value}>
            {r.label}
          </span>
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
