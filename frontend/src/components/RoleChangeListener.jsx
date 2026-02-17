import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

/**
 * Component to listen for role changes from admin
 * Automatically redirects user to appropriate dashboard when role is changed
 */
const RoleChangeListener = ({ user }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) return;

    // Connect to Socket.IO server
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5005', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Send user connection info
    socket.emit('userConnected', {
      userId: user._id,
      userName: user.fullName,
      userRole: user.role,
    });

    // Listen for role change events
    socket.on('roleChanged', (data) => {
      const { oldRole, newRole, message } = data;

      console.log('🔄 Role changed:', data);

      // Show notification with custom styling
      toast.info('Role Changed by Admin', {
        description: message,
        duration: 5000,
        action: {
          label: 'OK',
          onClick: () => console.log('Role change acknowledged'),
        },
      });

      // Update user in localStorage
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.role = newRole;
        localStorage.setItem('user', JSON.stringify(storedUser));
      } catch (error) {
        console.error('Error updating user in localStorage:', error);
      }

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        let redirectPath = '/login';
        
        switch (newRole) {
          case 'student':
            redirectPath = '/student/dashboard';
            break;
          case 'teacher':
            redirectPath = '/teacher/dashboard';
            break;
          case 'admin':
            redirectPath = '/admin/dashboard';
            break;
          default:
            redirectPath = '/login';
        }

        console.log(`🔄 Redirecting to ${redirectPath}...`);
        
        // Navigate and force reload
        navigate(redirectPath, { replace: true });
        
        // Force page reload after navigation to update all components
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 2000);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Cleanup on unmount
    return () => {
      socket.off('roleChanged');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [user?._id, user?.role, navigate]);

  // This component doesn't render anything
  return null;
};

export default RoleChangeListener;
