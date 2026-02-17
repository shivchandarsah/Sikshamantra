import React, { useState, useEffect } from 'react';
import { X, MessageCircle, User } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';

const ChatNotification = ({ 
  notification, 
  onClose, 
  onViewChat,
  autoHide = true,
  hideDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleClose();
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  const handleViewChat = () => {
    onViewChat(notification);
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">New Message</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sender Info */}
        <div className="flex items-center space-x-3 mb-3">
          <ProfileAvatar 
            user={notification.sender} 
            size="sm" 
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {notification.sender?.fullName || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {notification.sender?.role || 'User'}
            </p>
          </div>
        </div>

        {/* Message Preview */}
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Offer Context (if available) */}
        {notification.offer && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <span className="font-medium">Regarding:</span> {notification.offer.post?.topic || 'Tutoring Request'}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleViewChat}
            className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition-colors"
          >
            View Chat
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatNotification;