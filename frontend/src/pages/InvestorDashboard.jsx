import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is investor
    if (!userData) {
      navigate("/login");
      return;
    }

    if (userData.role !== "investor") {
      navigate("/login");
      return;
    }

    // Initialize Socket.io
    const socket = initializeSocket();
    joinInvestorRoom(userData._id);
    joinSignalsFeed();

    return () => {
      // Cleanup if needed
    };
  }, [userData, navigate]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077b6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
      {/* Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        userData={userData}
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
