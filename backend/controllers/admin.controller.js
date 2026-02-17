import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Teacher } from "../models/teacher.model.js";
import { Post } from "../models/post.model.js";
import { Offer } from "../models/Offer.model.js";
import { Meeting } from "../models/meeting.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Chat } from "../models/chat.model.js";
import { Notification } from "../models/notification.model.js";

/* =====================================================
   📊 ADMIN DASHBOARD STATS
===================================================== */
const getDashboardStats = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ✅ OPTIMIZED: Use aggregation to get all user stats in one query
  const userStats = await User.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        byRole: [
          { $group: { _id: "$role", count: { $sum: 1 } } }
        ],
        thisWeek: [
          { $match: { createdAt: { $gte: lastWeek } } },
          { $count: "count" }
        ],
        thisMonth: [
          { $match: { createdAt: { $gte: lastMonth } } },
          { $count: "count" }
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          { $project: { fullName: 1, email: 1, role: 1, createdAt: 1, isEmailVerified: 1 } }
        ]
      }
    }
  ]);

  // ✅ OPTIMIZED: Parallel queries for other collections
  const [postStats, offerStats, totalMeetings, totalChats, totalNotifications] = await Promise.all([
    Post.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          thisWeek: [
            { $match: { createdAt: { $gte: lastWeek } } },
            { $count: "count" }
          ],
          thisMonth: [
            { $match: { createdAt: { $gte: lastMonth } } },
            { $count: "count" }
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "studentDetail",
                foreignField: "_id",
                as: "studentDetail"
              }
            },
            { $unwind: { path: "$studentDetail", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                topic: 1,
                description: 1,
                createdAt: 1,
                status: 1,
                "studentDetail.fullName": 1,
                "studentDetail.email": 1
              }
            }
          ]
        }
      }
    ]),
    Offer.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          thisWeek: [
            { $match: { createdAt: { $gte: lastWeek } } },
            { $count: "count" }
          ],
          thisMonth: [
            { $match: { createdAt: { $gte: lastMonth } } },
            { $count: "count" }
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "offeredBy",
                foreignField: "_id",
                as: "offeredBy"
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "offeredTo",
                foreignField: "_id",
                as: "offeredTo"
              }
            },
            { $unwind: { path: "$offeredBy", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$offeredTo", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                proposed_price: 1,
                status: 1,
                createdAt: 1,
                "offeredBy.fullName": 1,
                "offeredBy.email": 1,
                "offeredTo.fullName": 1,
                "offeredTo.email": 1
              }
            }
          ]
        }
      }
    ]),
    Meeting.countDocuments(),
    Chat.countDocuments(),
    Notification.countDocuments()
  ]);

  // Extract data from aggregation results
  const roleCount = {};
  userStats[0].byRole.forEach(item => {
    roleCount[item._id] = item.count;
  });

  const stats = {
    overview: {
      totalUsers: userStats[0].total[0]?.count || 0,
      totalStudents: roleCount.student || 0,
      totalTeachers: roleCount.teacher || 0,
      totalAdmins: roleCount.admin || 0,
      totalPosts: postStats[0].total[0]?.count || 0,
      totalOffers: offerStats[0].total[0]?.count || 0,
      totalMeetings,
      totalChats,
      totalNotifications
    },
    activity: {
      newUsersThisWeek: userStats[0].thisWeek[0]?.count || 0,
      newUsersThisMonth: userStats[0].thisMonth[0]?.count || 0,
      postsThisWeek: postStats[0].thisWeek[0]?.count || 0,
      postsThisMonth: postStats[0].thisMonth[0]?.count || 0,
      offersThisWeek: offerStats[0].thisWeek[0]?.count || 0,
      offersThisMonth: offerStats[0].thisMonth[0]?.count || 0
    },
    recent: {
      users: userStats[0].recent || [],
      posts: postStats[0].recent || [],
      offers: offerStats[0].recent || []
    }
  };

  return res.status(200).json(
    new ApiResponse(200, stats, "Dashboard stats fetched successfully")
  );
});

/* =====================================================
   👥 GET ALL USERS
===================================================== */
const getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { page = 1, limit = 20, role, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  // Build filter query
  const filter = {};
  if (role && role !== "all") {
    filter.role = role;
  }
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  // Build sort query
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -emailVerificationOTP -passwordResetToken")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Users fetched successfully")
  );
});

/* =====================================================
   🔄 CHANGE USER ROLE
===================================================== */
const changeUserRole = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { userId } = req.params;
  const { newRole } = req.body;

  if (!["student", "teacher", "admin"].includes(newRole)) {
    throw new ApiError(400, "Invalid role. Must be student, teacher, or admin.");
  }

  // Prevent admin from changing their own role
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot change your own role.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  // Create appropriate profile if changing to student/teacher
  if (newRole === "student" && oldRole !== "student") {
    const existingStudent = await Student.findOne({ userDetail: userId });
    if (!existingStudent) {
      await Student.create({
        userDetail: userId,
        grade: "Not specified",
        school: "Not specified"
      });
    }
  } else if (newRole === "teacher" && oldRole !== "teacher") {
    const existingTeacher = await Teacher.findOne({ userDetail: userId });
    if (!existingTeacher) {
      await Teacher.create({
        userDetail: userId,
        experience: "Not specified",
        rating: 5
      });
    }
  }

  // Create notification for user
  await Notification.create({
    recipient: userId,
    sender: req.user._id,
    type: "system",
    title: "Role Changed",
    message: `Your role has been changed from ${oldRole} to ${newRole} by an administrator.`,
    data: { oldRole, newRole }
  });

  // ✅ Emit Socket.IO event to notify user in real-time
  if (global.io) {
    global.io.to(`user_${userId}`).emit("roleChanged", {
      oldRole,
      newRole,
      message: `Your role has been changed from ${oldRole} to ${newRole}. You will be redirected to your new dashboard.`,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { user: { ...user.toObject(), password: undefined } }, `User role changed from ${oldRole} to ${newRole}`)
  );
});

/* =====================================================
   🚫 TOGGLE USER STATUS
===================================================== */
const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { userId } = req.params;

  // Prevent admin from disabling themselves
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot disable your own account.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isEmailVerified = !user.isEmailVerified;
  await user.save();

  const status = user.isEmailVerified ? "enabled" : "disabled";

  // Create notification for user
  await Notification.create({
    recipient: userId,
    sender: req.user._id,
    type: "system",
    title: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your account has been ${status} by an administrator.`,
    data: { status }
  });

  return res.status(200).json(
    new ApiResponse(200, { user: { ...user.toObject(), password: undefined } }, `User account ${status}`)
  );
});

/* =====================================================
   📝 GET ALL POSTS
===================================================== */
const getAllPosts = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { page = 1, limit = 20, status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  // Build filter query
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { topic: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  // Build sort query
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .populate("studentDetail", "fullName email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Post.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalPosts / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Posts fetched successfully")
  );
});

/* =====================================================
   💼 GET ALL OFFERS
===================================================== */
const getAllOffers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { page = 1, limit = 20, status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  // Build filter query
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  // Build sort query
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [offers, totalOffers] = await Promise.all([
    Offer.find(filter)
      .populate("offeredBy", "fullName email")
      .populate("offeredTo", "fullName email")
      .populate("post", "topic description")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Offer.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalOffers / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      offers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOffers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Offers fetched successfully")
  );
});

/* =====================================================
   🎥 GET ALL MEETINGS
===================================================== */
const getAllMeetings = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { page = 1, limit = 20, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  // Build filter query
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  // Build sort query
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [meetings, totalMeetings] = await Promise.all([
    Meeting.find(filter)
      .populate("createdBy", "fullName email role")
      .populate("participants", "fullName email role")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Meeting.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalMeetings / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalMeetings,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Meetings fetched successfully")
  );
});

/* =====================================================
   🗑️ DELETE USER (HARD DELETE)
===================================================== */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { userId } = req.params;

  // Prevent admin from deleting themselves
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot delete your own account.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // ✅ HARD DELETE - Remove user and all related data
  try {
    // Delete user's profile based on role
    if (user.role === "student") {
      // Delete student profile
      await Student.deleteMany({ userDetail: userId });
      
      // Find and delete student's posts and related data
      const studentPosts = await Post.find({ studentDetail: userId }).select('_id');
      if (studentPosts.length > 0) {
        const postIds = studentPosts.map(post => post._id);
        
        // Find offers related to student's posts
        const relatedOffers = await Offer.find({ post: { $in: postIds } }).select('_id');
        if (relatedOffers.length > 0) {
          const offerIds = relatedOffers.map(offer => offer._id);
          // Delete appointments related to these offers
          await Appointment.deleteMany({ offer: { $in: offerIds } });
        }
        
        // Delete offers related to student's posts
        await Offer.deleteMany({ post: { $in: postIds } });
        
        // Delete the posts
        await Post.deleteMany({ _id: { $in: postIds } });
      }
    } else if (user.role === "teacher") {
      // Delete teacher profile
      await Teacher.deleteMany({ userDetail: userId });
    }

    // Find and delete user's offers (both sent and received)
    const userOffers = await Offer.find({
      $or: [
        { offeredBy: userId },
        { offeredTo: userId }
      ]
    }).select('_id');
    
    if (userOffers.length > 0) {
      const offerIds = userOffers.map(offer => offer._id);
      // Delete appointments related to user's offers
      await Appointment.deleteMany({ offer: { $in: offerIds } });
    }
    
    // Delete the offers
    await Offer.deleteMany({ 
      $or: [
        { offeredBy: userId },
        { offeredTo: userId }
      ]
    });

    // Delete user's meetings
    await Meeting.deleteMany({
      $or: [
        { createdBy: userId },
        { studentId: userId },
        { teacherId: userId },
        { 'participants.userId': userId }
      ]
    });

    // Delete user's chats
    await Chat.deleteMany({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    // Delete user's notifications
    await Notification.deleteMany({
      $or: [
        { recipient: userId },
        { sender: userId }
      ]
    });

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json(
      new ApiResponse(200, null, "User and all related data deleted successfully")
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new ApiError(500, `Failed to delete user: ${error.message}`);
  }
});

/* =====================================================
   📊 GET SYSTEM ANALYTICS
===================================================== */
const getSystemAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { period = "7d" } = req.query;

  let startDate;
  const endDate = new Date();

  switch (period) {
    case "24h":
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };

  const [
    userRegistrations,
    postCreations,
    offerCreations,
    meetingCreations,
    chatMessages
  ] = await Promise.all([
    User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Post.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Offer.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Meeting.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Chat.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const analytics = {
    period,
    startDate,
    endDate,
    data: {
      userRegistrations,
      postCreations,
      offerCreations,
      meetingCreations,
      chatMessages
    }
  };

  return res.status(200).json(
    new ApiResponse(200, analytics, "System analytics fetched successfully")
  );
});

export {
  getDashboardStats,
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
  getAllPosts,
  getAllOffers,
  getAllMeetings,
  deleteUser,
  getSystemAnalytics
};