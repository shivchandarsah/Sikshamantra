import { Link, useLocation } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-lg">
        <div className="mb-6">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full bg-green-600 text-white rounded-lg p-3 hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 rounded-lg p-3 hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>If you clicked a reset password link, please check:</p>
          <ul className="text-left mt-2 space-y-1">
            <li>• The link format should be: /auth/reset-password/[token]</li>
            <li>• The token hasn't expired (10 minutes)</li>
            <li>• You're on the correct domain</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;