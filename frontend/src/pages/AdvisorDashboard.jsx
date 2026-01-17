import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { AuthDataContext } from "../context/AuthDataContext";
import { toast } from "react-toastify";
import { setUserData } from "../redux/userSlice";
import { initializeSocket, joinAdvisorRoom } from "../utils/socket";

// Import new components
import AdvisorSidebar from "../components/advisor/AdvisorSidebar";
import AdvisorDashboardPage from "../components/advisor/AdvisorDashboardPage";
import AdvisorTradePage from "../components/advisor/AdvisorTradePage";
import AdvisorHistoryPage from "../components/advisor/AdvisorHistoryPage";
import SettingsPage from "../components/investor/SettingsPage";

const AdvisorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [initializing, setInitializing] = useState(true);
  const { serverUrl } = useContext(AuthDataContext);
  const userData = useSelector((state) => state.user.userData);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasCheckedAuth = useRef(false);

  // Initial auth check - runs once
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      // Wait a bit for UserDataContext to fetch user
      await new Promise(resolve => setTimeout(resolve, 300));
      setInitializing(false);
    };

    checkAuth();
  }, []);

  // Handle redirects based on userData
  useEffect(() => {
    if (initializing) return;

    // No user - redirect to login
    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }

    // Not an advisor
    if (userData.role !== "advisor") {
      toast.error("Only advisors can access this dashboard");
      navigate("/", { replace: true });
      return;
    }

    // Phone not verified
    if (!userData.isVerified) {
      navigate("/advisor/onboarding", { replace: true });
      return;
    }

    // Onboarding not complete
    if (!userData.verificationStatus || !["pending", "approved"].includes(userData.verificationStatus)) {
      navigate("/advisor/onboarding", { replace: true });
      return;
    }

    // Initialize socket
    try {
      const socket = initializeSocket();
      if (userData._id) {
        joinAdvisorRoom(userData._id);
      }
    } catch (e) {
      console.warn("Socket warning:", e.message);
    }
  }, [userData, initializing, navigate]);

  const handleLogout = async () => {
    try {
      // Clear Redux first
      dispatch(setUserData(null));
      
      // Then call API
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
      
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a2e] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // No user data after initializing
  if (!userData) {
    return null; // Will redirect in useEffect
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <AdvisorDashboardPage />;
      case "trade":
        return <AdvisorTradePage />;
      case "history":
        return <AdvisorHistoryPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <AdvisorDashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdvisorSidebar 
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

export default AdvisorDashboard;
