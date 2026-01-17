import React from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  History,
  Settings,
  LogOut,
  Award
} from "lucide-react";

const AdvisorSidebar = ({ activePage, setActivePage, userData, onLogout }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "trade", label: "Trade", icon: TrendingUp },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight">Technova</h1>
        <p className="text-xs text-white/70 mt-1">Advisor Panel</p>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{userData?.name || "Advisor"}</p>
            <p className="text-xs text-white/70 truncate">{userData?.email || ""}</p>
          </div>
        </div>
        {/* Trust Score Badge */}
        <div className="mt-3 bg-white/10 rounded-lg p-2 flex items-center justify-between">
          <span className="text-xs text-white/80">Trust Score</span>
          <span className="text-sm font-bold text-yellow-400">
            {userData?.trustScore?.toFixed(1) || "0"}/100
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#1a1a2e] shadow-lg border-r-4 border-yellow-400"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#1a1a2e]" : ""}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-200 text-red-100 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdvisorSidebar;

