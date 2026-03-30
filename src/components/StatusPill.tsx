import type { TaskStatus } from '../types'

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

interface Props {
  status: TaskStatus
  onClick: (next: TaskStatus) => void
}

export function StatusPill({ status, onClick }: Props) {
  return (
    <button
      className={`status-pill status-${status}`}
      onClick={() => onClick(NEXT_STATUS[status])}
      title="Click to change status"
    >
      {STATUS_LABELS[status]}
    </button>
  )
}
