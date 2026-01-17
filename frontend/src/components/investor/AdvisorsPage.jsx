import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { Award, TrendingUp, Users, Target, Star } from "lucide-react";

const AdvisorsPage = () => {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("trustScore");
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchAdvisors();
  }, [sortBy]);

  const fetchAdvisors = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/advisor/all?sortBy=${sortBy}`,
        { withCredentials: true }
      );
      setAdvisors(response.data.advisors);
    } catch (error) {
      console.error("Error fetching advisors:", error);
      toast.error("Failed to load advisors");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (advisorId) => {
    try {
      await axios.post(
        `${serverUrl}/api/investor/follow/${advisorId}`,
        {},
        { withCredentials: true }
      );
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
          <h1 className="text-3xl font-bold text-gray-900">Top Advisors</h1>
          <p className="text-gray-600 mt-1">Discover verified SEBI-registered advisors</p>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6]"
        >
          <option value="trustScore">Sort by Trust Score</option>
          <option value="winRate">Sort by Win Rate</option>
          <option value="subscribers">Sort by Subscribers</option>
        </select>
      </div>

      {/* Advisors Grid */}
      {advisors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No advisors available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advisors.map((advisor, index) => (
            <div
              key={advisor._id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:border-[#0077b6] relative overflow-hidden"
            >
              {/* Rank Badge */}
              {index < 3 && (
                <div className="absolute top-4 right-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? "bg-yellow-500" :
                    index === 1 ? "bg-gray-400" :
                    "bg-orange-600"
                  }`}>
                    #{index + 1}
                  </div>
                </div>
              )}

              {/* Advisor Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0077b6] to-[#00b4d8] rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {advisor.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{advisor.name}</h3>
                  <p className="text-xs text-gray-500">SEBI Registered</p>
                </div>
              </div>

              {/* Bio */}
              {advisor.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {advisor.bio}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-yellow-700 font-medium">Trust Score</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">{advisor.trustScore || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-700 font-medium">Win Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {advisor.winRate?.toFixed(1) || 0}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700 font-medium">Total Trades</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{advisor.totalTrades || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-700 font-medium">Subscribers</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{advisor.subscriberCount || 0}</p>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(advisor._id)}
                className="w-full py-3 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Follow Advisor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvisorsPage;
