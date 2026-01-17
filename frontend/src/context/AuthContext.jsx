import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth, provider } from '../utils/firebase';
import { signInWithPopup } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const serverUrl = "http://localhost:8901";

  // Fetch current user on mount
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true
      });
      console.log("Current User Data:", res.data.user);
      setUserData(res.data.user);
    } catch (error) {
      console.error("Failed to fetch user data", error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Check if user exists
  const checkUserExists = async (email) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/check-user`,
        { email },
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      console.error("Error checking user:", error);
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUserData(res.data.user);
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Signup
  const signup = async (name, email, password, role, sebiRegistrationNumber = null, phone = null) => {
    try {
      const payload = { name, email, password, role };
      
      // Add advisor-specific fields
      if (role === "advisor") {
        if (sebiRegistrationNumber) payload.sebiRegistrationNumber = sebiRegistrationNumber;
        if (phone) payload.phone = phone;
      }
      
      const res = await axios.post(
        `${serverUrl}/api/auth/signup`,
        payload,
        { withCredentials: true }
      );
      setUserData(res.data.user);
      return res.data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Google OAuth
  const googleSignIn = async (role = null) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const payload = {
        name: user.displayName,
        email: user.email,
      };
      
      if (role) {
        payload.role = role;
      }
      
      const res = await axios.post(
        `${serverUrl}/api/auth/google`,
        payload,
        { withCredentials: true }
      );
      
      if (res.data.requiresRole) {
        // Store pending auth data for role selection
        return { requiresRole: true, pendingAuth: payload };
      }
      
      setUserData(res.data.user);
      return res.data;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  // Complete Google signup with role
  const completeGoogleSignup = async (name, email, role) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/google`,
        { name, email, role },
        { withCredentials: true }
      );
      setUserData(res.data.user);
      return res.data;
    } catch (error) {
      console.error("Complete Google signup error:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.post(
        `${serverUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUserData(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const value = {
    userData,
    loading,
    serverUrl,
    login,
    signup,
    googleSignIn,
    completeGoogleSignup,
    logout,
    checkUserExists,
    refreshUser,
    setUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
