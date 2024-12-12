import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "./Card";
import { CreateCardModal } from "./CreateCardModal";
import { Plus, Trash } from "lucide-react";
import { Section as SectionType, Card as CardType } from "../../types/board";

interface SectionProps {
  section: SectionType;
  cards: CardType[];
  deleteSection: (sectionId: string) => void;
}

export const Section = ({ section, cards, deleteSection }: SectionProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { setNodeRef } = useDroppable({
    id: section._id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-3"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{section.name}</h3>
          <span className="text-sm text-gray-500">({cards.length})</span>
        </div>
        <button
          onClick={() => deleteSection(section._id)}
          className="p-1 text-gray-600 hover:text-red-600 hover:bg-gray-200 rounded"
          aria-label="Delete section"
        >
          <Trash size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {cards
          .sort((a, b) => a.order - b.order)
          .map((card) => (
            <Card key={card._id} card={card} />
          ))}
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="mt-2 w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-200 rounded"
      >
        <Plus size={16} />
        Add Card
      </button>

      {showCreateModal && (
        <CreateCardModal
          sectionId={section._id}
          boardId={section.boardId}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};
