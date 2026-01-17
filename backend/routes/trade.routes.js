import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { checkRole, checkAdvisorVerified } from "../middleware/roleCheck.middleware.js";
import {
  createSignal,
  getAdvisorTrades,
  updateTrade,
  closeTrade,
  getAllSignals,
  cancelPendingTrade,
  getMonitorStatus,
  restartMonitors,
} from "../controller/trade.controller.js";

const TradeRouter = express.Router();

// Advisor routes (require verification)
TradeRouter.post(
  "/signal",
  isAuth,
  checkRole("advisor"),
  // checkAdvisorVerified,
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
  // checkAdvisorVerified,
  updateTrade
);

TradeRouter.post(
  "/:tradeId/close",
  isAuth,
  checkRole("advisor"),
  checkAdvisorVerified,
  closeTrade
);

TradeRouter.delete(
  "/:tradeId/cancel",
  isAuth,
  checkRole("advisor"),
  cancelPendingTrade
);

// Public routes (for investors)
TradeRouter.get("/signals", getAllSignals);

// Monitor management routes (admin/debug)
TradeRouter.get(
  "/monitors/status",
  isAuth,
  getMonitorStatus
);

TradeRouter.post(
  "/monitors/restart",
  isAuth,
  checkRole("advisor"),
  restartMonitors
);

export default TradeRouter;
