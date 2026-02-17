// Meeting Summary Model
import mongoose from 'mongoose';

const meetingSummarySchema = new mongoose.Schema({
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  meetingData: {
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    chatMessages: [{
      sender: String,
      message: String,
      timestamp: Date
    }],
    whiteboardContent: String,
    participants: [String]
  },
  aiSummary: {
    summary: String,
    keyTopics: [String],
    importantPoints: [String],
    actionItems: [String],
    discussionHighlights: [String],
    recommendations: [String]
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date
}, {
  timestamps: true
});

// Index for faster queries
meetingSummarySchema.index({ meeting: 1 });
meetingSummarySchema.index({ teacher: 1, createdAt: -1 });
meetingSummarySchema.index({ students: 1, createdAt: -1 });

const MeetingSummary = mongoose.model('MeetingSummary', meetingSummarySchema);

export default MeetingSummary;
