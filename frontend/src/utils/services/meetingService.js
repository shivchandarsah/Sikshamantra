/* meetingService.js */
import API from "@/helper/axios.js";
import { getSocket } from "@/utils/socket.js";

const useMeeting = () => {
  /**
   * Generate a new video meeting link
   * @param {string} studentId
   * @param {string} teacherId
   * @param {string} subject
   * @param {Date} scheduledTime
   * @param {number} price - Meeting fee (optional, default 0)
   * @returns {Promise<Object>}
   */
  const generateMeetingLink = async (studentId, teacherId, subject, scheduledTime = null, price = 0) => {
    try {
      const res = await API.post('/meetings/generate', {
        studentId,
        teacherId,
        subject,
        scheduledTime,
        price
      });
      
      return res.data.data;
    } catch (error) {
      console.error('❌ Error generating meeting link:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Join an existing meeting
   * @param {string} roomId
   * @returns {Promise<Object>}
   */
  const joinMeeting = async (roomId) => {
    try {
      const res = await API.get(`/meetings/join/${roomId}`);
      
      return res.data.data;
    } catch (error) {
      console.error('❌ Error joining meeting:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Get meeting details
   * @param {string} roomId
   * @returns {Promise<Object>}
   */
  const getMeetingDetails = async (roomId) => {
    try {
      const res = await API.get(`/meetings/details/${roomId}`);
      
      return res.data.data;
    } catch (error) {
      console.error('❌ Error getting meeting details:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Send meeting invitation via WebSocket
   * @param {string} roomId
   * @param {string} meetingUrl
   * @param {string} recipientId
   * @param {string} subject
   */
  const sendMeetingInvitation = (roomId, meetingUrl, recipientId, subject) => {
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        const invitation = {
          type: 'meeting_invitation',
          roomId,
          meetingUrl,
          recipientId,
          subject,
          timestamp: new Date().toISOString()
        };
        
        socket.emit('sendMeetingInvitation', invitation);
      }
    } catch (error) {
      console.error('❌ Error sending meeting invitation:', error);
    }
  };

  /**
   * Listen for meeting invitations
   * @param {function} callback
   */
  const onMeetingInvitation = (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.on('receiveMeetingInvitation', callback);
      }
    } catch (error) {
      console.error('❌ Error setting up meeting invitation listener:', error);
    }
  };

  /**
   * Listen for meeting reminders
   * @param {function} callback
   */
  const onMeetingReminder = (callback) => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.on('meetingReminder', callback);
      }
    } catch (error) {
      console.error('❌ Error setting up meeting reminder listener:', error);
    }
  };

  /**
   * Get upcoming meetings for current user
   * @returns {Promise<Array>}
   */
  const getUpcomingMeetings = async () => {
    try {
      const res = await API.get('/meetings/upcoming');
      return res.data.data;
    } catch (error) {
      console.error('❌ Error getting upcoming meetings:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Get past meetings for current user
   * @returns {Promise<Array>}
   */
  const getPastMeetings = async () => {
    try {
      const res = await API.get('/meetings/past');
      return res.data.data;
    } catch (error) {
      console.error('❌ Error getting past meetings:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Get all meetings for current user
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<Object>}
   */
  const getAllMeetings = async (page = 1, limit = 20) => {
    try {
      const res = await API.get(`/meetings/all?page=${page}&limit=${limit}`);
      return res.data.data;
    } catch (error) {
      console.error('❌ Error getting all meetings:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Update meeting status
   * @param {string} meetingId
   * @param {string} status - 'scheduled', 'active', 'completed', 'cancelled'
   * @param {string} notes - Optional notes
   * @param {Object} meetingData - Optional meeting data for AI summary (chatMessages, whiteboardContent)
   * @param {Object} paymentData - Optional payment data (paymentProof, paymentStatus)
   * @returns {Promise<Object>}
   */
  const updateMeetingStatus = async (meetingId, status, notes = null, meetingData = null, paymentData = null) => {
    try {
      const res = await API.patch(`/meetings/status/${meetingId}`, {
        status,
        ...(notes && { notes }),
        ...(meetingData && { meetingData }),
        ...(paymentData && paymentData)
      });
      return res.data.data;
    } catch (error) {
      console.error('❌ Error updating meeting status:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Record participant join/leave activity
   * @param {string} meetingId
   * @param {string} action - 'join' or 'leave'
   * @returns {Promise<Object>}
   */
  const recordParticipantActivity = async (meetingId, action) => {
    try {
      const res = await API.post(`/meetings/participant/${meetingId}`, { action });
      return res.data.data;
    } catch (error) {
      console.error('❌ Error recording participant activity:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Confirm payment (teacher only)
   * @param {string} meetingId
   * @returns {Promise<Object>}
   */
  const confirmPayment = async (meetingId) => {
    try {
      const res = await API.post(`/meetings/confirm-payment/${meetingId}`);
      return res.data.data;
    } catch (error) {
      console.error('❌ Error confirming payment:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Open meeting in new window/tab
   * @param {string} meetingUrl
   * @param {string} roomId
   */
  const openMeeting = (meetingUrl, roomId) => {
    try {
      // Open in new window with specific dimensions
      const meetingWindow = window.open(
        meetingUrl,
        `meeting-${roomId}`,
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
      
      if (meetingWindow) {
        meetingWindow.focus();
      } else {
        // Fallback: open in same tab
        window.location.href = meetingUrl;
      }
    } catch (error) {
      console.error('❌ Error opening meeting:', error);
      // Fallback: try direct navigation
      window.location.href = meetingUrl;
    }
  };

  return {
    generateMeetingLink,
    joinMeeting,
    getMeetingDetails,
    sendMeetingInvitation,
    onMeetingInvitation,
    onMeetingReminder,
    getUpcomingMeetings,
    getPastMeetings,
    getAllMeetings,
    updateMeetingStatus,
    recordParticipantActivity,
    confirmPayment,
    openMeeting
  };
};

export default useMeeting;