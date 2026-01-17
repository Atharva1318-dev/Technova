
import User from "../models/user.models.js";
import { uploadToCloudinary } from "../middleware/upload.middleware.js";
import { generateAdvisorWallet } from "../services/solana.service.js";

// Submit advisor onboarding application
export const submitOnboarding = async (req, res) => {
  try {
    const userId = req.userId;
    const { sebiRegistrationNumber, bio, phone } = req.body;

    if (!sebiRegistrationNumber) {
      return res.status(400).json({ 
        message: "SEBI registration number is required" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "SEBI certificate is required" });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "technova/sebi-certificates"
    );

    const user = await User.findByIdAndUpdate(
      userId,
      {
        sebiCertificate: uploadResult.secure_url,
        sebiRegistrationNumber,
        bio: bio || "",
        phone: phone || "",
        verificationStatus: "pending",
      },
      { new: true }
    );

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

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

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

    const stats = {
      subscriberCount: user.subscriberCount || 0,
      totalTrades: user.totalTrades || 0,
      winRate: user.winRate || 0,
      trustScore: user.trustScore || 0,
      totalProfit: user.totalProfit || 0,
      totalLoss: user.totalLoss || 0,
      netProfitLoss: (user.totalProfit || 0) - (user.totalLoss || 0),
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

export default {
  submitOnboarding,
  updateProfile,
  getDashboardStats,
  getAdvisorProfile,
  getAllAdvisors,
};
