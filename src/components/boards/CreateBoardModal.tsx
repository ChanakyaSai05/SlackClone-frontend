import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useBoardStore } from "../../store/boardStore";
import { useUserStore } from "../../store/userStore";
import { Channel } from "../../types";
import { useAuthStore } from "../../store/authStore";

const boardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  members: z.array(z.string()),
});

type BoardFormData = z.infer<typeof boardSchema>;

interface CreateBoardModalProps {
  channel: Channel | null | undefined;
  channelId: string;
  onClose: () => void;
}

export const CreateBoardModal = ({
  channel,
  channelId,
  onClose,
}: CreateBoardModalProps) => {
  const { users } = useUserStore();
  const { user } = useAuthStore();
  const { createBoard } = useBoardStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      members: [],
    },
  });

  const onSubmit = async (data: BoardFormData) => {
    try {
      await createBoard({
        ...data,
        channelId,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create New Board</h3>
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
              Board Name
            </label>
            <input
              {...register("name")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter board name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              {...register("description")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter board description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Members
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {channel?.members?.map((everyUser) => (
                <label
                  key={everyUser._id}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    value={everyUser._id}
                    {...register("members")}
                    defaultChecked
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{everyUser.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
