import { useState } from "react";
import { X, CreditCard, DollarSign, User, Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentButton from "@/components/PaymentButton";
import { toast } from "sonner";

export default function MeetingPaymentModal({ meeting, onClose, onSuccess }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handlePaymentSuccess = () => {
    toast.success("Payment successful! Teacher will receive their payment.");
    if (onSuccess) onSuccess();
    onClose();
  };

  const handlePaymentError = (error) => {
    toast.error(error.message || "Payment failed. Please try again.");
  };

  // Get teacher info
  const teacher = typeof meeting.teacherId === 'object' 
    ? meeting.teacherId 
    : { fullName: 'Teacher' };

  // Calculate breakdown
  const totalAmount = meeting.price || 0;
  const platformFee = totalAmount * 0.20; // 20% platform fee
  const teacherAmount = totalAmount * 0.80; // 80% to teacher

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Pay for Meeting
              </h2>
              <p className="text-green-100 mt-1">Complete payment to teacher</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meeting Details */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Meeting Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subject:</span>
                <span className="font-semibold text-gray-900">{meeting.subject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(meeting.scheduledTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(meeting.scheduledTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Teacher:</span>
                <span className="font-semibold text-gray-900">{teacher.fullName}</span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Payment Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Meeting Fee:</span>
                <span className="font-semibold text-gray-900">NPR {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Platform Fee (20%):</span>
                <span className="font-semibold text-gray-900">NPR {platformFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Teacher Receives (80%):</span>
                <span className="font-semibold text-green-600">NPR {teacherAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    NPR {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                I confirm that the meeting has been completed and I agree to pay the teacher 
                for their time and expertise. This payment is non-refundable once processed.
              </label>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You will be redirected to eSewa payment gateway. 
              After successful payment, the teacher will receive their payment (80% of total) 
              and you will receive a payment confirmation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <PaymentButton
              amount={totalAmount}
              purpose="meeting"
              purposeId={meeting._id}
              metadata={{
                meetingSubject: meeting.subject,
                teacherId: typeof meeting.teacherId === 'object' 
                  ? meeting.teacherId._id 
                  : meeting.teacherId,
                teacherName: teacher.fullName,
                scheduledTime: meeting.scheduledTime
              }}
              buttonText={`Pay NPR ${totalAmount.toFixed(2)}`}
              className="flex-1"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={!agreedToTerms}
            />
          </div>

          {!agreedToTerms && (
            <p className="text-xs text-center text-red-600">
              Please agree to the terms before proceeding with payment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
