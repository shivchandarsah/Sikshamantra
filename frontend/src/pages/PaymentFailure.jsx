// Payment Failure Page
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const txnId = searchParams.get('txnId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Failed
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your payment could not be processed. This might be due to:
        </p>

        <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Payment was cancelled</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Insufficient balance in eSewa account</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Network connection issue</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>Technical error during transaction</span>
            </li>
          </ul>
        </div>

        {txnId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 mb-1">Transaction ID:</p>
            <p className="font-mono text-sm text-gray-800">{txnId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={() => navigate(-1)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => navigate('/student/dashboard')}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Need help?</p>
          <p className="text-xs text-gray-500">
            Contact support at{' '}
            <a href="mailto:support@sikshamantra.com" className="text-green-600 hover:underline">
              support@sikshamantra.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
