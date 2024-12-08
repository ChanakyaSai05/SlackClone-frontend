import { create } from 'zustand';
import { Message } from '../types';
import { messages as messagesApi } from '../services/api';
import { socket } from '../services/socket';

interface MessageState {
  messages: Record<string, Message[]>;
  loading: boolean;
  error: string | null;
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (content: string, channelId: string, attachments?: any[]) => Promise<void>;
  addMessage: (channelId: string, message: Message) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  loading: false,
  error: null,
  fetchMessages: async (channelId) => {
    set({ loading: true });
    try {
      const channelMessages = await messagesApi.getChannelMessages(channelId);
      // Sort messages by timestamp
      const sortedMessages = channelMessages.sort((a: Message, b: Message) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Deduplicate messages based on _id
      const uniqueMessages = sortedMessages.filter((message: Message, index: number, self: Message[]) =>
        index === self.findIndex((m) => m._id === message._id)
      );
      
      set((state) => ({
        messages: { ...state.messages, [channelId]: uniqueMessages },
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to fetch messages', loading: false });
    }
  },
  sendMessage: async (content, channelId, attachments = []) => {
    try {
      const newMessage = await messagesApi.send(content, channelId, attachments);
      
      // Emit the message through socket
      socket.emit('send_message', {
        ...newMessage,
        channelId
      });
      
      // Add message to state and ensure proper sorting and deduplication
      set((state) => {
        const currentMessages = state.messages[channelId] || [];
        const isDuplicate = currentMessages.some(m => m._id === newMessage._id);
        
        if (isDuplicate) {
          return state;
        }
        
        const updatedMessages = [...currentMessages, newMessage].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        return {
          messages: {
            ...state.messages,
            [channelId]: updatedMessages,
          },
        };
      });
    } catch (error) {
      set({ error: 'Failed to send message' });
      throw error;
    }
  },
  addMessage: (channelId, message) => {
    set((state) => {
      const currentMessages = state.messages[channelId] || [];
      
      // Check if message already exists
      if (currentMessages.some(m => m._id === message._id)) {
        return state;
      }
      
      // Add message and ensure proper sorting
      const updatedMessages = [...currentMessages, message].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      return {
        messages: {
          ...state.messages,
          [channelId]: updatedMessages,
        },
      };
    });
  },
}));