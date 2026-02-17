import { Router } from "express";
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create notification (usually called by system, not directly by users)
router.route("/create").post(createNotification);

// Get user notifications
router.route("/").get(getUserNotifications);

// Get unread count
router.route("/unread-count").get(getUnreadCount);

// Mark notification as read
router.route("/:notificationId/read").patch(markAsRead);

// Mark all notifications as read
router.route("/mark-all-read").patch(markAllAsRead);

// Delete notification
router.route("/:notificationId").delete(deleteNotification);

export default router;