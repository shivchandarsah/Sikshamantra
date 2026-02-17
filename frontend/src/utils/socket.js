// frontend/src/socket.js
import { io } from "socket.io-client";

/* =====================================================
   🔹 BACKEND URL
   - DEV: http://localhost:5005
   - PROD: https://your-production-domain.com
===================================================== */
const BACKEND_URL =
  import.meta.env.PROD
    ? "https://your-production-domain.com"
    : "http://localhost:5005"; // ✅ DEV HTTP

/* =====================================================
   🔹 SOCKET.IO CLIENT CONFIG
   - transports: websocket + polling fallback
   - withCredentials: send cookies automatically
   - autoConnect: false - connect only when needed
   - reconnection: enable automatic reconnection
   - reconnectionAttempts: limit reconnection attempts
   - reconnectionDelay: delay between reconnection attempts
===================================================== */
let socket = null;
let isConnecting = false;
let connectionPromise = null;
let isAuthenticated = false; // ✅ Track authentication status

const createSocket = () => {
  if (socket) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    transports: ["websocket", "polling"], // fallback for older browsers
    withCredentials: true,                 // ✅ send cookies automatically
    autoConnect: false,                    // ✅ Don't connect automatically
    reconnection: true,                    // ✅ Enable automatic reconnection
    reconnectionAttempts: 3,               // ✅ Limit reconnection attempts
    reconnectionDelay: 2000,               // ✅ 2 second delay between attempts
    reconnectionDelayMax: 8000,            // ✅ Maximum delay of 8 seconds
    timeout: 8000,                         // ✅ Connection timeout (match server)
    forceNew: false,                       // ✅ Reuse existing connection
    upgrade: true,                         // ✅ Allow transport upgrades
  });

  /* =====================================================
     🔹 SOCKET EVENTS
  ===================================================== */
  socket.on("connect", () => {
    isConnecting = false;
    connectionPromise = null;
    
    // Send user information to server for targeted messaging
    // This will be set by the auth system when user logs in
    if (socket.userInfo) {
      socket.emit("userConnected", socket.userInfo);
    }
  });

  socket.on("connect_error", (err) => {
    console.error("❌ WebSocket connection error:", err.message);
    isConnecting = false;
    connectionPromise = null;
  });

  socket.on("disconnect", (reason) => {
    // ✅ Only log important disconnect reasons to reduce noise
    const importantReasons = ["ping timeout", "transport error", "server namespace disconnect"];
    if (importantReasons.includes(reason)) {
      // Log only important disconnections for debugging
    }
  });

  socket.on("reconnect", (attemptNumber) => {
    // Reconnected successfully
  });

  socket.on("reconnect_error", (error) => {
    // ✅ Only log non-transport errors
    if (!error.message.includes("xhr poll error") && !error.message.includes("transport")) {
      console.error("❌ WebSocket reconnection error:", error.message);
    }
  });

  socket.on("reconnect_failed", () => {
    console.error("❌ WebSocket reconnection failed - giving up");
  });

  return socket;
};

const getSocket = () => {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
};

// ✅ Optimized connection with authentication check
const connectSocket = () => {
  // ✅ Return existing connection promise if already connecting
  if (connectionPromise) {
    return connectionPromise;
  }

  const socketInstance = getSocket();
  
  if (socketInstance.connected) {
    return Promise.resolve(socketInstance);
  }

  if (isConnecting) {
    return new Promise((resolve) => {
      socketInstance.once('connect', () => resolve(socketInstance));
    });
  }

  isConnecting = true;
  
  // ✅ Create connection promise
  connectionPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('❌ Socket connection timeout');
      isConnecting = false;
      connectionPromise = null;
      reject(new Error('Connection timeout'));
    }, 8000); // 8 second timeout

    socketInstance.once('connect', () => {
      clearTimeout(timeout);
      isConnecting = false;
      resolve(socketInstance);
    });

    socketInstance.once('connect_error', (error) => {
      clearTimeout(timeout);
      console.error('❌ Socket connection failed:', error);
      isConnecting = false;
      connectionPromise = null;
      reject(error);
    });

    // ✅ Connect with small delay to ensure auth is complete
    setTimeout(() => {
      socketInstance.connect();
    }, 200);
  });

  return connectionPromise;
};

const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  // ✅ Reset connection state
  isConnecting = false;
  connectionPromise = null;
  isAuthenticated = false;
};

// ✅ Set authentication status - should be called when user logs in
const setAuthenticationStatus = (authenticated, userInfo = null) => {
  isAuthenticated = authenticated;
  
  // Store user info for targeted messaging
  if (authenticated && userInfo) {
    const socketInstance = getSocket();
    socketInstance.userInfo = {
      userId: userInfo._id,
      userName: userInfo.fullName,
      userRole: userInfo.role
    };
    
    // If already connected, send user info immediately
    if (socketInstance.connected) {
      socketInstance.emit("userConnected", socketInstance.userInfo);
    }
  }
  
  // Auto-connect when authenticated
  if (authenticated && !socket?.connected) {
    connectSocket().catch(error => {
      console.error('❌ Failed to auto-connect socket after authentication:', error);
    });
  }
};

const getConnectionStatus = () => {
  if (!socket) return "not_initialized";
  if (socket.connected) return "connected";
  if (socket.connecting || isConnecting) return "connecting";
  return "disconnected";
};

const isSocketConnected = () => {
  return socket && socket.connected;
};

/* =====================================================
   🔹 EXPORT SOCKET FUNCTIONS
===================================================== */
export { getSocket, connectSocket, disconnectSocket, getConnectionStatus, isSocketConnected, setAuthenticationStatus };
export default getSocket;
