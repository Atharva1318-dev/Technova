import express from "express";
import {
  getAdvisorBlockchainTrades,
  verifyTrade,
  compareAdvisorData,
  getExplorerLink,
} from "../controller/blockchain.controller.js";

const BlockchainRouter = express.Router();

// Public routes for blockchain verification
BlockchainRouter.get("/advisor/:advisorId/trades", getAdvisorBlockchainTrades);
BlockchainRouter.get("/trade/:tradeId/verify", verifyTrade);
BlockchainRouter.get("/advisor/:advisorId/compare", compareAdvisorData);
BlockchainRouter.get("/trade/:tradeId/explorer", getExplorerLink);

export default BlockchainRouter;
