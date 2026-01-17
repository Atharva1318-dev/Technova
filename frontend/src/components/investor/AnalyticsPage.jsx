import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RefreshCw } from "lucide-react";

const AnalyticsPage = () => {
  const { serverUrl } = useContext(AuthDataContext);

  // 🔹 ONLY dynamic state
  const [followedSignals, setFollowedSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= STATIC DEMO DATA ================= */

  const staticSummary = {
    totalTrades: 24,
    winningTrades: 15,
    losingTrades: 9,
    winRate: 62.5,
    totalProfit: 48250,
    totalLoss: 19300,
  };

  const staticPaperTrades = [
    { profitLoss: 5200 },
    { profitLoss: -1800 },
    { profitLoss: 7600 },
    { profitLoss: -2400 },
    { profitLoss: 4300 },
  ];

  const staticMonthlyData = [
    { month: "Jan", profit: 12000, loss: 4000 },
    { month: "Feb", profit: 15000, loss: 6200 },
    { month: "Mar", profit: 9800, loss: 3000 },
    { month: "Apr", profit: 16450, loss: 5100 },
  ];

  /* ================= FETCH FOLLOWED SIGNALS ================= */

  const fetchSignals = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/investor/followed-advisors/signals`,
        { withCredentials: true }
      );
      setFollowedSignals(res.data.signals || []);
    } catch (error) {
      console.error("Error fetching followed signals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchSignals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed performance insights</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric title="Total Trades" value={staticSummary.totalTrades} />
        <Metric title="Winning Trades" value={staticSummary.winningTrades} green />
        <Metric title="Losing Trades" value={staticSummary.losingTrades} red />
        <Metric title="Win Rate" value={`${staticSummary.winRate}%`} />
      </div>

      {/* FOLLOWED SIGNALS (DYNAMIC) */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm text-gray-900">
        <h3 className="text-lg font-bold mb-4 text-gray-900">
          Signals from Advisors You Follow
        </h3>

        {followedSignals.length === 0 ? (
          <p className="text-gray-600">
            You are not following any advisors or no active signals available.
          </p>
        ) : (
          <div className="space-y-3">
            {followedSignals.map((signal) => (
              <div
                key={signal._id}
                className="flex items-center gap-6 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900"
              >
                <div className="w-40">
                  <p className="font-semibold">{signal.advisorId?.name}</p>
                  <p className="text-xs text-gray-600">
                    Trust {signal.advisorId?.trustScore || 0}
                  </p>
                </div>

                <div>
                  <p className="font-bold">{signal.symbol}</p>
                  <p className="text-xs text-gray-600 capitalize">
                    {signal.assetClass}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    signal.direction === "buy"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {signal.direction.toUpperCase()}
                </span>

                <div className="ml-auto flex gap-6">
                  <Price label="Entry" value={signal.entryPrice} />
                  <Price label="SL" value={signal.stopLoss} red />
                  <Price label="Target" value={signal.target} green />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MONTHLY P/L */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm text-gray-900">
        <h3 className="text-lg font-bold mb-4">Monthly Profit & Loss</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={staticMonthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#10b981" />
            <Line type="monotone" dataKey="loss" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          title="Total Profit"
          value={`₹${staticSummary.totalProfit}`}
          green
        />
        <SummaryCard
          title="Total Loss"
          value={`₹${staticSummary.totalLoss}`}
          red
        />
      </div>

      {/* INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Insight
          title="Best Trade"
          value={`₹${Math.max(...staticPaperTrades.map(t => t.profitLoss))}`}
        />
        <Insight
          title="Worst Trade"
          value={`₹${Math.min(...staticPaperTrades.map(t => t.profitLoss))}`}
        />
        <Insight title="Success Ratio" value={`${staticSummary.winRate}%`} />
      </div>
    </div>
  );
};

/* ================= REUSABLE COMPONENTS ================= */

const Metric = ({ title, value, green, red }) => (
  <div className="bg-white border border-gray-300 p-6 rounded-2xl shadow-sm text-gray-900">
    <p className="text-xs text-gray-600">{title}</p>
    <p
      className={`text-2xl font-bold ${
        green ? "text-green-700" : red ? "text-red-700" : "text-gray-900"
      }`}
    >
      {value}
    </p>
  </div>
);

const SummaryCard = ({ title, value, green, red }) => (
  <div className="bg-gray-50 border border-gray-300 p-6 rounded-2xl shadow-sm text-gray-900">
    <h3 className="font-bold mb-2">{title}</h3>
    <p
      className={`text-4xl font-bold ${
        green ? "text-green-700" : red ? "text-red-700" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

const Insight = ({ title, value }) => (
  <div className="bg-white border border-gray-300 p-4 rounded-xl shadow-sm text-gray-900">
    <p className="text-sm text-gray-600">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const Price = ({ label, value, red, green }) => (
  <div>
    <p className="text-xs text-gray-600">{label}</p>
    <p
      className={`font-semibold ${
        red ? "text-red-600" : green ? "text-green-600" : "text-gray-900"
      }`}
    >
      ₹{value?.toFixed(2)}
    </p>
  </div>
);

export default AnalyticsPage;
