import React from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Users, 
  Settings,
  LogOut,
  Flame,
  BarChart3,
  Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { useContext } from "react";

const Sidebar = ({ activePage, setActivePage, userData }) => {
  const navigate = useNavigate();
  const { serverUrl } = useContext(AuthDataContext);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hot-stocks", label: "Hot Stocks", icon: Flame },
    { id: "signals", label: "Live Signals", icon: TrendingUp },
    { id: "portfolio", label: "My Portfolio", icon: Briefcase },
    { id: "advisors", label: "Top Advisors", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#0077b6] to-[#005a8d] text-white h-screen fixed left-0 top-0 flex flex-col shadow-2xl">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight">Technova</h1>
        <p className="text-xs text-white/70 mt-1">Trading Platform</p>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">
              {userData?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{userData?.name}</p>
            <p className="text-xs text-white/70 truncate">{userData?.email}</p>
          </div>
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
                  ? "bg-white text-[#0077b6] shadow-lg border-r-4 border-white"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#0077b6]" : ""}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
