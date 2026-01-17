import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { Lock, Mail, User, UserCircle, TrendingUp } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase.js";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("investor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { serverUrl } = useContext(AuthDataContext);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!name || !email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { name, email, password, role },
        { withCredentials: true }
      );
      dispatch(setUserData(res.data.user));
      toast.success("Signup Successful");
      
      // Redirect based on role
      if (role === "advisor") {
        navigate("/advisor/onboarding");
      } else {
        navigate("/investor/dashboard");
      }
    } catch (err) {
      toast.error("Signup Failed");
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const name = user.displayName;
      const email = user.email;
      
      const res = await axios.post(
        `${serverUrl}/api/auth/google`,
        { name, email, role },
        { withCredentials: true }
      );
      
      dispatch(setUserData(res.data.user));
      toast.success("Google Sign-Up Successful");
      
      // Redirect based on role
      if (role === "advisor") {
        navigate("/advisor/onboarding");
      } else {
        navigate("/investor/dashboard");
      }
    } catch (error) {
      console.error("Google Sign-Up Failed", error);
      toast.error("Google Sign-Up Failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Sign up to get started</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I want to sign up as:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("investor")}
              className={`p-4 rounded-lg border-2 transition text-left ${
                role === "investor"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <UserCircle className="w-5 h-5" />
                <span className="font-semibold">Investor</span>
              </div>
              <p className={`text-xs ${role === "investor" ? "text-white/80" : "text-gray-500"}`}>
                Follow signals & paper trade
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole("advisor")}
              className={`p-4 rounded-lg border-2 transition text-left ${
                role === "advisor"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Advisor</span>
              </div>
              <p className={`text-xs ${role === "advisor" ? "text-white/80" : "text-gray-500"}`}>
                Share trading signals
              </p>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black transition"
            />
          </div>

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
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleAuth}
          className="w-full py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          <FcGoogle className="w-4 h-4" />
          Sign up with Google
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-black font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
