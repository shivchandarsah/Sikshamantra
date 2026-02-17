// Payment Button Component
import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import paymentService from '@/utils/services/paymentService';
import { toast } from 'sonner';

export default function PaymentButton({ 
  amount, 
  purpose, 
  purposeId, 
  metadata = {},
  buttonText = 'Pay with eSewa',
  className = '',
  onSuccess,
  onError
}) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setLoading(true);

    try {
      // Initiate payment
      const response = await paymentService.initiatePayment({
        amount,
        purpose,
        purposeId,
        metadata
      });

      if (response.success) {
        // Redirect to eSewa
        paymentService.redirectToEsewa(
          response.data.esewaData,
          response.data.paymentUrl
        );
      } else {
        toast.error(response.message || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
      if (onError) onError(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={`bg-green-600 hover:bg-green-700 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
