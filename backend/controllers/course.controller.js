import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { Course } from "../models/course.model.js";

/* =====================================================
   📤 UPLOAD COURSE (TEACHER ONLY)
===================================================== */
const uploadCourse = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "Only teachers can upload courses");
  }

  const { title, description, subject, grade, fileUrl, fileName, fileSize, fileType, tags, price } = req.body;

  if (!title || !description || !subject || !grade || !fileUrl || !fileName) {
    throw new ApiError(400, "All required fields must be provided");
  }

  if (price === undefined || price < 0) {
    throw new ApiError(400, "Valid price is required (0 for free courses)");
  }

  const course = await Course.create({
    title,
    description,
    subject,
    grade,
    fileUrl,
    fileName,
    fileSize: fileSize || 0,
    fileType: fileType || "application/pdf",
    uploadedBy: req.user._id,
    tags: tags || [],
    price: price || 0,
  });

  const populatedCourse = await Course.findById(course._id).populate("uploadedBy", "fullName email");

  return res.status(201).json(
    new ApiResponse(201, populatedCourse, "Course uploaded successfully")
  );
});

/* =====================================================
   📚 GET ALL COURSES
===================================================== */
const getAllCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, subject, grade, search, sortBy = "createdAt" } = req.query;

  const filter = { isPublic: true };

  if (subject && subject !== "all") {
    filter.subject = subject;
  }

  if (grade && grade !== "all") {
    filter.grade = grade;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [courses, totalCourses] = await Promise.all([
    Course.find(filter)
      .populate("uploadedBy", "fullName email profilePicture")
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Course.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCourses / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCourses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }, "Courses fetched successfully")
  );
});

/* =====================================================
   📖 GET TEACHER'S COURSES
===================================================== */
const getTeacherCourses = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    throw new ApiError(403, "Only teachers can access this route");
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [courses, totalCourses] = await Promise.all([
    Course.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Course.countDocuments({ uploadedBy: req.user._id }),
  ]);

  const totalPages = Math.ceil(totalCourses / limit);

  return res.status(200).json(
    new ApiResponse(200, {
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCourses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }, "Your courses fetched successfully")
  );
});

/* =====================================================
   📥 DOWNLOAD COURSE
===================================================== */
const downloadCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check if course is free or if payment has been made
  if (course.price > 0) {
    // Import Payment model dynamically to avoid circular dependency
    const { default: Payment } = await import("../models/payment.model.js");
    
    // Check if user has paid for this course
    const payment = await Payment.findOne({
      user: req.user._id,
      purpose: "course",
      purposeId: courseId,
      status: "success"
    });

    if (!payment) {
      throw new ApiError(403, "Payment required. Please purchase this course first.");
    }
  }

  // Increment download count
  course.downloads += 1;
  await course.save();

  return res.status(200).json(
    new ApiResponse(200, { fileUrl: course.fileUrl, fileName: course.fileName }, "Course ready for download")
  );
});

/* =====================================================
   🗑️ DELETE COURSE (TEACHER ONLY)
===================================================== */
const deleteCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check if the user is the owner
  if (course.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "You can only delete your own courses");
  }

  await Course.findByIdAndDelete(courseId);

  return res.status(200).json(
    new ApiResponse(200, null, "Course deleted successfully")
  );
});

/* =====================================================
   ✏️ UPDATE COURSE (TEACHER ONLY)
===================================================== */
const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description, subject, grade, tags, isPublic } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check if the user is the owner
  if (course.uploadedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own courses");
  }

  if (title) course.title = title;
  if (description) course.description = description;
  if (subject) course.subject = subject;
  if (grade) course.grade = grade;
  if (tags) course.tags = tags;
  if (isPublic !== undefined) course.isPublic = isPublic;

  await course.save();

  const updatedCourse = await Course.findById(courseId).populate("uploadedBy", "fullName email");

  return res.status(200).json(
    new ApiResponse(200, updatedCourse, "Course updated successfully")
  );
});

export {
  uploadCourse,
  getAllCourses,
  getTeacherCourses,
  downloadCourse,
  deleteCourse,
  updateCourse,
};
