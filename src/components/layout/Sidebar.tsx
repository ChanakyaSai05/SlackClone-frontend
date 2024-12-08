import React, { useEffect, useState } from 'react';
import { Hash, Users, Plus, MessageSquare } from 'lucide-react';
import { useChannelStore } from '../../store/channelStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Channel, User } from '../../types';
import { InviteModal } from '../modals/InviteModal';

export const Sidebar = () => {
  const { user } = useAuthStore();
  const { users, fetchUsers } = useUserStore();
  const { channels, fetchChannels, createChannel, setActiveChannel, activeChannelId } = useChannelStore();
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [inviteType, setInviteType] = useState<'channel' | 'direct'>('channel');

  useEffect(() => {
    const initializeSidebar = async () => {
      try {
        await Promise.all([fetchChannels(), fetchUsers()]);
      } catch (error) {
        console.error('Error initializing sidebar:', error);
      }
    };

    initializeSidebar();
  }, [fetchChannels, fetchUsers]);

  const handleCreateChannel = async () => {
    if (newChannelName.trim() && user?._id) {
      try {
        const newChannel = await createChannel({
          name: newChannelName,
          isPrivate: false,
          members: [user._id],
        });
        setNewChannelName('');
        setShowNewChannelModal(false);
        setShowInviteModal(true);
        setInviteType('channel');
        setActiveChannel(newChannel._id);
      } catch (error) {
        console.error('Error creating channel:', error);
      }
    }
  };

  const handleUserClick = (userId: string) => {
    setActiveChannel(`dm-${userId}`);
  };

  return (
    <div className="w-64 bg-gray-800 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-white text-xl font-bold">Slack Clone</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between text-gray-300 mb-2">
              <span className="font-semibold">Channels</span>
              <button 
                onClick={() => setShowNewChannelModal(true)}
                className="hover:text-white"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <ChannelItem 
                  key={channel._id} 
                  channel={channel}
                  isActive={channel._id === activeChannelId}
                  onClick={() => setActiveChannel(channel._id)}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-gray-300 mb-2">
              <span className="font-semibold">Direct Messages</span>
            </div>
            <div className="space-y-1">
              {users.filter(u => u._id !== user?._id).map((u) => (
                <UserItem
                  key={u._id}
                  user={u}
                  isActive={`dm-${u._id}` === activeChannelId}
                  onClick={() => handleUserClick(u._id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Channel</h3>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewChannelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          type={inviteType}
          channelId={activeChannelId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

const ChannelItem = ({ 
  channel, 
  isActive,
  onClick 
}: { 
  channel: Channel; 
  isActive: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center text-gray-400 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer ${
      isActive ? 'bg-gray-700 text-white' : ''
    }`}
  >
    <Hash size={18} className="mr-2" />
    <span>{channel.name}</span>
  </div>
);

const UserItem = ({
  user,
  isActive,
  onClick
}: {
  user: User;
  isActive: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center text-gray-400 hover:bg-gray-700 px-2 py-1 rounded cursor-pointer ${
      isActive ? 'bg-gray-700 text-white' : ''
    }`}
  >
    <div className="relative">
      <MessageSquare size={18} className="mr-2" />
      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
        user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
      }`} />
    </div>
    <span>{user.name}</span>
  </div>
);