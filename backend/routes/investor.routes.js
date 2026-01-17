import express from "express";
import isAuth from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/roleCheck.middleware.js";
import {
  followSignal,
  getPaperTrades,
  closePaperTrade,
  getPortfolioSummary,
  toggleFollowAdvisor,
} from "../controller/investor.controller.js";

const InvestorRouter = express.Router();

// Paper trading
InvestorRouter.post(
  "/paper-trade/follow",
  isAuth,
  checkRole("investor"),
  followSignal
);

InvestorRouter.get(
  "/paper-trades",
  isAuth,
  checkRole("investor"),
  getPaperTrades
);

InvestorRouter.post(
  "/paper-trade/:paperTradeId/close",
  isAuth,
  checkRole("investor"),
  closePaperTrade
);

InvestorRouter.get(
  "/portfolio/summary",
  isAuth,
  checkRole("investor"),
  getPortfolioSummary
);

// Follow/unfollow advisor
InvestorRouter.post(
  "/follow/:advisorId",
  isAuth,
  checkRole("investor"),
  toggleFollowAdvisor
);

export default InvestorRouter;
