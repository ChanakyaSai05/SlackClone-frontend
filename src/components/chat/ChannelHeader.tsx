import React, { useState, useEffect } from "react";
import { Settings, Users, Video, Phone } from "lucide-react";
import { useChannelStore } from "../../store/channelStore";
import { useUserStore } from "../../store/userStore";
import { useAuthStore } from "../../store/authStore";
import { InviteModal } from "../modals/InviteModal";
import { AddMembersModal } from "../modals/AddMembersModal";
import { CallModal } from "../calls/CallModal";
import { socket } from "../../services/socket";
import { peerService } from "../../services/peerService";

export const ChannelHeader = () => {
  const { activeChannelId, channels } = useChannelStore();
  const { users } = useUserStore();
  const { user } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const isDirectMessage = activeChannelId?.startsWith("dm-");
  const otherUser = isDirectMessage
    ? users.find((u) => `dm-${u._id}` === activeChannelId)
    : null;
  const channelName = isDirectMessage
    ? otherUser?.name
    : channels.find((c) => c._id === activeChannelId)?.name;

  useEffect(() => {
    const handleIncomingCall = (event: any) => {
      const { call, peerId } = event.detail;
      const callerId = peerId.split("-")[0];
      const caller = users.find((u) => u._id === callerId);

      if (caller) {
        setIncomingCall({ call, caller });
        setShowCallModal(true);
      }
    };

    window.addEventListener("incomingCall", handleIncomingCall);

    return () => {
      window.removeEventListener("incomingCall", handleIncomingCall);
    };
  }, [users]);

  const handleStartCall = (video: boolean) => {
    setIsVideoCall(video);
    setShowCallModal(true);
  };

  const handleCloseCall = () => {
    setShowCallModal(false);
    setIncomingCall(null);
    peerService.endCall();
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.forEach((device) => {
        if (device.kind === "videoinput") {
          navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
          });
        }
      });
    } );
  };
  useEffect(() => {
    if (!user?._id) return;
    const initializeCall = async () => {
      try {
        await peerService.initializePeer(user._id);
      } catch (error) {
        console.error("Error initializing call:", error);
      }
    };
    initializeCall();
  }, [user]);

  console.log(
    showCallModal,
    incomingCall,
    otherUser,
    "showCallModal, incomingCall,otherUser"
  );

  return (
    <div className="border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold">{channelName}</h2>
        {isDirectMessage && otherUser?.status === "online" && (
          <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {!isDirectMessage && (
          <>
            <button
              onClick={() => setShowAddMembersModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Add Members"
            >
              <Users size={20} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Invite via Email"
            >
              <Users size={20} />
            </button>
          </>
        )}

        {isDirectMessage && otherUser && (
          <>
            <button
              onClick={() => handleStartCall(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Start Video Call"
            >
              <Video size={20} />
            </button>
            <button
              onClick={() => handleStartCall(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Start Voice Call"
            >
              <Phone size={20} />
            </button>
          </>
        )}

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Settings size={20} />
        </button>
      </div>

      {showInviteModal && (
        <InviteModal
          type="channel"
          channelId={activeChannelId}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showAddMembersModal && activeChannelId && !isDirectMessage && (
        <AddMembersModal
          channelId={activeChannelId}
          onClose={() => setShowAddMembersModal(false)}
        />
      )}

      {showCallModal && (otherUser || incomingCall) && (
        <CallModal
          isOpen={showCallModal}
          recipientId={incomingCall ? incomingCall.caller._id : otherUser!._id}
          recipientName={
            incomingCall ? incomingCall.caller.name : otherUser!.name
          }
          isIncoming={!!incomingCall}
          call={incomingCall?.call}
          onClose={handleCloseCall}
        />
      )}
    </div>
  );
};
