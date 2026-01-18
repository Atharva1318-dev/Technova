import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { Lock, Mail, User, UserCircle, TrendingUp, Sparkles } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase.js";

import Navbar from "./Navbar";

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

  // --- LOGIC STARTS HERE (UNCHANGED) ---
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

      const user = res.data.user;
      if (user.role === "advisor") {
        navigate("/advisor/onboarding");
      } else if (user.role === "investor") {
        navigate("/investor/dashboard");
      } else {
        navigate("/");
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
        { name, email },
        { withCredentials: true }
      );

      if (res.data.requiresRole) {
        sessionStorage.setItem("pendingGoogleAuth", JSON.stringify({ name, email }));
        navigate("/role-selection");
        return;
      }

      dispatch(setUserData(res.data.user));
      toast.success("Google Sign-In Successful");

      if (res.data.user.role === "advisor") {
        if (!res.data.user.isVerified) {
          navigate("/advisor/onboarding");
        } else {
          navigate("/advisor/dashboard");
        }
      } else if (res.data.user.role === "investor") {
        navigate("/investor/dashboard");
      } else if (res.data.user.role === "admin") {
        navigate("/admin/panel");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Google Sign-In Failed", error);
      toast.error("Google Sign-In Failed");
    }
  };
  // --- LOGIC ENDS HERE ---

  return (
    // Main Container with Top Padding for Navbar
    <div className="min-h-screen bg-neutral-950 flex justify-center items-center px-4 pt-24 md:pt-32 relative overflow-hidden font-sans selection:bg-blue-500/30">
      <Navbar />
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-neutral-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 mb-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-4 text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-neutral-400 text-sm mt-2">Join Technova to start your trading journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* Role Selector */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            I am an
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("investor")}
              className={`p-3 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group ${role === "investor"
                ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:border-white/20"
                }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <UserCircle className={`w-5 h-5 ${role === "investor" ? "text-blue-400" : "text-neutral-500 group-hover:text-neutral-300"}`} />
                <span className="font-semibold text-sm">Investor</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole("advisor")}
              className={`p-3 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group ${role === "advisor"
                ? "border-purple-500 bg-purple-500/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                : "border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:border-white/20"
                }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                <TrendingUp className={`w-5 h-5 ${role === "advisor" ? "text-purple-400" : "text-neutral-500 group-hover:text-neutral-300"}`} />
                <span className="font-semibold text-sm">Advisor</span>
              </div>
            </button>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="relative group">
            <User className="absolute left-3 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-950/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-950/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-950/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 text-sm mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs text-neutral-500 font-medium uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Google Auth */}
        <button
          onClick={handleGoogleAuth}
          className="w-full py-3 border border-white/10 bg-white/5 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm font-medium text-white group"
        >
          <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Sign up with Google
        </button>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-white font-semibold hover:text-blue-400 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}