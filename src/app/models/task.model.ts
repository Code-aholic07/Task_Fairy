export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface Task {
  id: string;
  title: string;
  
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;        // ← ADD THIS LINE
  columnId: string;
  createdAt: Date;
  dueDate?: Date | string;
  media?: { type: 'image' | 'video'; url: string }[];
}
