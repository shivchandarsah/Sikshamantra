import axiosInstance from "@/helper/axios";

const useCourse = () => {
  // ================= UPLOAD COURSE (TEACHER) =================
  const uploadCourse = async (courseData) => {
    try {
      const res = await axiosInstance.post("/courses/upload", courseData);
      return res.data.data;
    } catch (error) {
      console.error("Upload course error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= GET ALL COURSES =================
  const getAllCourses = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/courses/all?${queryParams}`);
      return res.data.data;
    } catch (error) {
      console.error("Get all courses error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= GET TEACHER'S COURSES =================
  const getTeacherCourses = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/courses/my-courses?${queryParams}`);
      return res.data.data;
    } catch (error) {
      console.error("Get teacher courses error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= DOWNLOAD COURSE =================
  const downloadCourse = async (courseId) => {
    try {
      const res = await axiosInstance.get(`/courses/download/${courseId}`);
      return res.data.data;
    } catch (error) {
      console.error("Download course error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= DELETE COURSE =================
  const deleteCourse = async (courseId) => {
    try {
      const res = await axiosInstance.delete(`/courses/${courseId}`);
      return res.data;
    } catch (error) {
      console.error("Delete course error:", error.response?.data || error.message);
      throw error;
    }
  };

  // ================= UPDATE COURSE =================
  const updateCourse = async (courseId, courseData) => {
    try {
      const res = await axiosInstance.put(`/courses/${courseId}`, courseData);
      return res.data.data;
    } catch (error) {
      console.error("Update course error:", error.response?.data || error.message);
      throw error;
    }
  };

  return {
    uploadCourse,
    getAllCourses,
    getTeacherCourses,
    downloadCourse,
    deleteCourse,
    updateCourse,
  };
};

export default useCourse;
