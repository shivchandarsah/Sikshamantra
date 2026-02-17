// frontend/src/pages/auth/ResetPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StarBackground from "@/components/StarBackground.jsx";
import useMyContext from "@/hooks/useMyContext.jsx";
import PasswordInput from "@/components/PasswordInput.jsx";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tokenValid, setTokenValid] = useState(true);
  const { auth } = useMyContext();
  const { token } = useParams(); // from /auth/reset-password/:token
  const navigate = useNavigate();

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setErrorMsg("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long!");
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tokenValid) return;
    if (!validatePassword()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await auth.resetPassword(token, password);
      setSuccessMsg("Password reset successful! Redirecting to login...");
      
      // Clear form
      setPassword("");
      setConfirmPassword("");
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/auth/login", { 
          state: { message: "Password reset successful! You can now login with your new password." }
        });
      }, 3000);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to reset password. Please try again.";
      setErrorMsg(errMsg);
      
      // If token is invalid/expired, suggest requesting new reset
      if (errMsg.includes("Invalid") || errMsg.includes("expired")) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-indigo-100 p-4 relative overflow-hidden">
        <StarBackground />

        <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-red-600">Invalid Reset Link</h1>
            <p className="text-gray-500 text-sm mt-2">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">
                {errorMsg || "The reset link you clicked is invalid or has expired. Please request a new password reset."}
              </p>
            </div>

            <button
              onClick={() => navigate("/auth/forgot-password")}
              className="w-full bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 transition"
            >
              Request New Reset Link
            </button>

            <p className="text-sm text-center text-gray-600">
              Or{" "}
              <button
                onClick={() => navigate("/auth/login")}
                className="text-green-500 underline hover:text-green-600"
              >
                Back to Login
              </button>
            </p>
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
          <h1 className="text-2xl font-bold text-green-700">Reset Password</h1>
          <p className="text-gray-500 text-sm">
            Enter your new password to reset your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            name="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <PasswordInput
            name="confirmPassword"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

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
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Remembered your password?{" "}
          <button
            onClick={() => navigate("/auth/login")}
            className="text-green-500 underline hover:text-green-600"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
