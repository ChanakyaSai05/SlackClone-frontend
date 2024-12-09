import React, { useEffect, useRef } from 'react';
import { FileText, Image } from 'lucide-react';
import { useMessageStore } from '../../store/messageStore';
import { useChannelStore } from '../../store/channelStore';
import { Message as MessageType } from '../../types';
import { socket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';

export const MessageList = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeChannelId } = useChannelStore();
  const { messages, fetchMessages, addMessage } = useMessageStore();
  const {user}=useAuthStore();

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
      
      // Join channel room for real-time updates
      socket.emit('join_channel', activeChannelId);
      
      // Listen for new messages
      socket.on('receive_message', (message) => {
        if (message.channel === activeChannelId || 
            (activeChannelId.startsWith('dm-') && 
             message.sender._id === activeChannelId.replace('dm-', ''))) {
          addMessage(activeChannelId, message);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      });
      
      return () => {
        socket.emit('leave_channel', activeChannelId);
        socket.off('receive_message');
      };
    }
  }, [activeChannelId, fetchMessages, addMessage]);
  console.log(user,"user",messages,"messages");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages[activeChannelId]]);

  if (!activeChannelId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a channel to start messaging
      </div>
    );
  }

  const channelMessages = messages[activeChannelId] || [];
  // console.log(channelMessages,"channelMessages");

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {channelMessages.map((message) => (
        <Message key={message._id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

// const Message = ({ message }: { message: MessageType }) => {
//   console.log(message,"message");
//   return (
//     <div className="flex items-start space-x-3">
//       <img
//         src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}`}
//         alt={message.sender.name}
//         className="w-10 h-10 rounded-full"
//       />
//       <div className="flex-1">
//         <div className="flex items-baseline space-x-2">
//           <span className="font-medium">{message.sender.name}</span>
//           <span className="text-xs text-gray-500">
//             {new Date(message.createdAt).toLocaleTimeString()}
//           </span>
//         </div>
//         <p className="text-gray-800">{message.content}</p>
        
//         {message.attachments && message.attachments.length > 0 && (
//           <div className="mt-2 space-y-2">
//             {message.attachments.map((attachment, index) => (
//               <div key={index} className="inline-block">
//                 {attachment.type === 'image' ? (
//                   <a
//                     href={`${process.env.VITE_API_URL}/${attachment.url}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="block max-w-xs"
//                   >
//                     <img
//                       src={`${process.env.VITE_API_URL}/${attachment.url}`}
//                       alt={attachment.name || 'Attached image'}
//                       className="max-w-full rounded-lg shadow-sm hover:shadow-md transition-shadow"
//                     />
//                   </a>
//                 ) : (
//                   <a
//                     href={`${process.env.VITE_API_URL}/${attachment.url}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//                   >
//                     <FileText size={20} className="text-gray-500" />
//                     <span className="text-sm text-gray-700">{attachment.name}</span>
//                   </a>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

const Message = ({ message }: { message: MessageType }) => {
  const { user } = useAuthStore();

  const isSender = user?._id === message.sender._id;

  return (
    <div
      className={`flex items-start space-x-3 ${
        isSender ? 'justify-end text-right' : ''
      }`}
    >
      {!isSender && (
        <img
          src={
            message.sender.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              message.sender.name
            )}`
          }
          alt={message.sender.name}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div className={`flex-1 ${isSender ? 'bg-gray-100' : 'bg-gray-100'} p-3 rounded-lg`}>
        <div className={`flex ${isSender ? 'justify-end' : ''} items-baseline space-x-2`}>
          <span className="font-medium">{message.sender.name}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-gray-800">{message.content}</p>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="inline-block">
                {attachment.type === 'image' ? (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${attachment.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-xs"
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${attachment.url}`}
                      alt={attachment.name || 'Attached image'}
                      className="max-w-full rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    />
                  </a>
                ) : (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${attachment.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FileText size={20} className="text-gray-500" />
                    <span className="text-sm text-gray-700">{attachment.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {isSender && (
        <img
          src={
            message.sender.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              message.sender.name
            )}`
          }
          alt={message.sender.name}
          className="w-10 h-10 rounded-full"
        />
      )}
    </div>
  );
};
