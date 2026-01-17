import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Award, Target, Calendar } from "lucide-react";

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [paperTrades, setPaperTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, tradesRes] = await Promise.all([
        axios.get(`${serverUrl}/api/investor/portfolio/summary`, { withCredentials: true }),
        axios.get(`${serverUrl}/api/investor/paper-trades?status=closed`, { withCredentials: true }),
      ]);

      setSummary(summaryRes.data.summary);
      setPaperTrades(tradesRes.data.paperTrades);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const performanceData = paperTrades.slice(0, 10).reverse().map((trade, index) => ({
    name: `Trade ${index + 1}`,
    pnl: trade.profitLoss,
    symbol: trade.symbol,
  }));

  const monthlyData = [
    { month: "Jan", profit: 5000, loss: 2000 },
    { month: "Feb", profit: 7000, loss: 3000 },
    { month: "Mar", profit: 6000, loss: 2500 },
    { month: "Apr", profit: 8000, loss: 3500 },
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed performance insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Winning Trades</p>
              <p className="text-2xl font-bold text-green-600">{summary?.winningTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Losing Trades</p>
              <p className="text-2xl font-bold text-red-600">{summary?.losingTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.winRate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Performance Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Trade Performance</h3>
        {performanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="pnl" fill="#0077b6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No trade data available yet
          </div>
        )}
      </div>

      {/* Monthly Profit/Loss */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Profit & Loss</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis stroke="#666" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
            <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} name="Loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <h3 className="text-lg font-bold text-green-900 mb-4">Total Profit</h3>
          <p className="text-4xl font-bold text-green-600 mb-2">
            ₹{summary?.totalProfit.toFixed(2) || 0}
          </p>
          <p className="text-sm text-green-700">
            From {summary?.winningTrades || 0} winning trades
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <h3 className="text-lg font-bold text-red-900 mb-4">Total Loss</h3>
          <p className="text-4xl font-bold text-red-600 mb-2">
            ₹{summary?.totalLoss.toFixed(2) || 0}
          </p>
          <p className="text-sm text-red-700">
            From {summary?.losingTrades || 0} losing trades
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
