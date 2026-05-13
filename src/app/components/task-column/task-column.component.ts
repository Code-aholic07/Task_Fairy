import { Component, Input, Output, EventEmitter, TrackByFunction, ViewEncapsulation, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './task-column.component.html',
  styleUrls: ['./task-column.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TaskColumnComponent implements OnInit {
    @Output() completionChanged = new EventEmitter<Task>();
    saveCompletion(task: Task) {
      this.completionChanged.emit(task);
    }
    
  editingName = false;
    @Input() columns!: { id: string; title: string }[];
    @Output() renameColumn = new EventEmitter<{ id: string; title: string }>();
  activePriorityTask: any = null;
  taskPriorities: { [key: string]: string } = {};
  ngOnInit() {
    const saved = localStorage.getItem('taskPriorities');
    if (saved) {
      this.taskPriorities = JSON.parse(saved);
      // Restore priorities
      this.tasks?.forEach(task => {
        if (this.taskPriorities[task.id]) {
          task.priority = this.taskPriorities[task.id] as any;
        }
      });
    }
  }

  @Input() title!: string;
  @Input() columnId!: string;
  @Input() tasks!: Task[];
  @Input() listId!: string;
  @Input() connectedListIds: string[] = [];
  @Input() isEditMode = false;
  
    // Persist column rename
    onColumnRename(newTitle: string) {
      this.renameColumn.emit({ id: this.columnId, title: newTitle });
      this.editingName = false;
    }

  @Output() remove = new EventEmitter<Task>();
  @Output() edit = new EventEmitter<Task>();
  @Output() dropped = new EventEmitter<Task[]>();
  @Output() deleteColumn = new EventEmitter<string>();
  

  constructor(private cdr: ChangeDetectorRef) {}

  togglePriority(buttonRef: any, task: any): void {
    this.activePriorityTask = this.activePriorityTask === task ? null : task;
    this.cdr.detectChanges();
  }

  setPriority(task: any, priority: string): void {
  task.priority = priority as any;
  this.taskPriorities[task.id] = priority;
  localStorage.setItem('taskPriorities', JSON.stringify(this.taskPriorities));
  this.activePriorityTask = null;
  this.cdr.detectChanges();
}

  toggleComplete(task: any, event: any): void {
    if (!task.hasOwnProperty('completed')) {
      task.completed = false;
    }
    task.completed = event.target.checked;
    this.cdr.detectChanges();
  }

  get filteredTasks(): any[] {
    return this.tasks.filter(t => t.columnId === this.listId);
  }

  getDueDateDisplay(dueDate: Date | string): string {
    const now = new Date();
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  trackByFn: TrackByFunction<any> = (index, task) => task.id || index;

  onDrop(event: CdkDragDrop<any[]>): void {
    const task = event.item.data as any;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data as any[], event.previousIndex, event.currentIndex);
      this.dropped.emit(event.container.data);
    } else {
      task.columnId = this.listId;
      this.dropped.emit();
    }
  }
}
