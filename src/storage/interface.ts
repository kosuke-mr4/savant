import type { Project, Task, Resource, ProgressLog, Prompt, ExportData } from '../types'

export interface StorageAdapter {
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  saveProject(project: Project): Promise<void>
  deleteProject(id: string): Promise<void>

  getTasksByProject(projectId: string): Promise<Task[]>
  getTask(id: string): Promise<Task | null>
  saveTask(task: Task): Promise<void>
  deleteTask(id: string): Promise<void>

  getResourcesByTask(taskId: string): Promise<Resource[]>
  saveResource(resource: Resource): Promise<void>
  deleteResource(id: string): Promise<void>

  getLogsByTask(taskId: string): Promise<ProgressLog[]>
  addLog(log: ProgressLog): Promise<void>

  getPromptsByTask(taskId: string): Promise<Prompt[]>
  savePrompt(prompt: Prompt): Promise<void>
  deletePrompt(id: string): Promise<void>

  exportAll(): Promise<ExportData>
  importAll(data: ExportData): Promise<void>
}
