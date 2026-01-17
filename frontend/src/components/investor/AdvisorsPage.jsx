import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { Award, TrendingUp, Users, Target, Star } from "lucide-react";

import AdvisorsGrid from "../advisor/AdvisoryGrid";


const AdvisorsPage = () => {
  const [advisors, setAdvisors] = useState([]);
  const [followedAdvisors, setFollowedAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("trustScore");
  const { serverUrl } = useContext(AuthDataContext);
  

  useEffect(() => {
  fetchAdvisors();
  fetchCurrentUser(); // ✅ ADD
}, [sortBy]);


  const isAdvisorFollowed = (advisorId) => {
  return followedAdvisors.includes(advisorId);
};


  const fetchAdvisors = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/advisor/all?sortBy=${sortBy}`,
        { withCredentials: true }
      );

      console.log("Full API response:", response);
      console.log("Advisors array:", response.data.advisors);
      console.log("Number of advisors:", response.data.advisors?.length);

      setAdvisors(response.data.advisors);
    } catch (error) {
      console.error("Error fetching advisors:", error);
      toast.error("Failed to load advisors");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
  try {
    const res = await axios.get(
      `${serverUrl}/api/user/current`,
      { withCredentials: true }
    );

    setFollowedAdvisors(res.data.user.followedAdvisors || []);
  } catch (error) {
    console.error("Failed to fetch current user");
  }
};


  const handleFollow = async (advisorId) => {
  try {
    await axios.post(
      `${serverUrl}/api/investor/follow/${advisorId}`,
      {},
      { withCredentials: true }
    );

    // ✅ Update local state immediately
    setFollowedAdvisors((prev) => [...prev, advisorId]);

    toast.success("Advisor followed!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to follow advisor");
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077b6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advisors</h1>
          <p className="text-gray-600 mt-1">Discover verified SEBI-registered advisors</p>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white text-black px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6]"
        >
          <option value="trustScore" className="text-black">Sort by Trust Score</option>
          <option value="winRate" className="text-black">Sort by Win Rate</option>
          <option value="subscribers" className="text-black">Sort by Subscribers</option>
        </select>
      </div>

      {/* Advisors Grid */}
      {advisors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No advisors available</p>
        </div>
      ) : (
        <AdvisorsGrid
  advisors={advisors}
  onFollow={handleFollow}
  isAdvisorFollowed={isAdvisorFollowed}
/>

      )}
    </div>
  );
};

export default AdvisorsPage;
