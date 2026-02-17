// frontend/src/pages/auth/ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StarBackground from "@/components/StarBackground.jsx";
import useMyContext from "@/hooks/useMyContext.jsx";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Logo from "@/components/Logo.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { auth } = useMyContext();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMsg("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid Gmail address");
      return;
    }

    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await auth.forgotPassword(email);
      setSuccessMsg("Password reset email sent! Check your Gmail inbox and spam folder.");
      setEmailSent(true);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to send reset email. Please try again.";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
      
      // Clear messages after 10 seconds
      setTimeout(() => {
        setErrorMsg("");
        if (!emailSent) setSuccessMsg("");
      }, 10000);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      await auth.forgotPassword(email);
      setSuccessMsg("Reset email sent again! Please check your inbox.");
    } catch (error) {
      setErrorMsg("Failed to resend email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-indigo-100 p-4 relative overflow-hidden">
        <StarBackground />

        <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-700">Email Sent!</h1>
            <p className="text-gray-500 text-sm mt-2">
              We've sent a password reset link to your email
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-green-700 text-sm font-medium">Check your email</p>
                  <p className="text-green-600 text-sm mt-1">
                    We sent a reset link to <strong>{email}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>• Check your spam/junk folder if you don't see the email</p>
              <p>• The reset link will expire in 10 minutes</p>
              <p>• Click the link in the email to reset your password</p>
            </div>

            {successMsg && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">{successMsg}</p>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend Email"}
              </button>

              <button
                onClick={() => navigate("/auth/login")}
                className="w-full bg-gray-100 text-gray-700 rounded-lg p-2 hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-indigo-100 p-4 relative overflow-hidden">
      <StarBackground />

      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" showText={true} />
          </div>
          <p className="text-gray-500 text-sm">
            Enter your Gmail to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Enter your Gmail address"
              className="w-full border rounded-lg p-2 pl-10 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">{successMsg}</p>
            </div>
          )}
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <Link 
              to="/auth/login" 
              className="text-green-500 underline hover:text-green-600 text-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-green-500 underline hover:text-green-600">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
