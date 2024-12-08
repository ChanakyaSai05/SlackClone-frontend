import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, Phone } from 'lucide-react';

interface CallControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export const CallControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: CallControlsProps) => {
  return (
    <div className="flex items-center justify-center space-x-4 bg-gray-900 p-4">
      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full ${
          isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full ${
          isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
      </button>

      <button
        onClick={onToggleScreenShare}
        className={`p-3 rounded-full ${
          isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <Monitor size={24} />
      </button>

      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-500 hover:bg-red-600"
      >
        <Phone size={24} />
      </button>
    </div>
  );
};