import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { ChatContainer } from './components/chat/ChatContainer';
import { AuthContainer } from './components/auth/AuthContainer';
import { useAuthStore } from './store/authStore';
import { useUserStore } from './store/userStore';
import { socket } from './services/socket';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { updateUserStatus } = useUserStore();

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('user_connected', user._id);
      
      // Update user status to online
      updateUserStatus(user._id, 'online');
      
      // Listen for other users' status changes
      socket.on('user_status_change', ({ userId, status }) => {
        updateUserStatus(userId, status);
      });

      const handleBeforeUnload = () => {
        socket.emit('user_disconnected', user._id);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        socket.emit('user_disconnected', user._id);
        socket.disconnect();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user, updateUserStatus]);

  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <ChatContainer />
      </div>
    </Router>
  );
}
export default App;