import Trade from "../models/trade.models.js";
import Signal from "../models/signal.models.js";
import User from "../models/user.models.js";
import { getLivePrice, parseSymbol } from "../services/marketData.service.js";
import { createPendingTrade, createActiveTrade, getActiveTrades, updateActiveTrade, deleteActiveTrade } from "../services/supabase.service.js";
import { emitNewSignal, emitTradeUpdate, emitTradeClosed } from "../services/socket.service.js";
import { writeTradeToBlockchain } from "../services/solana.service.js";
import MonitorManager from "../services/tradeMonitor.service.js";

// Create a new signal/trade
export const createSignal = async (req, res) => {
  try {
    const advisorId = req.userId;
    const {
      symbol,
      orderType,
      direction,
      quantity,
      limitPrice,
      stopPrice,
      stopLoss,
      target,
      notes,
    } = req.body;

    // Validate required fields
    if (!symbol || !orderType || !direction || !quantity || !stopLoss || !target) {
      return res.status(400).json({ 
        message: "All required fields must be provided" 
      });
    }

    // Parse symbol to determine asset class
    const parsedSymbol = parseSymbol(symbol);
    const assetClass = parsedSymbol.type;

    // Get live price for market orders
    let entryPrice;
    if (orderType === "market") {
      entryPrice = await getLivePrice(symbol);
    } else if (orderType === "limit") {
      if (!limitPrice) {
        return res.status(400).json({ message: "Limit price is required for limit orders" });
      }
      entryPrice = limitPrice;
    } else if (orderType === "stop-limit") {
      if (!stopPrice || !limitPrice) {
        return res.status(400).json({ 
          message: "Stop price and limit price are required for stop-limit orders" 
        });
      }
      entryPrice = limitPrice;
    }

    // Create trade in MongoDB
    const trade = await Trade.create({
      advisorId,
      symbol,
      assetClass,
      orderType,
      direction,
      entryPrice,
      limitPrice,
      stopPrice,
      quantity,
      stopLoss,
      target,
      notes,
      status: orderType === "market" ? "active" : "pending",
    });

    // Create signal
    const signal = await Signal.create({
      tradeId: trade._id,
      advisorId,
      symbol,
      assetClass,
      direction,
      entryPrice,
      stopLoss,
      target,
    });

    // Store in Supabase for real-time access
    const supabaseData = {
      trade_id: trade._id.toString(),
      advisor_id: advisorId.toString(),
      symbol,
      asset_class: assetClass,
      order_type: orderType,
      direction,
      entry_price: entryPrice,
      stop_loss: stopLoss,
      target,
      quantity,
      status: trade.status,
      created_at: new Date().toISOString(),
    };

    if (orderType === "market") {
      await createActiveTrade(supabaseData);
    } else {
      await createPendingTrade(supabaseData);
    }

    // Emit real-time signal to investors
    emitNewSignal({
      signalId: signal._id,
      tradeId: trade._id,
      advisorId,
      symbol,
      direction,
      entryPrice,
      stopLoss,
      target,
      assetClass,
    });

    // Start monitoring the trade
    MonitorManager.addMonitor(trade);

    return res.status(201).json({
      message: "Signal created successfully",
      trade,
      signal,
    });
  } catch (error) {
    console.error("Error in createSignal:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get active trades for advisor
export const getAdvisorTrades = async (req, res) => {
  try {
    const advisorId = req.userId;
    const { status } = req.query;

    const filter = { advisorId };
    if (status) {
      filter.status = status;
    }

    const trades = await Trade.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ trades });
  } catch (error) {
    console.error("Error in getAdvisorTrades:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update trade (modify SL/Target only)
export const updateTrade = async (req, res) => {
  try {
    const advisorId = req.userId;
    const { tradeId } = req.params;
    const { stopLoss, target } = req.body;

    const trade = await Trade.findOne({ _id: tradeId, advisorId });

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (trade.status === "closed") {
      return res.status(400).json({ message: "Cannot modify closed trade" });
    }

    // Only allow SL and Target modification
    if (stopLoss !== undefined) {
      trade.stopLoss = stopLoss;
    }
    if (target !== undefined) {
      trade.target = target;
    }

    await trade.save();

    // Update in Supabase
    await updateActiveTrade(tradeId, {
      stop_loss: trade.stopLoss,
      target: trade.target,
    });

    // Update the monitor with new values
    MonitorManager.updateMonitor(tradeId, {
      stopLoss: trade.stopLoss,
      target: trade.target,
    });

    // Emit real-time update
    emitTradeUpdate(advisorId, trade);

    return res.status(200).json({
      message: "Trade updated successfully",
      trade,
    });
  } catch (error) {
    console.error("Error in updateTrade:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Close trade manually
export const closeTrade = async (req, res) => {
  try {
    const advisorId = req.userId;
    const { tradeId } = req.params;
    const { exitPrice, reason } = req.body;

    const trade = await Trade.findOne({ _id: tradeId, advisorId });

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (trade.status === "closed") {
      return res.status(400).json({ message: "Trade is already closed" });
    }

    // Get exit price
    const finalExitPrice = exitPrice || (await getLivePrice(trade.symbol));

    // Calculate P&L
    const profitLoss = trade.direction === "buy"
      ? (finalExitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - finalExitPrice) * trade.quantity;

    const profitLossPercentage = ((finalExitPrice - trade.entryPrice) / trade.entryPrice) * 100;

    // Determine outcome
    let outcome = "breakeven";
    if (profitLoss > 0) outcome = "profit";
    if (profitLoss < 0) outcome = "loss";

    // Update trade
    trade.exitPrice = finalExitPrice;
    trade.profitLoss = profitLoss;
    trade.profitLossPercentage = profitLossPercentage;
    trade.outcome = outcome;
    trade.status = "closed";
    trade.closedAt = new Date();
    trade.closedReason = reason || "manual";

    await trade.save();

    // Update signal
    await Signal.findOneAndUpdate(
      { tradeId: trade._id },
      { status: "closed" }
    );

    // Remove from Supabase active trades
    await deleteActiveTrade(tradeId);

    // Write to blockchain
    const advisor = await User.findById(advisorId);
    if (advisor.solanaWallet) {
      try {
        const blockchainResult = await writeTradeToBlockchain({
          advisorPublicKey: advisor.solanaWallet,
          tradeDetails: {
            symbol: trade.symbol,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            profitLoss: trade.profitLoss,
          },
        });
        trade.solanaTransactionId = blockchainResult.transactionId;
        trade.isOnChain = true;
        await trade.save();
      } catch (blockchainError) {
        console.error("Blockchain write failed:", blockchainError);
      }
    }

    // Update advisor stats
    await User.findByIdAndUpdate(advisorId, {
      $inc: {
        totalTrades: 1,
        totalProfit: outcome === "profit" ? profitLoss : 0,
        totalLoss: outcome === "loss" ? Math.abs(profitLoss) : 0,
      },
    });

    // Stop monitoring the trade
    MonitorManager.removeMonitor(tradeId);

    // Emit real-time update
    emitTradeClosed(advisorId, trade);

    return res.status(200).json({
      message: "Trade closed successfully",
      trade,
    });
  } catch (error) {
    console.error("Error in closeTrade:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all signals (for investor feed)
export const getAllSignals = async (req, res) => {
  try {
    const { assetClass, riskLevel, advisorId } = req.query;

    const filter = { status: "active", isPublic: true };

    if (assetClass) {
      filter.assetClass = assetClass;
    }
    if (riskLevel) {
      filter.riskLevel = riskLevel;
    }
    if (advisorId) {
      filter.advisorId = advisorId;
    }

    const signals = await Signal.find(filter)
      .populate("advisorId", "name profilePicture trustScore winRate")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ signals });
  } catch (error) {
    console.error("Error in getAllSignals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel a pending trade
export const cancelPendingTrade = async (req, res) => {
  try {
    const advisorId = req.userId;
    const { tradeId } = req.params;

    const trade = await Trade.findOne({ _id: tradeId, advisorId });

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (trade.status !== "pending") {
      return res.status(400).json({ message: "Only pending trades can be cancelled" });
    }

    // Update trade status
    trade.status = "cancelled";
    await trade.save();

    // Update signal
    await Signal.findOneAndUpdate(
      { tradeId: trade._id },
      { status: "cancelled" }
    );

    // Remove from Supabase pending trades
    const { deletePendingTrade } = await import("../services/supabase.service.js");
    try {
      await deletePendingTrade(tradeId);
    } catch (supabaseError) {
      console.error("Supabase delete failed:", supabaseError.message);
    }

    // Stop monitoring
    MonitorManager.removeMonitor(tradeId);

    return res.status(200).json({
      message: "Trade cancelled successfully",
      trade,
    });
  } catch (error) {
    console.error("Error in cancelPendingTrade:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get monitor status (for debugging/admin)
export const getMonitorStatus = async (req, res) => {
  try {
    const stats = MonitorManager.getStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getMonitorStatus:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Restart all monitors (useful after server restart)
export const restartMonitors = async (req, res) => {
  try {
    const count = await MonitorManager.restartAllMonitors();
    return res.status(200).json({
      message: "Monitors restarted successfully",
      count,
    });
  } catch (error) {
    console.error("Error in restartMonitors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  createSignal,
  getAdvisorTrades,
  updateTrade,
  closeTrade,
  getAllSignals,
  cancelPendingTrade,
  getMonitorStatus,
  restartMonitors,
};
