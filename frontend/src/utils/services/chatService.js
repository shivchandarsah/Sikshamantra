/* chatService.js */
import API from "@/helper/axios.js";
import { getSocket, connectSocket } from "@/utils/socket.js";
import { chatEncryption } from "@/utils/encryption.js";

const useChat = () => {
  /**
   * Fetch all chat messages for a given offer
   * @param {string} offerId
   * @param {string} currentUserId - Current user's ID for decryption
   * @param {string} otherUserId - Other user's ID for decryption
   * @returns {Promise<Array>}
   */
  const fetchChats = async (offerId, currentUserId = null, otherUserId = null) => {
    try {
      if (!offerId) {
        return [];
      }
      
      const res = await API.get(`/chats/get-all-chats/${offerId}`);
      const chats = res.data.data || [];
      
      // Decrypt messages if encryption keys are provided
      if (currentUserId && otherUserId) {
        const decryptedChats = await Promise.all(
          chats.map(async (chat) => {
            if (chat.isEncrypted) {
              try {
                const decryptedMessage = await chatEncryption.decryptMessage(
                  chat.message,
                  currentUserId,
                  otherUserId
                );
                return { ...chat, message: decryptedMessage, _decrypted: true };
              } catch (error) {
                console.error('Failed to decrypt message:', error);
                return { ...chat, message: '🔒 [Encrypted Message]', _decryptionFailed: true };
              }
            }
            return chat;
          })
        );
        return decryptedChats;
      }
      
      return chats;
    } catch (error) {
      console.error(
        "❌ Error fetching chats:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  /**
   * Create a new chat message with optional encryption
   * @param {string} receiverId
   * @param {string} offerId
   * @param {string} message
   * @param {string} senderId - Sender's ID for encryption
   * @param {boolean} encrypt - Whether to encrypt the message
   * @returns {Promise<Object>}
   */
  const createChat = async (receiverId, offerId, message, senderId = null, encrypt = true) => {
    try {
      if (!receiverId || !offerId || !message) {
        throw new Error('Missing required parameters for chat creation');
      }
      
      let messageToSend = message;
      let isEncrypted = false;
      
      // Encrypt message if encryption is enabled and we have sender ID
      if (encrypt && senderId) {
        try {
          messageToSend = await chatEncryption.encryptMessage(message, senderId, receiverId);
          isEncrypted = true;
          console.log('✅ Message encrypted');
        } catch (error) {
          console.error('❌ Encryption failed, sending unencrypted:', error);
          // Fall back to unencrypted if encryption fails
        }
      }
      
      const res = await API.post(`/chats/create/${receiverId}?offerId=${offerId}`, { 
        message: messageToSend,
        isEncrypted
      });

      // Emit message to socket room
      try {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit("sendMessage", {
            roomId: offerId,
            message: messageToSend,
            isEncrypted,
            senderId: res.data.data.sender?._id,
            sender: res.data.data.sender,
            offer: res.data.data.offer,
          });
        } else {
          const connectedSocket = await connectSocket();
          if (connectedSocket && connectedSocket.connected) {
            connectedSocket.emit("sendMessage", {
              roomId: offerId,
              message: messageToSend,
              isEncrypted,
              senderId: res.data.data.sender?._id,
              sender: res.data.data.sender,
              offer: res.data.data.offer,
            });
          }
        }
      } catch (socketError) {
        console.error('❌ Socket emit error:', socketError);
      }

      // Return with decrypted message for display
      return {
        ...res.data.data,
        message: message, // Original unencrypted message for sender's display
        _encrypted: isEncrypted
      };
    } catch (error) {
      console.error(
        "❌ Error creating chat message:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  };

  /**
   * Listen for incoming messages in real-time via socket
   * Automatically decrypts encrypted messages
   * @param {function} callback
   * @param {string} currentUserId - Current user's ID for decryption
   * @param {string} otherUserId - Other user's ID for decryption
   */
  const onMessageReceived = (callback, currentUserId = null, otherUserId = null) => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.on("receiveMessage", async (msg) => {
          // Decrypt if encrypted and we have keys
          if (msg.isEncrypted && currentUserId && otherUserId) {
            try {
              const decryptedMessage = await chatEncryption.decryptMessage(
                msg.message,
                currentUserId,
                otherUserId
              );
              callback({ ...msg, message: decryptedMessage, _decrypted: true });
            } catch (error) {
              console.error('Failed to decrypt incoming message:', error);
              callback({ ...msg, message: '🔒 [Encrypted Message]', _decryptionFailed: true });
            }
          } else {
            callback(msg);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
    }
  };

  /**
   * Join a socket room corresponding to an offer
   * @param {string} offerId
   */
  const joinRoom = async (offerId) => {
    if (!offerId) {
      return;
    }
    
    try {
      const socket = getSocket(); // ✅ Get existing socket instance first
      
      if (socket && socket.connected) {
        socket.emit("joinRoom", offerId);
      } else {
        // ✅ Connect first, then join room
        const connectedSocket = await connectSocket();
        if (connectedSocket && connectedSocket.connected) {
          connectedSocket.emit("joinRoom", offerId);
        }
      }
    } catch (error) {
      console.error('❌ Error joining room:', error);
    }
  };

  return {
    fetchChats,
    createChat,
    onMessageReceived,
    joinRoom,
  };
};

export default useChat;
