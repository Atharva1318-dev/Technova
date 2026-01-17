import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";
import { setUserData } from "../redux/userSlice";
import { 
  Users, 
  Target, 
  Award,
  Plus,
  Activity,
  LogOut,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import SignalCreator from "../components/advisor/SignalCreator";
import ActiveTrades from "../components/advisor/ActiveTrades";
import { initializeSocket, joinAdvisorRoom } from "../utils/socket";

const AdvisorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [showSignalCreator, setShowSignalCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const { serverUrl } = useContext(AuthDataContext);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasCheckedAuth = useRef(false);

  // Initial auth check - runs once
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      // Wait a bit for UserDataContext to fetch user
      await new Promise(resolve => setTimeout(resolve, 300));
      setInitializing(false);
    };

    checkAuth();
  }, []);

  // Handle redirects based on userData
  useEffect(() => {
    if (initializing) return;

    // No user - redirect to login
    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }

    // Not an advisor
    if (userData.role !== "advisor") {
      toast.error("Only advisors can access this dashboard");
      navigate("/", { replace: true });
      return;
    }

    // Phone not verified
    if (!userData.isVerified) {
      navigate("/advisor/onboarding", { replace: true });
      return;
    }

    // Onboarding not complete
    if (!userData.verificationStatus || !["pending", "approved"].includes(userData.verificationStatus)) {
      navigate("/advisor/onboarding", { replace: true });
      return;
    }

    // All checks passed - fetch stats
    fetchStats();

    // Initialize socket
    try {
      const socket = initializeSocket();
      if (userData._id) {
        joinAdvisorRoom(userData._id);
      }
    } catch (e) {
      console.warn("Socket warning:", e.message);
    }
  }, [userData, initializing, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverUrl}/api/advisor/dashboard/stats`,
        { withCredentials: true }
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 401) {
        dispatch(setUserData(null));
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear Redux first
      dispatch(setUserData(null));
      
      // Then call API
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
      
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // No user data after initializing
  if (!userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, <span className="font-semibold">{userData?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSignalCreator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Signal
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Verification Status Banner */}
      {userData?.verificationStatus === "pending" && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 text-blue-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Application Pending Review</p>
                <p className="text-xs mt-1">Your application is under review. Signals won't be visible until approved.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {userData?.verificationStatus === "approved" && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">✓ Account Approved - Your signals are visible to investors!</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <>
            {/* Profile Info Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">SEBI Registration Number</h3>
                  <p className="text-lg font-bold text-gray-900">
                    {userData?.sebiRegistrationNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Phone Number</h3>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {userData?.phone || "Not verified"}
                    {userData?.phoneVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </p>
                </div>
                {userData?.bio && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Bio</h3>
                    <p className="text-gray-700">{userData.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stats?.subscriberCount || 0}
                </h3>
                <p className="text-sm text-gray-600">Subscribers</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stats?.totalTrades || 0}
                </h3>
                <p className="text-sm text-gray-600">Total Trades</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stats?.winRate?.toFixed(1) || 0}%
                </h3>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stats?.trustScore?.toFixed(1) || 0}/100
                </h3>
                <p className="text-sm text-gray-600">Trust Score</p>
              </div>
            </div>

            {/* P&L Summary */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 mb-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profit & Loss Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="border-l-4 border-green-500 pl-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Profit</p>
                  <p className="text-4xl font-bold text-green-600">
                    ₹{stats?.totalProfit?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Total Loss</p>
                  <p className="text-4xl font-bold text-red-600">
                    ₹{stats?.totalLoss?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Net P&L</p>
                  <p className={`text-4xl font-bold ${(stats?.netProfitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{stats?.netProfitLoss?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Signals */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Signals</h2>
                <button onClick={fetchStats} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Refresh
                </button>
              </div>
              <ActiveTrades onRefresh={fetchStats} />
            </div>
          </>
        )}
      </div>

      {/* Signal Creator Modal */}
      {showSignalCreator && (
        <SignalCreator
          onClose={() => setShowSignalCreator(false)}
          onSuccess={() => {
            setShowSignalCreator(false);
            fetchStats();
            toast.success("Signal created successfully!");
          }}
        />
      )}
    </div>
  );
};

export default AdvisorDashboard;