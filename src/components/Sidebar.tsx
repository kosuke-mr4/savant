import { useState } from 'react'
import type { Project, Task } from '../types'

interface Props {
  projects: Project[]
  tasks: Task[]
  selectedProjectId: string | null
  selectedTaskId: string | null
  onSelectProject: (id: string) => void
  onSelectTask: (id: string) => void
  onAddProject: (name: string) => void
  onAddTask: (name: string) => void
  onDeleteProject: (id: string) => void
  allTasksByProject: Record<string, Task[]>
}

const STATUS_DOT: Record<Task['status'], string> = {
  todo: '○',
  in_progress: '◐',
  done: '●',
}

export function Sidebar({
  projects,
  selectedProjectId,
  selectedTaskId,
  onSelectProject,
  onSelectTask,
  onAddProject,
  onAddTask,
  onDeleteProject,
  allTasksByProject,
}: Props) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [addingProject, setAddingProject] = useState(false)
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleProjectSelect = (id: string) => {
    onSelectProject(id)
    setExpandedProjects(prev => new Set(prev).add(id))
  }

  const submitProject = () => {
    if (inputValue.trim()) {
      onAddProject(inputValue.trim())
      setInputValue('')
      setAddingProject(false)
    }
  }

  const submitTask = () => {
    if (inputValue.trim() && addingTaskFor) {
      onSelectProject(addingTaskFor)
      onAddTask(inputValue.trim())
      setInputValue('')
      setAddingTaskFor(null)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Savant</h1>
      </div>
      <nav className="sidebar-nav">
        {projects.map(p => {
          const isExpanded = expandedProjects.has(p.id)
          const tasks = allTasksByProject[p.id] || []
          return (
            <div key={p.id} className="sidebar-project">
              <div
                className={`sidebar-project-header ${selectedProjectId === p.id ? 'active' : ''}`}
              >
                <button className="expand-btn" onClick={() => toggleExpand(p.id)}>
                  {isExpanded ? '▾' : '▸'}
                </button>
                <span className="project-name" onClick={() => handleProjectSelect(p.id)}>
                  {p.name}
                </span>
                <button
                  className="btn-icon sidebar-action"
                  title="Add task"
                  onClick={e => {
                    e.stopPropagation()
                    handleProjectSelect(p.id)
                    setAddingTaskFor(p.id)
                    setInputValue('')
                    setExpandedProjects(prev => new Set(prev).add(p.id))
                  }}
                >
                  +
                </button>
                <button
                  className="btn-icon sidebar-action btn-danger"
                  title="Delete project"
                  onClick={e => { e.stopPropagation(); if (window.confirm(`"${p.name}" を削除しますか？配下のタスク・リソースもすべて削除されます。`)) onDeleteProject(p.id) }}
                >
                  ×
                </button>
              </div>
              {isExpanded && (
                <div className="sidebar-tasks">
                  {tasks.map(t => (
                    <div
                      key={t.id}
                      className={`sidebar-task ${selectedTaskId === t.id ? 'active' : ''}`}
                      onClick={() => { onSelectProject(p.id); onSelectTask(t.id) }}
                    >
                      <span className={`task-dot status-${t.status}`}>{STATUS_DOT[t.status]}</span>
                      <span className="task-name">{t.name}</span>
                    </div>
                  ))}
                  {addingTaskFor === p.id && (
                    <div className="sidebar-inline-input">
                      <input
                        type="text"
                        placeholder="Task name..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitTask()
                          if (e.key === 'Escape') { setAddingTaskFor(null); setInputValue('') }
                        }}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {addingProject ? (
        <div className="sidebar-add-project">
          <input
            type="text"
            placeholder="Project name..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submitProject()
              if (e.key === 'Escape') { setAddingProject(false); setInputValue('') }
            }}
            autoFocus
          />
        </div>
      ) : (
        <button className="btn-add-project" onClick={() => { setAddingProject(true); setInputValue('') }}>
          + New Project
        </button>
      )}
    </aside>
  )
}
