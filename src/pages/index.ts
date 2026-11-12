import type { ComponentType } from 'react'
import { HomePage } from './home/HomePage'
import { TaskListPage } from './taskList/TaskListPage'
import { TaskDetailPage } from './taskDetail/TaskDetailPage'

export interface PageRegistryItem {
  page: string
  component: ComponentType<any>
}

export const pages: PageRegistryItem[] = [
  { page: 'home', component: HomePage },
  { page: 'task-list', component: TaskListPage },
  { page: 'task-detail', component: TaskDetailPage },
]
