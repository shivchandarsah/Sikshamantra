import { useState, useEffect } from "react";
import { CreditCard, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PaymentSetupBanner({ user }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user is teacher and hasn't set up payment details
    if (user && user.role === 'teacher') {
      const hasPaymentDetails = !!(user.esewaId || user.esewaQRCode);
      
      console.log('🔍 PaymentSetupBanner check:', {
        hasEsewaId: !!user.esewaId,
        hasQRCode: !!user.esewaQRCode,
        hasPaymentDetails,
        esewaId: user.esewaId,
        qrCodeLength: user.esewaQRCode?.length
      });
      
      // If payment details exist, clear the dismissed flag and hide banner
      if (hasPaymentDetails) {
        localStorage.removeItem('paymentSetupBannerDismissed');
        setShow(false);
        setDismissed(false);
      }
      // Show banner if no payment details and not dismissed
      else {
        const wasDismissed = localStorage.getItem('paymentSetupBannerDismissed');
        if (!wasDismissed) {
          setShow(true);
          setDismissed(false);
        } else {
          setShow(false);
        }
      }
    } else {
      setShow(false);
    }
  }, [user, user?.esewaId, user?.esewaQRCode]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    // Remember dismissal for this session
    localStorage.setItem('paymentSetupBannerDismissed', 'true');
  };

  const handleSetup = () => {
    navigate('/teacher/payment-settings');
  };

  if (!show || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-lg p-4 mb-6 shadow-md animate-in slide-in-from-top duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-orange-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Set Up Payment Details
          </h3>
          <p className="text-gray-700 mb-3">
            Before you can receive payments from students, please configure your eSewa payment details. 
            This will allow students to pay you directly after completing meetings.
          </p>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSetup}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              Set Up Now
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800"
            >
              Remind Me Later
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
