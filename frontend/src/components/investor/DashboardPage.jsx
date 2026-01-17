import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, Award, Target, Shield, ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of active signals and top advisors</p>
      </div>

      {/* Top Advisors Carousel */}
      <div className="bg-gradient-to-r from-[#0077b6] to-[#00b4d8] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🏆 Top Performing Advisors</h2>
          <div className="flex gap-2">
            <button
              onClick={prevAdvisor}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextAdvisor}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {topAdvisors.length > 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {topAdvisors[currentAdvisorIndex]?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{topAdvisors[currentAdvisorIndex]?.name}</h3>
                <p className="text-sm text-white/80">SEBI Registered Advisor</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{topAdvisors[currentAdvisorIndex]?.trustScore || 0}</div>
                <p className="text-xs text-white/80">Trust Score</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Win Rate</p>
                <p className="text-lg font-bold">{topAdvisors[currentAdvisorIndex]?.winRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Total Trades</p>
                <p className="text-lg font-bold">{topAdvisors[currentAdvisorIndex]?.totalTrades || 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">Subscribers</p>
                <p className="text-lg font-bold">{topAdvisors[currentAdvisorIndex]?.subscriberCount || 0}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-center mt-4">
              {topAdvisors.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentAdvisorIndex ? "w-8 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/70">
            No advisors available yet
          </div>
        )}
      </div>

      {/* Active & Pending Signals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Live Trading Signals</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No active signals</p>
            <p className="text-sm text-gray-500">
              New signals from advisors will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {signals.map((signal) => (
              <div
                key={signal._id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-[#0077b6]"
              >
                {/* Advisor Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0077b6] to-[#00b4d8] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {signal.advisorId?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {signal.advisorId?.name || "Advisor"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Award className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          {signal.advisorId?.trustScore || 0}/100
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          {signal.advisorId?.winRate?.toFixed(1) || 0}% Win
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      signal.riskLevel === "low"
                        ? "bg-green-100 text-green-700"
                        : signal.riskLevel === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {signal.riskLevel?.toUpperCase()}
                  </span>
                </div>

                {/* Signal Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Symbol</p>
                      <p className="font-bold text-gray-900">{signal.symbol}</p>
                      <p className="text-xs text-gray-500 capitalize">{signal.assetClass}</p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        signal.direction === "buy"
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {signal.direction === "buy" ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <span
                          className={`font-bold text-sm ${
                            signal.direction === "buy" ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {signal.direction.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Entry</p>
                      <p className="font-bold text-gray-900">₹{signal.entryPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Stop Loss
                      </p>
                      <p className="font-bold text-red-700">₹{signal.stopLoss.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Target
                      </p>
                      <p className="font-bold text-green-700">₹{signal.target.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleFollow(signal.tradeId)}
                  className="w-full py-3 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Follow Signal
                </button>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {signal.followers || 0} investors following
                  </span>
                  <span className="text-xs text-gray-400">
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
