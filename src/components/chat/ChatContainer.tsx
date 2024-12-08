import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChannelHeader } from './ChannelHeader';
import { useChannelStore } from '../../store/channelStore';

export const ChatContainer = () => {
  const { activeChannelId } = useChannelStore();

  if (!activeChannelId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a channel or user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChannelHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
};