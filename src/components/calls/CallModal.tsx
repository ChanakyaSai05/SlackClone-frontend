// import React, { useEffect, useRef, useState } from "react";
// import { Phone, Video, Mic, MicOff, VideoOff, X } from "lucide-react";
// import { CallControls } from "./CallControls";
// import { IncomingCallModal } from "./IncomingCallModal";
// import { peerService } from "../../services/peerService";
// import { useAuthStore } from "../../store/authStore";
// import { socket } from "../../services/socket";

// interface CallModalProps {
//   isOpen: boolean;
//   recipientId: string;
//   recipientName: string;
//   isIncoming?: boolean;
//   call?: any;
//   onClose: () => void;
// }

// export const CallModal: React.FC<CallModalProps> = ({
//   isOpen,
//   recipientId,
//   recipientName,
//   isIncoming,
//   call,
//   onClose,
// }) => {
//   const { user } = useAuthStore();
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isCallEnded, setIsCallEnded] = useState(false);
//   const [showIncomingCall, setShowIncomingCall] = useState(isIncoming);
//   const [isCallAccepted, setIsCallAccepted] = useState(false);
//   const currentCallRef = useRef<any>(null);

//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     if (!isOpen || !user?._id) return;

//     const initializeCall = async () => {
//       try {
//         // await peerService.initializePeer(user._id);

//         if (!isIncoming) {
//           try {
//             const { call: newCall, localStream } = await peerService.startCall(
//               recipientId
//             );
//             currentCallRef.current = newCall;
//             setLocalStream(localStream);

//             newCall.on("stream", (remoteStream: MediaStream) => {
//               console.log("Received remote stream");
//               setRemoteStream(remoteStream);
//             });

//             newCall.on("error", (err: Error) => {
//               console.error("Call error:", err);
//               setError("Call failed: " + err.message);
//               setIsCallEnded(true);
//               setTimeout(onClose, 3000);
//             });

//             newCall.on("close", () => {
//               setIsCallEnded(true);

//               console.log("Call closed");
//               // handleEndCall();
//             });
//           } catch (error) {
//             console.error("Error starting call:", error);
//             setError("Failed to start call. Please check camera permissions.");
//             setTimeout(onClose, 3000);
//           }
//         }
//       } catch (error) {
//         console.error("Error setting up call:", error);
//         setError("Failed to establish call connection");
//         setTimeout(onClose, 3000);
//       }
//     };

//     if (!isIncoming || isCallAccepted) {
//       initializeCall();
//     }

//     // Listen for call events
//     socket.on("call_failed", ({ error: callError }) => {
//       setError(callError);
//       setIsCallEnded(true);
//       console.log("Call failed:", callError);
//       setTimeout(onClose, 3000);
//     });

//     socket.on("call_ended", () => {
//       setIsCallEnded(true);
//       console.log("Call ended");
//       // handleEndCall();
//       setTimeout(onClose, 3000);
//     });
//     socket.on("call_rejected", () => {
//       setError("Call rejected");
//       setIsCallEnded(true);
//       console.log("Call rejected");
//       setTimeout(onClose, 3000);
//     });

//     return () => {
//       socket.off("call_failed");
//       socket.off("call_ended");
//       // handleEndCall();
//     };
//   }, [isOpen, recipientId, isIncoming, isCallAccepted, user?._id]);
  

//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//     if (remoteVideoRef.current && remoteStream) {
//       remoteVideoRef.current.srcObject = remoteStream;
//     }
//   }, [localStream, remoteStream]);

//   const handleAcceptCall = async () => {
//     try {
//       if (!call) return;

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       setLocalStream(stream);
//       currentCallRef.current = call;
//       call.answer(stream);

//       call.on("stream", (remoteStream: MediaStream) => {
//         console.log("Received remote stream in answer");
//         setRemoteStream(remoteStream);
//       });

//       setShowIncomingCall(false);
//       setIsCallAccepted(true);

//       // Notify caller that call was answered
//       socket.emit("answer_call", { targetUserId: recipientId });
//     } catch (error) {
//       console.error("Error accepting call:", error);
//       setError("Failed to access camera/microphone. Please check permissions.");
//       socket.emit("call_error", {
//         targetUserId: recipientId,
//         error: "Failed to access media devices",
//       });
//       setTimeout(onClose, 3000);
//     }
//   };

//   const handleRejectCall = () => {
//     socket.emit("call_rejected", { targetUserId: recipientId });
//     console.log("Call rejected");
//     peerService.endCall();
//     onClose();
//   };

//   const handleToggleAudio = () => {
//     if (localStream) {
//       const audioTrack = localStream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !isAudioEnabled;
//         setIsAudioEnabled(!isAudioEnabled);
//       }
//     }
//   };

//   const handleToggleVideo = () => {
//     if (localStream) {
//       const videoTrack = localStream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !isVideoEnabled;
//         setIsVideoEnabled(!isVideoEnabled);
//       }
//     }
//   };

//   const handleToggleScreenShare = async () => {
//     try {
//       if (!isScreenSharing) {
//         // const screenStream = await peerService.startScreenShare(call);
//         const screenStream = await peerService.startScreenShare(currentCallRef.current);
//         screenStream.getVideoTracks()[0].onended = () => {
//           setIsScreenSharing(false);
//         };
//         setIsScreenSharing(true);
//       } else {
//         const { localStream } = await peerService.startCall(recipientId);
//         setLocalStream(localStream);
//         setIsScreenSharing(false);
//       }
//     } catch (error) {
//       console.error("Error toggling screen share:", error);
//       setError("Failed to share screen");
//     }
//   };

//   // const handleEndCall = () => {
//   //   setIsCallEnded(true);
//   //   if (localStream) {
//   //     localStream.getTracks().forEach((track) => track.stop());
//   //   }
//   //   if (remoteStream) {
//   //     remoteStream.getTracks().forEach((track) => track.stop());
//   //   }
//   //   peerService.endCall();
//   //   socket.emit("end_call", { targetUserId: recipientId });
//   //   console.log("Call ended");
//   //   onClose();
//   // };
//   const handleEndCall = () => {
//     console.log("Ending call");
//     setIsCallEnded(true);

//     // Stop all tracks from local stream
//     if (localStream) {
//       localStream.getTracks().forEach((track) => {
//         track.enabled = false; // First disable
//         track.stop(); // Then stop
//       });
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = null; // Clear video element
//       }
//       setLocalStream(null);
//     }

//     // Stop all tracks from remote stream
//     if (remoteStream) {
//       remoteStream.getTracks().forEach((track) => {
//         track.enabled = false;
//         track.stop();
//       });
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }
//       setRemoteStream(null);
//     }

//     // Clean up peer connection
//     // if (call) {
//     //   call.close();
//     // }
//     if (currentCallRef.current) {
//       currentCallRef.current.close();
//       currentCallRef.current = null;
//     }

//     // Clean up peer service
//     peerService.endCall();

//     // Notify other peer
//     socket.emit("end_call", { targetUserId: recipientId });
//     console.log("Call ended");
//     onClose();
//   };

//   if (!isOpen) return null;

//   if (showIncomingCall) {
//     return (
//       <IncomingCallModal
//         callerName={recipientName}
//         onAccept={handleAcceptCall}
//         onReject={handleRejectCall}
//       />
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
//       <div className="bg-gray-900 w-full h-full md:w-4/5 md:h-4/5 rounded-lg overflow-hidden flex flex-col">
//         <div className="p-4 flex justify-between items-center bg-gray-800">
//           <h3 className="text-white text-lg font-semibold">
//             Call with {recipientName}
//           </h3>
//           <button
//             onClick={handleEndCall}
//             className="text-gray-400 hover:text-white"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         {error && (
//           <div className="bg-red-500 text-white p-2 text-center">{error}</div>
//         )}

//         <div className="flex-1 relative bg-black">
//           {remoteStream && (
//             <video
//               ref={remoteVideoRef}
//               autoPlay
//               playsInline
//               className="w-full h-full object-cover"
//             />
//           )}

//           {localStream && (
//             <video
//               ref={localVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg shadow-lg"
//             />
//           )}
//         </div>

//         <CallControls
//           isAudioEnabled={isAudioEnabled}
//           isVideoEnabled={isVideoEnabled}
//           isScreenSharing={isScreenSharing}
//           onToggleAudio={handleToggleAudio}
//           onToggleVideo={handleToggleVideo}
//           onToggleScreenShare={handleToggleScreenShare}
//           onEndCall={handleEndCall}
//         />
//       </div>
//     </div>
//   );
// };
import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, X } from 'lucide-react';
import { CallControls } from './CallControls';
import { IncomingCallModal } from './IncomingCallModal';
import { AnnotationCanvas } from './AnnotationCanvas';
import { peerService } from '../../services/peerService';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../services/socket';

interface CallModalProps {
  isOpen: boolean;
  recipientId: string;
  recipientName: string;
  isIncoming?: boolean;
  call?: any;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  recipientId,
  recipientName,
  isIncoming,
  call,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(isIncoming);
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const currentCallRef = useRef<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen || !user?._id) return;

    const initializeCall = async () => {
      try {
        if (!isIncoming) {
          try {
            const { call: newCall, localStream } = await peerService.startCall(recipientId);
            currentCallRef.current = newCall;
            setLocalStream(localStream);

            newCall.on('stream', (remoteStream: MediaStream) => {
              console.log('Received remote stream');
              setRemoteStream(remoteStream);
            });

            newCall.on('error', (err: Error) => {
              console.error('Call error:', err);
              setError('Call failed: ' + err.message);
              setIsCallEnded(true);
              handleEndCall();
            });

            newCall.on('close', () => {
              console.log('Call closed');
              setIsCallEnded(true);
              handleEndCall();
            });
          } catch (error) {
            console.error('Error starting call:', error);
            setError('Failed to start call. Please check camera permissions.');
            setTimeout(onClose, 3000);
          }
        }
      } catch (error) {
        console.error('Error setting up call:', error);
        setError('Failed to establish call connection');
        setTimeout(onClose, 3000);
      }
    };

    if (!isIncoming || isCallAccepted) {
      initializeCall();
    }

    const handleCallEnded = () => {
      console.log('Received call_ended event');
      setIsCallEnded(true);
      handleEndCall();
    };

    const handleCallFailed = ({ error: callError }: { error: string }) => {
      setError(callError);
      setIsCallEnded(true);
      handleEndCall();
    };

    socket.on('call_ended', handleCallEnded);
    socket.on('call_failed', handleCallFailed);

    return () => {
      socket.off('call_ended', handleCallEnded);
      socket.off('call_failed', handleCallFailed);
      // if (!isCallEnded) {
      //   handleEndCall();
      // }
    };
  }, [isOpen, recipientId, isIncoming, isCallAccepted, user?._id]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const handleAcceptCall = async () => {
    try {
      if (!call) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      currentCallRef.current = call;
      call.answer(stream);

      call.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream in answer');
        setRemoteStream(remoteStream);
      });

      setShowIncomingCall(false);
      setIsCallAccepted(true);

      socket.emit('answer_call', { targetUserId: recipientId });
    } catch (error) {
      console.error('Error accepting call:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
      socket.emit('call_error', {
        targetUserId: recipientId,
        error: 'Failed to access media devices',
      });
      setTimeout(onClose, 3000);
    }
  };

  const handleRejectCall = () => {
    socket.emit('call_rejected', { targetUserId: recipientId });
    onClose();
  };

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await peerService.startScreenShare(currentCallRef.current);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } else {
        const { localStream } = await peerService.startCall(recipientId);
        setLocalStream(localStream);
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError('Failed to share screen');
    }
  };

  const handleEndCall = () => {
    console.log('Ending call');
    setIsCallEnded(true);

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setLocalStream(null);
    }

    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setRemoteStream(null);
    }

    // Close peer connection
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }

    // Clean up peer service
    peerService.endCall();

    // Notify other peer
    socket.emit('end_call', { targetUserId: recipientId });
    
    onClose();
  };

  if (!isOpen) return null;

  if (showIncomingCall) {
    return (
      <IncomingCallModal
        callerName={recipientName}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-full h-full md:w-4/5 md:h-4/5 rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 flex justify-between items-center bg-gray-800">
          <h3 className="text-white text-lg font-semibold">
            Call with {recipientName}
          </h3>
          <button
            onClick={handleEndCall}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-2 text-center">{error}</div>
        )}

        <div className="flex-1 relative bg-black">
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg shadow-lg"
            />
          )}

          <AnnotationCanvas
            isScreenSharing={isScreenSharing}
            recipientId={recipientId}
          />
        </div>

        <CallControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  );
};