import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  LogOut,
  Award,
  Shield,
  Rocket,
  BarChart3,
  Activity,
  Users,
  Target,
  DollarSign,
  Link2
} from "lucide-react";

import { Link } from "react-router-dom";

const AdvisorSidebar = ({ activePage, setActivePage, userData, onLogout }) => {
  const menuItems = [
    // { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "trade", label: "Trade Signals", icon: TrendingUp },
    { id: "history", label: "History", icon: History },
    { id: "blockchain", label: "Blockchain", icon: Link2 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="w-64 bg-[#0A0A0F] border-r border-gray-900 text-white h-screen fixed left-0 top-0 flex flex-col z-50">
      {/* Logo/Brand */}
      <div className="p-5 border-b border-gray-900 flex-shrink-0">
        <Link href="/">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-gray-800 rounded-lg flex items-center justify-center">
              <img
                src="/securities.png"
                alt="VeriFi Logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">VeriFi</h1>
              <p className="text-xs text-gray-500">Advisor Portal</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-gray-800 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-white truncate">{userData?.name || "Advisor"}</p>
            <p className="text-xs text-gray-500 truncate">{userData?.email || ""}</p>
          </div>
        </div>

        {/* SEBI Badge */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-400">SEBI</span>
            </div>
            <span className="text-xs font-medium text-green-400">✓</span>
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Trust</span>
            <span className="text-xs font-bold text-yellow-400">
              {userData?.trustScore?.toFixed(0) || "0"}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1 rounded-full"
              style={{ width: `${userData?.trustScore || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Scrollable with invisible scrollbar */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        <div className="px-3 mb-1">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Menu</p>
        </div>

        <div className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-900/40 text-white shadow"
                  : "text-gray-400 hover:bg-gray-900/50 hover:text-white"
                  }`}
              >
                <div className={`p-1.5 rounded ${isActive
                  ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                  : "bg-gray-900/50"
                  }`}>
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-gray-500"}`} />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="px-3 mt-4 mb-1">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Stats</p>
        </div>

        <div className="space-y-1 px-2">
          <div className="flex items-center justify-between bg-gray-900/30 border border-gray-800 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-gray-400">Followers</span>
            </div>
            <span className="text-xs font-bold text-white">{userData?.subscriberCount || 0}</span>
          </div>

          <div className="flex items-center justify-between bg-gray-900/30 border border-gray-800 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-gray-400">Win Rate</span>
            </div>
            <span className="text-xs font-bold text-green-400">{userData?.winRate?.toFixed(0) || 0}%</span>
          </div>

          <div className="flex items-center justify-between bg-gray-900/30 border border-gray-800 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-gray-400">P&L</span>
            </div>
            <span className={`text-xs font-bold ${(userData?.netProfitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{(userData?.netProfitLoss || 0) >= 0 ? '+' : ''}{userData?.netProfitLoss?.toFixed(0) || "0"}
            </span>
          </div>
        </div>
      </nav>

      {/* Logout Button - FIXED AT BOTTOM (ALWAYS VISIBLE) */}
      <div className="mt-auto p-4 border-t border-gray-900 bg-[#0A0A0F] flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-900/50 to-red-800/40 hover:from-red-800/60 hover:to-red-700/50 border border-red-900/50 hover:border-red-700/60 rounded-lg transition-all duration-200 text-red-300 hover:text-white hover:shadow-lg hover:shadow-red-900/30 group font-semibold"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">Logout</span>
        </button>

        {/* Platform Status */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Platform Live</span>
            <span className="text-xs text-gray-600 ml-auto">v1.0</span>
          </div>
        </div>
      </div>

      {/* Invisible scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};


export default AdvisorSidebar;