import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  Plus,
  Activity,
  LogOut
} from "lucide-react";
import SignalCreator from "../components/advisor/SignalCreator";
import ActiveTrades from "../components/advisor/ActiveTrades";
import { initializeSocket, joinAdvisorRoom } from "../utils/socket";

const AdvisorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [showSignalCreator, setShowSignalCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const { serverUrl } = useContext(AuthDataContext);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is advisor
    if (!userData || userData.role !== "advisor") {
      navigate("/login");
      return;
    }

    // Check if advisor is verified
    if (!userData.isVerified) {
      navigate("/advisor/onboarding");
      return;
    }

    // Initialize Socket.io
    const socket = initializeSocket();
    joinAdvisorRoom(userData._id);

    // Fetch dashboard stats
    fetchStats();

    return () => {
      // Cleanup if needed
    };
  }, [userData, navigate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/advisor/dashboard/stats`,
        { withCredentials: true }
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {userData?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSignalCreator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition"
              >
                <Plus className="w-4 h-4" />
                Create Signal
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Subscribers */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.subscriberCount || 0}
            </h3>
            <p className="text-sm text-gray-600">Subscribers</p>
          </div>

          {/* Total Trades */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">All Time</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.totalTrades || 0}
            </h3>
            <p className="text-sm text-gray-600">Total Trades</p>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Success</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.winRate?.toFixed(1) || 0}%
            </h3>
            <p className="text-sm text-gray-600">Win Rate</p>
          </div>

          {/* Trust Score */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-xs text-gray-500">Rating</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.trustScore || 0}/100
            </h3>
            <p className="text-sm text-gray-600">Trust Score</p>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Profit & Loss Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{stats?.totalProfit?.toFixed(2) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Loss</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{stats?.totalLoss?.toFixed(2) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Net P&L</p>
              <p className={`text-2xl font-bold ${
                stats?.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ₹{stats?.netProfitLoss?.toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Active Trades */}
        <ActiveTrades onRefresh={fetchStats} />
      </div>

      {/* Signal Creator Modal */}
      {showSignalCreator && (
        <SignalCreator
          onClose={() => setShowSignalCreator(false)}
          onSuccess={() => {
            setShowSignalCreator(false);
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default AdvisorDashboard;
