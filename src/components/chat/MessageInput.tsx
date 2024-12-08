import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import { useMessageStore } from '../../store/messageStore';
import { useChannelStore } from '../../store/channelStore';
import { api } from '../../services/api';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeChannelId } = useChannelStore();
  const { sendMessage } = useMessageStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || !activeChannelId || uploading) return;

    try {
      setUploading(true);
      
      // Upload attachments if any
      const uploadedAttachments = [];
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        uploadedAttachments.push({
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: response.data.url,
          name: file.name,
          size: file.size,
          mimeType: file.type
        });
      }

      await sendMessage(message, activeChannelId, uploadedAttachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!activeChannelId) return null;

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1">
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-gray-600"
        >
          <Paperclip size={20} />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
        />
        
        <button
          type="button"
          className="text-gray-500 hover:text-gray-600"
        >
          <Smile size={20} />
        </button>
        
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || uploading}
          className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};