import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter } from './interface'
import type { Project, Task, Resource, ProgressLog, Prompt, ExportData } from '../types'

const DB_NAME = 'savant'
const DB_VERSION = 2

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
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
      }
      if (oldVersion < 2) {
        const promptStore = db.createObjectStore('prompts', { keyPath: 'id' })
        promptStore.createIndex('taskId', 'taskId')
        promptStore.createIndex('order', 'order')
      }
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
    const tx = db.transaction(['projects', 'tasks', 'resources', 'progressLogs', 'prompts'], 'readwrite')
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
      const prompts = await this.getPromptsByTask(task.id)
      for (const p of prompts) {
        tx.objectStore('prompts').delete(p.id)
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
    const tx = db.transaction(['tasks', 'resources', 'progressLogs', 'prompts'], 'readwrite')
    tx.objectStore('tasks').delete(id)
    const resources = await db.getAllFromIndex('resources', 'taskId', id)
    for (const r of resources) {
      tx.objectStore('resources').delete(r.id)
    }
    const logs = await db.getAllFromIndex('progressLogs', 'taskId', id)
    for (const l of logs) {
      tx.objectStore('progressLogs').delete(l.id)
    }
    const prompts = await db.getAllFromIndex('prompts', 'taskId', id)
    for (const p of prompts) {
      tx.objectStore('prompts').delete(p.id)
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

  async getPromptsByTask(taskId: string): Promise<Prompt[]> {
    const db = await this.dbPromise
    const prompts = await db.getAllFromIndex('prompts', 'taskId', taskId)
    return prompts.sort((a, b) => a.order - b.order)
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    const db = await this.dbPromise
    await db.put('prompts', prompt)
  }

  async deletePrompt(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete('prompts', id)
  }

  async exportAll(): Promise<ExportData> {
    const db = await this.dbPromise
    const [projects, tasks, resources, progressLogs, prompts] = await Promise.all([
      db.getAll('projects'),
      db.getAll('tasks'),
      db.getAll('resources'),
      db.getAll('progressLogs'),
      db.getAll('prompts'),
    ])
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
      resources,
      progressLogs,
      prompts,
    }
  }

  async importAll(data: ExportData): Promise<void> {
    const db = await this.dbPromise
    const tx = db.transaction(['projects', 'tasks', 'resources', 'progressLogs', 'prompts'], 'readwrite')
    await Promise.all([
      tx.objectStore('projects').clear(),
      tx.objectStore('tasks').clear(),
      tx.objectStore('resources').clear(),
      tx.objectStore('progressLogs').clear(),
      tx.objectStore('prompts').clear(),
    ])
    for (const p of data.projects) tx.objectStore('projects').put(p)
    for (const t of data.tasks) tx.objectStore('tasks').put(t)
    for (const r of data.resources) tx.objectStore('resources').put(r)
    for (const l of data.progressLogs) tx.objectStore('progressLogs').put(l)
    for (const pr of (data.prompts || [])) tx.objectStore('prompts').put(pr)
    await tx.done
  }
}
