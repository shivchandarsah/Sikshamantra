/* Final_Project/backend/routes/post.routes.js */
import { Router } from "express";
import {
  create,
  getPostDetail,
  getAllPost,
  deletePost,
  postClosed,
  getAllPostForTeacher,
  cleanupOrphanedOffers,
} from "../controllers/post.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const postRouter = Router();

// 🔐 Protect ALL post routes with JWT authentication
postRouter.use(authMiddleware);

// ================= ROUTES =================

// Create a new post
postRouter.post("/create", create);

// Get details of a single post
postRouter.get("/get-post-details/:postId", getPostDetail);

// Get all posts (for students/general)
postRouter.get("/get-posts", getAllPost);

// Get all posts for teachers
postRouter.get("/get-posts-teacher", getAllPostForTeacher);

// Close/update a post
postRouter.patch("/update-post/:postId", postClosed);

// Delete a post
postRouter.delete("/delete-post/:postId", deletePost);

// Cleanup orphaned offers (admin/maintenance endpoint)
postRouter.post("/cleanup-orphaned-offers", cleanupOrphanedOffers);

export default postRouter;
