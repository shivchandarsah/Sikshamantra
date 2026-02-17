/* auth.controller.js */
import axiosInstance from "@/helper/axios";
const useOffer = () => {
  const createOffer = async (offerData) => {
    try {
      const response = await axiosInstance.post(
        `/offers/create?reqId=${offerData.reqId}&studentId=${offerData.studentId}`,
        offerData
      );

      return response.data.data;
    } catch (error) {
      console.error(
        "Error creating offer",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await axiosInstance.get("/offers/fetchOffers");
      return res.data.data;
    } catch (error) {
      console.error("Error fetching offers:", error.response?.data || error.message);
      throw error;
    }
  };

  const fetchOffersByReqId = async (reqId) => {
    try {
      const res = await axiosInstance.get(
        `/offers/fetchOffers-by-reqId?reqId=${reqId}`
      );
      return res.data.data;
    } catch (error) {
      console.error("Error fetching offers by reqId:", error.response?.data || error.message);
      throw error;
    }
  };

  const fetchOfferByReqId = async (reqId) => {
    try {
      const res = await axiosInstance.get(
        `/offers/fetchOffer-reqId?reqId=${reqId}`
      );
      return res.data.data;
    } catch (error) {
      console.error("❌ Error fetching offer by reqId:", error.response?.data || error.message);
      // Don't log 404 as error - it's expected when no offer exists
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const acceptOffer = async (offerId) => {
    try {
      const res = await axiosInstance.post(
        `/offers/acceptOffer?offerId=${offerId}`
      );
      return res.data.data;
    } catch (error) {
      console.error("Error accepting offer", error.response?.data || error.message);
      throw error;
    }
  };

  const rejectOffer = async (offerId, reason = null) => {
    try {
      const res = await axiosInstance.post(
        `/offers/rejectOffer?offerId=${offerId}`,
        { reason }
      );
      return res.data.data;
    } catch (error) {
      console.error("Error rejecting offer", error.response?.data || error.message);
      throw error;
    }
  };

  return {
    createOffer,
    fetchOffers,
    fetchOffersByReqId,
    fetchOfferByReqId,
    acceptOffer,
    rejectOffer
  };
};

export default useOffer;
