import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { checkRole, checkAdvisorVerified } from "../middleware/roleCheck.middleware.js";
import {
  createSignal,
  getAdvisorTrades,
  updateTrade,
  closeTrade,
  getAllSignals,
} from "../controller/trade.controller.js";

const TradeRouter = express.Router();

// Advisor routes (require verification)
TradeRouter.post(
  "/signal",
  isAuth,
  checkRole("advisor"),
  checkAdvisorVerified,
  createSignal
);

TradeRouter.get(
  "/advisor/trades",
  isAuth,
  checkRole("advisor"),
  getAdvisorTrades
);

TradeRouter.put(
  "/:tradeId",
  isAuth,
  checkRole("advisor"),
  checkAdvisorVerified,
  updateTrade
);

TradeRouter.post(
  "/:tradeId/close",
  isAuth,
  checkRole("advisor"),
  checkAdvisorVerified,
  closeTrade
);

// Public routes (for investors)
TradeRouter.get("/signals", getAllSignals);

export default TradeRouter;
