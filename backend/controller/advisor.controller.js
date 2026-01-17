import User from "../models/user.models.js";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";
import { generateOTP, sendOTP, storeOTP, verifyOTP, normalizePhone } from "../services/sms.service.js";
import { generateAdvisorWallet } from "../services/solana.service.js";

// Send OTP for phone verification
export const sendPhoneOTP = async (req, res) => {
  try {
    const userId = req.userId;
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(phone);
    console.log(`SendOTP: ${phone} → ${normalizedPhone}`);

    const otp = generateOTP();
    storeOTP(normalizedPhone, otp);

    try {
      await sendOTP(normalizedPhone, otp);
    } catch (sendErr) {
      console.error("Send OTP error:", sendErr.message);
      return res.status(500).json({ 
        message: sendErr.message || "Failed to send OTP",
        hint: "If using WhatsApp sandbox, recipient must join sandbox first: send 'join <code>' to +14155238886"
      });
    }

    await User.findByIdAndUpdate(userId, { 
      phone: normalizedPhone,
      phoneVerified: false 
    });

    return res.status(200).json({
      message: "OTP sent successfully via WhatsApp",
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error("Error in sendPhoneOTP:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Verify phone OTP — SET isVerified: true HERE
export const verifyPhoneOTP = async (req, res) => {
  try {
    const userId = req.userId;
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const normalizedPhone = normalizePhone(phone);
    const verification = verifyOTP(normalizedPhone, otp);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    // Set isVerified: true when OTP is verified
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        phone: normalizedPhone, 
        phoneVerified: true,
        isVerified: true  // Set to true after OTP verification
      },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Phone verified successfully",
      user,
    });
  } catch (error) {
    console.error("Error in verifyPhoneOTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Submit advisor onboarding application
export const submitOnboarding = async (req, res) => {
  try {
    const userId = req.userId;
    const { sebiRegistrationNumber, bio, phone } = req.body;

    if (!sebiRegistrationNumber || !phone) {
      return res.status(400).json({ 
        message: "SEBI registration number and phone are required" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "SEBI certificate is required" });
    }

    // Normalize phone BEFORE storing
    const normalizedPhone = normalizePhone(phone);
    console.log(`Onboarding: ${phone} → ${normalizedPhone}`);

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "technova/sebi-certificates"
    );

    // Do NOT set isVerified here — it's already set in OTP verification
    const user = await User.findByIdAndUpdate(
      userId,
      {
        sebiCertificate: uploadResult.secure_url,
        sebiRegistrationNumber,
        bio: bio || "",
        phone: normalizedPhone,
        phoneVerified: true,
        verificationStatus: "pending",  // Admin will change to "approved"
        // isVerified remains true (already set from OTP step)
      },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Onboarding application submitted successfully",
      user,
    });
  } catch (error) {
    console.error("Error in submitOnboarding:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update advisor profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { bio } = req.body;

    const updateData = {};

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "technova/profile-pictures"
      );
      updateData.profilePicture = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, select: "-password" }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get advisor dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Import Trade model to get active trades count
    const Trade = (await import("../models/trade.models.js")).default;
    
    // Get active trades count
    const activeTrades = await Trade.countDocuments({
      advisorId: userId,
      status: "active"
    });

    // Get won and lost trades count
    const wonTrades = await Trade.countDocuments({
      advisorId: userId,
      status: "closed",
      outcome: "profit"
    });

    const lostTrades = await Trade.countDocuments({
      advisorId: userId,
      status: "closed",
      outcome: "loss"
    });

    // Calculate today's P&L (mock for now - you can implement actual logic)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await Trade.find({
      advisorId: userId,
      status: "closed",
      closedAt: { $gte: today }
    }).select("profitLoss");

    const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);

    const stats = {
      subscriberCount: user.subscriberCount || 0,
      totalTrades: user.totalTrades || 0,
      activeTrades: activeTrades || 0,
      wonTrades: wonTrades || 0,
      lostTrades: lostTrades || 0,
      winRate: user.winRate || 0,
      trustScore: user.trustScore || 0,
      totalProfit: user.totalProfit || 0,
      totalLoss: user.totalLoss || 0,
      netProfitLoss: (user.totalProfit || 0) - (user.totalLoss || 0),
      todayPnL: todayPnL || 0,
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get advisor profile
export const getAdvisorProfile = async (req, res) => {
  try {
    const { advisorId } = req.params;

    const advisor = await User.findById(advisorId).select(
      "-password -sebiCertificate -phone"
    );

    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    return res.status(200).json({ advisor });
  } catch (error) {
    console.error("Error in getAdvisorProfile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all verified advisors
export const getAllAdvisors = async (req, res) => {
  try {
    const { minWinRate, sortBy } = req.query;

    const filter = {
      role: "advisor",
      isVerified: true,
      verificationStatus: "approved",
    };

    if (minWinRate) {
      filter.winRate = { $gte: parseFloat(minWinRate) };
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === "trustScore") sortOptions = { trustScore: -1 };
    else if (sortBy === "winRate") sortOptions = { winRate: -1 };
    else if (sortBy === "subscribers") sortOptions = { subscriberCount: -1 };

    const advisors = await User.find(filter)
      .select("-password -sebiCertificate -phone")
      .sort(sortOptions)
      .limit(50);

    return res.status(200).json({ advisors });
  } catch (error) {
    console.error("Error in getAllAdvisors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get recent activity for advisor dashboard
export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const Trade = (await import("../models/trade.models.js")).default;
    
    // Get recent closed trades (last 10)
    const recentTrades = await Trade.find({
      advisorId: userId,
      status: "closed"
    })
      .sort({ closedAt: -1 })
      .limit(10)
      .select("symbol direction outcome profitLoss closedReason closedAt");

    // Build activity feed
    const activities = [];

    // Add trade outcomes
    recentTrades.forEach((trade) => {
      const isProfit = trade.profitLoss > 0;
      const timeAgo = getTimeAgo(trade.closedAt);
      
      if (trade.closedReason === "target-hit") {
        activities.push({
          type: "target_hit",
          title: `🎯 Target Hit - ${trade.symbol}`,
          description: `${trade.direction.toUpperCase()} trade closed with ₹${Math.abs(trade.profitLoss).toFixed(2)} profit`,
          time: timeAgo,
          timestamp: trade.closedAt
        });
      } else if (trade.closedReason === "sl-hit") {
        activities.push({
          type: "sl_hit",
          title: `🛑 Stop Loss Hit - ${trade.symbol}`,
          description: `${trade.direction.toUpperCase()} trade closed with ₹${Math.abs(trade.profitLoss).toFixed(2)} loss`,
          time: timeAgo,
          timestamp: trade.closedAt
        });
      } else if (trade.closedReason === "manual") {
        activities.push({
          type: "trade_closed",
          title: `${isProfit ? '✅' : '❌'} Trade Closed - ${trade.symbol}`,
          description: `Manually closed with ${isProfit ? 'profit' : 'loss'} of ₹${Math.abs(trade.profitLoss).toFixed(2)}`,
          time: timeAgo,
          timestamp: trade.closedAt
        });
      }
    });

    // Mock new subscriber notifications (you can replace with actual subscriber tracking)
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 2);
    
    // Add some mock subscriber activities
    activities.push({
      type: "new_subscriber",
      title: "🎉 New Subscriber",
      description: "A new investor started following your signals",
      time: "2 hours ago",
      timestamp: recentDate
    });

    // Mock trade acknowledgments
    const ackDate = new Date();
    ackDate.setHours(ackDate.getHours() - 1);
    
    activities.push({
      type: "trade_acknowledged",
      title: "📊 Signal Published",
      description: "Your latest signal has been published to investors",
      time: "1 hour ago",
      timestamp: ackDate
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit to 15 most recent activities
    const limitedActivities = activities.slice(0, 15);

    return res.status(200).json({ activities: limitedActivities });
  } catch (error) {
    console.error("Error in getRecentActivity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

export default {
  sendPhoneOTP,
  verifyPhoneOTP,
  submitOnboarding,
  updateProfile,
  getDashboardStats,
  getAdvisorProfile,
  getAllAdvisors,
  getRecentActivity,
};