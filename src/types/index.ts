export type ProjectStatus = 'active' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type ResourceType = 'file' | 'url' | 'chat' | 'memo'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  name: string
  description: string
  status: TaskStatus
  order: number
  createdAt: string
  updatedAt: string
}

export interface Resource {
  id: string
  taskId: string
  type: ResourceType
  value: string
  label: string
  order: number
  createdAt: string
}

export interface ProgressLog {
  id: string
  taskId: string
  content: string
  createdAt: string
}

export interface ExportData {
  version: number
  exportedAt: string
  projects: Project[]
  tasks: Task[]
  resources: Resource[]
  progressLogs: ProgressLog[]
}
