import { useState, useEffect, useCallback, useRef } from 'react'
import type { StorageAdapter } from '../storage/interface'
import type { Project, Task, Resource, ProgressLog } from '../types'
import { IndexedDBAdapter } from '../storage/indexeddb'

const adapter: StorageAdapter = new IndexedDBAdapter()

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const data = await adapter.getProjects()
    setProjects(data)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const addProject = useCallback(async (name: string) => {
    const now = new Date().toISOString()
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description: '',
      status: 'active',
      order: projects.length,
      createdAt: now,
      updatedAt: now,
    }
    await adapter.saveProject(project)
    await reload()
    return project
  }, [projects.length, reload])

  const updateProject = useCallback(async (project: Project) => {
    await adapter.saveProject({ ...project, updatedAt: new Date().toISOString() })
    await reload()
  }, [reload])

  const deleteProject = useCallback(async (id: string) => {
    await adapter.deleteProject(id)
    await reload()
  }, [reload])

  return { projects, loading, addProject, updateProject, deleteProject, reload }
}

export function useTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const projectIdRef = useRef(projectId)
  projectIdRef.current = projectId

  const reload = useCallback(async () => {
    if (!projectIdRef.current) { setTasks([]); return }
    const data = await adapter.getTasksByProject(projectIdRef.current)
    setTasks(data)
  }, [])

  useEffect(() => { reload() }, [projectId, reload])

  const addTask = useCallback(async (name: string) => {
    if (!projectIdRef.current) return null
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      projectId: projectIdRef.current,
      name,
      description: '',
      status: 'todo',
      order: tasks.length,
      createdAt: now,
      updatedAt: now,
    }
    await adapter.saveTask(task)
    await reload()
    return task
  }, [tasks.length, reload])

  const updateTask = useCallback(async (task: Task) => {
    await adapter.saveTask({ ...task, updatedAt: new Date().toISOString() })
    await reload()
  }, [reload])

  const deleteTask = useCallback(async (id: string) => {
    await adapter.deleteTask(id)
    await reload()
  }, [reload])

  return { tasks, addTask, updateTask, deleteTask, reload }
}

export function useResources(taskId: string | null) {
  const [resources, setResources] = useState<Resource[]>([])
  const taskIdRef = useRef(taskId)
  taskIdRef.current = taskId

  const reload = useCallback(async () => {
    if (!taskIdRef.current) { setResources([]); return }
    const data = await adapter.getResourcesByTask(taskIdRef.current)
    setResources(data)
  }, [])

  useEffect(() => { reload() }, [taskId, reload])

  const addResource = useCallback(async (type: Resource['type'], value: string, label: string) => {
    if (!taskIdRef.current) return
    const resource: Resource = {
      id: crypto.randomUUID(),
      taskId: taskIdRef.current,
      type,
      value,
      label: label || generateLabel(type, value),
      order: resources.length,
      createdAt: new Date().toISOString(),
    }
    await adapter.saveResource(resource)
    await reload()
  }, [resources.length, reload])

  const deleteResource = useCallback(async (id: string) => {
    await adapter.deleteResource(id)
    await reload()
  }, [reload])

  return { resources, addResource, deleteResource, reload }
}

export function useProgressLogs(taskId: string | null) {
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const taskIdRef = useRef(taskId)
  taskIdRef.current = taskId

  const reload = useCallback(async () => {
    if (!taskIdRef.current) { setLogs([]); return }
    const data = await adapter.getLogsByTask(taskIdRef.current)
    setLogs(data)
  }, [])

  useEffect(() => { reload() }, [taskId, reload])

  const addLog = useCallback(async (content: string) => {
    if (!taskIdRef.current) return
    const log: ProgressLog = {
      id: crypto.randomUUID(),
      taskId: taskIdRef.current,
      content,
      createdAt: new Date().toISOString(),
    }
    await adapter.addLog(log)
    await reload()
  }, [reload])

  return { logs, addLog, reload }
}

function generateLabel(type: Resource['type'], value: string): string {
  if (type === 'file') {
    return value.split('/').pop() || value
  }
  if (type === 'url' || type === 'chat') {
    try {
      const url = new URL(value)
      return url.hostname + url.pathname.slice(0, 40)
    } catch {
      return value.slice(0, 50)
    }
  }
  return value.slice(0, 50)
}

export function detectResourceType(value: string): Resource['type'] {
  if (value.includes('claude.ai/chat/')) return 'chat'
  if (/^https?:\/\//.test(value)) return 'url'
  if (/^[~/\/]/.test(value)) return 'file'
  return 'memo'
}

export function getStorageAdapter(): StorageAdapter {
  return adapter
}
