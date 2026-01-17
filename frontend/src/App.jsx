import React from "react";
import { Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp.jsx";
import Login from "./components/Login.jsx";
import { ToastContainer } from "react-toastify";
import Home from "./pages/Home.jsx";
import RoleSelection from "./pages/RoleSelection.jsx";
import AdvisorOnboarding from "./pages/AdvisorOnboarding.jsx";
import AdvisorDashboard from "./pages/AdvisorDashboard.jsx";
import InvestorDashboard from "./pages/InvestorDashboard.jsx";
import UserDataContext from "./context/UserDataContext.jsx";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

const App = () => {
  const userData = useSelector((state) => state.user.userData);
  
  return (
    <div>
      <ToastContainer
        position="top-left"
        hideProgressBar={true}
        autoClose={1000}
        theme="dark"
        toastStyle={{
          background: "#18181b",
          color: "#fafafa",
          borderRadius: "10px",
          fontWeight: "500",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      />
      <UserDataContext />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={userData ? <Navigate to="/" /> : <SignUp />} />
        <Route path="/login" element={userData ? <Navigate to="/" /> : <Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route 
          path="/advisor/onboarding" 
          element={
            userData && userData.role === "advisor" 
              ? <AdvisorOnboarding /> 
              : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/advisor/dashboard" 
          element={
            userData && userData.role === "advisor" 
              ? <AdvisorDashboard /> 
              : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/investor/dashboard" 
          element={
            userData && userData.role === "investor" 
              ? <InvestorDashboard /> 
              : <Navigate to="/login" />
          } 
        />
        {/* TODO: Add admin panel when component is created */}
        {/* <Route path="/admin/panel" element={<AdminPanel />} /> */}
      </Routes>
    </div>
  );
};

export default App;
