import Peer from "peerjs";
import { nanoid } from "nanoid";
import { socket } from "./socket";

class PeerService {
  private peer: Peer | null = null;
  private myStream: MediaStream | null = null;
  private currentCall: any = null;
  private initialized: boolean = false;
  private userId: string | null = null;
  private peerId: string | null = null;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  async initializePeer(userId: string) {
    try {
      this.userId = userId;

      if (this.initialized && this.peer) {
        return Promise.resolve(this.peerId);
      }

      this.peerId = `${userId}-${nanoid(8)}`;

      console.log("Initializing peer with ID:", this.peerId);

      this.peer = new Peer(this.peerId, {
        host: import.meta.env.NODE_ENV === "production" ? import.meta.env.VITE_API_URL : window.location.hostname,
        port: import.meta.env.NODE_ENV === "production" ? 443 : 3000,
        path: "/peerjs/myapp",
        debug: 3,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
          ],
        },
      });

      return new Promise((resolve, reject) => {
        if (!this.peer) {
          reject(new Error("Failed to create peer"));
          return;
        }

        this.peer.on("open", (id) => {
          console.log("Peer connection opened with ID:", id);
          this.initialized = true;
          this.retryAttempts = 0;

          socket.emit(
            "peer_id",
            {
              userId: this.userId,
              peerId: id,
            },
            (response: any) => {
              console.log("Peer ID response:", response);
            }
          );

          resolve(id);
        });

        this.peer.on("error", (error) => {
          console.error("Peer connection error:", error);
          this.initialized = false;

          if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            console.log(
              `Retrying peer connection (attempt ${this.retryAttempts})`
            );
            this.peer?.reconnect();
          } else {
            reject(error);
          }
        });

        this.peer.on("disconnected", () => {
          console.log("Peer disconnected, attempting to reconnect...");
          if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            this.peer?.reconnect();
          }
        });

        this.peer.on("close", () => {
          console.log("Peer connection closed");
          this.initialized = false;
          this.peer = null;

          if (this.userId) {
            socket.emit("peer_disconnected", { userId: this.userId });
          }
        });

        this.peer.on("call", async (call) => {
          console.log("Receiving call from:", call.peer);

          // Instead of auto-answering, emit an event for the UI to handle
          const event = new CustomEvent("incomingCall", {
            detail: { call, peerId: call.peer },
          });
          window.dispatchEvent(event);
        });

        setTimeout(() => {
          if (!this.initialized) {
            reject(new Error("Peer connection timeout"));
          }
        }, 20000);
      });
    } catch (error) {
      console.error("Error in initializePeer:", error);
      throw error;
    }
  }

  async startCall(recipientId: string) {
    try {
      if (!this.peer || !this.initialized) {
        await this.initializePeer(this.userId!);
      }

      console.log("Starting call to recipient:", recipientId);

      return new Promise((resolve, reject) => {
        socket.emit(
          "get_peer_id",
          { targetUserId: recipientId },
          async (response) => {
            console.log("Got peer ID response:", response);
            if (!response.peerId) {
              reject(new Error("Recipient not available"));
              return;
            }

            try {
              console.log("Got recipient peer ID:", response.peerId);

              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });

              this.myStream = stream;
              const call = this.peer!.call(response.peerId!, stream);
              this.currentCall = call;

              console.log("Call initiated");
              resolve({ call, localStream: stream });
            } catch (error) {
              console.error("Error in call setup:", error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  }

  async startScreenShare(call: any) {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      if (this.myStream && call) {
        const videoTrack = this.myStream.getVideoTracks()[0];
        const screenTrack = stream.getVideoTracks()[0];

        const sender = call.peerConnection
          ?.getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = async () => {
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        };
      }

      return stream;
    } catch (error) {
      console.error("Error sharing screen:", error);
      throw error;
    }
  }

  // endCall() {
  //   if (this.myStream) {
  //     this.myStream.getTracks().forEach((track) => {
  //       track.stop();
  //     });
  //     console.log("All tracks stopped");
  //     this.myStream = null;
  //   }
  //   if (this.peer) {
  //     // Close all active connections
  //     this.peer.disconnect();
  //   }
  //   // Ensure all possible streams are stopped
  //   navigator.mediaDevices.enumerateDevices().then((devices) => {
  //     devices
  //       .filter((device) => device.kind === "videoinput")
  //       .forEach(() => {
  //         navigator.mediaDevices
  //           .getUserMedia({ video: true })
  //           .then((stream) => {
  //             stream.getTracks().forEach((track) => track.stop());
  //           });
  //       });
  //   });
  // }
  endCall() {
    console.log('Ending call in peerService');
    
    if (this.myStream) {
      this.myStream.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      this.myStream = null;
    }

    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }
    
    if (this.userId) {
      socket.emit('end_call', { targetUserId: this.userId });
    }
  }

  destroy() {
    this.endCall();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
      this.initialized = false;
      this.peerId = null;

      if (this.userId) {
        socket.emit("peer_disconnected", { userId: this.userId });
      }
    }
  }
}

export const peerService = new PeerService();
// import Peer from 'peerjs';
// import { nanoid } from 'nanoid';
// import { socket } from './socket';

// class PeerService {
//   private peer: Peer | null = null;
//   private myStream: MediaStream | null = null;
//   private currentCall: any = null;
//   private initialized: boolean = false;
//   private userId: string | null = null;
//   private peerId: string | null = null;
//   private retryAttempts: number = 0;
//   private maxRetries: number = 3;
//   private reconnectTimeout: NodeJS.Timeout | null = null;

//   async initializePeer(userId: string) {
//     try {
//       if (this.initialized && this.peer && this.userId === userId) {
//         return Promise.resolve(this.peerId);
//       }

//       // Cleanup existing peer if any
//       if (this.peer) {
//         this.destroy();
//       }

//       this.userId = userId;
//       this.peerId = `${userId}-${nanoid(8)}`;
      
//       console.log('Initializing peer with ID:', this.peerId);
      
//       this.peer = new Peer(this.peerId, {
//         host: window.location.hostname,
//         port: 3000,
//         path: '/peerjs/myapp',
//         debug: 3,
//         config: {
//           iceServers: [
//             { urls: 'stun:stun.l.google.com:19302' },
//             { urls: 'stun:stun1.l.google.com:19302' },
//             { urls: 'stun:stun2.l.google.com:19302' },
//             { urls: 'stun:stun3.l.google.com:19302' },
//             { urls: 'stun:stun4.l.google.com:19302' }
//           ]
//         }
//       });

//       return new Promise((resolve, reject) => {
//         if (!this.peer) {
//           reject(new Error('Failed to create peer'));
//           return;
//         }

//         const connectionTimeout = setTimeout(() => {
//           if (!this.initialized) {
//             this.peer?.destroy();
//             reject(new Error('Peer connection timeout'));
//           }
//         }, 20000);

//         this.peer.on('open', (id) => {
//           clearTimeout(connectionTimeout);
//           console.log('Peer connection opened with ID:', id);
//           this.initialized = true;
//           this.retryAttempts = 0;
          
//           socket.emit('peer_id', { 
//             userId: this.userId, 
//             peerId: id 
//           });
          
//           resolve(id);
//         });

//         this.peer.on('error', (error) => {
//           console.error('Peer connection error:', error);
//           this.initialized = false;
          
//           if (this.retryAttempts < this.maxRetries) {
//             this.retryAttempts++;
//             console.log(`Retrying peer connection (attempt ${this.retryAttempts})`);
            
//             if (this.reconnectTimeout) {
//               clearTimeout(this.reconnectTimeout);
//             }
            
//             this.reconnectTimeout = setTimeout(() => {
//               this.peer?.reconnect();
//             }, 2000 * this.retryAttempts);
//           } else {
//             reject(error);
//           }
//         });

//         this.peer.on('disconnected', () => {
//           console.log('Peer disconnected, attempting to reconnect...');
//           this.initialized = false;
          
//           if (this.retryAttempts < this.maxRetries) {
//             this.retryAttempts++;
            
//             if (this.reconnectTimeout) {
//               clearTimeout(this.reconnectTimeout);
//             }
            
//             this.reconnectTimeout = setTimeout(() => {
//               this.peer?.reconnect();
//             }, 2000 * this.retryAttempts);
//           }
//         });

//         this.peer.on('close', () => {
//           console.log('Peer connection closed');
//           this.initialized = false;
//           this.peer = null;
//           this.endCall();
          
//           if (this.userId) {
//             socket.emit('peer_disconnected', { userId: this.userId });
//           }
//         });

//         this.peer.on('call', async (call) => {
//           try {
//             console.log('Receiving call from:', call.peer);
//             this.currentCall = call;
            
//             const stream = await this.getUserMedia();
//             this.myStream = stream;
//             call.answer(stream);
            
//             call.on('stream', (remoteStream) => {
//               console.log('Received remote stream');
//               const event = new CustomEvent('incomingStream', { 
//                 detail: { call, stream: remoteStream } 
//               });
//               window.dispatchEvent(event);
//             });

//             call.on('error', (error) => {
//               console.error('Call error:', error);
//               this.endCall();
//             });

//             call.on('close', () => {
//               console.log('Call closed');
//               this.endCall();
//             });
//           } catch (error) {
//             console.error('Error answering call:', error);
//             socket.emit('call_error', {
//               targetUserId: call.peer.split('-')[0],
//               error: 'Failed to access media devices'
//             });
//           }
//         });
//       });
//     } catch (error) {
//       console.error('Error in initializePeer:', error);
//       throw error;
//     }
//   }

//   private async getUserMedia(isVideo: boolean = true) {
//     try {
//       const constraints = {
//         video: isVideo ? {
//           width: { ideal: 1280 },
//           height: { ideal: 720 }
//         } : false,
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true
//         }
//       };
      
//       return await navigator.mediaDevices.getUserMedia(constraints);
//     } catch (error) {
//       console.error('Error accessing media devices:', error);
      
//       if (error instanceof DOMException && error.name === 'NotReadableError') {
//         return await navigator.mediaDevices.getUserMedia({
//           video: false,
//           audio: {
//             echoCancellation: true,
//             noiseSuppression: true
//           }
//         });
//       }
//       throw error;
//     }
//   }

//   async startCall(recipientId: string, isVideo: boolean = true) {
//     try {
//       if (!this.peer || !this.initialized) {
//         await this.initializePeer(this.userId!);
//       }

//       console.log('Starting call to recipient:', recipientId);

//       socket.emit('call_user', { targetUserId: recipientId });

//       return new Promise((resolve, reject) => {
//         socket.emit('get_peer_id', { targetUserId: recipientId }, async (response) => {
//           if (!response.peerId || !response.isOnline) {
//             reject(new Error('Recipient not available'));
//             return;
//           }

//           try {
//             console.log('Got recipient peer ID:', response.peerId);
            
//             const stream = await this.getUserMedia(isVideo);
//             this.myStream = stream;
            
//             const call = this.peer!.call(response.peerId!, stream);
//             this.currentCall = call;
//             console.log('Call initiated');
            
//             const callTimeout = setTimeout(() => {
//               call.close();
//               reject(new Error('Call not answered'));
//             }, 30000);
            
//             call.on('stream', (remoteStream) => {
//               clearTimeout(callTimeout);
//               console.log('Received remote stream from recipient');
//               const event = new CustomEvent('incomingStream', { 
//                 detail: { call, stream: remoteStream } 
//               });
//               window.dispatchEvent(event);
//             });

//             call.on('error', (error) => {
//               clearTimeout(callTimeout);
//               console.error('Call error:', error);
//               this.endCall();
//               reject(error);
//             });

//             call.on('close', () => {
//               clearTimeout(callTimeout);
//               console.log('Call ended');
//               this.endCall();
//             });

//             resolve({ call, localStream: stream });
//           } catch (error) {
//             console.error('Error in call setup:', error);
//             reject(error);
//           }
//         });
//       });
//     } catch (error) {
//       console.error('Error starting call:', error);
//       throw error;
//     }
//   }

//   async answerCall(call: any) {
//     try {
//       console.log('Answering call from:', call.peer);
//       this.currentCall = call;
      
//       const stream = await this.getUserMedia();
//       this.myStream = stream;
//       call.answer(stream);

//       call.on('stream', (remoteStream: MediaStream) => {
//         console.log('Received remote stream in answer');
//         const event = new CustomEvent('incomingStream', { 
//           detail: { call, stream: remoteStream } 
//         });
//         window.dispatchEvent(event);
//       });

//       return stream;
//     } catch (error) {
//       console.error('Error answering call:', error);
//       socket.emit('call_error', {
//         targetUserId: call.peer.split('-')[0],
//         error: 'Failed to access media devices'
//       });
//       throw error;
//     }
//   }

//   async startScreenShare(call: any) {
//     try {
//       const stream = await navigator.mediaDevices.getDisplayMedia({
//         video: {
//           cursor: 'always'
//         },
//         audio: false
//       });
      
//       if (this.myStream && call) {
//         const videoTrack = this.myStream.getVideoTracks()[0];
//         const screenTrack = stream.getVideoTracks()[0];
        
//         const sender = call.peerConnection?.getSenders().find((s: RTCRtpSender) => 
//           s.track?.kind === 'video'
//         );
        
//         if (sender) {
//           await sender.replaceTrack(screenTrack);
//         }

//         screenTrack.onended = async () => {
//           if (sender && videoTrack) {
//             await sender.replaceTrack(videoTrack);
//           }
//         };
//       }
      
//       return stream;
//     } catch (error) {
//       console.error('Error sharing screen:', error);
//       throw error;
//     }
//   }

//   endCall() {
//     console.log('Ending call in peerService');
    
//     if (this.myStream) {
//       this.myStream.getTracks().forEach(track => {
//         track.enabled = false;
//         track.stop();
//       });
//       this.myStream = null;
//     }

//     if (this.currentCall) {
//       this.currentCall.close();
//       this.currentCall = null;
//     }
    
//     if (this.userId) {
//       socket.emit('end_call', { targetUserId: this.userId });
//     }
//   }

//   destroy() {
//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout);
//     }
    
//     this.endCall();
    
//     if (this.peer) {
//       this.peer.destroy();
//       this.peer = null;
//       this.initialized = false;
//       this.peerId = null;
//       this.retryAttempts = 0;
      
//       if (this.userId) {
//         socket.emit('peer_disconnected', { userId: this.userId });
//       }
//     }
//   }
// }

// export const peerService = new PeerService();