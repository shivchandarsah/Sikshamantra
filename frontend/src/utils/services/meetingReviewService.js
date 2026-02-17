import axiosInstance from '@/helper/axios';

class MeetingReviewService {
  // Create a review for a meeting
  async createReview(meetingId, reviewData) {
    try {
      const response = await axiosInstance.post(`/meeting-reviews/${meetingId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await axiosInstance.put(`/meeting-reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await axiosInstance.delete(`/meeting-reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get all reviews for a meeting
  async getMeetingReviews(meetingId) {
    try {
      const response = await axiosInstance.get(`/meeting-reviews/meeting/${meetingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Check if user can review a meeting
  async canReviewMeeting(meetingId) {
    try {
      const response = await axiosInstance.get(`/meeting-reviews/can-review/${meetingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get reviews for a specific user
  async getUserReviews(userId, params = {}) {
    try {
      const response = await axiosInstance.get(`/meeting-reviews/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get my reviews (reviews I gave)
  async getMyReviews(params = {}) {
    try {
      const response = await axiosInstance.get('/meeting-reviews/my/reviews', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new MeetingReviewService();
