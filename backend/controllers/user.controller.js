import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { clearUserCache } from "../middlewares/auth.middleware.js";
import jwt from "jsonwebtoken";

/* =====================================================
   🔐 TOKEN GENERATION
===================================================== */
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Token generation error:', error);
    throw new ApiError(
      500,
      `Something went wrong while generating tokens: ${error.message}`
    );
  }
};

/* =====================================================
   📝 REGISTER USER (NO AUTO LOGIN)
===================================================== */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if ([fullName, email, password, role].some((field) => !field)) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "User already exists");

  const createdUser = await User.create({
    fullName,
    email,
    password,
    role,
  });

  if (!createdUser) throw new ApiError(500, "User registration failed");

  // ❌ No token generation here
  // ✅ Email verification must happen before login

  const user = await User.findById(createdUser._id).select(
    "_id fullName email role isEmailVerified"
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      user,
      "Registration successful. Please verify your email before logging in."
    )
  );
});

/* =====================================================
   🔑 LOGIN USER
===================================================== */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const userExist = await User.findOne({ email });
  if (!userExist) throw new ApiError(404, "User does not exist");

  const isPasswordCorrect = await userExist.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new ApiError(401, "Incorrect password");

  if (!userExist.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(userExist._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  // Only return safe fields for frontend
  const safeUser = {
    _id: userExist._id,
    fullName: userExist.fullName,
    email: userExist.email,
    role: userExist.role,
    isEmailVerified: userExist.isEmailVerified,
    age: userExist.age,
    phoneNumber: userExist.phoneNumber,
    qualification: userExist.qualification,
    currentCenter: userExist.currentCenter,
    profilePicture: userExist.profilePicture,
    averageRating: userExist.averageRating || 0,
    totalReviews: userExist.totalReviews || 0,
    esewaId: userExist.esewaId,
    esewaQRCode: userExist.esewaQRCode,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, safeUser, "Successfully logged in"));
});

/* =====================================================
   🚪 LOGOUT USER
===================================================== */
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: "" } },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logout successful"));
});

/* =====================================================
   👤 GET CURRENT USER
===================================================== */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(404, "User not found");

  const safeUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    age: user.age,
    phoneNumber: user.phoneNumber,
    qualification: user.qualification,
    currentCenter: user.currentCenter,
    profilePicture: user.profilePicture,
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0,
    esewaId: user.esewaId,
    esewaQRCode: user.esewaQRCode,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, safeUser, "Current user fetched successfully"));
});

/* =====================================================
   ✏️ UPDATE USER PROFILE
===================================================== */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fullName, age, phoneNumber, qualification, currentCenter, profilePicture, esewaId, esewaQRCode } = req.body;

  // Find user
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Update fields if provided
  if (fullName !== undefined) user.fullName = fullName;
  if (age !== undefined) user.age = age;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (qualification !== undefined) user.qualification = qualification;
  if (currentCenter !== undefined) user.currentCenter = currentCenter;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  if (esewaId !== undefined) user.esewaId = esewaId;
  if (esewaQRCode !== undefined) user.esewaQRCode = esewaQRCode;

  // Save updated user
  await user.save();

  // Clear user cache to ensure fresh data on next request
  clearUserCache(userId.toString());

  // Return safe user data
  const safeUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    age: user.age,
    phoneNumber: user.phoneNumber,
    qualification: user.qualification,
    currentCenter: user.currentCenter,
    profilePicture: user.profilePicture,
    averageRating: user.averageRating || 0,
    totalReviews: user.totalReviews || 0,
    esewaId: user.esewaId,
    esewaQRCode: user.esewaQRCode,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, safeUser, "Profile updated successfully"));
});

/* =====================================================
   🔄 REFRESH ACCESS TOKEN
===================================================== */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }

    // Check if refresh token matches
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = 
      await generateAccessAndRefreshTokens(user._id);

    // Cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...options,
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie("refreshToken", newRefreshToken, {
        ...options,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  register,
  login,
  logoutUser,
  getCurrentUser,
  updateProfile,
  refreshAccessToken,
};
