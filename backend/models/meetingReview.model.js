import mongoose from "mongoose";

const meetingReviewSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    // Specific rating categories
    categories: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      knowledge: {
        type: Number,
        min: 1,
        max: 5,
      },
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      helpfulness: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "hidden", "reported"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per person per meeting
meetingReviewSchema.index({ meeting: 1, reviewer: 1 }, { unique: true });
meetingReviewSchema.index({ reviewee: 1, status: 1 });
meetingReviewSchema.index({ meeting: 1 });

// Calculate average rating before saving
meetingReviewSchema.pre("save", function (next) {
  if (this.categories) {
    const cats = this.categories;
    const count = Object.values(cats).filter(v => v).length;
    if (count > 0) {
      const sum = Object.values(cats).reduce((acc, val) => acc + (val || 0), 0);
      this.rating = Math.round((sum / count) * 10) / 10; // Round to 1 decimal
    }
  }
  next();
});

export const MeetingReview = mongoose.model("MeetingReview", meetingReviewSchema);
