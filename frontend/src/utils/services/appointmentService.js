/* appointmentService.js */
import axiosInstance from "@/helper/axios";

// Simple cache to prevent repeated 404 calls for the same offer
const appointmentCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const useAppointment = () => {
  const createAppointment = async (offerId, data) => {
    try {
      const response = await axiosInstance.post(
        `/appointments/create/${offerId}`,
        data
      );

      // Clear cache for this offer since appointment was created
      appointmentCache.delete(offerId);
      
      return response.data.data;
    } catch (error) {
      console.error(
        "Error creating appointment:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  const fetchAppointment = async (offerId) => {
    // Check cache first
    const cached = appointmentCache.get(offerId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const res = await axiosInstance.get(`/appointments/get-appointment/${offerId}`);
      const data = res.data.data;
      
      // Cache successful result
      appointmentCache.set(offerId, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      // 404 is expected when no appointment exists - cache null result to prevent repeated calls
      if (error.response?.status === 404) {
        appointmentCache.set(offerId, {
          data: null,
          timestamp: Date.now()
        });
        return null;
      }
      // For other errors, still throw
      throw error;
    }
  };

  return {
    createAppointment,
    fetchAppointment,
  };
};

export default useAppointment;
