import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";
import { 
  TrendingUp, 
  Users, 
  Wallet,
  LogOut,
  Filter
} from "lucide-react";
import DiscoveryFeed from "../components/investor/DiscoveryFeed";
import PaperTradingPortfolio from "../components/investor/PaperTradingPortfolio";
import { initializeSocket, joinInvestorRoom, joinSignalsFeed } from "../utils/socket";

const InvestorDashboard = () => {
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("feed"); // feed or portfolio
  const [loading, setLoading] = useState(true);
  const { serverUrl } = useContext(AuthDataContext);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is investor
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.role !== "investor") {
      navigate("/login");
      return;
    }

    // Initialize Socket.io
    const socket = initializeSocket();
    joinInvestorRoom(userData._id);
    joinSignalsFeed();

    // Fetch portfolio summary
    fetchPortfolioSummary();

    return () => {
      // Cleanup if needed
    };
  }, [userData, navigate]);

  const fetchPortfolioSummary = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/investor/portfolio/summary`,
        { withCredentials: true }
      );
      setPortfolioSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast.error("Failed to load portfolio summary");
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
              <h1 className="text-2xl font-bold text-gray-900">Investor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {userData?.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Balance */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Virtual</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              ₹{portfolioSummary?.balance?.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-gray-600">Paper Trading Balance</p>
          </div>

          {/* Active Trades */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">Running</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {portfolioSummary?.activeTrades || 0}
            </h3>
            <p className="text-sm text-gray-600">Active Trades</p>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Success</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {portfolioSummary?.winRate?.toFixed(1) || 0}%
            </h3>
            <p className="text-sm text-gray-600">Win Rate</p>
          </div>

          {/* Net P&L */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                portfolioSummary?.netProfitLoss >= 0 ? "bg-green-100" : "bg-red-100"
              }`}>
                <TrendingUp className={`w-6 h-6 ${
                  portfolioSummary?.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                }`} />
              </div>
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <h3 className={`text-2xl font-bold mb-1 ${
              portfolioSummary?.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              ₹{portfolioSummary?.netProfitLoss?.toFixed(2) || 0}
            </h3>
            <p className="text-sm text-gray-600">Net P&L</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-6 py-4 font-semibold transition ${
                  activeTab === "feed"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Discovery Feed
              </button>
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`px-6 py-4 font-semibold transition ${
                  activeTab === "portfolio"
                    ? "border-b-2 border-black text-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Portfolio
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "feed" ? (
              <DiscoveryFeed />
            ) : (
              <PaperTradingPortfolio onRefresh={fetchPortfolioSummary} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
