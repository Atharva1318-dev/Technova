import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Award, Target, Calendar, RefreshCw } from "lucide-react";

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

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
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
      <div className="flex items-center justify-center h-96 bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-700 mt-1">Detailed performance insights</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0056b3] to-[#6d28d9] text-white rounded-lg hover:from-[#004996] hover:to-[#5b21b6] transition font-semibold shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
              <Target className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Winning Trades</p>
              <p className="text-2xl font-bold text-emerald-700">{summary?.winningTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-50 rounded-lg border border-rose-200">
              <TrendingUp className="w-6 h-6 text-rose-700" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Losing Trades</p>
              <p className="text-2xl font-bold text-rose-700">{summary?.losingTrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg border border-yellow-200">
              <Award className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.winRate.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Performance Chart */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Trade Performance</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Last 10 Trades</span>
          </div>
        </div>
        {performanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#4b5563" 
                style={{ fontSize: '12px' }} 
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#4b5563" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                formatter={(value) => [`₹${value.toFixed(2)}`, 'P&L']}
              />
              <Bar 
                dataKey="pnl" 
                fill="#0056b3" 
                radius={[8, 8, 0, 0]} 
                name="Profit/Loss"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-300 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No trade data available yet</p>
              <p className="text-sm text-gray-500 mt-1">Start paper trading to see your performance analytics</p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Profit/Loss */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Profit & Loss</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#4b5563" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#4b5563" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: '#1f2937', fontWeight: 'bold' }}
              formatter={(value) => [`₹${value.toFixed(2)}`, '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={2} 
              name="Profit"
              dot={{ r: 4, fill: '#10b981' }}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="loss" 
              stroke="#ef4444" 
              strokeWidth={2} 
              name="Loss"
              dot={{ r: 4, fill: '#ef4444' }}
              activeDot={{ r: 6, fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-200 to-emerald-100 rounded-lg border border-emerald-300">
              <TrendingUp className="w-6 h-6 text-emerald-800" />
            </div>
            <h3 className="text-lg font-bold text-emerald-900">Total Profit</h3>
          </div>
          <p className="text-4xl font-bold text-emerald-700 mb-2">
            ₹{summary?.totalProfit.toFixed(2) || 0}
          </p>
          <p className="text-sm text-emerald-800 font-medium">
            From {summary?.winningTrades || 0} winning trades
          </p>
          <div className="mt-4 pt-4 border-t border-emerald-300">
            <p className="text-xs text-emerald-700">
              Average profit per winning trade: ₹{
                summary?.winningTrades > 0 
                  ? (summary.totalProfit / summary.winningTrades).toFixed(2)
                  : "0.00"
              }
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-100 to-rose-50 rounded-2xl p-6 border border-rose-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-rose-200 to-rose-100 rounded-lg border border-rose-300">
              <TrendingUp className="w-6 h-6 text-rose-800" />
            </div>
            <h3 className="text-lg font-bold text-rose-900">Total Loss</h3>
          </div>
          <p className="text-4xl font-bold text-rose-700 mb-2">
            ₹{summary?.totalLoss.toFixed(2) || 0}
          </p>
          <p className="text-sm text-rose-800 font-medium">
            From {summary?.losingTrades || 0} losing trades
          </p>
          <div className="mt-4 pt-4 border-t border-rose-300">
            <p className="text-xs text-rose-700">
              Average loss per losing trade: ₹{
                summary?.losingTrades > 0 
                  ? (summary.totalLoss / summary.losingTrades).toFixed(2)
                  : "0.00"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-300 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200">
                <Target className="w-4 h-4 text-blue-700" />
              </div>
              <p className="text-sm font-medium text-gray-800">Best Trade</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {paperTrades.length > 0 ? (
                `₹${Math.max(...paperTrades.map(t => t.profitLoss || 0)).toFixed(2)}`
              ) : (
                "₹0.00"
              )}
            </p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-4 border border-rose-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-rose-100 to-rose-50 rounded-lg border border-rose-200">
                <TrendingUp className="w-4 h-4 text-rose-700" />
              </div>
              <p className="text-sm font-medium text-gray-800">Worst Trade</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {paperTrades.length > 0 ? (
                `₹${Math.min(...paperTrades.map(t => t.profitLoss || 0)).toFixed(2)}`
              ) : (
                "₹0.00"
              )}
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-white rounded-xl p-4 border border-violet-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg border border-violet-200">
                <Award className="w-4 h-4 text-violet-700" />
              </div>
              <p className="text-sm font-medium text-gray-800">Success Ratio</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {summary?.winRate ? summary.winRate.toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;