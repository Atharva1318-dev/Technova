import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle, TrendingUp } from "lucide-react";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);
  const navigate = useNavigate();
  const { serverUrl } = useContext(AuthDataContext);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if there's pending Google auth
    const pending = sessionStorage.getItem("pendingGoogleAuth");
    if (pending) {
      setPendingAuth(JSON.parse(pending));
    } else {
      // No pending auth, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  const handleContinue = async () => {
    if (!selectedRole || !pendingAuth) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/google`,
        { 
          name: pendingAuth.name, 
          email: pendingAuth.email,
          role: selectedRole 
        },
        { withCredentials: true }
      );

      dispatch(setUserData(res.data.user));
      sessionStorage.removeItem("pendingGoogleAuth");
      toast.success("Account created successfully!");

      // Redirect based on role
      if (selectedRole === "advisor") {
        navigate("/advisor/onboarding");
      } else if (selectedRole === "investor") {
        navigate("/investor/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to Technova
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Investor Card */}
          <button
            onClick={() => setSelectedRole("investor")}
            className={`p-8 rounded-2xl border-2 transition-all duration-200 text-left ${
              selectedRole === "investor"
                ? "border-black bg-black text-white shadow-xl scale-105"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`p-3 rounded-xl ${
                  selectedRole === "investor"
                    ? "bg-white/20"
                    : "bg-gray-100"
                }`}
              >
                <UserCircle
                  className={`w-8 h-8 ${
                    selectedRole === "investor"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                />
              </div>
              <h2 className="text-2xl font-bold">Investor</h2>
            </div>
            <p
              className={`text-sm mb-4 ${
                selectedRole === "investor"
                  ? "text-white/80"
                  : "text-gray-600"
              }`}
            >
              Follow expert advisors, practice with paper trading, and learn
              from verified signals.
            </p>
            <ul
              className={`space-y-2 text-sm ${
                selectedRole === "investor"
                  ? "text-white/90"
                  : "text-gray-700"
              }`}
            >
              <li>✓ Discover verified advisors</li>
              <li>✓ Paper trading portfolio</li>
              <li>✓ Real-time signal updates</li>
              <li>✓ Blockchain verification</li>
            </ul>
          </button>

          {/* Advisor Card */}
          <button
            onClick={() => setSelectedRole("advisor")}
            className={`p-8 rounded-2xl border-2 transition-all duration-200 text-left ${
              selectedRole === "advisor"
                ? "border-black bg-black text-white shadow-xl scale-105"
                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`p-3 rounded-xl ${
                  selectedRole === "advisor"
                    ? "bg-white/20"
                    : "bg-gray-100"
                }`}
              >
                <TrendingUp
                  className={`w-8 h-8 ${
                    selectedRole === "advisor"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                />
              </div>
              <h2 className="text-2xl font-bold">Advisor</h2>
            </div>
            <p
              className={`text-sm mb-4 ${
                selectedRole === "advisor"
                  ? "text-white/80"
                  : "text-gray-600"
              }`}
            >
              Share trading signals, build your reputation, and grow your
              subscriber base with blockchain transparency.
            </p>
            <ul
              className={`space-y-2 text-sm ${
                selectedRole === "advisor"
                  ? "text-white/90"
                  : "text-gray-700"
              }`}
            >
              <li>✓ Create trading signals</li>
              <li>✓ Build trust score</li>
              <li>✓ Manage active trades</li>
              <li>✓ Blockchain-verified history</li>
            </ul>
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue as {selectedRole || "..."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
