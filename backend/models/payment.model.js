// Payment Model
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  purpose: {
    type: String,
    enum: ['course', 'meeting', 'consultation', 'subscription', 'donation', 'other'],
    required: true
  },
  purposeId: {
    type: mongoose.Schema.Types.ObjectId,
    // Reference to Course, Meeting, etc.
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'esewa'
  },
  esewaRefId: {
    type: String
  },
  esewaResponse: {
    type: Object
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ user: 1, status: 1 });
// transactionId already has unique: true, no need for separate index
paymentSchema.index({ esewaRefId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
