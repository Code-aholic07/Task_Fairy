import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Input, OnChanges, SimpleChanges } from '@angular/core';
@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  
  
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss']
})

export class TaskModalComponent implements OnChanges{

  @Output() close = new EventEmitter<void>();

  @Output() save = new EventEmitter<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    columnId: string;
    media?: {type: 'image' | 'video'; url: string}[];
    dueDate?: string;
    subtasks?: {
    title: string;
    completed: boolean;
  }[];
  }>();

  title = '';
  description = '';
  newSubtask = '';
  subtasks: { title: string; completed: boolean }[] = [];
  priority: 'high' | 'medium' | 'low' = 'medium';
  dueDate: string = '';
  newMediaType: 'image' | 'video' = 'image';
  newMediaUrl = '';
  mediaItems: {type: 'image' | 'video'; url: string}[] = [];
  isSubmitting = false;
  dragIndex: number | null = null;
  
@Input() task: any;
  @Input() columns: {id:string;title:string}[] = [];
  @Input() initialColumnId: string | null = null;

  selectedColumnId: string | null = null;

ngOnChanges(changes: SimpleChanges) {
  if (changes['task'] && this.task) {
    this.title = this.task.title;
    this.description = this.task.description;
    this.priority = this.task.priority;
    this.selectedColumnId = this.task.columnId;
    this.mediaItems = this.task.media ? [...this.task.media] : [];
  }

  if (changes['task'] && !this.task) {
    this.title = '';
    this.description = '';
    this.priority = 'medium';
    this.selectedColumnId = this.initialColumnId || this.columns[0]?.id || null;
    this.mediaItems = [];
    this.subtasks = this.task.subtasks ? [...this.task.subtasks] : [];
  }
  if (changes['columns'] && !this.selectedColumnId) {
     this.subtasks = [];
    this.selectedColumnId = this.initialColumnId || this.columns[0]?.id || null;
  }
}

addMedia() {
  if (this.newMediaUrl.trim()) {
    this.mediaItems.push({ 
      type: this.newMediaType,
      url: this.newMediaUrl.trim() });
    this.newMediaUrl = '';
  }
}

removeMedia(index: number) {
  this.mediaItems.splice(index, 1);
}

onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      let type: 'image' | 'video';
      if (file.type.startsWith('image')) {
        type = 'image';
      } else if (file.type.startsWith('video')) {
        type = 'video';
      } else {
        return; // Not a supported type
      }
      this.mediaItems.push({ type, url: reader.result as string });
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    input.value = '';
  }
}


today = new Date();
tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));
onFileDrop(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer?.files?.length) {
    const file = event.dataTransfer.files[0];
    this.handleFile(file);
  }
}
onDragStart(index: number) {
  this.dragIndex = index;
}

onDrop(index: number) {
  if (this.dragIndex === null) return;

  const item = this.mediaItems[this.dragIndex];
  this.mediaItems.splice(this.dragIndex, 1);
  this.mediaItems.splice(index, 0, item);

  this.dragIndex = null;
}


handleFile(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    const type = file.type.startsWith('image') ? 'image' : 'video';
    this.mediaItems.push({ type, url: reader.result as string });
  };
  reader.readAsDataURL(file);
}

addSubtask() {
  if (!this.newSubtask.trim()) return;

  this.subtasks.push({
    title: this.newSubtask.trim(),
    completed: false
  });

  this.newSubtask = '';
}

removeSubtask(index: number) {
  this.subtasks.splice(index, 1);
}


saveTask() {
    if (this.isSubmitting) return;
    if (!this.title.trim()) return;
    if (!this.selectedColumnId) return;

    this.isSubmitting = true;

    this.save.emit({
      title: this.title,
      description: this.description,
      priority: this.priority,
      columnId: this.selectedColumnId,
      media: this.mediaItems,
      dueDate: this.dueDate,
      subtasks: this.subtasks
    });

    // Optional reset after save
    this.title = '';
    this.description = '';
    this.priority = 'medium';
    this.selectedColumnId = this.columns[0]?.id || null;
    this.mediaItems = [];
  }}