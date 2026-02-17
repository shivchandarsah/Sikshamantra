import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import StarBackground from "@/components/StarBackground.jsx";
import useMyContext from "@/hooks/useMyContext.jsx";
import { toast } from "sonner";
import PasswordInput from "@/components/PasswordInput.jsx";
import Logo from "@/components/Logo.jsx";

export default function Registration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
  });
  const { user, auth } = useMyContext();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === "student" ? "/student/dashboard" : "/teacher/dashboard");
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const hasEmptyValues = () => Object.values(formData).some((value) => value === "");

  const checkValidation = () => {
    if (hasEmptyValues()) {
      setErrorMsg("Please fill in all fields!");
      return false;
    }

    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long!");
      return false;
    }

    // Gmail-only validation
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.email)) {
      setErrorMsg("Make sure your Gmail is correct!");
      return false;
    }

    return true;
  };

  const resetValues = () => ({
    fullName: "",
    email: "",
    password: "",
    role: "student",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checkValidation()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Register user
      const res = await auth.register(formData);

      // Save email for OTP verification
      localStorage.setItem("emailForVerification", formData.email);

      // Reset form fields
      setFormData(resetValues());

      // Show success toast
      toast.success(res.message || "Registration successful! Check your email for OTP.");

      // Redirect to OTP verification page
      navigate("/auth/verify-email");
    } catch (error) {
      const errMsg = error.response?.data?.message || "Registration failed. Try again.";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);

      // Clear messages after 5 seconds
      setTimeout(() => {
        setErrorMsg("");
        setSuccessMsg("");
      }, 5000);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-indigo-100 p-4 overflow-hidden">
      <StarBackground />

      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" showText={true} />
          </div>
          <p className="text-gray-500 text-sm">Create your account as Student or Teacher</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 text-gray-700"
          >
            <option value="student">👨‍🎓 Student</option>
            <option value="teacher">👩‍🏫 Teacher</option>
          </select>

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="w-full border rounded-lg p-2"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Gmail Address"
            className="w-full border rounded-lg p-2"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <PasswordInput
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-green-500 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
