import { useState } from "react";
import { X, CreditCard, Copy, CheckCircle, User, Calendar, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useMyContext from "@/hooks/useMyContext";

export default function DirectPaymentModal({ meeting, onClose, onSuccess }) {
  const { meetingDb } = useMyContext();
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Debug: Log meeting data
  console.log('💳 DirectPaymentModal - Meeting data:', {
    meetingId: meeting?._id,
    subject: meeting?.subject,
    teacherId: meeting?.teacherId,
    teacherName: typeof meeting?.teacherId === 'object' ? meeting?.teacherId?.fullName : 'Not populated',
    hasEsewaId: typeof meeting?.teacherId === 'object' ? !!meeting?.teacherId?.esewaId : false,
    hasQRCode: typeof meeting?.teacherId === 'object' ? !!meeting?.teacherId?.esewaQRCode : false,
    esewaId: typeof meeting?.teacherId === 'object' ? meeting?.teacherId?.esewaId : 'N/A',
  });

  // Get teacher info
  const teacher = typeof meeting.teacherId === 'object' 
    ? meeting.teacherId 
    : { fullName: 'Teacher', esewaId: '', esewaQRCode: '' };

  const totalAmount = meeting.price || 0;

  const handleCopyEsewaId = async () => {
    if (teacher.esewaId) {
      await navigator.clipboard.writeText(teacher.esewaId);
      toast.success("eSewa ID copied to clipboard!");
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter transaction ID or reference number");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the terms");
      return;
    }

    setSubmitting(true);
    try {
      // Update meeting with payment proof
      await meetingDb.updateMeetingStatus(
        meeting._id,
        meeting.status, // Keep current status
        null,
        null,
        {
          paymentProof: transactionId,
          paymentStatus: 'paid_awaiting_confirmation'
        }
      );

      toast.success("Payment submitted! Waiting for teacher confirmation.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error submitting payment:', error);
      toast.error("Failed to submit payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Pay Teacher Directly
              </h2>
              <p className="text-green-100 mt-1">Send payment via eSewa</p>
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
                <span className="text-gray-600">Teacher:</span>
                <span className="font-semibold text-gray-900">{teacher.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount to Pay:</span>
                <span className="text-2xl font-bold text-green-600">NPR {totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-3">📱 Payment Instructions</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Open your eSewa app or scan the QR code below</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Send <strong>NPR {totalAmount}</strong> to the teacher's eSewa ID</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Copy the transaction ID from eSewa</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Paste the transaction ID below and submit</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">5.</span>
                <span>Teacher will confirm receipt of payment</span>
              </li>
            </ol>
          </div>

          {/* Teacher's eSewa Details */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              Teacher's eSewa Details
            </h3>

            {/* eSewa ID */}
            {teacher.esewaId ? (
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">eSewa ID / Mobile Number</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-green-300 rounded-lg px-4 py-3 font-mono text-lg font-semibold text-gray-900">
                    {teacher.esewaId}
                  </div>
                  <Button
                    onClick={handleCopyEsewaId}
                    variant="outline"
                    className="border-green-300 hover:bg-green-50"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  ⚠️ Teacher has not set up their eSewa ID yet. Please contact the teacher directly.
                </p>
              </div>
            )}

            {/* QR Code */}
            {teacher.esewaQRCode ? (
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Scan QR Code to Pay
                </label>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 flex justify-center">
                  <img 
                    src={teacher.esewaQRCode} 
                    alt="eSewa QR Code" 
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Scan this QR code with your eSewa app
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  💡 No QR code available. Use the eSewa ID above to send payment.
                </p>
              </div>
            )}
          </div>

          {/* Transaction ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID / Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter eSewa transaction ID (e.g., 0012ABC123)"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can find this in your eSewa transaction history
            </p>
          </div>

          {/* Terms Agreement */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                I confirm that I have sent <strong>NPR {totalAmount}</strong> to the teacher's eSewa account 
                and the transaction ID provided above is correct. I understand that the teacher will verify 
                this payment before marking it as complete.
              </label>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>⚠️ Important:</strong> Make sure you send the payment to the correct eSewa ID shown above. 
              Double-check the transaction ID before submitting. Once submitted, you cannot edit it.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={!agreedToTerms || !transactionId.trim() || submitting || !teacher.esewaId}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Payment
                </>
              )}
            </Button>
          </div>

          {(!agreedToTerms || !transactionId.trim()) && (
            <p className="text-xs text-center text-red-600">
              Please complete all required fields and agree to the terms
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
