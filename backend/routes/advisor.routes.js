import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/roleCheck.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  submitOnboarding,
  updateProfile,
  getDashboardStats,
  getAdvisorProfile,
  getAllAdvisors,
} from "../controller/advisor.controller.js";

const AdvisorRouter = express.Router();

// Onboarding
AdvisorRouter.post(
  "/onboarding",
  isAuth,
  checkRole("advisor"),
  upload.single("sebiCertificate"),
  submitOnboarding
);

// Profile management
AdvisorRouter.put(
  "/profile",
  isAuth,
  checkRole("advisor"),
  upload.single("profilePicture"),
  updateProfile
);

// Dashboard stats
AdvisorRouter.get("/dashboard/stats", isAuth, checkRole("advisor"), getDashboardStats);

// Public routes
AdvisorRouter.get("/profile/:advisorId", getAdvisorProfile);
AdvisorRouter.get("/all", getAllAdvisors);

export default AdvisorRouter;
