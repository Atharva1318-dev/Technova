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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filter.assetClass}
            onChange={(e) => setFilter({ ...filter, assetClass: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6]"
          >
            <option value="">All Asset Classes</option>
            <option value="equity">Equity</option>
            <option value="futures">Futures</option>
            <option value="options">Options</option>
          </select>

          <select
            value={filter.riskLevel}
            onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6]"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
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
        // <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        //   {signals.map((signal) => (
        //     <div
        //       key={signal._id}
        //       className="bg-white rounded-2xl border border-gray-200 p-3 hover:shadow-2xl transition-all duration-300 hover:border-[#0077b6] transform hover:-translate-y-1"
        //     >
        //       {/* Advisor Header */}
        //       <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        //         <div className="flex items-center gap-3">
        //           <div className="w-12 h-12 bg-gradient-to-br from-[#0077b6] to-[#00b4d8] rounded-full flex items-center justify-center shadow-md">
        //             <span className="text-white font-bold">
        //               {signal.advisorId?.name?.charAt(0).toUpperCase()}
        //             </span>
        //           </div>
        //           <div>
        //             <p className="font-bold text-gray-900">{signal.advisorId?.name || "Advisor"}</p>
        //             <div className="flex items-center gap-2 mt-1">
        //               <Award className="w-3 h-3 text-yellow-500" />
        //               <span className="text-xs text-gray-600 font-medium">
        //                 {signal.advisorId?.trustScore || 0}/100
        //               </span>
        //               <span className="text-xs text-gray-400">•</span>
        //               <span className="text-xs text-gray-600 font-medium">
        //                 {signal.advisorId?.winRate?.toFixed(1) || 0}% Win
        //               </span>
        //             </div>
        //           </div>
        //         </div>

        //         <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${signal.riskLevel === "low"
        //             ? "bg-green-100 text-green-700 border border-green-200"
        //             : signal.riskLevel === "medium"
        //               ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
        //               : "bg-red-100 text-red-700 border border-red-200"
        //           }`}>
        //           {signal.riskLevel?.toUpperCase()} RISK
        //         </span>
        //       </div>

        //       {/* Signal Details */}
        //       <div className="space-y-4 mb-4">
        //         <div className="flex items-center justify-between">
        //           <div>
        //             <p className="text-xs text-gray-500 mb-1">Symbol</p>
        //             <p className="font-bold text-xl text-gray-900">{signal.symbol}</p>
        //             <p className="text-xs text-gray-500 capitalize mt-1">{signal.assetClass}</p>
        //           </div>
        //           <div className={`px-6 py-3 rounded-xl shadow-md ${signal.direction === "buy"
        //               ? "bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
        //               : "bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
        //             }`}>
        //             <div className="flex items-center gap-2">
        //               {signal.direction === "buy" ? (
        //                 <TrendingUp className="w-6 h-6 text-green-600" />
        //               ) : (
        //                 <TrendingDown className="w-6 h-6 text-red-600" />
        //               )}
        //               <span className={`font-bold ${signal.direction === "buy" ? "text-green-700" : "text-red-700"
        //                 }`}>
        //                 {signal.direction.toUpperCase()}
        //               </span>
        //             </div>
        //           </div>
        //         </div>

        //         <div className="grid grid-cols-3 gap-3">
        //           <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        //             <p className="text-xs text-gray-500 mb-1">Entry Price</p>
        //             <p className="font-bold text-lg text-gray-900">₹{signal.entryPrice.toFixed(2)}</p>
        //           </div>
        //           <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        //             <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
        //               <Shield className="w-3 h-3" />
        //               Stop Loss
        //             </p>
        //             <p className="font-bold text-lg text-red-700">₹{signal.stopLoss.toFixed(2)}</p>
        //           </div>
        //           <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        //             <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
        //               <Target className="w-3 h-3" />
        //               Target
        //             </p>
        //             <p className="font-bold text-lg text-green-700">₹{signal.target.toFixed(2)}</p>
        //           </div>
        //         </div>
        //       </div>

        //       {/* Action Button */}
        //       <button
        //         onClick={() => handleFollow(signal.tradeId)}
        //         className="w-full py-3 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white font-bold rounded-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        //       >
        //         Follow Signal
        //       </button>

        //       {/* Footer */}
        //       <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        //         <span className="text-xs text-gray-500 flex items-center gap-1">
        //           <TrendingUp className="w-3 h-3" />
        //           {signal.followers || 0} investors following
        //         </span>
        //         <span className="text-xs text-gray-400">
        //           {new Date(signal.createdAt).toLocaleTimeString()}
        //         </span>
        //       </div>
        //     </div>
        //   ))}
        // </div>
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
