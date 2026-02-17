import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, MessageCircle, Calendar, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProfileAvatar from './ProfileAvatar';
import useMyContext from '@/hooks/useMyContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getSocket } from '@/utils/socket';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { notificationDb, user, loading: authLoading, initialized } = useMyContext();
  const navigate = useNavigate();

  // Fetch notifications when panel opens
  useEffect(() => {
    if (isOpen && initialized && user && user._id && !authLoading) {
      fetchNotifications();
    }
  }, [isOpen, user, initialized, authLoading]);

  // Fetch unread count on component mount and set up socket listener
  useEffect(() => {
    if (initialized && user && user._id && !authLoading) {
      fetchUnreadCount();
      
      // Listen for new notifications via socket
      const socket = getSocket();
      if (socket) {
        const handleNewNotification = () => {
          // Refresh unread count when new notification arrives
          fetchUnreadCount();
          
          // If notification center is open, refresh the list
          if (isOpen) {
            fetchNotifications();
          }
        };

        // Listen for various notification events
        socket.on('receiveMessage', handleNewNotification);
        socket.on('receiveMeetingInvitation', handleNewNotification);
        socket.on('receiveAppointmentInvitation', handleNewNotification);
        
        return () => {
          socket.off('receiveMessage', handleNewNotification);
          socket.off('receiveMeetingInvitation', handleNewNotification);
          socket.off('receiveAppointmentInvitation', handleNewNotification);
        };
      }
    }
  }, [user, isOpen, initialized, authLoading]);

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      if (!user || !user._id) {
        setNotifications([]);
        return;
      }
      
      setLoading(true);
      const data = await notificationDb.getUserNotifications({ page, limit: 20 });
      
      if (append) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setHasMore(data.currentPage < data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      // Only show toast for non-authentication errors
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch notifications');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (!user || !user._id) {
        setUnreadCount(0);
        return;
      }
      
      const count = await notificationDb.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Only log non-authentication errors
      if (error.response?.status !== 401) {
        console.error('Failed to fetch unread count:', error);
      }
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationDb.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationDb.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationDb.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'offer':
        return <Users className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationDate.toLocaleDateString();
  };

  // Don't render if user is not authenticated or still loading
  if (!initialized || authLoading || !user || !user._id) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ProfileAvatar 
                            user={notification.sender} 
                            size="xs" 
                          />
                          <span className="text-xs text-gray-500">
                            {notification.sender?.fullName}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          <div className="flex space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;