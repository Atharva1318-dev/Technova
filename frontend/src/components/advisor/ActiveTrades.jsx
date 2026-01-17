import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Edit2, X as CloseIcon, TrendingUp, TrendingDown } from "lucide-react";
import { onTradeUpdate, onTradeClosed } from "../../utils/socket";

const ActiveTrades = ({ onRefresh }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTrade, setEditingTrade] = useState(null);
  const [editForm, setEditForm] = useState({ stopLoss: "", target: "" });
  const { serverUrl } = useAuth();

  useEffect(() => {
    fetchTrades();

    // Listen for real-time updates
    const handleTradeUpdate = (trade) => {
      setTrades((prev) =>
        prev.map((t) => (t._id === trade._id ? trade : t))
      );
    };

    const handleTradeClosed = (trade) => {
      setTrades((prev) => prev.filter((t) => t._id !== trade._id));
      toast.success(`Trade closed: ${trade.symbol}`);
      if (onRefresh) onRefresh();
    };

    onTradeUpdate(handleTradeUpdate);
    onTradeClosed(handleTradeClosed);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/trade/advisor/trades?status=active`,
        { withCredentials: true }
      );
      setTrades(response.data.trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast.error("Failed to load active trades");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade._id);
    setEditForm({
      stopLoss: trade.stopLoss.toString(),
      target: trade.target.toString(),
    });
  };

  const handleSaveEdit = async (tradeId) => {
    try {
      await axios.put(
        `${serverUrl}/api/trade/${tradeId}`,
        {
          stopLoss: parseFloat(editForm.stopLoss),
          target: parseFloat(editForm.target),
        },
        { withCredentials: true }
      );
      toast.success("Trade updated successfully");
      setEditingTrade(null);
      fetchTrades();
    } catch (error) {
      console.error("Error updating trade:", error);
      toast.error(error.response?.data?.message || "Failed to update trade");
    }
  };

  const handleCloseTrade = async (tradeId) => {
    if (!window.confirm("Are you sure you want to close this trade?")) {
      return;
    }

    try {
      await axios.post(
        `${serverUrl}/api/trade/${tradeId}/close`,
        { reason: "manual" },
        { withCredentials: true }
      );
      toast.success("Trade closed successfully");
      fetchTrades();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error closing trade:", error);
      toast.error(error.response?.data?.message || "Failed to close trade");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Active Trades</h2>
        <p className="text-sm text-gray-600 mt-1">
          {trades.length} active {trades.length === 1 ? "trade" : "trades"}
        </p>
      </div>

      {trades.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">No active trades</p>
          <p className="text-sm text-gray-500">
            Create your first signal to get started
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
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stop Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trades.map((trade) => (
                <tr key={trade._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{trade.symbol}</div>
                    <div className="text-xs text-gray-500">{trade.assetClass}</div>
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
                  <td className="px-6 py-4">
                    {editingTrade === trade._id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.stopLoss}
                        onChange={(e) =>
                          setEditForm({ ...editForm, stopLoss: e.target.value })
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm text-red-600">
                        ₹{trade.stopLoss.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingTrade === trade._id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.target}
                        onChange={(e) =>
                          setEditForm({ ...editForm, target: e.target.value })
                        }
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm text-green-600">
                        ₹{trade.target.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {trade.quantity}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {editingTrade === trade._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(trade._id)}
                            className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTrade(null)}
                            className="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(trade)}
                            className="p-2 hover:bg-gray-100 rounded transition"
                            title="Edit SL/Target"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleCloseTrade(trade._id)}
                            className="p-2 hover:bg-red-50 rounded transition"
                            title="Close Trade"
                          >
                            <CloseIcon className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveTrades;
