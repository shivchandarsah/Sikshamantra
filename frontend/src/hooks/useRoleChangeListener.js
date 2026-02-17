import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

/**
 * Hook to listen for role changes from admin
 * Automatically redirects user to appropriate dashboard when role is changed
 */
export const useRoleChangeListener = (user) => {
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

      console.log('Role changed:', data);

      // Show notification
      toast.info('Role Changed', {
        description: message,
        duration: 5000,
      });

      // Update user in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.role = newRole;
      localStorage.setItem('user', JSON.stringify(storedUser));

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        switch (newRole) {
          case 'student':
            navigate('/student/dashboard', { replace: true });
            window.location.reload(); // Force reload to update UI
            break;
          case 'teacher':
            navigate('/teacher/dashboard', { replace: true });
            window.location.reload();
            break;
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            window.location.reload();
            break;
          default:
            navigate('/login', { replace: true });
        }
      }, 2000);
    });

    // Cleanup on unmount
    return () => {
      socket.off('roleChanged');
      socket.disconnect();
    };
  }, [user?._id, user?.role, navigate]);
};
