import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPasswordRedirect() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the correct auth route
    if (token) {
      navigate(`/auth/reset-password/${token}`, { replace: true });
    } else {
      // If no token, redirect to forgot password page
      navigate('/auth/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-indigo-100">
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to the password reset page.</p>
      </div>
    </div>
  );
}