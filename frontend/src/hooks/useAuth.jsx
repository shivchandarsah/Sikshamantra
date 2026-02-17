import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";
import { connectSocket, disconnectSocket, setAuthenticationStatus } from "@/utils/socket.js";

// ================= CREATE CONTEXT =================
const AuthContext = createContext();

// ================= AUTH PROVIDER =================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ---------------- CHECK AUTH STATUS ----------------
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Quick token check first - don't make API call if no token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        setUser(null);
        setAuthenticationStatus(false);
        setLoading(false);
        setInitialized(true);
        return null;
      }

      // ✅ Only make API call if token exists
      const res = await axiosInstance.get("/users/me", {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      });

      const currentUser = res.data.user || res.data.data || null;
      setUser(currentUser);
      
      // ✅ Set authentication status and connect WebSocket
      if (currentUser) {
        setAuthenticationStatus(true, currentUser);
        try {
          setTimeout(() => connectSocket(), 100);
        } catch (socketError) {
          console.error('❌ Failed to connect WebSocket:', socketError);
        }
      } else {
        setAuthenticationStatus(false);
      }
      
      return currentUser;
    } catch (error) {
      // Only log non-401 errors
      if (error.response?.status !== 401) {
        console.error("Auth check failed:", error);
      }
      setUser(null);
      setAuthenticationStatus(false);
      return null;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // Initialize auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // ---------------- LOGIN ----------------
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/users/login", { email, password }, {
        withCredentials: true
      });

      // Wait a moment for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if cookies were set
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
      
      // Get user data from response instead of making another API call
      const currentUser = res.data.data || res.data.user || null;
      setUser(currentUser);
      setInitialized(true);
      
      // ✅ Set authentication status and connect WebSocket
      if (currentUser) {
        setAuthenticationStatus(true, currentUser);
        try {
          connectSocket();
        } catch (socketError) {
          console.error('❌ Failed to connect WebSocket:', socketError);
        }
      } else {
        setAuthenticationStatus(false);
      }
      
      toast.success("Login successful!");
      return currentUser;
    } catch (error) {
      console.error("Login error:", error.response?.data);
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    setLoading(true);
    try {
      await axiosInstance.post("/users/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear cookies manually as fallback
      document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // ✅ Set authentication status and disconnect WebSocket
      setAuthenticationStatus(false);
      disconnectSocket();
      
      setUser(null);
      setLoading(false);
      window.location.href = "/auth/login";
    }
  };

  // ---------------- REGISTER ----------------
  const register = async (credentials) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/users/register", credentials);
      toast.success(res.data.message || "Registration successful! Check your email for OTP.");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY OTP ----------------
  const verifyOTP = async ({ email, otp }) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/users/verify-email", { email, otp });
      toast.success(res.data.message || "Email verified successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RESEND OTP ----------------
  const resendOTP = async (email) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/users/resend-verification-email", { email });
      toast.success(res.data.message || "OTP resent successfully!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Resend OTP failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FORGOT PASSWORD ----------------
  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/users/forgot-password", { email });
      toast.success(res.data.message || "Password reset link sent to email");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RESET PASSWORD ----------------
  const resetPassword = async (token, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.put(`/users/reset-password/${token}`, { password });
      toast.success(res.data.message || "Password reset successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REFRESH USER DATA ----------------
  const refreshUser = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/users/me", {
        withCredentials: true,
        timeout: 5000
      });

      const currentUser = res.data.user || res.data.data || null;
      
      // Update user state
      setUser(currentUser);
      
      console.log('✅ User data refreshed:', {
        userId: currentUser?._id,
        hasEsewaId: !!currentUser?.esewaId,
        hasQRCode: !!currentUser?.esewaQRCode
      });
      
      return currentUser;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
        checkAuthStatus,
        refreshUser,
        login,
        logout,
        register,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= NAMED HOOK =================
export const useAuth = () => useContext(AuthContext);

// ✅ Default export for better HMR compatibility
const useAuthHook = () => useContext(AuthContext);
export default useAuthHook;
