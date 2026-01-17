import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award,
  Activity,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Bell,
  DollarSign
} from "lucide-react";
import { toast } from "react-toastify";

const AdvisorDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        axios.get(`${serverUrl}/api/advisor/dashboard/stats`, { withCredentials: true }),
        axios.get(`${serverUrl}/api/advisor/recent-activity`, { withCredentials: true })
      ]);
      
      setStats(statsRes.data.stats);
      setRecentActivity(activityRes.data.activities || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a2e]"></div>
      </div>
    );
  }

  const todayPnL = stats?.todayPnL || 0;
  const isPnLPositive = todayPnL >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Track your performance and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Subscribers */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-semibold">+12%</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.subscriberCount || 0}
          </h3>
          <p className="text-sm text-gray-600">Total Subscribers</p>
        </div>

        {/* Active Trades */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.activeTrades || 0}
          </h3>
          <p className="text-sm text-gray-600">Active Trades</p>
        </div>

        {/* Today's P&L */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${isPnLPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-6 h-6 ${isPnLPositive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="flex items-center gap-1 text-sm">
              {isPnLPositive ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`font-semibold ${isPnLPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(todayPnL).toFixed(2)}%
              </span>
            </div>
          </div>
          <h3 className={`text-3xl font-bold mb-1 ${isPnLPositive ? 'text-green-600' : 'text-red-600'}`}>
            ₹{Math.abs(todayPnL).toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Today's P&L</p>
        </div>

        {/* Trust Score */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.trustScore?.toFixed(1) || 0}<span className="text-lg text-gray-500">/100</span>
          </h3>
          <p className="text-sm text-gray-600">Trust Score</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy & Trades */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Performance Metrics</h2>
          <div className="space-y-6">
            {/* Accuracy Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Accuracy Rate</span>
                <span className="text-lg font-bold text-gray-900">{stats?.winRate?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.winRate || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Total Trades Published */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Trades Published</span>
                <span className="text-2xl font-bold text-gray-900">{stats?.totalTrades || 0}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Won: {stats?.wonTrades || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Lost: {stats?.lostTrades || 0}</span>
                </div>
              </div>
            </div>

            {/* Net P&L */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Net P&L (Lifetime)</span>
                <span className={`text-2xl font-bold ${(stats?.netProfitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{stats?.netProfitLoss?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className={`p-2 rounded-full ${
                    activity.type === 'target_hit' ? 'bg-green-100' :
                    activity.type === 'sl_hit' ? 'bg-red-100' :
                    activity.type === 'new_subscriber' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'target_hit' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {activity.type === 'sl_hit' && <XCircle className="w-4 h-4 text-red-600" />}
                    {activity.type === 'new_subscriber' && <Users className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'trade_acknowledged' && <TrendingUp className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Profit & Loss Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Profit</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{stats?.totalProfit?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="border-l-4 border-red-500 pl-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Loss</p>
            <p className="text-3xl font-bold text-red-600">
              ₹{stats?.totalLoss?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Net P&L</p>
            <p className={`text-3xl font-bold ${(stats?.netProfitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{stats?.netProfitLoss?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboardPage;

