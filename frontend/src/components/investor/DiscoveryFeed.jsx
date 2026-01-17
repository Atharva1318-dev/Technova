import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, Target, Shield, User } from "lucide-react";
import { onNewSignal } from "../../utils/socket";

const DiscoveryFeed = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    assetClass: "",
    riskLevel: "",
  });
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchSignals();

    // Listen for new signals
    const handleNewSignal = (signal) => {
      setSignals((prev) => [signal, ...prev]);
      toast.info(`New signal: ${signal.symbol}`);
    };

    onNewSignal(handleNewSignal);

    return () => {
      // Cleanup
    };
  }, [filter]);

  const fetchSignals = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.assetClass) params.append("assetClass", filter.assetClass);
      if (filter.riskLevel) params.append("riskLevel", filter.riskLevel);

      const response = await axios.get(
        `${serverUrl}/api/trade/signals?${params.toString()}`,
        { withCredentials: true }
      );
      setSignals(response.data.signals);
    } catch (error) {
      console.error("Error fetching signals:", error);
      toast.error("Failed to load signals");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.assetClass}
          onChange={(e) => setFilter({ ...filter, assetClass: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        >
          <option value="">All Asset Classes</option>
          <option value="equity">Equity</option>
          <option value="futures">Futures</option>
          <option value="options">Options</option>
        </select>

        <select
          value={filter.riskLevel}
          onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
        >
          <option value="">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
      </div>

      {/* Signals Feed */}
      {signals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No signals available</p>
          <p className="text-sm text-gray-500 mt-2">
            Check back later for new trading signals
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal) => (
            <div
              key={signal._id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {signal.advisorId?.name || "Advisor"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Trust Score: {signal.advisorId?.trustScore || 0}/100
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        Win Rate: {signal.advisorId?.winRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    signal.riskLevel === "low"
                      ? "bg-green-100 text-green-700"
                      : signal.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {signal.riskLevel.toUpperCase()} RISK
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Symbol</p>
                  <p className="font-semibold text-gray-900">{signal.symbol}</p>
                  <p className="text-xs text-gray-500">{signal.assetClass}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Direction</p>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      signal.direction === "buy"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {signal.direction === "buy" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {signal.direction.toUpperCase()}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Entry Price</p>
                  <p className="font-semibold text-gray-900">
                    ₹{signal.entryPrice.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Target</p>
                  <p className="font-semibold text-green-600">
                    ₹{signal.target.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    SL: ₹{signal.stopLoss.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Target: ₹{signal.target.toFixed(2)}
                  </span>
                  <span>{signal.followers || 0} followers</span>
                </div>

                <button
                  onClick={() => handleFollow(signal.tradeId)}
                  className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition"
                >
                  Follow Signal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;
