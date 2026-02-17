// backend/routes/userRouter.js
import { Router } from "express";
import {
  register,
  verifyEmail, // OTP verification
  resendVerificationEmail, // Resend OTP
  login,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

import { updateProfile, refreshAccessToken } from "../controllers/user.controller.js";
import { getStudentProfile, getTeacherProfile, getStudentProfileById } from "../controllers/profile.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js"; // default export

const router = Router();

// ================= AUTH ROUTES =================

// Register user & send OTP
router.post("/register", register);

// Verify email with OTP
router.post("/verify-email", verifyEmail); // body: { email, otp }

// Resend OTP for verification
router.post("/resend-verification-email", resendVerificationEmail); // body: { email }

// Login
router.post("/login", login);

// Logout (protected route)
router.post("/logout", authMiddleware, logoutUser);

// Refresh access token (no auth required - uses refresh token)
router.post("/refresh-token", refreshAccessToken);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password (token in URL)
router.put("/reset-password/:token", resetPassword);

// ================= GET CURRENT USER =================

// Returns current logged-in user info (protected route)
router.get("/me", authMiddleware, getCurrentUser);

// Update user profile (protected route)
router.put("/profile", authMiddleware, updateProfile);

// ================= PROFILE ROUTES =================

// Student profile (protected + role check)
router.get("/profile/student", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied: not a student" });
    }
    await getStudentProfile(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Teacher profile (protected + role check)
router.get("/profile/teacher", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied: not a teacher" });
    }
    await getTeacherProfile(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Student profile by ID (for teachers to view)
router.get("/profile/student/:studentId", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied: only teachers can view student profiles" });
    }
    await getStudentProfileById(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
