import { create } from "zustand";
import { Channel } from "../types";
import { channels } from "../services/api";

interface ChannelState {
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | null;
  loading: boolean;
  error: string | null;
  fetchChannels: () => Promise<void>;
  setActiveChannel: (channelId: string) => void;
  setActiveChannelObject: (channel:Channel) => void;
  createChannel: (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
    members: string[];
  }) => Promise<Channel>;
  updateChannel: (
    channelId: string,
    updates: Partial<Channel>
  ) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  activeChannelId: null,
  loading: false,
  error: null,
  activeChannel: null,
  fetchChannels: async () => {
    set({ loading: true });
    try {
      const fetchedChannels = await channels.getAll();
      set({ channels: fetchedChannels, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch channels", loading: false });
    }
  },
  setActiveChannel: (channelId) => {
    set({ activeChannelId: channelId });
  },
  setActiveChannelObject(channel) {
    set({ activeChannel: channel });
  },
  createChannel: async (data) => {
    try {
      const newChannel = await channels.create(data);
      set((state) => ({
        channels: [...state.channels, newChannel],
        activeChannelId: newChannel._id, // Updated to use _id
      }));
      return newChannel;
    } catch (error) {
      set({ error: "Failed to create channel" });
      throw error;
    }
  },
  updateChannel: async (channelId, updates) => {
    try {
      // const response = await api.patch(`/api/channels/${channelId}`, updates);
      // console.log("channelId", channelId,updates);
      const updatedChannel = await channels.updateChannel(channelId, updates);
      // return;
      // const updatedChannel = response.data;
      set((state) => ({
        channels: state.channels.map((channel) =>
          channel._id === channelId ? updatedChannel : channel
        ),
      }));
    } catch (error) {
      set({ error: "Failed to update channel" });
      throw error;
    }
  },

  deleteChannel: async (channelId) => {
    try {
      // await api.delete(`/api/channels/${channelId}`);
      await channels.deleteChannel(channelId);
      set((state) => ({
        channels: state.channels.filter((channel) => channel._id !== channelId),
        activeChannelId:
          state.activeChannelId === channelId ? null : state.activeChannelId,
      }));
    } catch (error) {
      set({ error: "Failed to delete channel" });
      throw error;
    }
  },
}));
