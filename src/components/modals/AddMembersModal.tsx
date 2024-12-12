import React from "react";
import { X } from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { useChannelStore } from "../../store/channelStore";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { Channel } from "../../types";

interface AddMembersModalProps {
  channel: Channel | null | undefined;
  channelId: string;
  onClose: () => void;
}

export const AddMembersModal = ({
  channel,
  channelId,
  onClose,
}: AddMembersModalProps) => {
  const { users } = useUserStore();
  const { user } = useAuthStore();
  const { channels, fetchChannels } = useChannelStore();

  const currentChannel = channels.find((c) => c._id === channelId);
  const nonMembers = users.filter(
    (u) => u._id !== user?._id && !currentChannel?.members.includes(u._id)
  );

  const handleAddMember = async (userId: string) => {
    try {
      await api.post(`/api/channels/${channelId}/members`, { userId });
      await fetchChannels();
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Members</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* <div className="space-y-2">
          {channel?.members?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="ml-2">{user.name}</span>
              </div>
              <button
                onClick={() => handleAddMember(user._id)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          ))}
        </div> */}
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
          {channel?.members?.map((everyUser, index) => (
            <React.Fragment key={everyUser._id}>
              <div className="flex justify-between items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {/* {everyUser.name[0].toUpperCase()} */}
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        everyUser?.name || ""
                      )}`}
                      alt={everyUser?.name}
                      className="w-7 h-7 rounded-full"
                    />
                  </div>
                  <span className="ml-2">{everyUser.name}</span>
                </div>
                {everyUser.status === "online" && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
              {index < channel.members.length - 1 && (
                <hr className="border-t border-gray-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
