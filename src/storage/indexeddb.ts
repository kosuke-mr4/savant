import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter } from './interface'
import type { Project, Task, Resource, ProgressLog, ExportData } from '../types'

const DB_NAME = 'savant'
const DB_VERSION = 1

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
      projectStore.createIndex('order', 'order')

      const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
      taskStore.createIndex('projectId', 'projectId')
      taskStore.createIndex('order', 'order')

      const resourceStore = db.createObjectStore('resources', { keyPath: 'id' })
      resourceStore.createIndex('taskId', 'taskId')
      resourceStore.createIndex('order', 'order')

      const logStore = db.createObjectStore('progressLogs', { keyPath: 'id' })
      logStore.createIndex('taskId', 'taskId')
      logStore.createIndex('createdAt', 'createdAt')
    },
  })
}

export class IndexedDBAdapter implements StorageAdapter {
  private dbPromise = getDB()

  async getProjects(): Promise<Project[]> {
    const db = await this.dbPromise
    const projects = await db.getAll('projects')
    return projects.sort((a, b) => a.order - b.order)
  }

  async getProject(id: string): Promise<Project | null> {
    const db = await this.dbPromise
    return (await db.get('projects', id)) ?? null
  }

  async saveProject(project: Project): Promise<void> {
    const db = await this.dbPromise
    await db.put('projects', project)
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.dbPromise
    const tasks = await this.getTasksByProject(id)
    const tx = db.transaction(['projects', 'tasks', 'resources', 'progressLogs'], 'readwrite')
    tx.objectStore('projects').delete(id)
    for (const task of tasks) {
      tx.objectStore('tasks').delete(task.id)
      const resources = await this.getResourcesByTask(task.id)
      for (const r of resources) {
        tx.objectStore('resources').delete(r.id)
      }
      const logs = await this.getLogsByTask(task.id)
      for (const l of logs) {
        tx.objectStore('progressLogs').delete(l.id)
      }
    }
    await tx.done
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const db = await this.dbPromise
    const tasks = await db.getAllFromIndex('tasks', 'projectId', projectId)
    return tasks.sort((a, b) => a.order - b.order)
  }

  async getTask(id: string): Promise<Task | null> {
    const db = await this.dbPromise
    return (await db.get('tasks', id)) ?? null
  }

  async saveTask(task: Task): Promise<void> {
    const db = await this.dbPromise
    await db.put('tasks', task)
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.dbPromise
    const tx = db.transaction(['tasks', 'resources', 'progressLogs'], 'readwrite')
    tx.objectStore('tasks').delete(id)
    const resources = await db.getAllFromIndex('resources', 'taskId', id)
    for (const r of resources) {
      tx.objectStore('resources').delete(r.id)
    }
    const logs = await db.getAllFromIndex('progressLogs', 'taskId', id)
    for (const l of logs) {
      tx.objectStore('progressLogs').delete(l.id)
    }
    await tx.done
  }

  async getResourcesByTask(taskId: string): Promise<Resource[]> {
    const db = await this.dbPromise
    const resources = await db.getAllFromIndex('resources', 'taskId', taskId)
    return resources.sort((a, b) => a.order - b.order)
  }

  async saveResource(resource: Resource): Promise<void> {
    const db = await this.dbPromise
    await db.put('resources', resource)
  }

  async deleteResource(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('resources', id)
  }

  async getLogsByTask(taskId: string): Promise<ProgressLog[]> {
    const db = await this.dbPromise
    const logs = await db.getAllFromIndex('progressLogs', 'taskId', taskId)
    return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async addLog(log: ProgressLog): Promise<void> {
    const db = await this.dbPromise
    await db.put('progressLogs', log)
  }

  async exportAll(): Promise<ExportData> {
    const db = await this.dbPromise
    const [projects, tasks, resources, progressLogs] = await Promise.all([
      db.getAll('projects'),
      db.getAll('tasks'),
      db.getAll('resources'),
      db.getAll('progressLogs'),
    ])
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
      resources,
      progressLogs,
    }
  }

  async importAll(data: ExportData): Promise<void> {
    const db = await this.dbPromise
    const tx = db.transaction(['projects', 'tasks', 'resources', 'progressLogs'], 'readwrite')
    await Promise.all([
      tx.objectStore('projects').clear(),
      tx.objectStore('tasks').clear(),
      tx.objectStore('resources').clear(),
      tx.objectStore('progressLogs').clear(),
    ])
    for (const p of data.projects) tx.objectStore('projects').put(p)
    for (const t of data.tasks) tx.objectStore('tasks').put(t)
    for (const r of data.resources) tx.objectStore('resources').put(r)
    for (const l of data.progressLogs) tx.objectStore('progressLogs').put(l)
    await tx.done
  }
}
