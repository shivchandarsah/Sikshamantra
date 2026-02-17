import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { Offer } from "../models/Offer.model.js";
import { Notification } from "../models/notification.model.js";
import { isValidObjectId } from "mongoose";
const create = asyncHandler(async (req, res) => {
  const { message, isEncrypted } = req.body;
  const offerId = req.query.offerId;
  const senderId = req.user._id;
  const receiverId = req.params.receiverId;
  
  if (!message) {
    throw new ApiError(409, "Message is required");
  }
  if (!senderId || !receiverId || !offerId) {
    throw new ApiError(409, "Sender/Receiver/offer id is required");
  }
  if (
    !isValidObjectId(senderId) ||
    !isValidObjectId(receiverId) ||
    !isValidObjectId(offerId)
  ) {
    throw new ApiError(409, "Invalid sender/receiver/offer id format");
  }
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);
  const offer = await Offer.findById(offerId);
  if (!sender) {
    throw new ApiError(404, "Sender doesnot exist");
  }
  if (!receiver) {
    throw new ApiError(404, "Receiver doesnot exist");
  }
  if (!offer) {
    throw new ApiError(404, "Offer doesnot exist");
  }
  const createMessage = await Chat.create({
    sender: senderId,
    receiver: receiverId,
    offer: offerId,
    message,
    isEncrypted: isEncrypted || false
  });
  if (!createMessage) {
    throw new ApiError(500, "Failed to create chat");
  }
  const createdChat = await Chat.findById(createMessage._id)
    .populate({ path: "sender", select: "fullName role profilePicture" })
    .populate({ path: "receiver", select: "fullName role profilePicture" })
    .populate({ 
      path: "offer", 
      select: "proposed_price status appointmentTime",
      populate: {
        path: "post",
        select: "topic description"
      }
    });

  // Create notification for the receiver
  // Don't show message content if encrypted
  try {
    const notificationMessage = isEncrypted 
      ? `${sender.fullName} sent you an encrypted message`
      : `${sender.fullName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`;
    
    await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: "chat",
      title: "New Message",
      message: notificationMessage,
      data: {
        offerId: offerId,
        chatId: createMessage._id,
        isEncrypted: isEncrypted || false
      },
      actionUrl: receiver.role === 'student' ? '/student/accepted-offers' : '/teacher/offered'
    });
  } catch (notificationError) {
    console.error("Failed to create chat notification:", notificationError);
    // Don't fail the chat creation if notification fails
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdChat, "chat successfully created"));
});
const getAllChat = asyncHandler(async (req, res) => {
  const offerId = req.params.offerId;
  
  if (!offerId) {
    throw new ApiError(409, "Offer id is required");
  }
  
  if (!isValidObjectId(offerId)) {
    throw new ApiError(409, "Invalid offer id format");
  }
  
  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new ApiError(404, "Offer not found");
  }
  
  const AllChats = await Chat.find({ offer: offerId })
    .populate({ path: "sender", select: "fullName role" })
    .populate({ path: "receiver", select: "fullName role" });
  
  if (!AllChats) {
    throw new ApiError(500, "Failed to fetch all chats");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, AllChats, "Successfully fetched all the chats"));
});

/**
 * Get all students who have sent messages to a teacher
 * Returns unique students grouped by offer
 */
const getStudentsWhoMessaged = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  if (req.user.role !== "teacher") {
    throw new ApiError(403, "Access denied. Teacher only.");
  }

  // Get all offers made by this teacher
  const teacherOffers = await Offer.find({
    offeredBy: teacherId,
  }).select("_id");

  const offerIds = teacherOffers.map((offer) => offer._id);

  if (offerIds.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, [], "No offers found. No students have messaged yet.")
      );
  }

  // Get all chats where teacher is receiver (students sent messages)
  const chats = await Chat.find({
    receiver: teacherId,
    offer: { $in: offerIds },
  })
    .populate({
      path: "sender",
      select: "fullName email role",
    })
    .populate({
      path: "offer",
      populate: [
        {
          path: "post",
          select: "topic description",
        },
        {
          path: "offeredTo",
          select: "fullName email",
        },
      ],
    })
    .sort({ createdAt: -1 });

  // Group by offer and get unique students
  const studentsByOffer = {};
  chats.forEach((chat) => {
    const offerId = chat.offer._id.toString();
    if (!studentsByOffer[offerId]) {
      studentsByOffer[offerId] = {
        offer: chat.offer,
        student: chat.sender,
        lastMessage: chat.message,
        lastMessageTime: chat.createdAt,
        messageCount: 1,
      };
    } else {
      studentsByOffer[offerId].messageCount += 1;
      // Update last message if this one is newer
      if (new Date(chat.createdAt) > new Date(studentsByOffer[offerId].lastMessageTime)) {
        studentsByOffer[offerId].lastMessage = chat.message;
        studentsByOffer[offerId].lastMessageTime = chat.createdAt;
      }
    }
  });

  // Convert to array and format
  const studentsList = Object.values(studentsByOffer).map((item) => ({
    offer: {
      _id: item.offer._id,
      proposed_price: item.offer.proposed_price,
      status: item.offer.status,
      appointmentTime: item.offer.appointmentTime,
      post: item.offer.post,
      offeredTo: item.offer.offeredTo,
    },
    student: {
      _id: item.student._id,
      fullName: item.student.fullName,
      email: item.student.email,
    },
    lastMessage: item.lastMessage,
    lastMessageTime: item.lastMessageTime,
    messageCount: item.messageCount,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        studentsList,
        "Successfully fetched students who have messaged"
      )
    );
});

export { create, getAllChat, getStudentsWhoMessaged };
