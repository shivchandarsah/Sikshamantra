import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { Notification } from "../models/notification.model.js";
import { isValidObjectId } from "mongoose";

// Create a new notification
const createNotification = asyncHandler(async (req, res) => {
  const { recipientId, type, title, message, data, actionUrl } = req.body;
  const senderId = req.user._id;

  if (!recipientId || !type || !title || !message) {
    throw new ApiError(400, "Recipient, type, title, and message are required");
  }

  if (!isValidObjectId(recipientId) || !isValidObjectId(senderId)) {
    throw new ApiError(400, "Invalid recipient or sender ID");
  }

  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    data: data || {},
    actionUrl,
  });

  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "fullName role profilePicture")
    .populate("recipient", "fullName role");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedNotification, "Notification created successfully"));
});

// Get all notifications for a user
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const query = { recipient: userId };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .populate("sender", "fullName role profilePicture")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalNotifications = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      totalNotifications,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(totalNotifications / limit),
    }, "Notifications fetched successfully")
  );
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  ).populate("sender", "fullName role profilePicture");

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { modifiedCount: result.modifiedCount }, "All notifications marked as read"));
});

// Delete a notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { unreadCount }, "Unread count fetched successfully"));
});

export {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};