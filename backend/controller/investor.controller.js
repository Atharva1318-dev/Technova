import PaperTrade from "../models/paperTrade.models.js";
import Trade from "../models/trade.models.js";
import User from "../models/user.models.js";
import { emitPaperTradeUpdate } from "../services/socket.service.js";

// Follow a signal (create paper trade)
export const followSignal = async (req, res) => {
  try {
    const investorId = req.userId;
    const { tradeId, quantity } = req.body;

    if (!tradeId || !quantity) {
      return res.status(400).json({ message: "Trade ID and quantity are required" });
    }

    // Get the original trade
    const trade = await Trade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (trade.status !== "active") {
      return res.status(400).json({ message: "Trade is not active" });
    }

    // Check if investor has enough virtual balance
    const investor = await User.findById(investorId);
    const requiredBalance = trade.entryPrice * quantity;

    if (investor.paperTradingBalance < requiredBalance) {
      return res.status(400).json({ 
        message: "Insufficient paper trading balance",
        required: requiredBalance,
        available: investor.paperTradingBalance,
      });
    }

    // Create paper trade
    const paperTrade = await PaperTrade.create({
      investorId,
      tradeId: trade._id,
      advisorId: trade.advisorId,
      symbol: trade.symbol,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      quantity,
      stopLoss: trade.stopLoss,
      target: trade.target,
      status: "active",
    });

    // Deduct from paper trading balance
    investor.paperTradingBalance -= requiredBalance;
    await investor.save();

    // Increment advisor's subscriber count
    await User.findByIdAndUpdate(trade.advisorId, {
      $inc: { subscriberCount: 1 },
    });

    // Add advisor to followed list
    if (!investor.followedAdvisors.includes(trade.advisorId)) {
      investor.followedAdvisors.push(trade.advisorId);
      await investor.save();
    }

    // Increment signal followers
    const Signal = (await import("../models/signal.models.js")).default;
    await Signal.findOneAndUpdate(
      { tradeId: trade._id },
      { $inc: { followers: 1 } }
    );

    return res.status(201).json({
      message: "Signal followed successfully",
      paperTrade,
    });
  } catch (error) {
    console.error("Error in followSignal:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get investor's paper trades
export const getPaperTrades = async (req, res) => {
  try {
    const investorId = req.userId;
    const { status } = req.query;

    const filter = { investorId };
    if (status) {
      filter.status = status;
    }

    const paperTrades = await PaperTrade.find(filter)
      .populate("advisorId", "name profilePicture trustScore")
      .sort({ createdAt: -1 });

    return res.status(200).json({ paperTrades });
  } catch (error) {
    console.error("Error in getPaperTrades:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Close paper trade manually
export const closePaperTrade = async (req, res) => {
  try {
    const investorId = req.userId;
    const { paperTradeId } = req.params;
    const { exitPrice } = req.body;

    const paperTrade = await PaperTrade.findOne({ 
      _id: paperTradeId, 
      investorId 
    });

    if (!paperTrade) {
      return res.status(404).json({ message: "Paper trade not found" });
    }

    if (paperTrade.status === "closed") {
      return res.status(400).json({ message: "Paper trade is already closed" });
    }

    // Calculate P&L
    const finalExitPrice = exitPrice || paperTrade.entryPrice; // Use entry price if no exit price provided
    const profitLoss = paperTrade.direction === "buy"
      ? (finalExitPrice - paperTrade.entryPrice) * paperTrade.quantity
      : (paperTrade.entryPrice - finalExitPrice) * paperTrade.quantity;

    const profitLossPercentage = ((finalExitPrice - paperTrade.entryPrice) / paperTrade.entryPrice) * 100;

    // Determine outcome
    let outcome = "breakeven";
    if (profitLoss > 0) outcome = "profit";
    if (profitLoss < 0) outcome = "loss";

    // Update paper trade
    paperTrade.exitPrice = finalExitPrice;
    paperTrade.profitLoss = profitLoss;
    paperTrade.profitLossPercentage = profitLossPercentage;
    paperTrade.outcome = outcome;
    paperTrade.status = "closed";
    paperTrade.closedAt = new Date();
    paperTrade.closedReason = "manual";

    await paperTrade.save();

    // Update investor's paper trading balance
    const investor = await User.findById(investorId);
    const returnAmount = (paperTrade.entryPrice * paperTrade.quantity) + profitLoss;
    investor.paperTradingBalance += returnAmount;
    await investor.save();

    // Emit real-time update
    emitPaperTradeUpdate(investorId, paperTrade);

    return res.status(200).json({
      message: "Paper trade closed successfully",
      paperTrade,
      newBalance: investor.paperTradingBalance,
    });
  } catch (error) {
    console.error("Error in closePaperTrade:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get paper trading portfolio summary
export const getPortfolioSummary = async (req, res) => {
  try {
    const investorId = req.userId;

    const investor = await User.findById(investorId);
    const activeTrades = await PaperTrade.find({ 
      investorId, 
      status: "active" 
    });
    const closedTrades = await PaperTrade.find({ 
      investorId, 
      status: "closed" 
    });

    const totalProfit = closedTrades
      .filter(t => t.outcome === "profit")
      .reduce((sum, t) => sum + t.profitLoss, 0);

    const totalLoss = Math.abs(
      closedTrades
        .filter(t => t.outcome === "loss")
        .reduce((sum, t) => sum + t.profitLoss, 0)
    );

    const winningTrades = closedTrades.filter(t => t.outcome === "profit").length;
    const losingTrades = closedTrades.filter(t => t.outcome === "loss").length;
    const winRate = closedTrades.length > 0 
      ? (winningTrades / closedTrades.length) * 100 
      : 0;

    const summary = {
      balance: investor.paperTradingBalance,
      activeTrades: activeTrades.length,
      totalTrades: closedTrades.length,
      winningTrades,
      losingTrades,
      winRate: parseFloat(winRate.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      netProfitLoss: parseFloat((totalProfit - totalLoss).toFixed(2)),
    };

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Error in getPortfolioSummary:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Follow/unfollow an advisor
export const toggleFollowAdvisor = async (req, res) => {
  try {
    const investorId = req.userId;
    const { advisorId } = req.params;

    const investor = await User.findById(investorId);
    const advisor = await User.findById(advisorId);

    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    const isFollowing = investor.followedAdvisors.includes(advisorId);

    if (isFollowing) {
      // Unfollow
      investor.followedAdvisors = investor.followedAdvisors.filter(
        id => id.toString() !== advisorId
      );
      await investor.save();

      await User.findByIdAndUpdate(advisorId, {
        $inc: { subscriberCount: -1 },
      });

      return res.status(200).json({ 
        message: "Unfollowed advisor", 
        isFollowing: false 
      });
    } else {
      // Follow
      investor.followedAdvisors.push(advisorId);
      await investor.save();

      await User.findByIdAndUpdate(advisorId, {
        $inc: { subscriberCount: 1 },
      });

      return res.status(200).json({ 
        message: "Followed advisor", 
        isFollowing: true 
      });
    }
  } catch (error) {
    console.error("Error in toggleFollowAdvisor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  followSignal,
  getPaperTrades,
  closePaperTrade,
  getPortfolioSummary,
  toggleFollowAdvisor,
};
