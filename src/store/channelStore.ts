import { create } from 'zustand';
import { Channel } from '../types';
import { channels } from '../services/api';

interface ChannelState {
  channels: Channel[];
  activeChannelId: string | null;
  loading: boolean;
  error: string | null;
  fetchChannels: () => Promise<void>;
  setActiveChannel: (channelId: string) => void;
  createChannel: (data: { name: string; description?: string; isPrivate: boolean; members: string[] }) => Promise<Channel>;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  activeChannelId: null,
  loading: false,
  error: null,
  fetchChannels: async () => {
    set({ loading: true });
    try {
      const fetchedChannels = await channels.getAll();
      set({ channels: fetchedChannels, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch channels', loading: false });
    }
  },
  setActiveChannel: (channelId) => {
    set({ activeChannelId: channelId });
  },
  createChannel: async (data) => {
    try {
      const newChannel = await channels.create(data);
      set((state) => ({ 
        channels: [...state.channels, newChannel],
        activeChannelId: newChannel._id // Updated to use _id
      }));
      return newChannel;
    } catch (error) {
      set({ error: 'Failed to create channel' });
      throw error;
    }
  },
}));