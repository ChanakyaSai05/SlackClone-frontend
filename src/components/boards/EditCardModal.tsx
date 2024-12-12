import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useBoardStore } from "../../store/boardStore";
import { useUserStore } from "../../store/userStore";
import { Card } from "../../types/board";

const cardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assignedTo: z.array(z.string()),
  labels: z
    .array(
      z.object({
        name: z.string(),
        color: z.string(),
      })
    )
    .optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

interface EditCardModalProps {
  card: Card;
  onClose: () => void;
}

export const EditCardModal = ({ card, onClose }: EditCardModalProps) => {
  const { users } = useUserStore();
  const { boards, activeBoard } = useBoardStore();
  const { updateCard, deleteCard } = useBoardStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: card.title,
      description: card.description,
      priority: card.priority,
      dueDate: card.dueDate,
      assignedTo: card.assignedTo,
      labels: card.labels,
    },
  });
  const boardObject = boards.find((board) => board._id === activeBoard);
  const assignedUsers = card.assignedTo;

  const onSubmit = async (data: CardFormData) => {
    try {
      await updateCard(card._id, data);
      onClose();
    } catch (error) {
      console.error("Failed to update card:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      try {
        await deleteCard(card._id);
        onClose();
      } catch (error) {
        console.error("Failed to delete card:", error);
      }
    }
  };
  console.log(assignedUsers,"assignedUsers",boardObject,"boardObject",card,"card");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Card</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              {...register("title")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter card title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter card description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register("priority")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              {...register("dueDate")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {boardObject?.members?.map((user) => (
                <label key={user._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={user._id}
                    defaultChecked={assignedUsers.some((u) => u._id === user._id)}
                    {...register("assignedTo")}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete Card
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
