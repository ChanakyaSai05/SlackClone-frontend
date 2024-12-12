import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBoardStore } from '../../store/boardStore';

interface CreateSectionButtonProps {
  boardId: string;
}

export const CreateSectionButton = ({ boardId }: CreateSectionButtonProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const { createSection } = useBoardStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createSection({
        name,
        boardId
      });
      setName('');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  if (isEditing) {
    return (
      <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-3">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter section name"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex-shrink-0 w-80 h-12 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg"
    >
      <Plus size={20} />
      Add Section
    </button>
  );
};