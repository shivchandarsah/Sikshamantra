/* Final_Project/frontend/src/services/post.service.js */
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";

const usePost = () => {
  // ================= CREATE POST =================
  const createPost = async (postData) => {
    try {
      const res = await axiosInstance.post("/posts/create", postData);
      toast.success("Post created successfully!");
      return res.data.data;
    } catch (error) {
      console.error("❌ Create post error:", error.response?.data || error.message);
      console.error("❌ Full error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      toast.error(error.response?.data?.message || "Failed to create post");
      throw error;
    }
  };

  // ================= FETCH POSTS (for students/general) =================
  const fetchPosts = async () => {
    try {
      const res = await axiosInstance.get("/posts/get-posts");
      return res.data.data;
    } catch (error) {
      console.error("❌ Fetch posts error:", error.response?.data || error.message);
      console.error("❌ Full error object:", error);
      throw error;
    }
  };

  // ================= FETCH POSTS (for teachers) =================
  const fetchPostsForTeacher = async () => {
    try {
      const res = await axiosInstance.get("/posts/get-posts-teacher");
      return res.data.data;
    } catch (error) {
      console.error(
        "Fetch teacher posts error:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  // ================= FETCH POST DETAILS =================
  const fetchPostDetail = async (postId) => {
    try {
      const res = await axiosInstance.get(`/posts/get-post-details/${postId}`);
      return res.data.data;
    } catch (error) {
      // Don't log 404 errors as they're expected when posts don't exist
      if (error.response?.status !== 404) {
        console.error(
          "Fetch post detail error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  };

  // ================= CLOSE/UPDATE POST =================
  const closePost = async (postId) => {
    try {
      const res = await axiosInstance.patch(`/posts/update-post/${postId}`, {});
      toast.success("Post closed successfully!");
      return res.data.data;
    } catch (error) {
      console.error(
        "Close post error:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  // ================= DELETE POST =================
  const deletePost = async (postId) => {
    try {
      const res = await axiosInstance.delete(`/posts/delete-post/${postId}`);
      toast.success("Post deleted successfully!");
      return res.data.data;
    } catch (error) {
      console.error(
        "Delete post error:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || "Failed to delete post");
      throw error;
    }
  };

  return {
    createPost,
    fetchPosts,
    fetchPostsForTeacher,
    fetchPostDetail,
    closePost,
    deletePost,
  };
};

export default usePost;
