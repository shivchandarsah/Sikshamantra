/* Final_Project/backend/middlewares/auth.middleware.js */

import jwt from "jsonwebtoken";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utility/ApiError.js";

// ✅ Simple in-memory cache for user data
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/* =====================================================
   🔑 HELPER FUNCTION: GET USER FROM JWT WITH CACHING
   - Verifies token
   - Fetches user from cache or DB with safe fields
===================================================== */
const getUserFromToken = async (token) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded?._id) {
      throw new ApiError(401, "Invalid token payload");
    }

    const cacheKey = decoded._id;
    const now = Date.now();

    // Check cache first
    if (userCache.has(cacheKey)) {
      const cached = userCache.get(cacheKey);
      if (now - cached.timestamp < CACHE_DURATION) {
        return cached.user;
      }
      // Cache expired, remove it
      userCache.delete(cacheKey);
    }

    // Fetch user from DB (including profile fields and rating fields)
    const user = await User.findById(decoded._id).select(
      "_id fullName email role isEmailVerified age phoneNumber qualification currentCenter profilePicture averageRating totalReviews esewaId esewaQRCode"
    );

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Cache the user data
    userCache.set(cacheKey, {
      user,
      timestamp: now
    });

    return user;
  } catch (error) {
    // ✅ Only log non-JWT errors to reduce noise
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      console.error("JWT verification failed:", error.message);
    }
    throw new ApiError(401, "Unauthorized: Invalid token");
  }
};

/* =====================================================
   🔐 VERIFY JWT (named export)
   - Use in routes where token is sent via Authorization header or cookies
===================================================== */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Check token in Authorization header first
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2️⃣ Check token in cookies as fallback
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  req.user = await getUserFromToken(token);
  next();
});

/* =====================================================
   🔒 AUTH MIDDLEWARE (default export)
   - Protect routes via cookies or Authorization header
===================================================== */
const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // ✅ Only log in development mode to reduce noise
  const isDebugMode = process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true';
  
  // 1️⃣ Check token in Authorization header first
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2️⃣ Check token in cookies as fallback
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized: access token missing");
  }

  // Get user from token (with caching)
  req.user = await getUserFromToken(token);
  next();
});

// ✅ Clear cache periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      userCache.delete(key);
    }
  }
}, CACHE_DURATION);

// ✅ Export function to clear user cache (for profile updates)
export const clearUserCache = (userId) => {
  if (userCache.has(userId)) {
    userCache.delete(userId);
  }
};

export default authMiddleware;
