import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  updateUserStatus: (userId: string, status: 'online' | 'offline' | 'away') => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/api/users');
      set({ users: response.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch users', loading: false });
    }
  },
  updateUserStatus: (userId, status) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, status } : user
      ),
    }));
  },
}));