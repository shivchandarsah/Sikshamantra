// backend/routes/teacher.route.js
import { Router } from "express";
import { register, getTeacherById } from "../controllers/teacher.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const teacherRouter = Router();

// =====================================================
// 📝 REGISTER TEACHER
// Public route (no auth required)
teacherRouter.post("/register/:id", register);

// =====================================================
// 👤 GET TEACHER BY ID
// Protected route (JWT required)
teacherRouter.get("/get-teacher/:id", authMiddleware, getTeacherById);

export default teacherRouter;
