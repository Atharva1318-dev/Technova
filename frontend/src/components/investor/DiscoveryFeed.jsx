import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, Target, Shield, Award, Filter } from "lucide-react";
import { onNewSignal } from "../../utils/socket";

const DiscoveryFeed = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    assetClass: "",
    riskLevel: "",
  });
  const { serverUrl } = useContext(AuthDataContext);

  const gridRef = useRef(null);

  useEffect(() => {
    fetchSignals();

    const handleNewSignal = (signal) => {
      setSignals((prev) => [signal, ...prev]);
      toast.info(`🔔 New signal: ${signal.symbol}`);
    };

    onNewSignal(handleNewSignal);

    return () => { };
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
      toast.success("✅ Signal followed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to follow signal");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Signals</h1>
          <p className="text-gray-600 mt-1">Real-time trading signals from verified advisors</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 font-medium">Live</span>
        </div>
      </div>

      {/* Filters - FIXED TEXT COLOR */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filter.assetClass}
            onChange={(e) => setFilter({ ...filter, assetClass: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6] bg-white text-gray-900"
          >
            <option value="" className="text-gray-900">All Asset Classes</option>
            <option value="equity" className="text-gray-900">Equity</option>
            <option value="futures" className="text-gray-900">Futures</option>
            <option value="options" className="text-gray-900">Options</option>
          </select>

          <select
            value={filter.riskLevel}
            onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6] bg-white text-gray-900"
          >
            <option value="" className="text-gray-900">All Risk Levels</option>
            <option value="low" className="text-gray-900">Low Risk</option>
            <option value="medium" className="text-gray-900">Medium Risk</option>
            <option value="high" className="text-gray-900">High Risk</option>
          </select>

          <button
            onClick={fetchSignals}
            className="ml-auto px-6 py-2 bg-[#0077b6] text-white rounded-lg hover:bg-[#005a8d] transition font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Signals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl h-64 border border-gray-200"></div>
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-2">No signals available</p>
          <p className="text-sm text-gray-500">
            New signals from advisors will appear here in real-time
          </p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="space-y-3"
        >
          {signals.map((signal) => (
            <div
              key={signal._id}
              className="bg-white border border-gray-200 rounded-xl px-3 py-3 flex items-center gap-7 hover:shadow-md transition-all duration-200"
            >
              {/* Advisor */}
              <div className="flex items-center gap-3 w-[210px]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0077b6] to-[#00b4d8] flex items-center justify-center text-white font-semibold text-sm">
                  {signal.advisorId?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {signal.advisorId?.name || "Advisor"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Trust {signal.advisorId?.trustScore || 0}
                  </p>
                </div>
              </div>

              {/* Symbol */}
              <div className="w-[120px]">
                <p className="font-bold text-gray-900">{signal.symbol}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {signal.assetClass}
                </p>
              </div>

              {/* Direction */}
              <div
                className={`px-2 py-1 rounded-lg text-sm font-semibold ${signal.direction === "buy"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                {signal.direction.toUpperCase()}
              </div>

              {/* Prices */}
              <div className="flex items-center gap-6 ml-auto">
                <div>
                  <p className="text-xs text-gray-500">Entry</p>
                  <p className="font-semibold text-gray-900">
                    ₹{signal.entryPrice.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">SL</p>
                  <p className="font-semibold text-red-600">
                    ₹{signal.stopLoss.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="font-semibold text-green-600">
                    ₹{signal.target.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Risk */}
              <div
                className={`px-3 py-1 rounded-full flex flex-row items-center justify-center text-xs font-semibold ml-2 ${signal.riskLevel === "low"
                  ? "bg-green-100 text-green-700"
                  : signal.riskLevel === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {signal.riskLevel?.toUpperCase()} RISK
              </div>

              {/* Action */}
              <button
                onClick={() => handleFollow(signal.tradeId)}
                className="ml-6 px-5 py-2 bg-[#0077b6] text-white rounded-lg font-semibold hover:bg-[#005a8d] transition"
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;