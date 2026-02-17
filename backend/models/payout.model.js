// Payout Request Model
import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['esewa', 'bank'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  payoutDetails: {
    esewaId: String,
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      branchName: String
    }
  },
  requestNote: {
    type: String
  },
  adminNote: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  transactionReference: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
payoutSchema.index({ teacher: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
