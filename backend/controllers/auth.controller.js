import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { Student } from "../models/student.model.js";
import { Teacher } from "../models/teacher.model.js";
import crypto from "crypto";
import sendEmail from "../utility/sendEmail.js";

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
   📝 OTP GENERATOR
===================================================== */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

/* =====================================================
   📝 REGISTER USER
===================================================== */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if ([fullName, email, password, role].some((field) => !field)) {
    throw new ApiError(400, "All fields are required");
  }

  const isUserExist = await User.findOne({ email });
  if (isUserExist) throw new ApiError(409, "User already exists");

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  const createdUser = await User.create({
    fullName,
    email,
    password,
    role,
    emailVerificationOTP: otp,
    emailVerificationExpires: otpExpiry,
    isEmailVerified: false,
  });

  // Send OTP via email
  await sendEmail({
    to: email,
    subject: "Email Verification OTP",
    text: `Your verification OTP is: ${otp}. It expires in 10 minutes.`,
  });

  const user = await User.findById(createdUser._id).select(
    "_id fullName email role isEmailVerified"
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      user,
      "Registration successful. An OTP has been sent to your email."
    )
  );
});

/* =====================================================
   🔁 RESEND VERIFICATION OTP
===================================================== */
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (user.isEmailVerified) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Email is already verified"));
  }

  const otp = generateOTP();
  user.emailVerificationOTP = otp;
  user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: email,
    subject: "Resend Verification OTP",
    text: `Your new verification OTP is: ${otp}. It expires in 10 minutes.`,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Verification OTP resent successfully"));
});

/* =====================================================
   ✅ VERIFY EMAIL OTP
===================================================== */
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await User.findOne({
    email,
    emailVerificationOTP: otp,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired OTP");

  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // ✅ AUTO-CREATE PROFILE AFTER EMAIL VERIFICATION
  try {
    if (user.role === "student") {
      const existingStudent = await Student.findOne({ userDetail: user._id });
      if (!existingStudent) {
        await Student.create({
          userDetail: user._id,
          grade: "Not specified", // Default value
          school: "Not specified" // Default value
        });
      }
    } else if (user.role === "teacher") {
      const existingTeacher = await Teacher.findOne({ userDetail: user._id });
      if (!existingTeacher) {
        await Teacher.create({
          userDetail: user._id,
          experience: "Not specified", // Default value
          rating: 5 // Default value
        });
      }
    }
  } catch (profileError) {
    console.error("Error creating profile:", profileError);
    // Don't throw error - email verification should still succeed
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Email verified successfully"));
});

/* =====================================================
   🔑 LOGIN USER
===================================================== */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User does not exist. Please register first.");

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new ApiError(401, "Incorrect password");

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email with the OTP sent to your email before logging in");
  }

  // ✅ ENSURE PROFILE EXISTS (FALLBACK FOR EXISTING USERS)
  try {
    if (user.role === "student") {
      const existingStudent = await Student.findOne({ userDetail: user._id });
      if (!existingStudent) {
        await Student.create({
          userDetail: user._id,
          grade: "Not specified",
          school: "Not specified"
        });
      }
    } else if (user.role === "teacher") {
      const existingTeacher = await Teacher.findOne({ userDetail: user._id });
      if (!existingTeacher) {
        await Teacher.create({
          userDetail: user._id,
          experience: "Not specified",
          rating: 5
        });
      }
    }
  } catch (profileError) {
    console.error("Error ensuring profile exists:", profileError);
    // Don't block login if profile creation fails
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // ✅ HTTP COOKIE OPTIONS - Environment-based security
  const options = {
    httpOnly: false, // ✅ Allow JavaScript access for debugging (should be true in production)
    secure: process.env.NODE_ENV === "production",   // ✅ HTTPS in production, HTTP in dev
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // ✅ Strict in production
    path: "/",          // ✅ Accessible from all paths
    maxAge: 24 * 60 * 60 * 1000, // ✅ 24 hours
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined // ✅ No domain in dev
  };

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
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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

  // ✅ HTTP COOKIE OPTIONS - Must match login
  const options = {
    httpOnly: process.env.NODE_ENV === "production", // ✅ Secure in production, accessible in dev for debugging
    secure: process.env.NODE_ENV === "production",   // ✅ HTTPS in production, HTTP in dev
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // ✅ Strict in production
    path: "/",          // ✅ Accessible from all paths
    maxAge: 24 * 60 * 60 * 1000, // ✅ 24 hours
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : "localhost"
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
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
  };

  return res
    .status(200)
    .json(new ApiResponse(200, safeUser, "Current user fetched successfully"));
});

/* =====================================================
   🔒 FORGOT PASSWORD
===================================================== */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  // Hash and save the token to database
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

  // Email content
  const emailText = `
    Hello ${user.fullName},
    
    You requested a password reset for your EduConnect account.
    
    Please click the link below to reset your password:
    ${resetUrl}
    
    This link will expire in 10 minutes.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    EduConnect Team
  `;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Password Reset Request</h2>
      <p>Hello <strong>${user.fullName}</strong>,</p>
      <p>You requested a password reset for your EduConnect account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>
      <p><strong>This link will expire in 10 minutes.</strong></p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">Best regards,<br>EduConnect Team</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - EduConnect",
      text: emailText,
      html: emailHtml,
    });

    return res.status(200).json(
      new ApiResponse(200, null, "Password reset link sent to your email")
    );
  } catch (error) {
    // Clear the reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    throw new ApiError(500, "Email could not be sent. Please try again later.");
  }
});

/* =====================================================
   🔑 RESET PASSWORD
===================================================== */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params; // Get token from URL params
  const { password } = req.body; // Get new password from request body
  
  if (!token || !password) {
    throw new ApiError(400, "Token and new password are required");
  }

  // Hash the token to match the stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid reset token that hasn't expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // Update password and clear reset token fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

export {
  register,
  login,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  verifyEmail,
};
