import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Trash2, Users } from "lucide-react";
import { useChannelStore } from "../../store/channelStore";
import { useUserStore } from "../../store/userStore";
import { Channel } from "../../types";
import { useAuthStore } from "../../store/authStore";

const channelSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
  description: z.string().optional(),
  members: z.array(z.string()),
});

type ChannelFormData = z.infer<typeof channelSchema>;

interface ChannelSettingsModalProps {
  channel: Channel | null | undefined;
  onClose: () => void;
}

export const ChannelSettingsModal = ({
  channel,
  onClose,
}: ChannelSettingsModalProps) => {
  const { users } = useUserStore();
  const { user } = useAuthStore();
  const { updateChannel, deleteChannel } = useChannelStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      name: channel.name,
      description: channel.description,
      members: channel.members,
    },
  });

  const onSubmit = async (data: ChannelFormData) => {
    try {
      await updateChannel(channel._id, data);
      onClose();
    } catch (error) {
      console.error("Failed to update channel:", error);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this channel? This will delete all boards, sections, and cards associated with this channel."
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteChannel(channel._id);
      onClose();
    } catch (error) {
      console.error("Failed to delete channel:", error);
      setIsDeleting(false);
    }
  };
  console.log(users, "users",channel, "channel", user, "user");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Channel Settings</h3>
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
              Channel Name
            </label>
            <input
              {...register("name")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Members
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {users.map((everyUser) => (
                <label
                  key={everyUser._id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    value={everyUser._id}
                    {...register("members")}
                    defaultChecked={(everyUser._id === user?._id) || !!channel?.members?.find((m) => m?._id === everyUser._id)}
                    onChange={(e)=>{
                      if(everyUser._id === user?._id){
                        e.preventDefault();
                        return;
                      }
                    }}
                    onClick={(e)=>{
                      if(everyUser._id === user?._id){
                        e.preventDefault();
                        return;
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm flex-1">{everyUser.name}</span>
                  {everyUser.status === "online" && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-2" />
              {isDeleting ? "Deleting..." : "Delete Channel"}
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
