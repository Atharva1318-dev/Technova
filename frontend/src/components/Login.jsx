import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, UserCircle, TrendingUp } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("investor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleSignIn, checkUserExists } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }
    try {
      // Check if user exists before attempting login
      const userCheck = await checkUserExists(email);
      if (!userCheck.exists) {
        setError("Account not found. Please sign up first.");
        toast.error("Account not found. Please sign up first.");
        setLoading(false);
        return;
      }

      const res = await login(email, password);
      toast.success("Login Successful");
      
      // Redirect based on user's actual role
      const user = res.user;
      if (user.role === "advisor") {
        if (!user.isVerified) {
          navigate("/advisor/onboarding");
        } else {
          navigate("/advisor/dashboard");
        }
      } else if (user.role === "investor") {
        navigate("/investor/dashboard");
      } else if (user.role === "admin") {
        navigate("/admin/panel");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error("Login Failed");
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const res = await googleSignIn();
      
      // Check if role selection is required (new user)
      if (res.requiresRole) {
        // Store user data temporarily and redirect to role selection
        sessionStorage.setItem("pendingGoogleAuth", JSON.stringify(res.pendingAuth));
        navigate("/role-selection");
        return;
      }
      
      toast.success("Google Sign-In Successful");
      
      // Redirect based on role
      if (res.user.role === "advisor") {
        if (!res.user.isVerified) {
          navigate("/advisor/onboarding");
        } else {
          navigate("/advisor/dashboard");
        }
      } else if (res.user.role === "investor") {
        navigate("/investor/dashboard");
      } else if (res.user.role === "admin") {
        navigate("/admin/panel");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Google Sign-In Failed", error);
      toast.error("Google Sign-In Failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Role Selector (Visual Only) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Login as:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole("investor")}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedRole === "investor"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                <span className="font-semibold text-sm">Investor</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("advisor")}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedRole === "advisor"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold text-sm">Advisor</span>
              </div>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: You'll be redirected based on your account type
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition disabled:opacity-50 text-sm"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          <FcGoogle className="w-4 h-4" />
          Sign in with Google
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-black font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
