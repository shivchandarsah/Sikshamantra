// frontend/src/pages/Login.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import useMyContext from "@/hooks/useMyContext.jsx";
import StarBackground from "@/components/StarBackground.jsx";
import PasswordInput from "@/components/PasswordInput.jsx";
import Logo from "@/components/Logo.jsx";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { user, userLoaded, initialized, auth } = useMyContext(); // ✅ includes initialized to wait for auth state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Show success message from password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMsg(""), 5000);
    }
  }, [location.state]);

  // ---------------- Redirect after successful login ----------------
  useEffect(() => {
    if (initialized && userLoaded && user) {
      // ✅ Clear form fields before redirect
      setFormData({
        email: "",
        password: "",
      });
      
      let route;
      switch (user.role) {
        case "student":
          route = "/student/dashboard";
          break;
        case "teacher":
          route = "/teacher/dashboard";
          break;
        case "admin":
          route = "/admin/dashboard";
          break;
        default:
          route = "/auth/login";
      }
      navigate(route, { replace: true });
    }
  }, [user, userLoaded, initialized, navigate]);

  // ---------------- Cleanup form on component unmount ----------------
  useEffect(() => {
    return () => {
      // ✅ Clear form fields when component unmounts
      setFormData({
        email: "",
        password: "",
      });
      setErrorMsg("");
      setSuccessMsg("");
    };
  }, []);

  // ---------------- Form Handlers ----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const loggedUser = await auth.login(formData.email, formData.password);

      if (loggedUser) {
        setSuccessMsg("Login successful! Redirecting...");
        
        // ✅ Clear form fields after successful login
        setFormData({
          email: "",
          password: "",
        });
        
        // ✅ Navigation will be handled by useEffect when user state updates
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
        (error.response?.status === 403
          ? "Please verify your email with the OTP sent to your email first."
          : error.response?.status === 401
          ? "Incorrect password."
          : "User with this email does not exist!")
      );
    } finally {
      setLoading(false);

      // Clear messages after 3s (reduced time)
      setTimeout(() => {
        setErrorMsg("");
        setSuccessMsg("");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-indigo-100 p-4 relative overflow-hidden">
      <StarBackground />

      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" showText={true} />
          </div>
          <p className="text-gray-500 text-sm">
            A place for Teachers & Students to grow together
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded-lg p-2"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <PasswordInput
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          <p className="text-sm text-right mt-1 text-gray-600">
            <Link to="/auth/forgot-password" className="text-green-500 underline">
              Forgot Password?
            </Link>
          </p>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Don’t have an account?{" "}
          <Link to="/auth/register" className="text-green-500 underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
