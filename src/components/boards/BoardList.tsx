import React, { useState, useEffect } from "react";
import { Plus, Trash } from "lucide-react";
import { useBoardStore } from "../../store/boardStore";
import { useChannelStore } from "../../store/channelStore";
import { CreateBoardModal } from "./CreateBoardModal";
import { Board } from "./Board";

export const BoardList = () => {
  const { boards, fetchBoards, setActiveBoard, activeBoard, deleteBoard } =
    useBoardStore();
  const { activeChannelId, channels } = useChannelStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (activeChannelId && !activeChannelId.startsWith("dm-")) {
      fetchBoards(activeChannelId);
    }
  }, [activeChannelId, fetchBoards]);

  const handleCreateBoard = () => {
    setShowCreateModal(true);
  };
  const activeChannel = channels.find((c) => c._id === activeChannelId);

  if (!activeBoard) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Boards</h2>
          <button
            onClick={handleCreateBoard}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus size={16} />
            New Board
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => setActiveBoard(board._id)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium mb-2">{board.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBoard(board._id)
                  }}
                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-gray-200 rounded"
                  aria-label="Delete Board"
                >
                  <Trash size={16} />
                </button>
              </div>
              {board.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {board.description}
                </p>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <span>{board.members.length} members</span>
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <CreateBoardModal
            channel={activeChannel}
            channelId={activeChannelId!}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    );
  }

  return <Board boardId={activeBoard} />;
};
