// frontend/src/pages/auth/ResendVerification.jsx
import { useState } from "react";
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post("/users/resend-verification-email", { email });
      toast.success(res.data.message || "Verification OTP resent!");

      // Store email locally for verification page
      localStorage.setItem("emailForVerification", email);

      // Redirect to verification page
      navigate(`/auth/verify-email?token=`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Resend Verification OTP</h1>
        <form onSubmit={handleResend} className="flex flex-col gap-3 w-full max-w-sm mx-auto">
          <input
            type="email"
            required
            placeholder="Enter your Gmail"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
          >
            {loading ? "Sending..." : "Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
