import axios from 'axios';
import { Channel } from '../types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401|| error.response?.status === 403) {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('token');
      window.location.reload();
    }
    if (error.response) {
      throw new Error(error.response.data.message || 'An error occurred');
    }
    throw error;
  }
);

export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register', { 
      name, 
      email, 
      password 
    });
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('token');
    return true;
  }
};

export const channels = {
  getAll: async () => {
    const response = await api.get('/api/channels');
    return response.data;
  },
  create: async (data: { name: string; description?: string; isPrivate: boolean; members: string[] }) => {
    const response = await api.post('/api/channels', data);
    return response.data;
  },
  addMember: async (channelId: string, userId: string) => {
    const response = await api.post(`/api/channels/${channelId}/members`, { userId });
    return response.data;
  },
  removeMember: async (channelId: string, userId: string) => {
    const response = await api.delete(`/api/channels/${channelId}/members/${userId}`);
    return response.data;
  },
  updateChannel: async (channelId: string, updates: Partial<Channel>) => {
    const response = await api.patch(`/api/channels/${channelId}`, updates);
    return response.data;
  },
  deleteChannel: async (channelId: string) => {
    const response = await api.delete(`/api/channels/${channelId}`);
    return response.data;
  }
};

export const messages = {
  getChannelMessages: async (channelId: string) => {
    const response = await api.get(`/api/messages/channel/${channelId}`);
    return response.data;
  },
  send: async (content: string, channelId: string, attachments?: any[]) => {
    const response = await api.post('/api/messages', { 
      content, 
      channelId, 
      attachments 
    });
    return response.data;
  },
};

export const users = {
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },
  updateStatus: async (status: string) => {
    const response = await api.patch('/api/users/status', { status });
    return response.data;
  }
};