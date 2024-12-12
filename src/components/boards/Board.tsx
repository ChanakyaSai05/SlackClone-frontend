import React, { useEffect } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useBoardStore } from "../../store/boardStore";
import { Section } from "./Section";
import { CreateSectionButton } from "./CreateSectionButton";
import { ArrowLeft } from "lucide-react";

interface BoardProps {
  boardId: string;
}

export const Board = ({ boardId }: BoardProps) => {
  const {
    sections,
    cards,
    fetchBoardData,
    moveCard,
    setActiveBoard,
    deleteSection,
    boards,
  } = useBoardStore();

  useEffect(() => {
    fetchBoardData(boardId);
  }, [boardId, fetchBoardData]);
  const activeBoardObject= boards.find((b) => b._id === boardId);
  console.log(activeBoardObject,"activeBoardObject");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    // Find the target section and position
    const overSection =
      sections.find((s) => s._id === overId) ||
      sections.find((s) => {
        const sectionCards = cards.filter((c) => c.sectionId === s._id);
        return sectionCards.some((c) => c._id === overId);
      });

    if (!overSection) return;

    // Calculate new order
    const sectionCards = cards
      .filter((c) => c.sectionId === overSection._id)
      .sort((a, b) => a.order - b.order);

    let newOrder = 0;

    if (overId === overSection._id) {
      // Dropped at the end of the section
      newOrder =
        sectionCards.length > 0
          ? sectionCards[sectionCards.length - 1].order + 1
          : 0;
    } else {
      // Dropped between cards
      const overCard = sectionCards.find((c) => c._id === overId);
      if (overCard) {
        newOrder = overCard.order;
      }
    }

    moveCard(cardId, overSection._id, newOrder);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setActiveBoard(null)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">
            {sections.length > 0 ? "Board Sections" : "Add your first section"}
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <Section
                key={section._id}
                section={section}
                cards={cards.filter((c) => c.sectionId === section._id)}
                deleteSection={deleteSection}
              />
            ))}
          <CreateSectionButton boardId={boardId} />
        </div>
      </div>
    </DndContext>
  );
};
