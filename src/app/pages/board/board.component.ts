import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from '../../../firebase';
import { User, updateProfile, signOut } from 'firebase/auth';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskColumnComponent } from '../../components/task-column/task-column.component';
import { TaskModalComponent } from '../../components/task-modal/task-modal.component';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import { reload } from 'firebase/auth';
interface Column {
  id: string;
  title: string;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TaskColumnComponent,
    TaskModalComponent
  ],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

  // 🔹 PROFILE
  currentUser: User | null = null;
  menuOpen = false;

  // 🔹 TASKS & COLUMNS
  tasks: Task[] = [];
  columns: Column[] = [];
  searchTerm = '';
  editingTask: Task | null = null;
  editingColumnId: string | null = null;
  showModal = false;
  private _lastCreatedSignature: string | null = null;

  lastDeletedTask: any = null;
  lastDeletedColumnId: string | null = null;
  showUndo = false;
  undoTimeout: any;
  showAccountModal = false;
  newDisplayName = '';

  // 🔹 FILTER & SORT
  showFilter = false;
  showSort = false;
  filterMode = 'all';
  sortMode = 'priority-high-low';

  constructor(private router: Router) {}


  loadBoardData() {
  const saved = localStorage.getItem(this.getStorageKey());

  if (saved) {
    const { tasks: savedTasks, columns: savedCols } = JSON.parse(saved);

    this.columns = savedCols || [];
    this.tasks = (savedTasks || []).map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt)
    }));
  }

  if (this.columns.length === 0) {
    this.columns = [{ id: crypto.randomUUID(), title: 'Backlog' }];
  }

  this.tasks.forEach(t => {
    if (!t.columnId) {
      t.columnId = this.columns[0].id;
    }
  });
}



  // 🔹 INIT
  ngOnInit() {
    // redirect if not logged in & set currentUser, then load board data ONCE
    auth.onAuthStateChanged(async(user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      this.currentUser = user;
      this.loadBoardData();
    });
  }


  // 🔹 PROFILE MENU
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  isEditMode = false;

toggleEditMode() {
  this.isEditMode = !this.isEditMode;
}

onImgError(event: any) {
  event.target.src = 'assets/default-avatar.png';
}

  @HostListener('document:click', ['$event.target'])
  closeMenu(targetElement: any) {
    const clickedInside = targetElement.closest('.profile-container');
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'LABEL') {
    return;
  }
    if (!clickedInside) this.menuOpen = false;

  }

  // 🔹 PROFILE ACTIONS
  openAccountModal() {
  const user = auth.currentUser;
  if (!user) return;

  this.newDisplayName = user.displayName || '';
  this.showAccountModal = true;
}

  async saveAccountChanges() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await updateProfile(user, {
      displayName: this.newDisplayName
    });

    this.currentUser = auth.currentUser;
    this.showAccountModal = false;

    alert('Profile updated!');
  } catch (err: any) {
    alert(err.message);
  }
}

toggleFilter() {
  this.showFilter = !this.showFilter;
  this.showSort = false;
}

toggleSort() {
  this.showSort = !this.showSort;
  this.showFilter = false;
}

  async uploadAvatar(event: Event) {
    console.log("UPLOAD FUNCTION CALLED");
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  console.log("STEP 1: file =", file);

  if (!file) return;

  const user = auth.currentUser;
  console.log("STEP 2: user =", user);

  if (!user) return;

  try {
    const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);

    await uploadBytes(storageRef, file);
    console.log("STEP 3: uploaded");

    const url = await getDownloadURL(storageRef);
    console.log("STEP 4: download URL =", url);

    await updateProfile(user, { photoURL: url });
    console.log("STEP 5: profile updated");

    console.log("STEP 6: reloaded user =", user.photoURL);

    this.currentUser = { ...user, photoURL: url };

    input.value = '';

  } catch (err) {
    console.error("ERROR:", err);
  }
}

getAvatarUrl(url: string | null | undefined): string | null {
  return url || null;
}

  async logout() {
  try {
    await signOut(auth);
    this.router.navigate(['/login']);
  } catch (err: any) {
    alert(err.message);
  }
}

switchAccount() {
  this.logout(); // same behavior for now
}

  // 🔹 STORAGE
  saveToStorage() {
    localStorage.setItem(this.getStorageKey(), JSON.stringify({ tasks: this.tasks, columns: this.columns }));
  }

  // 🔹 TASK METHODS
  saveTask(taskData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    columnId: string;
    dueDate?: Date|string;
    media?: any[];
  }) {
    if (this.editingTask) Object.assign(this.editingTask, taskData);
    else {
      const signature = JSON.stringify(taskData);
      if (signature !== this._lastCreatedSignature) {
        const newTask: Task = { id: crypto.randomUUID(), ...taskData, createdAt: new Date(), completed: false } as any;
        if (newTask.priority === 'high') {
          const idx = this.tasks.findIndex(t => t.columnId === newTask.columnId && t.priority !== 'high');
          if (idx !== -1) this.tasks.splice(idx, 0, newTask);
          else this.tasks.unshift(newTask);
        } else this.tasks.push(newTask);
        this._lastCreatedSignature = signature;
      }
    }
    this.tasks = [...this.tasks];
    this.saveToStorage();
    this.editingTask = null;
    this.showModal = false;
  }

  getStorageKey(): string {
  const user = auth.currentUser;

  // fallback just in case
  return user ? `plantBoardData_${user.uid}` : 'plantBoardData_guest';
}

  get filteredTasks(): Task[] {
    let filtered = this.tasks;
    const term = this.searchTerm.trim().toLowerCase();
    if (term) filtered = filtered.filter(t => t.title.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term)));

    switch (this.filterMode) {
      case 'checked':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'unchecked':
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'high':
        filtered = filtered.filter(t => t.priority === 'high');
        break;
      case 'medium':
        filtered = filtered.filter(t => t.priority === 'medium');
        break;
      case 'low':
        filtered = filtered.filter(t => t.priority === 'low');
        break;
      case 'due-today':
        const today = new Date();
        today.setHours(0,0,0,0);
        filtered = filtered.filter(t => t.dueDate && (() => {
          const due = new Date(t.dueDate!);
          return due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth() && due.getDate() === today.getDate();
        })());
        break;
    }

    switch (this.sortMode) {
      case 'priority-high-low': filtered = filtered.slice().sort((a, b) => ({ high:3, medium:2, low:1 }[b.priority] - { high:3, medium:2, low:1 }[a.priority])); break;
      case 'priority-low-high': filtered = filtered.slice().sort((a, b) => ({ high:3, medium:2, low:1 }[a.priority] - { high:3, medium:2, low:1 }[b.priority])); break;
      case 'due-soon': filtered = filtered.filter(t => t.dueDate).slice().sort((a,b)=> new Date(a.dueDate!).getTime()-new Date(b.dueDate!).getTime()); break;
      case 'past-due': filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).slice().sort((a,b)=> new Date(a.dueDate!).getTime()-new Date(b.dueDate!).getTime()); break;
      case 'due-last': filtered = filtered.filter(t => t.dueDate).slice().sort((a,b)=> new Date(b.dueDate!).getTime()-new Date(a.dueDate!).getTime()); break;
      case 'alphabetical': filtered = filtered.slice().sort((a,b)=> a.title.localeCompare(b.title)); break;
    }
    return filtered;
  }

  openModal(columnId?: string, task?: Task) {
    this.editingTask = task || null;
    this.editingColumnId = task?.columnId || columnId || this.columns[0]?.id || null;
    this.showModal = true;
    this._lastCreatedSignature = null;
  }

  deleteTask(task: Task) {
  this.lastDeletedTask = task;
  this.lastDeletedColumnId = task.columnId;

  // ✅ REMOVE from main tasks array
  this.tasks = this.tasks.filter(t => t.id !== task.id);

  this.saveToStorage();

  // show undo
  this.showUndo = true;

  clearTimeout(this.undoTimeout);
  this.undoTimeout = setTimeout(() => {
    this.showUndo = false;
    this.lastDeletedTask = null;
  }, 5000);
}
  
  undoDelete() {
  if (!this.lastDeletedTask) return;

  // ✅ ADD BACK to tasks array
  this.tasks = [...this.tasks, this.lastDeletedTask];

  this.saveToStorage();

  this.showUndo = false;
  this.lastDeletedTask = null;

  clearTimeout(this.undoTimeout);
}
  startEdit(task: Task) { this.openModal(task.columnId, task); }

  addColumn(columnId: string) {
    const idx = this.columns.findIndex(col => col.id === columnId);
    if (idx !== -1) { this.columns.splice(idx+1,0,{id:'col-'+Math.random().toString(36).substr(2,6),title:'New Column'}); this.saveToStorage(); }
  }

  addColumnAtEnd() {
  const lastCol = this.columns[this.columns.length - 1];
  if (lastCol) this.addColumn(lastCol.id);
}

  deleteColumn(id: string) { 
    if (!confirm('Delete this column and all its tasks?')) return; 
    this.columns = this.columns.filter(c=>c.id!==id); 
    this.tasks = this.tasks.filter(t=>t.columnId!==id); 
    this.saveToStorage();
  }

  dropColumn(event: CdkDragDrop<Column[]>) { moveItemInArray(this.columns,event.previousIndex,event.currentIndex); this.saveToStorage(); }
  trackByColumn(index:number,col:Column){ return col.id; }

  onTaskDropped(newOrder?: Task[]) {
    if (newOrder && newOrder.length>0) {
      const colId=newOrder[0].columnId;
      const otherTasks=this.tasks.filter(t=>t.columnId!==colId);
      this.tasks=[...otherTasks,...newOrder];
    }
    this.tasks=[...this.tasks]; this.saveToStorage();
  }

  onCompletionChanged(task: Task) {
    const idx=this.tasks.findIndex(t=>t.id===task.id);
    if(idx!==-1){ this.tasks[idx].completed=task.completed; this.saveToStorage(); }
  }

  onColumnRenamed(event:{id:string,title:string}) {
    const idx=this.columns.findIndex(col=>col.id===event.id);
    if(idx!==-1){ this.columns[idx].title=event.title; this.saveToStorage(); }
  }

  get columnIds(): string[] { return this.columns.map(c=>c.id); }

}