import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/roleCheck.middleware.js";
import {
  getPendingVerifications,
  approveAdvisor,
  rejectAdvisor,
  correctTrade,
  getAdminLogs,
  getSystemHealth,
  suspendUser,
} from "../controller/admin.controller.js";

const AdminRouter = express.Router();

// All routes require admin role
AdminRouter.use(isAuth, checkRole("admin"));

// Verification queue
AdminRouter.get("/verifications/pending", getPendingVerifications);
AdminRouter.post("/advisor/:advisorId/approve", approveAdvisor);
AdminRouter.post("/advisor/:advisorId/reject", rejectAdvisor);

// Dispute resolution
AdminRouter.put("/trade/:tradeId/correct", correctTrade);

// User management
AdminRouter.post("/user/:userId/suspend", suspendUser);

// Logs and monitoring
AdminRouter.get("/logs", getAdminLogs);
AdminRouter.get("/health", getSystemHealth);

export default AdminRouter;
