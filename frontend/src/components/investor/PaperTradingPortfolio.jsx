import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, X as CloseIcon } from "lucide-react";
import { onPaperTradeUpdate } from "../../utils/socket";

const PaperTradingPortfolio = ({ onRefresh }) => {
  const [paperTrades, setPaperTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // active or closed
  const { serverUrl } = useAuth();

  useEffect(() => {
    fetchPaperTrades();

    // Listen for real-time updates
    const handlePaperTradeUpdate = (trade) => {
      setPaperTrades((prev) =>
        prev.map((t) => (t._id === trade._id ? trade : t))
      );
    };

    onPaperTradeUpdate(handlePaperTradeUpdate);

    return () => {
      // Cleanup
    };
  }, [filter]);

  const fetchPaperTrades = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/investor/paper-trades?status=${filter}`,
        { withCredentials: true }
      );
      setPaperTrades(response.data.paperTrades);
    } catch (error) {
      console.error("Error fetching paper trades:", error);
      toast.error("Failed to load paper trades");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTrade = async (paperTradeId) => {
    if (!window.confirm("Are you sure you want to close this paper trade?")) {
      return;
    }

    try {
      await axios.post(
        `${serverUrl}/api/investor/paper-trade/${paperTradeId}/close`,
        {},
        { withCredentials: true }
      );
      toast.success("Paper trade closed successfully");
      fetchPaperTrades();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error closing paper trade:", error);
      toast.error(error.response?.data?.message || "Failed to close trade");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-100 rounded"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "active"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Active Trades
        </button>
        <button
          onClick={() => setFilter("closed")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === "closed"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Closed Trades
        </button>
      </div>

      {/* Trades List */}
      {paperTrades.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No {filter} trades</p>
          <p className="text-sm text-gray-500 mt-2">
            {filter === "active"
              ? "Follow signals from the discovery feed to start paper trading"
              : "Your closed trades will appear here"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Advisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {filter === "closed" ? "Exit" : "Target"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {filter === "closed" ? "P&L" : "Status"}
                </th>
                {filter === "active" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paperTrades.map((trade) => (
                <tr key={trade._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{trade.symbol}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {trade.advisorId?.name || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        trade.direction === "buy"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {trade.direction === "buy" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₹{trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {filter === "closed" ? (
                      <span className="text-gray-900">
                        ₹{trade.exitPrice?.toFixed(2) || "-"}
                      </span>
                    ) : (
                      <span className="text-green-600">
                        ₹{trade.target.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trade.quantity}
                  </td>
                  <td className="px-6 py-4">
                    {filter === "closed" ? (
                      <span
                        className={`font-semibold ${
                          trade.profitLoss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {trade.profitLoss >= 0 ? "+" : ""}₹
                        {trade.profitLoss?.toFixed(2) || 0}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Running</span>
                    )}
                  </td>
                  {filter === "active" && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCloseTrade(trade._id)}
                        className="p-2 hover:bg-red-50 rounded transition"
                        title="Close Trade"
                      >
                        <CloseIcon className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaperTradingPortfolio;
