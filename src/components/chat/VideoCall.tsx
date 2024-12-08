import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, Phone } from 'lucide-react';
import { CallControls } from '../calls/CallControls';

interface VideoCallProps {
  peer: any; // Replace with proper peer type
  localStream: MediaStream;
  remoteStream: MediaStream;
  onEndCall: () => void;
}

export const VideoCall = ({ peer, localStream, remoteStream, onEndCall }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const toggleAudio = () => {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isAudioEnabled;
    });
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = () => {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !isVideoEnabled;
    });
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        peer.replaceTrack(
          localStream.getVideoTracks()[0],
          videoTrack,
          localStream
        );
        
        videoTrack.onended = () => {
          peer.replaceTrack(
            videoTrack,
            localStream.getVideoTracks()[0],
            localStream
          );
          setIsScreenSharing(false);
        };
        
        setIsScreenSharing(true);
      } else {
        peer.replaceTrack(
          localStream.getVideoTracks()[0],
          localStream.getVideoTracks()[0],
          localStream
        );
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      <div className="flex-1 flex">
        <div className="relative flex-1">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg shadow-lg"
          />
        </div>
      </div>

      <CallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onEndCall={onEndCall}
      />
    </div>
  );
};