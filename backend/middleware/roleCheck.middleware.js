import User from "../models/user.models.js";

// Check if user has required role
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId; // Set by isAuth middleware
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required role: ${allowedRoles.join(" or ")}` 
        });
      }

      req.user = user; // Attach user to request
      next();
    } catch (error) {
      console.error("Error in role check middleware:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Check if advisor is verified
export const checkAdvisorVerified = async (req, res, next) => {
  try {
    const user = req.user; // Set by checkRole middleware
    
    if (user.role !== "advisor") {
      return res.status(403).json({ message: "Only advisors can access this resource" });
    }

    if (!user.isVerified || user.verificationStatus !== "approved") {
      return res.status(403).json({ 
        message: "Your advisor account is not verified yet. Please wait for admin approval." 
      });
    }

    next();
  } catch (error) {
    console.error("Error in advisor verification check:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  checkRole,
  checkAdvisorVerified,
};
