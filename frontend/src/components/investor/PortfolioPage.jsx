import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, X as CloseIcon, Wallet, Target, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const PortfolioPage = () => {
  const [paperTrades, setPaperTrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchPaperTrades();
    fetchSummary();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/investor/portfolio/summary`,
        { withCredentials: true }
      );
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleCloseTrade = async (paperTradeId) => {
    if (!window.confirm("Close this paper trade?")) return;

    try {
      await axios.post(
        `${serverUrl}/api/investor/paper-trade/${paperTradeId}/close`,
        {},
        { withCredentials: true }
      );
      toast.success("Paper trade closed");
      fetchPaperTrades();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to close trade");
    }
  };

  const pieData = summary ? [
    { name: "Winning Trades", value: summary.winningTrades, color: "#10b981" },
    { name: "Losing Trades", value: summary.losingTrades, color: "#ef4444" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
        <p className="text-gray-600 mt-1">Track your paper trading performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#0077b6] to-[#00b4d8] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-8 h-8" />
            <p className="text-sm text-white/80">Balance</p>
          </div>
          <p className="text-3xl font-bold">₹{summary?.balance.toLocaleString() || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-purple-600" />
            <p className="text-sm text-gray-600">Total Trades</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary?.totalTrades || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-yellow-600" />
            <p className="text-sm text-gray-600">Win Rate</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary?.winRate.toFixed(1) || 0}%</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className={`w-8 h-8 ${
              summary?.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
            }`} />
            <p className="text-sm text-gray-600">Net P&L</p>
          </div>
          <p className={`text-3xl font-bold ${
            summary?.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            ₹{summary?.netProfitLoss.toFixed(2) || 0}
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      {summary && summary.totalTrades > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Total Profit</span>
                <span className="text-lg font-bold text-green-600">
                  ₹{summary.totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-900">Total Loss</span>
                <span className="text-lg font-bold text-red-600">
                  ₹{summary.totalLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Active Trades</span>
                <span className="text-lg font-bold text-gray-900">
                  {summary.activeTrades}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trades Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Trade History</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("active")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "active"
                    ? "bg-[#0077b6] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("closed")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === "closed"
                    ? "bg-[#0077b6] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Closed
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {paperTrades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No {filter} trades</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Symbol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Advisor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Direction</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Entry</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    {filter === "closed" ? "Exit" : "Target"}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    {filter === "closed" ? "P&L" : "Status"}
                  </th>
                  {filter === "active" && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paperTrades.map((trade) => (
                  <tr key={trade._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{trade.symbol}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {trade.advisorId?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        trade.direction === "buy"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {trade.direction === "buy" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {filter === "closed" ? (
                        <span className="text-gray-900">₹{trade.exitPrice?.toFixed(2) || "-"}</span>
                      ) : (
                        <span className="text-green-600">₹{trade.target.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{trade.quantity}</td>
                    <td className="px-6 py-4">
                      {filter === "closed" ? (
                        <span className={`font-bold ${
                          trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {trade.profitLoss >= 0 ? "+" : ""}₹{trade.profitLoss?.toFixed(2) || 0}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          Running
                        </span>
                      )}
                    </td>
                    {filter === "active" && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCloseTrade(trade._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
