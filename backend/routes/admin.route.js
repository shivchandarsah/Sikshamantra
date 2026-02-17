import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
  getAllPosts,
  getAllOffers,
  getAllMeetings,
  deleteUser,
  getSystemAnalytics
} from "../controllers/admin.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// 🔐 Protect ALL admin routes with JWT authentication
router.use(authMiddleware);

// ================= ADMIN DASHBOARD =================
router.get("/dashboard/stats", getDashboardStats);
router.get("/analytics", getSystemAnalytics);

// ================= USER MANAGEMENT =================
router.get("/users", getAllUsers);
router.put("/users/:userId/role", changeUserRole);
router.put("/users/:userId/toggle-status", toggleUserStatus);
router.delete("/users/:userId", deleteUser);

// ================= CONTENT MANAGEMENT =================
router.get("/posts", getAllPosts);
router.get("/offers", getAllOffers);
router.get("/meetings", getAllMeetings);

export default router;