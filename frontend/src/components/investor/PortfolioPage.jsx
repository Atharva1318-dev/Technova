import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, X as CloseIcon, Wallet, Target, Award, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

  const handleRefresh = () => {
    fetchPaperTrades();
    fetchSummary();
  };

  const pieData = summary ? [
    { name: "Winning Trades", value: summary.winningTrades, color: "#10b981" },
    { name: "Losing Trades", value: summary.losingTrades, color: "#ef4444" },
  ] : [];

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-700 mt-1">Track your paper trading performance</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0056b3] to-[#6d28d9] text-white rounded-lg hover:from-[#004996] hover:to-[#5b21b6] transition font-semibold shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-[#0056b3] to-[#6d28d9] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-lg border border-white/25">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm text-white/90">Balance</p>
          </div>
          <p className="text-3xl font-bold">₹{summary?.balance.toLocaleString() || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg border border-purple-200">
              <Target className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Trades</p>
              <p className="text-3xl font-bold text-gray-900">{summary?.totalTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg border border-yellow-200">
              <Award className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Win Rate</p>
              <p className="text-3xl font-bold text-gray-900">{summary?.winRate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg border ${
              summary?.netProfitLoss >= 0 
                ? "bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200"
                : "bg-gradient-to-br from-rose-100 to-rose-50 border-rose-200"
            }`}>
              {summary?.netProfitLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-700" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Net P&L</p>
              <p className={`text-3xl font-bold ${
                summary?.netProfitLoss >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                ₹{summary?.netProfitLoss.toFixed(2) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {summary && summary.totalTrades > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-sm font-medium text-emerald-900">Total Profit</span>
                <span className="text-lg font-bold text-emerald-700">
                  ₹{summary.totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-rose-50 to-white rounded-xl border border-rose-200 shadow-sm">
                <span className="text-sm font-medium text-rose-900">Total Loss</span>
                <span className="text-lg font-bold text-rose-700">
                  ₹{summary.totalLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 shadow-sm">
                <span className="text-sm font-medium text-blue-900">Active Trades</span>
                <span className="text-lg font-bold text-blue-700">
                  {summary.activeTrades}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trades Table */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 shadow-sm">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Trade History</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("active")}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  filter === "active"
                    ? "bg-gradient-to-r from-[#0056b3] to-[#6d28d9] text-white shadow-lg"
                    : "bg-white border border-gray-400 text-gray-800 hover:border-[#0056b3] hover:text-[#0056b3]"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter("closed")}
                className={`px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  filter === "closed"
                    ? "bg-gradient-to-r from-[#0056b3] to-[#6d28d9] text-white shadow-lg"
                    : "bg-white border border-gray-400 text-gray-800 hover:border-[#0056b3] hover:text-[#0056b3]"
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
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Symbol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Advisor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Direction</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Entry</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    {filter === "closed" ? "Exit" : "Target"}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Qty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    {filter === "closed" ? "P&L" : "Status"}
                  </th>
                  {filter === "active" && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {paperTrades.map((trade) => (
                  <tr key={trade._id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{trade.symbol}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {trade.advisorId?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        trade.direction === "buy"
                          ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border border-rose-200"
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
                        <span className="text-emerald-700 font-semibold">₹{trade.target.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{trade.quantity}</td>
                    <td className="px-6 py-4">
                      {filter === "closed" ? (
                        <span className={`font-bold ${
                          trade.profitLoss >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}>
                          {trade.profitLoss >= 0 ? "+" : ""}₹{trade.profitLoss?.toFixed(2) || 0}
                        </span>
                      ) : (
                        <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full font-semibold border border-blue-200">
                          Running
                        </span>
                      )}
                    </td>
                    {filter === "active" && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleCloseTrade(trade._id)}
                          className="p-2 hover:bg-rose-50 rounded-lg transition border border-rose-200 hover:border-rose-300"
                          title="Close Trade"
                        >
                          <CloseIcon className="w-4 h-4 text-rose-600" />
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

      {/* Additional Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-emerald-800 font-medium">Average Profit</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{summary.totalProfit > 0 ? (summary.totalProfit / summary.winningTrades).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-rose-50 rounded-xl border border-rose-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-50 rounded-lg border border-rose-200">
                <TrendingDown className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <p className="text-xs text-rose-800 font-medium">Average Loss</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{summary.totalLoss > 0 ? (summary.totalLoss / summary.losingTrades).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-violet-50 rounded-xl border border-violet-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg border border-violet-200">
                <Target className="w-6 h-6 text-violet-700" />
              </div>
              <div>
                <p className="text-xs text-violet-800 font-medium">Active Investments</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.activeTrades}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;