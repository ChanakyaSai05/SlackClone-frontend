export interface Board {
  _id: string;
  name: string;
  description?: string;
  channelId: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  _id: string;
  name: string;
  boardId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  sectionId: string;
  boardId: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order: number;
  labels: {
    name: string;
    color: string;
  }[];
  createdAt: string;
  updatedAt: string;
}