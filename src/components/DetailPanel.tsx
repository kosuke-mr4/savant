import { useState } from 'react'
import type { Task, Project } from '../types'
import { StatusPill } from './StatusPill'
import { ResourceList } from './ResourceList'
import { PromptList } from './PromptList'
import { ProgressLog } from './ProgressLog'
import { useResources, usePrompts, useProgressLogs } from '../hooks/useStorage'

interface Props {
  task: Task
  project: Project
  onUpdateTask: (task: Task) => void
  onDeleteTask: (id: string) => void
}

export function DetailPanel({ task, project, onUpdateTask, onDeleteTask }: Props) {
  const { resources, addResource, updateResource, deleteResource } = useResources(task.id)
  const { prompts, addPrompt, updatePrompt, deletePrompt } = usePrompts(task.id)
  const { logs, addLog, updateLog } = useProgressLogs(task.id)
  const [editingName, setEditingName] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [nameValue, setNameValue] = useState(task.name)
  const [descValue, setDescValue] = useState(task.description)
  const [copied, setCopied] = useState(false)

  const handleStatusChange = (status: Task['status']) => {
    onUpdateTask({ ...task, status })
  }

  const saveName = () => {
    if (nameValue.trim() && nameValue !== task.name) {
      onUpdateTask({ ...task, name: nameValue.trim() })
    }
    setEditingName(false)
  }

  const saveDesc = () => {
    if (descValue !== task.description) {
      onUpdateTask({ ...task, description: descValue })
    }
    setEditingDesc(false)
  }

  const copyContext = async () => {
    const lines = [
      `## ${task.name}`,
      '',
      `Status: ${task.status}`,
      `Project: ${project.name}`,
      '',
      '### Resources',
      ...resources.map(r => `- [${r.type}] ${r.value}`),
      '',
      '### Progress',
      ...logs.map(l => `- ${l.createdAt.slice(0, 10)}: ${l.content}`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-title-row">
          {editingName ? (
            <input
              className="edit-inline title-edit"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) saveName(); if (e.key === 'Escape') { setNameValue(task.name); setEditingName(false) } }}
              autoFocus
            />
          ) : (
            <h2 onClick={() => { setNameValue(task.name); setEditingName(true) }}>{task.name}</h2>
          )}
          <StatusPill status={task.status} onClick={handleStatusChange} />
        </div>
        <div className="detail-meta">
          <span className="project-label">{project.name}</span>
          <button className="btn-sm" onClick={copyContext} title="Copy context bundle">
            {copied ? '✓ Copied' : 'Copy context'}
          </button>
          <button className="btn-sm btn-danger" onClick={() => onDeleteTask(task.id)} title="Delete task">
            Delete
          </button>
        </div>
        {editingDesc ? (
          <textarea
            className="edit-inline desc-edit"
            value={descValue}
            onChange={e => setDescValue(e.target.value)}
            onBlur={saveDesc}
            onKeyDown={e => { if (e.key === 'Escape') { setDescValue(task.description); setEditingDesc(false) } }}
            placeholder="Add a description..."
            autoFocus
          />
        ) : (
          <p
            className="detail-description"
            onClick={() => { setDescValue(task.description); setEditingDesc(true) }}
          >
            {task.description || 'Add a description...'}
          </p>
        )}
      </div>

      <ResourceList resources={resources} onAdd={addResource} onUpdate={updateResource} onDelete={deleteResource} />
      <PromptList prompts={prompts} onAdd={addPrompt} onUpdate={updatePrompt} onDelete={deletePrompt} />
      <ProgressLog logs={logs} onAdd={addLog} onUpdate={updateLog} />
    </div>
  )
}
