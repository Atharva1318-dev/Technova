import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, Award, Target, Shield, ChevronLeft, ChevronRight, Users, Activity, BarChart3 } from "lucide-react";
import { onNewSignal, onSignalClosed } from "../../utils/socket";

const DashboardPage = () => {
  const [signals, setSignals] = useState([]);
  const [topAdvisors, setTopAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdvisorIndex, setCurrentAdvisorIndex] = useState(0);
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchSignals();
    fetchTopAdvisors();

    // Real-time updates
    const handleNewSignal = (signal) => {
      setSignals((prev) => [signal, ...prev]);
    };

    const handleSignalClosed = ({ tradeId }) => {
      setSignals((prev) => prev.filter((s) => s.tradeId !== tradeId));
    };

    onNewSignal(handleNewSignal);
    onSignalClosed(handleSignalClosed);

    // Auto-scroll advisors every 3 seconds
    const interval = setInterval(() => {
      setCurrentAdvisorIndex((prev) => 
        prev >= topAdvisors.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [topAdvisors.length]);

  const fetchSignals = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/trade/signals`,
        { withCredentials: true }
      );
      setSignals(response.data.signals);
    } catch (error) {
      console.error("Error fetching signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopAdvisors = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/advisor/all?sortBy=trustScore`,
        { withCredentials: true }
      );
      setTopAdvisors(response.data.advisors.slice(0, 10));
    } catch (error) {
      console.error("Error fetching advisors:", error);
    }
  };

  const handleFollow = async (tradeId) => {
    const quantity = prompt("Enter quantity to trade:");
    if (!quantity || isNaN(quantity)) {
      toast.error("Invalid quantity");
      return;
    }

    try {
      await axios.post(
        `${serverUrl}/api/investor/paper-trade/follow`,
        { tradeId, quantity: parseFloat(quantity) },
        { withCredentials: true }
      );
      toast.success("Signal followed successfully!");
    } catch (error) {
      console.error("Error following signal:", error);
      toast.error(error.response?.data?.message || "Failed to follow signal");
    }
  };

  const nextAdvisor = () => {
    setCurrentAdvisorIndex((prev) => 
      prev >= topAdvisors.length - 1 ? 0 : prev + 1
    );
  };

  const prevAdvisor = () => {
    setCurrentAdvisorIndex((prev) => 
      prev <= 0 ? topAdvisors.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077b6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Investor Dashboard</h1>
        <p className="text-gray-600 mt-2">Real-time signals from verified SEBI advisors</p>
      </div>

      {/* Top Advisors Carousel - Darker Blue/Purple Shades */}
      <div className="bg-gradient-to-r from-[#0056b3] to-[#6d28d9] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Top Performing Advisors</h2>
              <p className="text-sm text-white/90 mt-1">Based on Trust Score & Win Rate</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevAdvisor}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextAdvisor}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {topAdvisors.length > 0 ? (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-8 border border-white/25 shadow-lg">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-white/30 to-white/15 border-2 border-white/40 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {topAdvisors[currentAdvisorIndex]?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{topAdvisors[currentAdvisorIndex]?.name}</h3>
                <p className="text-sm text-white/90 flex items-center gap-2 mt-2">
                  <Shield className="w-4 h-4" />
                  SEBI Registered Advisor
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">{topAdvisors[currentAdvisorIndex]?.trustScore || 0}</div>
                <p className="text-sm text-white/90">Trust Score</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white/15 border border-white/25 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-emerald-300" />
                  <p className="text-sm text-white/90">Win Rate</p>
                </div>
                <p className="text-2xl font-bold text-white">{topAdvisors[currentAdvisorIndex]?.winRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="bg-white/15 border border-white/25 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-sky-300" />
                  <p className="text-sm text-white/90">Total Trades</p>
                </div>
                <p className="text-2xl font-bold text-white">{topAdvisors[currentAdvisorIndex]?.totalTrades || 0}</p>
              </div>
              <div className="bg-white/15 border border-white/25 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-violet-300" />
                  <p className="text-sm text-white/90">Subscribers</p>
                </div>
                <p className="text-2xl font-bold text-white">{topAdvisors[currentAdvisorIndex]?.subscriberCount || 0}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-center mt-8">
              {topAdvisors.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentAdvisorIndex ? "w-12 bg-white shadow-lg" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-white/90 bg-white/15 rounded-2xl border border-white/25">
            <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white/90" />
            </div>
            <p className="text-lg font-medium">No advisors available yet</p>
            <p className="text-sm mt-2">Advisors will appear after verification</p>
          </div>
        )}
      </div>

      {/* Active & Pending Signals */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0056b3] to-[#6d28d9] rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live Trading Signals</h2>
              <p className="text-gray-700 text-sm mt-1">Real-time signals from trusted advisors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-md shadow-emerald-500/50"></div>
            <span className="text-sm font-medium text-gray-700">Live Updates</span>
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-300 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <TrendingUp className="w-10 h-10 text-[#0056b3]" />
            </div>
            <p className="text-gray-800 font-semibold text-lg mb-2">No active signals</p>
            <p className="text-gray-700 max-w-md mx-auto">
              New signals from SEBI-registered advisors will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {signals.map((signal) => (
              <div
                key={signal._id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300 hover:shadow-blue-100"
              >
                {/* Advisor Info */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0056b3] to-[#6d28d9] rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {signal.advisorId?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {signal.advisorId?.name || "Advisor"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-gray-800">
                            {signal.advisorId?.trustScore || 0}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-gray-400"></div>
                        <span className="text-sm font-medium text-gray-800">
                          {signal.advisorId?.winRate?.toFixed(1) || 0}% Win Rate
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      signal.riskLevel === "low"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : signal.riskLevel === "medium"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {signal.riskLevel?.toUpperCase()} RISK
                  </span>
                </div>

                {/* Signal Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-700 mb-1">Symbol</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900">{signal.symbol}</p>
                        <p className="text-sm text-gray-700 capitalize px-3 py-1 bg-gray-200 rounded-full">
                          {signal.assetClass}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-5 py-3 rounded-xl ${
                        signal.direction === "buy"
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/30"
                          : "bg-gradient-to-r from-rose-600 to-rose-700 shadow-lg shadow-rose-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {signal.direction === "buy" ? (
                          <TrendingUp className="w-6 h-6 text-white" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-white" />
                        )}
                        <span className="font-bold text-lg text-white">
                          {signal.direction.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4">
                      <p className="text-xs text-blue-800 mb-2 font-medium">Entry Price</p>
                      <p className="text-xl font-bold text-gray-900">₹{signal.entryPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-xl p-4">
                      <p className="text-xs text-rose-800 mb-2 font-medium flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Stop Loss
                      </p>
                      <p className="text-xl font-bold text-rose-700">₹{signal.stopLoss.toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-4">
                      <p className="text-xs text-emerald-800 mb-2 font-medium flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Target
                      </p>
                      <p className="text-xl font-bold text-emerald-700">₹{signal.target.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleFollow(signal.tradeId)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#0056b3] to-[#6d28d9] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#0056b3]/30 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Follow Signal
                </button>

                {/* Footer */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {signal.followers || 0} investors following
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(signal.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;