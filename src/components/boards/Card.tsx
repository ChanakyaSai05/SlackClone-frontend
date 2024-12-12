import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Calendar, Tag } from "lucide-react";
import { Card as CardType } from "../../types/board";
import { useUserStore } from "../../store/userStore";
import { EditCardModal } from "./EditCardModal";

interface CardProps {
  card: CardType;
}

export const Card = ({ card }: CardProps) => {
  const { users } = useUserStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card._id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setShowEditModal(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        
        className="bg-white p-3 rounded shadow-sm hover:shadow cursor-grab active:cursor-grabbing"
      >
        <div onClick={handleCardClick}>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium">{card.title}</h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                priorityColors[card.priority]
              }`}
            >
              {card.priority}
            </span>
          </div>

          {card.description && (
            <p className="text-sm text-gray-600 mb-2">{card.description}</p>
          )}

          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map((label, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: label.color + "20",
                    color: label.color,
                  }}
                >
                  <Tag size={12} />
                  {label.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            {card.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {format(new Date(card.dueDate), "MMM d")}
              </div>
            )}

            {/* {assignedUsers.length > 0 && (
              <div className="flex -space-x-2">
                {assignedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white"
                    title={user.name}
                  >
                    {user.name[0].toUpperCase()}
                  </div>
                ))}
              </div>
            )} */}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditCardModal card={card} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
};
