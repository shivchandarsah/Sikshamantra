// Payment Service
import axiosInstance from '@/helper/axios';

class PaymentService {
  // Initiate payment
  async initiatePayment(paymentData) {
    try {
      const response = await axiosInstance.post('/payments/initiate', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Verify payment after eSewa callback
  async verifyPayment(queryParams) {
    try {
      const response = await axiosInstance.get('/payments/verify', {
        params: queryParams
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment history
  async getPaymentHistory(filters = {}) {
    try {
      const response = await axiosInstance.get('/payments/history', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single payment
  async getPayment(transactionId) {
    try {
      const response = await axiosInstance.get(`/payments/${transactionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Admin: Get all payments
  async getAllPayments(filters = {}) {
    try {
      const response = await axiosInstance.get('/payments/admin/all', {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Admin: Refund payment
  async refundPayment(transactionId, reason) {
    try {
      const response = await axiosInstance.post(`/payments/admin/refund/${transactionId}`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Helper: Redirect to eSewa
  redirectToEsewa(esewaData, paymentUrl) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;

    Object.keys(esewaData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = esewaData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }
}

export default new PaymentService();
