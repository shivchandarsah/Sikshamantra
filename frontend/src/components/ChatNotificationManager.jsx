import React, { useState, useEffect } from 'react';
import { getSocket, connectSocket } from '@/utils/socket';
import ChatNotification from './ChatNotification';
import useMyContext from '@/hooks/useMyContext';
import { useNavigate } from 'react-router-dom';
import notificationSound from '@/utils/notificationSound';

const ChatNotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useMyContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Setup socket connection and message listener
    const setupSocketListener = async () => {
      try {
        // Ensure socket is connected
        const socket = getSocket();
        
        if (!socket?.connected) {
          await connectSocket();
        }

        const connectedSocket = getSocket();
        if (!connectedSocket) {
          console.error('Failed to get connected socket');
          return;
        }

        // Listen for new chat messages
        const handleNewMessage = (messageData) => {
          // Don't show notification for own messages
          if (messageData.senderId === user._id) {
            return;
          }

          // Play notification sound
          notificationSound.playMessageNotification();

          // Show browser notification if page is not visible
          if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification('New Message - Siksha Mantra', {
              body: `${messageData.sender?.fullName || 'Someone'}: ${messageData.message}`,
              icon: '/favicon.svg',
              tag: 'chat-message', // Prevents duplicate notifications
              requireInteraction: false,
              silent: false
            });

            // Auto-close browser notification after 5 seconds
            setTimeout(() => {
              browserNotification.close();
            }, 5000);

            // Handle click on browser notification
            browserNotification.onclick = () => {
              window.focus();
              browserNotification.close();
              
              // Navigate to appropriate chat page
              if (user.role === 'student') {
                navigate('/student/accepted-offers');
              } else if (user.role === 'teacher') {
                navigate('/teacher/offered');
              }
            };
          }

          // Create notification object
          const notification = {
            id: Date.now() + Math.random(), // Unique ID
            message: messageData.message,
            sender: messageData.sender,
            offer: messageData.offer,
            offerId: messageData.roomId,
            timestamp: new Date().toISOString(),
            type: 'chat'
          };

          // Add to notifications list
          setNotifications(prev => [...prev, notification]);
        };

        // Set up socket listener
        connectedSocket.on('receiveMessage', handleNewMessage);

        // Cleanup function
        return () => {
          connectedSocket.off('receiveMessage', handleNewMessage);
        };
      } catch (error) {
        console.error('Error setting up chat notification listener:', error);
      }
    };

    // Setup with a small delay to ensure socket is ready
    const timeoutId = setTimeout(() => {
      setupSocketListener();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, navigate]);

  const handleCloseNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const handleViewChat = (notification) => {
    // Navigate to appropriate chat page based on user role
    if (user.role === 'student') {
      navigate('/student/accepted-offers');
    } else if (user.role === 'teacher') {
      navigate('/teacher/offered');
    }
    
    // Close the notification
    handleCloseNotification(notification.id);
  };

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="p-4 space-y-3 pointer-events-auto">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 1000 - index 
            }}
          >
            <ChatNotification
              notification={notification}
              onClose={() => handleCloseNotification(notification.id)}
              onViewChat={handleViewChat}
              autoHide={true}
              hideDelay={6000}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatNotificationManager;