export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Message {
  _id: string;
  content: string;
  sender: string;
  channel: string;
  timestamp: Date;
  attachments?: string[];
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface CallSession {
  _id: string;
  participants: string[];
  type: 'audio' | 'video';
  startTime: Date;
  isScreenSharing?: boolean;
  hasAnnotations?: boolean;
}