import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    meetingUrl: {
      type: String,
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    reminders: {
      fifteenMinute: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date }
      },
      tenMinute: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date }
      },
      fiveMinute: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date }
      },
      twoMinute: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date }
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      joinedAt: Date,
      leftAt: Date,
    }],
    // Payment fields
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid_awaiting_confirmation", "completed", "refunded"],
      default: "not_required",
    },
    paymentProof: {
      type: String, // URL or transaction ID from student
    },
    paymentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Teacher who confirmed payment
    },
    paymentConfirmedAt: {
      type: Date,
    },
    notes: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
meetingSchema.index({ scheduledTime: 1, status: 1 });
meetingSchema.index({ studentId: 1, teacherId: 1 });
meetingSchema.index({ 
  "reminders.fifteenMinute.sent": 1, 
  "reminders.tenMinute.sent": 1, 
  "reminders.fiveMinute.sent": 1,
  "reminders.twoMinute.sent": 1, 
  scheduledTime: 1 
});

export const Meeting = mongoose.model("Meeting", meetingSchema);