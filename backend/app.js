// backend/app.js
import dotenv from "dotenv";

// ⚠️ CRITICAL: Load environment variables FIRST
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.route.js";
import studentRouter from "./routes/student.route.js";
import teacherRouter from "./routes/teacher.route.js";
import offerRouter from "./routes/offer.route.js";
import postRouter from "./routes/post.route.js";
import chatRouter from "./routes/chat.route.js";
import appointmentRouter from "./routes/appointment.route.js";
import meetingRouter from "./routes/meeting.route.js";
import notificationRouter from "./routes/notification.route.js";
import adminRouter from "./routes/admin.route.js";
import courseRouter from "./routes/course.route.js";
import chatbotRouter from "./routes/chatbot.route.js";
import paymentRouter from "./routes/payment.route.js";
import meetingSummaryRouter from "./routes/meetingSummary.route.js";
import meetingReviewRouter from "./routes/meetingReview.route.js";
import teacherBalanceRouter from "./routes/teacherBalance.route.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// ================================
// 🌍 CORS (DEV + PROD safe)
// ================================
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.CLIENT_URL]        // PROD frontend
    : ["http://localhost:5173", "http://localhost:5174"];      // DEV frontend

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true, // ✅ allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================================
// 🔧 Middlewares
// ================================
app.use(express.json({ limit: "10mb" })); // Increased limit for profile picture uploads
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ================================
// 🚏 Routes
// ================================
// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/teachers", teacherRouter);
app.use("/api/v1/offers", offerRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/meetings", meetingRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/chatbot", chatbotRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/meeting-summaries", meetingSummaryRouter);
app.use("/api/v1/meeting-reviews", meetingReviewRouter);
app.use("/api/v1/teacher-balance", teacherBalanceRouter);

// ================================
// ❤️ Health Check
// ================================
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ================================
// ❗ Global Error Handler
// ================================
app.use(errorHandler);

export default app;
