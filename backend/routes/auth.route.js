// backend/routes/authRouter.js
import express from "express";
import {
  register,
  login,
  logoutUser,
  getCurrentUser,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";

import validateGmail from "../middlewares/validateEmail.js"; 
import authMiddleware, { verifyJWT } from "../middlewares/auth.middleware.js"; // Protect routes

const router = express.Router();

// ================= AUTH ROUTES =================

// Registration with Gmail-only validation
router.post("/register", validateGmail, register);

// Login
router.post("/login", login);

// Verify email (from email link)
router.post("/verify-email", verifyEmail);

// Resend verification email
router.post("/resend-verification-email", resendVerificationEmail);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password (token in URL)
router.put("/reset-password/:token", resetPassword);

// Logout (protected route)
router.post("/logout", authMiddleware, logoutUser);

// Get current logged-in user (protected)
router.get("/me", authMiddleware, getCurrentUser);

export default router;
