/* notificationService.js */
import API from "@/helper/axios.js";

const useNotification = () => {
  /**
   * Create a new notification
   * @param {Object} notificationData
   * @returns {Promise<Object>}
   */
  const createNotification = async (notificationData) => {
    try {
      const res = await API.post("/notifications/create", notificationData);
      return res.data.data;
    } catch (error) {
      console.error("Error creating notification:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Get user notifications with pagination
   * @param {Object} params - { page, limit, unreadOnly }
   * @returns {Promise<Object>}
   */
  const getUserNotifications = async (params = {}) => {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = params;
      const res = await API.get("/notifications", {
        params: { page, limit, unreadOnly }
      });
      return res.data.data;
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Get unread notification count
   * @returns {Promise<number>}
   */
  const getUnreadCount = async () => {
    try {
      const res = await API.get("/notifications/unread-count");
      return res.data.data.unreadCount;
    } catch (error) {
      console.error("Error fetching unread count:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  const markAsRead = async (notificationId) => {
    try {
      const res = await API.patch(`/notifications/${notificationId}/read`);
      return res.data.data;
    } catch (error) {
      console.error("Error marking notification as read:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>}
   */
  const markAllAsRead = async () => {
    try {
      const res = await API.patch("/notifications/mark-all-read");
      return res.data.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  /**
   * Delete a notification
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error("Error deleting notification:", error.response?.data?.message || error.message);
      throw error;
    }
  };

  return {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default useNotification;