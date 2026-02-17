// backend/models/user.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    isEmailVerified: { type: Boolean, default: false },

    // Profile fields
    age: { type: Number, min: 1, max: 120 },
    phoneNumber: { type: String, trim: true },
    qualification: { type: String, trim: true },
    currentCenter: { type: String, trim: true }, // School for students, Institution for teachers
    profilePicture: { type: String }, // URL to profile image

    // Rating fields
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },

    // Payment details (for teachers)
    esewaId: { type: String, trim: true }, // Teacher's eSewa ID for receiving payments
    esewaQRCode: { type: String }, // URL to eSewa QR code image

    // OTP fields for email verification
    emailVerificationOTP: String,
    emailVerificationExpires: Date,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    refreshToken: String,
  },
  { timestamps: true }
);

// ===== Password hashing pre-save hook =====
userSchema.pre("save", async function (next) {
  try {
    // Only hash if password is new or modified
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    console.error("Error hashing password for user:", this.email, error);
    next(error); // Propagate the error so Mongoose knows save failed
  }
});

// ===== Instance methods =====
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

userSchema.methods.generateEmailVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = otp;
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// ===== TTL Index for unverified users =====
// Automatically delete unverified users after 10 minutes (600 seconds)
// This index will only delete documents where isEmailVerified is false
userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 600, // 10 minutes
    partialFilterExpression: { isEmailVerified: false }
  }
);

// Export model
export const User = mongoose.model("User", userSchema);
