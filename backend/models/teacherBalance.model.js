// Teacher Balance Model
import mongoose from 'mongoose';

const teacherBalanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  withdrawnAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionRate: {
    type: Number,
    default: 20, // 20% platform commission
    min: 0,
    max: 100
  },
  payoutMethod: {
    type: String,
    enum: ['esewa', 'bank', 'not_set'],
    default: 'not_set'
  },
  esewaId: {
    type: String,
    trim: true
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branchName: String
  }
}, {
  timestamps: true
});

// Calculate teacher share after commission
teacherBalanceSchema.methods.calculateTeacherShare = function(amount) {
  const commission = (amount * this.commissionRate) / 100;
  const teacherShare = amount - commission;
  return {
    totalAmount: amount,
    commission: commission,
    teacherShare: teacherShare,
    commissionRate: this.commissionRate
  };
};

// Add earnings to balance
teacherBalanceSchema.methods.addEarnings = async function(amount, paymentId) {
  const breakdown = this.calculateTeacherShare(amount);
  
  this.totalEarnings += breakdown.teacherShare;
  this.availableBalance += breakdown.teacherShare;
  
  await this.save();
  return breakdown;
};

// Request payout
teacherBalanceSchema.methods.requestPayout = async function(amount) {
  if (amount > this.availableBalance) {
    throw new Error('Insufficient balance');
  }
  
  this.availableBalance -= amount;
  this.pendingBalance += amount;
  
  await this.save();
};

// Complete payout
teacherBalanceSchema.methods.completePayout = async function(amount) {
  if (amount > this.pendingBalance) {
    throw new Error('Invalid payout amount');
  }
  
  this.pendingBalance -= amount;
  this.withdrawnAmount += amount;
  
  await this.save();
};

// Cancel payout
teacherBalanceSchema.methods.cancelPayout = async function(amount) {
  this.pendingBalance -= amount;
  this.availableBalance += amount;
  
  await this.save();
};

const TeacherBalance = mongoose.model('TeacherBalance', teacherBalanceSchema);

export default TeacherBalance;
