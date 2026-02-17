// backend/server.js
import dotenv from "dotenv";

// ⚠️ CRITICAL: Load environment variables FIRST before any other imports
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./db/db.config.js";
import meetingReminderService from "./services/meetingReminderService.js";
import userCleanupService from "./services/userCleanup.service.js";

const PORT = process.env.PORT || 5005;

// Connect MongoDB first
connectDB().then(() => {
  // ✅ Create HTTP server for Socket.IO
  const server = http.createServer(app);
  
  // ✅ Initialize Socket.IO with optimized settings
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 30000,        // ✅ 30 seconds before considering connection dead (reduced)
    pingInterval: 15000,       // ✅ Send ping every 15 seconds (reduced)
    upgradeTimeout: 20000,     // ✅ 20 seconds to upgrade transport (reduced)
    allowUpgrades: true,       // ✅ Allow transport upgrades
    transports: ["websocket", "polling"], // ✅ Explicit transport order
    allowEIO3: true,           // ✅ Allow Engine.IO v3 clients
  });

  // ✅ Make io instance globally available for reminder service
  global.io = io;

  // ✅ Socket.IO connection handling
  io.on("connection", (socket) => {
    
    // Store user information when they connect
    socket.on("userConnected", (userData) => {
      socket.userId = userData.userId;
      socket.userName = userData.userName;
      socket.userRole = userData.userRole;
      
      // Join a room based on user ID for targeted messaging
      socket.join(`user_${userData.userId}`);
    });

    // Join room for specific offer/chat
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { roomId, message, senderId } = data;
        
        // Get sender information and offer details for notification
        const senderInfo = {
          _id: senderId,
          fullName: socket.userName,
          role: socket.userRole
        };

        // Enhanced message data for notification
        const enhancedMessageData = {
          ...data,
          sender: senderInfo,
          timestamp: new Date().toISOString()
        };

        // Broadcast to all users in the room except sender
        socket.to(roomId).emit("receiveMessage", enhancedMessageData);
        
      } catch (error) {
        console.error("Error handling sendMessage:", error);
      }
    });

    // Handle meeting invitations - TARGET SPECIFIC USER
    socket.on("sendMeetingInvitation", (invitation) => {
      const { recipientId, roomId, meetingUrl, subject } = invitation;
      
      // Send meeting invitation to specific recipient only
      io.to(`user_${recipientId}`).emit("receiveMeetingInvitation", {
        ...invitation,
        senderName: socket.userName || "Someone",
        senderId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle appointment invitations - TARGET SPECIFIC USER
    socket.on("sendAppointmentInvitation", (invitation) => {
      const { recipientId } = invitation;
      
      // Send appointment invitation to specific recipient only
      io.to(`user_${recipientId}`).emit("receiveAppointmentInvitation", {
        ...invitation,
        senderId: socket.userId,
        senderName: socket.userName,
        timestamp: new Date().toISOString()
      });
    });

    // Handle ping/pong for connection health
    socket.on("ping", () => {
      socket.emit("pong");
    });

    // Handle disconnect with reason
    socket.on("disconnect", (reason) => {
      // Leave user-specific room
      if (socket.userId) {
        socket.leave(`user_${socket.userId}`);
      }
      
      // Only log important disconnect reasons
      const importantReasons = ["server namespace disconnect", "ping timeout", "transport error"];
      if (importantReasons.includes(reason)) {
        // Log only important disconnections
      }
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    
    // ✅ Start meeting reminder service
    meetingReminderService.start();
    
    // ✅ Start user cleanup service (deletes unverified users after 10 minutes)
    userCleanupService.start();
  });
});
