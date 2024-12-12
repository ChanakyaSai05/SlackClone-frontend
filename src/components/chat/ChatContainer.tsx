import React, { useEffect, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChannelHeader } from "./ChannelHeader";
import { useChannelStore } from "../../store/channelStore";
import { BoardList } from "../boards/BoardList";
import { Layout } from "lucide-react";

export const ChatContainer = () => {
  const { activeChannelId, channels } = useChannelStore();
  const [activeTab, setActiveTab] = useState<"chat" | "board">("chat");
  console.log(activeTab, "activeTab");

  const isDM = activeChannelId?.startsWith("dm-");
  useEffect(() => {
    if (activeChannelId) {
      if (isDM) {
        setActiveTab("chat");
      }
    }
  }, [activeChannelId, isDM]);
  if (!activeChannelId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Select a channel or user to start chatting
        </p>
      </div>
    );
  }
  // Don't show boards tab for direct messages

  // return (
  //   <div className="flex-1 flex flex-col bg-white">
  //     <ChannelHeader />
  //     <MessageList />
  //     <MessageInput />
  //   </div>
  // );
  // console.log(activeChannelId,activeChannel,"activeChannelId,activeChannel");
  const activeChannel = channels.find((c) => c._id === activeChannelId);

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ChannelHeader />

      {!isDM && (
        <div className="border-b px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-2 px-4 focus:outline-none ${
                activeTab === "chat"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("board")}
              className={`py-2 px-4 focus:outline-none flex items-center gap-2 ${
                activeTab === "board"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Layout size={18} />
              Board
            </button>
          </div>
        </div>
      )}

      {activeTab === "chat" ? (
        <>
          <MessageList />
          <MessageInput />
        </>
      ) : (
        <div className="flex-1 overflow-hidden">
          <BoardList />
        </div>
      )}
    </div>
  );
};
