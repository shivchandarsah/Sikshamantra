// frontend/src/pages/auth/VerifyEmail.jsx
import { useState, useEffect } from "react";
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const storedEmail = localStorage.getItem("emailForVerification") || "";
  const [email, setEmail] = useState(storedEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no email found, redirect to registration page
    if (!email) {
      toast.error("No email found. Please register first.");
      navigate("/auth/register");
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      return toast.error("Email and OTP are required");
    }

    setLoading(true);

    try {
      // Call backend API to verify OTP
      const res = await axiosInstance.post("/users/verify-email", { email, otp });

      toast.success(res.data.message || "Email verified successfully!");

      // Remove stored email from localStorage
      localStorage.removeItem("emailForVerification");

      // Auto redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("OTP verification failed", error);
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verify Email with OTP</h1>
        <p className="mb-4 text-gray-600">
          Enter the 6-digit OTP sent to your email: <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className="border p-2 rounded"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          Didn't receive OTP?{" "}
          <a href="/auth/resend-verification" className="text-blue-500 underline">
            Resend OTP
          </a>
        </p>
      </div>
    </div>
  );
}
