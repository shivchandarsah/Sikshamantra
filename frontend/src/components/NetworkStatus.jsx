import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check backend connectivity
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5005/api/v1/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    // Check backend status every 30 seconds
    checkBackend();
    const interval = setInterval(checkBackend, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Only show indicator when there's an issue
  if (isOnline && backendStatus === 'connected') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">No Internet Connection</span>
        </div>
      )}
      
      {isOnline && backendStatus === 'disconnected' && (
        <div className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Backend Server Disconnected</span>
        </div>
      )}
      
      {isOnline && backendStatus === 'checking' && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">Checking connection...</span>
        </div>
      )}
    </div>
  );
}
