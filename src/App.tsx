import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { DetailPanel } from './components/DetailPanel'
import { useProjects, useTasks, getStorageAdapter } from './hooks/useStorage'
import type { Task } from './types'
import './styles/global.css'

export default function App() {
  const { projects, loading, addProject, deleteProject, reload: reloadProjects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const { tasks, addTask, updateTask, deleteTask, reload: reloadTasks } = useTasks(selectedProjectId)
  const [allTasksByProject, setAllTasksByProject] = useState<Record<string, Task[]>>({})
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('savant-dark-mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('savant-dark-mode', String(darkMode))
  }, [darkMode])

  const loadAllTasks = useCallback(async () => {
    const adapter = getStorageAdapter()
    const map: Record<string, Task[]> = {}
    for (const p of projects) {
      map[p.id] = await adapter.getTasksByProject(p.id)
    }
    setAllTasksByProject(map)
  }, [projects])

  useEffect(() => { loadAllTasks() }, [loadAllTasks])

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null
  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null

  const handleAddTask = async (name: string) => {
    const task = await addTask(name)
    if (task) {
      setSelectedTaskId(task.id)
      await loadAllTasks()
    }
  }

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id)
    if (selectedTaskId === id) setSelectedTaskId(null)
    await loadAllTasks()
  }

  const handleUpdateTask = async (task: Task) => {
    await updateTask(task)
    await loadAllTasks()
  }

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id)
    if (selectedProjectId === id) {
      setSelectedProjectId(null)
      setSelectedTaskId(null)
    }
    await loadAllTasks()
  }

  const handleAddProject = async (name: string) => {
    const project = await addProject(name)
    setSelectedProjectId(project.id)
    setSelectedTaskId(null)
    reloadTasks()
    await loadAllTasks()
  }

  const handleExport = async () => {
    const data = await getStorageAdapter().exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `savant-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      const data = JSON.parse(text)
      await getStorageAdapter().importAll(data)
      await reloadProjects()
      setSelectedProjectId(null)
      setSelectedTaskId(null)
    }
    input.click()
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="app">
      <Sidebar
        projects={projects}
        tasks={tasks}
        selectedProjectId={selectedProjectId}
        selectedTaskId={selectedTaskId}
        onSelectProject={id => { setSelectedProjectId(id); setSelectedTaskId(null) }}
        onSelectTask={setSelectedTaskId}
        onAddProject={handleAddProject}
        onAddTask={handleAddTask}
        onDeleteProject={handleDeleteProject}
        allTasksByProject={allTasksByProject}
      />
      <main className="main-content">
        {selectedTask && selectedProject ? (
          <DetailPanel
            key={selectedTask.id}
            task={selectedTask}
            project={selectedProject}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : selectedProject ? (
          <div className="empty-state">
            <p>Select a task or create a new one</p>
          </div>
        ) : (
          <div className="empty-state">
            <h2>Savant</h2>
            <p>Select or create a project to get started</p>
          </div>
        )}
        <div className="toolbar">
          <button className="btn-icon" onClick={() => setDarkMode(d => !d)} title="Toggle theme">
            {darkMode ? '☀' : '☽'}
          </button>
          <button className="btn-sm" onClick={handleExport}>Export</button>
          <button className="btn-sm" onClick={handleImport}>Import</button>
        </div>
      </main>
    </div>
  )
}
