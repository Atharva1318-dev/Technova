import User from "../models/user.models.js";
import Trade from "../models/trade.models.js";
import AdminAction from "../models/adminAction.models.js";
import { generateAdvisorWallet } from "../services/solana.service.js";

// Get pending advisor verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const pendingAdvisors = await User.find({
      role: "advisor",
      verificationStatus: "pending",
    }).select("-password");

    return res.status(200).json({ advisors: pendingAdvisors });
  } catch (error) {
    console.error("Error in getPendingVerifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Approve advisor
export const approveAdvisor = async (req, res) => {
  try {
    const adminId = req.userId;
    const { advisorId } = req.params;
    const { notes } = req.body;

    const advisor = await User.findById(advisorId);

    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    if (advisor.verificationStatus === "approved") {
      return res.status(400).json({ message: "Advisor is already approved" });
    }

    // Generate Solana wallet for advisor
    const wallet = await generateAdvisorWallet();

    // Update advisor
    const previousData = {
      verificationStatus: advisor.verificationStatus,
      isVerified: advisor.isVerified,
      solanaWallet: advisor.solanaWallet,
    };

    advisor.verificationStatus = "approved";
    advisor.isVerified = true;
    advisor.solanaWallet = wallet.publicKey;
    await advisor.save();

    // Log admin action
    await AdminAction.create({
      adminId,
      actionType: "advisor-approved",
      targetUserId: advisorId,
      reason: "Advisor verification approved",
      previousData,
      newData: {
        verificationStatus: "approved",
        isVerified: true,
        solanaWallet: wallet.publicKey,
      },
      notes,
    });

    return res.status(200).json({
      message: "Advisor approved successfully",
      advisor,
    });
  } catch (error) {
    console.error("Error in approveAdvisor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reject advisor
export const rejectAdvisor = async (req, res) => {
  try {
    const adminId = req.userId;
    const { advisorId } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const advisor = await User.findById(advisorId);

    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    const previousData = {
      verificationStatus: advisor.verificationStatus,
      isVerified: advisor.isVerified,
    };

    advisor.verificationStatus = "rejected";
    advisor.isVerified = false;
    await advisor.save();

    // Log admin action
    await AdminAction.create({
      adminId,
      actionType: "advisor-rejected",
      targetUserId: advisorId,
      reason,
      previousData,
      newData: {
        verificationStatus: "rejected",
        isVerified: false,
      },
      notes,
    });

    return res.status(200).json({
      message: "Advisor rejected",
      advisor,
    });
  } catch (error) {
    console.error("Error in rejectAdvisor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Correct trade data (dispute resolution)
export const correctTrade = async (req, res) => {
  try {
    const adminId = req.userId;
    const { tradeId } = req.params;
    const { corrections, reason, notes } = req.body;

    if (!corrections || !reason) {
      return res.status(400).json({ 
        message: "Corrections and reason are required" 
      });
    }

    const trade = await Trade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    const previousData = trade.toObject();

    // Apply corrections
    Object.keys(corrections).forEach((key) => {
      if (trade[key] !== undefined) {
        trade[key] = corrections[key];
      }
    });

    await trade.save();

    // Log admin action
    await AdminAction.create({
      adminId,
      actionType: "trade-corrected",
      targetTradeId: tradeId,
      reason,
      previousData,
      newData: trade.toObject(),
      notes,
    });

    return res.status(200).json({
      message: "Trade corrected successfully",
      trade,
    });
  } catch (error) {
    console.error("Error in correctTrade:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get admin action logs
export const getAdminLogs = async (req, res) => {
  try {
    const { actionType, targetUserId, limit = 50 } = req.query;

    const filter = {};
    if (actionType) filter.actionType = actionType;
    if (targetUserId) filter.targetUserId = targetUserId;

    const logs = await AdminAction.find(filter)
      .populate("adminId", "name email")
      .populate("targetUserId", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ logs });
  } catch (error) {
    console.error("Error in getAdminLogs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get system health metrics
export const getSystemHealth = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdvisors = await User.countDocuments({ role: "advisor" });
    const verifiedAdvisors = await User.countDocuments({ 
      role: "advisor", 
      isVerified: true 
    });
    const pendingAdvisors = await User.countDocuments({ 
      role: "advisor", 
      verificationStatus: "pending" 
    });
    const totalInvestors = await User.countDocuments({ role: "investor" });

    const totalTrades = await Trade.countDocuments();
    const activeTrades = await Trade.countDocuments({ status: "active" });
    const closedTrades = await Trade.countDocuments({ status: "closed" });

    const health = {
      users: {
        total: totalUsers,
        advisors: totalAdvisors,
        verifiedAdvisors,
        pendingAdvisors,
        investors: totalInvestors,
      },
      trades: {
        total: totalTrades,
        active: activeTrades,
        closed: closedTrades,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    };

    return res.status(200).json({ health });
  } catch (error) {
    console.error("Error in getSystemHealth:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Suspend user
export const suspendUser = async (req, res) => {
  try {
    const adminId = req.userId;
    const { userId } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Suspension reason is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousData = {
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
    };

    user.isVerified = false;
    user.verificationStatus = "rejected";
    await user.save();

    // Log admin action
    await AdminAction.create({
      adminId,
      actionType: "user-suspended",
      targetUserId: userId,
      reason,
      previousData,
      newData: {
        isVerified: false,
        verificationStatus: "rejected",
      },
      notes,
    });

    return res.status(200).json({
      message: "User suspended successfully",
      user,
    });
  } catch (error) {
    console.error("Error in suspendUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  getPendingVerifications,
  approveAdvisor,
  rejectAdvisor,
  correctTrade,
  getAdminLogs,
  getSystemHealth,
  suspendUser,
};
