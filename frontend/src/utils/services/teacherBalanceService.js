// Teacher Balance Service
import axiosInstance from '@/helper/axios';

class TeacherBalanceService {
  // Get teacher balance
  async getBalance() {
    try {
      const response = await axiosInstance.get('/teacher-balance/balance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update payment settings
  async updatePaymentSettings(settings) {
    try {
      const response = await axiosInstance.put('/teacher-balance/payment-settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get earnings history
  async getEarningsHistory(filters = {}) {
    try {
      const response = await axiosInstance.get('/teacher-balance/earnings', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Request payout
  async requestPayout(amount, requestNote = '') {
    try {
      const response = await axiosInstance.post('/teacher-balance/payout/request', {
        amount,
        requestNote
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payout history
  async getPayoutHistory(filters = {}) {
    try {
      const response = await axiosInstance.get('/teacher-balance/payout/history', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cancel payout request
  async cancelPayoutRequest(payoutId) {
    try {
      const response = await axiosInstance.delete(`/teacher-balance/payout/${payoutId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new TeacherBalanceService();
