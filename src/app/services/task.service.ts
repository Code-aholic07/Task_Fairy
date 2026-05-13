import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private storageKey = 'taskFairyTasks';

  getTasks(): Task[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];

    const tasks = JSON.parse(data);

    // Migration logic
    return tasks.map((task: any) => ({
      ...task,
      priority: task.priority || 'medium',
      dateCreated: task.dateCreated || new Date().toISOString()
    }));
  }

  saveTasks(tasks: Task[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }
}
