import express from "express";
import {
  getAdvisorBlockchainTrades,
  verifyTrade,
  compareAdvisorData,
  getExplorerLink,
  getAdvisorStats,
  checkEscrowStatus,
  createAdvisorEscrow,
  releaseAdvisorEscrow,
} from "../controller/blockchain.controller.js";
import isAuth from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/roleCheck.middleware.js";

const BlockchainRouter = express.Router();

// Public routes for blockchain verification
BlockchainRouter.get("/advisor/:advisorId/trades", getAdvisorBlockchainTrades);
BlockchainRouter.get("/advisor/:advisorId/stats", getAdvisorStats);
BlockchainRouter.get("/advisor/:advisorId/compare", compareAdvisorData);
BlockchainRouter.get("/advisor/:advisorId/escrow", checkEscrowStatus);
BlockchainRouter.get("/trade/:tradeId/verify", verifyTrade);
BlockchainRouter.get("/trade/:tradeId/explorer", getExplorerLink);

// Admin-only routes for escrow management
BlockchainRouter.post(
  "/advisor/:advisorId/escrow/create",
  isAuth,
  checkRole(["admin"]),
  createAdvisorEscrow
);
BlockchainRouter.post(
  "/advisor/:advisorId/escrow/release",
  isAuth,
  checkRole(["admin"]),
  releaseAdvisorEscrow
);

export default BlockchainRouter;
