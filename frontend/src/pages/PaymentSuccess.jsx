// Payment Success Page
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import paymentService from '@/utils/services/paymentService';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const oid = searchParams.get('oid');
      const amt = searchParams.get('amt');
      const refId = searchParams.get('refId');

      if (!oid || !amt || !refId) {
        setError('Invalid payment parameters');
        setVerifying(false);
        return;
      }

      const response = await paymentService.verifyPayment({ oid, amt, refId });
      
      if (response.success) {
        setPayment(response.data);
      } else {
        setError(response.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    if (payment?.purpose === 'course') {
      navigate('/student/courses');
    } else if (payment?.purpose === 'consultation') {
      navigate('/student/appointments');
    } else {
      navigate('/student/dashboard');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment with eSewa
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Payment Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/student/dashboard')}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600">
            Your payment has been processed successfully
          </p>
        </div>

        {payment && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-semibold text-gray-800">
                  {payment.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-green-600">
                  NPR {payment.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purpose:</span>
                <span className="font-semibold text-gray-800 capitalize">
                  {payment.purpose}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {payment.status}
                </span>
              </div>
              {payment.esewaRefId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">eSewa Ref:</span>
                  <span className="font-semibold text-gray-800">
                    {payment.esewaRefId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            onClick={() => navigate('/student/payments')}
            variant="outline"
            className="w-full"
          >
            View Payment History
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          A confirmation email has been sent to your registered email address
        </p>
      </div>
    </div>
  );
}
