import axiosInstance from "@/helper/axios";

const useAdmin = () => {
  // ================= DASHBOARD STATS =================
  const getDashboardStats = async () => {
    try {
      const res = await axiosInstance.get("/admin/dashboard/stats");
      return res.data.data;
    } catch (error) {
      console.error("Get dashboard stats error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= ANALYTICS =================
  const getSystemAnalytics = async (period = "7d") => {
    try {
      const res = await axiosInstance.get(`/admin/analytics?period=${period}`);
      return res.data.data;
    } catch (error) {
      console.error("Get analytics error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= USER MANAGEMENT =================
  const getAllUsers = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/admin/users?${queryParams}`);
      return res.data.data;
    } catch (error) {
      console.error("Get all users error:", error.response?.data || error.message);
      throw error;
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/role`, { newRole });
      return res.data.data;
    } catch (error) {
      console.error("Change user role error:", error.response?.data || error.message);
      throw error;
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/toggle-status`);
      return res.data.data;
    } catch (error) {
      console.error("Toggle user status error:", error.response?.data || error.message);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await axiosInstance.delete(`/admin/users/${userId}`);
      return res.data.data;
    } catch (error) {
      console.error("Delete user error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= CONTENT MANAGEMENT =================
  const getAllPosts = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/admin/posts?${queryParams}`);
      return res.data.data;
    } catch (error) {
      console.error("Get all posts error:", error.response?.data || error.message);
      throw error;
    }
  };

  const getAllOffers = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/admin/offers?${queryParams}`);
      return res.data.data;
    } catch (error) {
      console.error("Get all offers error:", error.response?.data || error.message);
      throw error;
    }
  };

  const getAllMeetings = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/admin/meetings?${queryParams}`);
      return res.data.data;
    } catch (error) {
      console.error("Get all meetings error:", error.response?.data || error.message);
      throw error;
    }
  };

  return {
    getDashboardStats,
    getSystemAnalytics,
    getAllUsers,
    changeUserRole,
    toggleUserStatus,
    deleteUser,
    getAllPosts,
    getAllOffers,
    getAllMeetings
  };
};

export default useAdmin;