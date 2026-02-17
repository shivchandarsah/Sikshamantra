import { Router } from "express";
import {
  uploadCourse,
  getAllCourses,
  getTeacherCourses,
  downloadCourse,
  deleteCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes with authentication
router.use(authMiddleware);

// Course routes
router.post("/upload", uploadCourse);
router.get("/all", getAllCourses);
router.get("/my-courses", getTeacherCourses);
router.get("/download/:courseId", downloadCourse);
router.delete("/:courseId", deleteCourse);
router.put("/:courseId", updateCourse);

export default router;
