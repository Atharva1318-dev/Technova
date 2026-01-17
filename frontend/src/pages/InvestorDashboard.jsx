
import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { setUserData } from "../redux/userSlice";
import { AuthDataContext } from "../context/AuthDataContext";
import Sidebar from "../components/investor/Sidebar";
import DashboardPage from "../components/investor/DashboardPage";
import HotStocksPage from "../components/investor/HotStocksPage";
import DiscoveryFeed from "../components/investor/DiscoveryFeed";
import PortfolioPage from "../components/investor/PortfolioPage";
import AdvisorsPage from "../components/investor/AdvisorsPage";
import AnalyticsPage from "../components/investor/AnalyticsPage";
import WalletPage from "../components/investor/WalletPage";
import SettingsPage from "../components/investor/SettingsPage";
import { initializeSocket, joinInvestorRoom, joinSignalsFeed } from "../utils/socket";

const InvestorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [initializing, setInitializing] = useState(true);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { serverUrl } = useContext(AuthDataContext);
  const hasCheckedAuth = useRef(false);

  // Initial auth check - runs once
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      // Wait for UserDataContext to fetch user
      await new Promise(resolve => setTimeout(resolve, 300));
      setInitializing(false);
    };

    checkAuth();
  }, []);

  // Handle auth and socket initialization
  useEffect(() => {
    if (initializing) return;

    // Check if user exists
    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }

    // Check if user is investor
    if (userData.role !== "investor") {
      toast.error("Only investors can access this dashboard");
      navigate("/", { replace: true });
      return;
    }

    // Initialize Socket.io
    try {
      const socket = initializeSocket();
      if (userData._id) {
        joinInvestorRoom(userData._id);
        joinSignalsFeed();
      }
    } catch (e) {
      console.warn("Socket initialization warning:", e.message);
    }

    return () => {
      // Cleanup if needed
    };
  }, [userData, initializing, navigate]);

  // Logout handler - passed to Sidebar
  const handleLogout = async () => {
    try {
      // Clear Redux FIRST
      dispatch(setUserData(null));
      
      // Then call logout API
      await axios.post(
        `${serverUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Redux already cleared, just navigate
      navigate("/", { replace: true });
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077b6] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // No user after initializing
  if (!userData) {
    return null; // Will redirect in useEffect
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "hot-stocks":
        return <HotStocksPage />;
      case "signals":
        return <DiscoveryFeed />;
      case "portfolio":
        return <PortfolioPage />;
      case "advisors":
        return <AdvisorsPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "wallet":
        return <WalletPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - pass logout handler */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        userData={userData}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;