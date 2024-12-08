import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

interface InviteModalProps {
  type: 'channel' | 'direct';
  channelId?: string | null;
  onClose: () => void;
}

export const InviteModal = ({ type, channelId, onClose }: InviteModalProps) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await api.post('/api/invitations', {
        type,
        recipientEmail: email,
        channelId
      });

      setStatus('success');
      setMessage('Invitation sent successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to send invitation. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold mb-4">
          {type === 'channel' ? 'Invite to Channel' : 'Start Direct Message'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {status === 'error' && (
            <p className="text-red-500 text-sm">{message}</p>
          )}

          {status === 'success' && (
            <p className="text-green-500 text-sm">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}