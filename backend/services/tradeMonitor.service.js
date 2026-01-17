import { getLivePrice } from "./marketData.service.js";
import { 
  updateActiveTrade, 
  deleteActiveTrade, 
  movePendingToActive,
  deletePendingTrade 
} from "./supabase.service.js";
import { 
  emitTradeUpdate, 
  emitTargetHit, 
  emitStopLossHit, 
  emitTradeClosed 
} from "./socket.service.js";
import { writeTradeToBlockchain } from "./solana.service.js";
import Trade from "../models/trade.models.js";
import Signal from "../models/signal.models.js";
import User from "../models/user.models.js";

/**
 * TradeMonitor Class
 * Monitors a single trade for price changes and executes based on conditions
 */
class TradeMonitor {
  constructor(tradeData) {
    this.tradeId = tradeData._id.toString();
    this.advisorId = tradeData.advisorId.toString();
    this.symbol = tradeData.symbol;
    this.orderType = tradeData.orderType;
    this.direction = tradeData.direction;
    this.entryPrice = tradeData.entryPrice;
    this.limitPrice = tradeData.limitPrice;
    this.stopPrice = tradeData.stopPrice;
    this.quantity = tradeData.quantity;
    this.stopLoss = tradeData.stopLoss;
    this.target = tradeData.target;
    this.status = tradeData.status;
    this.assetClass = tradeData.assetClass;
    this.notes = tradeData.notes;
    
    this.intervalId = null;
    this.checkInterval = 10000; // Check every 10 seconds
    this.isRunning = false;
    this.lastPrice = null;
    this.errorCount = 0;
    this.maxErrors = 5;
  }

  /**
   * Start monitoring the trade
   */
  start() {
    if (this.isRunning) {
      console.log(`⚠️  Monitor already running for trade ${this.tradeId}`);
      return;
    }

    console.log(`🚀 Starting monitor for trade ${this.tradeId} (${this.symbol})`);
    this.isRunning = true;
    
    // Run initial check immediately
    this.checkPrice();
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkPrice();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring the trade
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log(`🛑 Stopped monitor for trade ${this.tradeId}`);
  }

  /**
   * Update trade parameters (for modifications)
   */
  update(updates) {
    if (updates.stopLoss !== undefined) {
      this.stopLoss = updates.stopLoss;
      console.log(`📝 Updated stop loss for ${this.tradeId}: ${this.stopLoss}`);
    }
    if (updates.target !== undefined) {
      this.target = updates.target;
      console.log(`📝 Updated target for ${this.tradeId}: ${this.target}`);
    }
    if (updates.limitPrice !== undefined) {
      this.limitPrice = updates.limitPrice;
      console.log(`📝 Updated limit price for ${this.tradeId}: ${this.limitPrice}`);
    }
    if (updates.stopPrice !== undefined) {
      this.stopPrice = updates.stopPrice;
      console.log(`📝 Updated stop price for ${this.tradeId}: ${this.stopPrice}`);
    }
  }

  /**
   * Main price checking logic
   */
  async checkPrice() {
    try {
      // Fetch current price
      const currentPrice = await getLivePrice(this.symbol);
      this.lastPrice = currentPrice;
      this.errorCount = 0; // Reset error count on success

      console.log(`💹 ${this.symbol}: Current=${currentPrice}, Entry=${this.entryPrice}, SL=${this.stopLoss}, Target=${this.target}`);

      // Check if trade is pending and needs activation
      if (this.status === "pending") {
        await this.checkPendingOrderActivation(currentPrice);
      }
      // Check if trade is active and needs closure
      else if (this.status === "active") {
        await this.checkActiveTradeConditions(currentPrice);
      }

    } catch (error) {
      this.errorCount++;
      console.error(`❌ Error checking price for ${this.tradeId}:`, error.message);
      
      // Stop monitoring if too many errors
      if (this.errorCount >= this.maxErrors) {
        console.error(`🚨 Max errors reached for ${this.tradeId}. Stopping monitor.`);
        this.stop();
        MonitorManager.removeMonitor(this.tradeId);
      }
    }
  }

  /**
   * Check if pending order should be activated
   */
  async checkPendingOrderActivation(currentPrice) {
    let shouldActivate = false;

    if (this.orderType === "limit") {
      // Limit buy: Activate when price <= limit price
      // Limit sell: Activate when price >= limit price
      if (this.direction === "buy" && currentPrice <= this.limitPrice) {
        shouldActivate = true;
      } else if (this.direction === "sell" && currentPrice >= this.limitPrice) {
        shouldActivate = true;
      }
    } else if (this.orderType === "stop-limit") {
      // Stop-limit: Activate when price crosses stop price
      if (this.direction === "buy" && currentPrice >= this.stopPrice) {
        shouldActivate = true;
      } else if (this.direction === "sell" && currentPrice <= this.stopPrice) {
        shouldActivate = true;
      }
    }

    if (shouldActivate) {
      await this.activatePendingOrder(currentPrice);
    }
  }

  /**
   * Activate a pending order
   */
  async activatePendingOrder(activationPrice) {
    try {
      console.log(`✅ Activating pending order ${this.tradeId} at price ${activationPrice}`);

      // Update MongoDB
      const trade = await Trade.findById(this.tradeId);
      if (!trade) {
        console.error(`Trade ${this.tradeId} not found in MongoDB`);
        this.stop();
        return;
      }

      trade.status = "active";
      trade.entryPrice = activationPrice; // Update entry price to actual activation price
      await trade.save();

      // Update local state
      this.status = "active";
      this.entryPrice = activationPrice;

      // Move from pending to active in Supabase
      try {
        await movePendingToActive(this.tradeId);
      } catch (supabaseError) {
        console.error("Supabase move failed:", supabaseError.message);
        // Continue even if Supabase fails
      }

      // Emit real-time update
      emitTradeUpdate(this.advisorId, trade);

      console.log(`🎉 Trade ${this.tradeId} activated successfully`);
    } catch (error) {
      console.error(`Error activating trade ${this.tradeId}:`, error);
    }
  }

  /**
   * Check if active trade should be closed (SL or Target hit)
   */
  async checkActiveTradeConditions(currentPrice) {
    let shouldClose = false;
    let closeReason = null;
    let outcome = null;

    // Check Stop Loss
    if (this.direction === "buy" && currentPrice <= this.stopLoss) {
      shouldClose = true;
      closeReason = "sl-hit";
      outcome = "loss";
      console.log(`🛑 Stop Loss HIT for ${this.tradeId}: ${currentPrice} <= ${this.stopLoss}`);
    } else if (this.direction === "sell" && currentPrice >= this.stopLoss) {
      shouldClose = true;
      closeReason = "sl-hit";
      outcome = "loss";
      console.log(`🛑 Stop Loss HIT for ${this.tradeId}: ${currentPrice} >= ${this.stopLoss}`);
    }

    // Check Target
    if (this.direction === "buy" && currentPrice >= this.target) {
      shouldClose = true;
      closeReason = "target-hit";
      outcome = "profit";
      console.log(`🎯 Target HIT for ${this.tradeId}: ${currentPrice} >= ${this.target}`);
    } else if (this.direction === "sell" && currentPrice <= this.target) {
      shouldClose = true;
      closeReason = "target-hit";
      outcome = "profit";
      console.log(`🎯 Target HIT for ${this.tradeId}: ${currentPrice} <= ${this.target}`);
    }

    if (shouldClose) {
      await this.closeTrade(currentPrice, closeReason, outcome);
    }
  }

  /**
   * Close the trade and perform all necessary updates
   */
  async closeTrade(exitPrice, reason, outcome) {
    try {
      console.log(`🔒 Closing trade ${this.tradeId} at ${exitPrice} (${reason})`);

      // Stop monitoring first
      this.stop();

      // Fetch trade from MongoDB
      const trade = await Trade.findById(this.tradeId);
      if (!trade) {
        console.error(`Trade ${this.tradeId} not found in MongoDB`);
        MonitorManager.removeMonitor(this.tradeId);
        return;
      }

      // Calculate P&L
      const profitLoss = this.direction === "buy"
        ? (exitPrice - this.entryPrice) * this.quantity
        : (this.entryPrice - exitPrice) * this.quantity;

      const profitLossPercentage = ((exitPrice - this.entryPrice) / this.entryPrice) * 100;

      // Update trade in MongoDB
      trade.exitPrice = exitPrice;
      trade.profitLoss = profitLoss;
      trade.profitLossPercentage = profitLossPercentage;
      trade.outcome = outcome;
      trade.status = "closed";
      trade.closedAt = new Date();
      trade.closedReason = reason;

      await trade.save();

      // Update signal status
      await Signal.findOneAndUpdate(
        { tradeId: trade._id },
        { status: "closed" }
      );

      // Remove from Supabase active trades
      try {
        await deleteActiveTrade(this.tradeId);
      } catch (supabaseError) {
        console.error("Supabase delete failed:", supabaseError.message);
        // Continue even if Supabase fails
      }

      // Write to blockchain
      const advisor = await User.findById(this.advisorId);
      if (advisor && advisor.solanaWallet) {
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
          console.log(`⛓️  Trade ${this.tradeId} written to blockchain: ${blockchainResult.transactionId}`);
        } catch (blockchainError) {
          console.error("Blockchain write failed:", blockchainError.message);
          // Continue even if blockchain fails
        }
      }

      // Update advisor stats
      await User.findByIdAndUpdate(this.advisorId, {
        $inc: {
          totalTrades: 1,
          totalProfit: outcome === "profit" ? profitLoss : 0,
          totalLoss: outcome === "loss" ? Math.abs(profitLoss) : 0,
        },
      });

      // Emit real-time notifications
      if (reason === "target-hit") {
        emitTargetHit(this.advisorId, trade);
      } else if (reason === "sl-hit") {
        emitStopLossHit(this.advisorId, trade);
      }
      emitTradeClosed(this.advisorId, trade);

      console.log(`✅ Trade ${this.tradeId} closed successfully. P&L: ${profitLoss.toFixed(2)}`);

      // Remove from monitor manager
      MonitorManager.removeMonitor(this.tradeId);

    } catch (error) {
      console.error(`Error closing trade ${this.tradeId}:`, error);
      // Restart monitoring if closure fails
      if (!this.isRunning) {
        this.start();
      }
    }
  }

  /**
   * Get monitor status
   */
  getStatus() {
    return {
      tradeId: this.tradeId,
      symbol: this.symbol,
      status: this.status,
      isRunning: this.isRunning,
      lastPrice: this.lastPrice,
      entryPrice: this.entryPrice,
      stopLoss: this.stopLoss,
      target: this.target,
      errorCount: this.errorCount,
    };
  }
}

/**
 * MonitorManager Class
 * Manages all active trade monitors
 */
class MonitorManager {
  static monitors = new Map();

  /**
   * Add a new monitor for a trade
   */
  static addMonitor(tradeData) {
    const tradeId = tradeData._id.toString();

    // Check if monitor already exists
    if (this.monitors.has(tradeId)) {
      console.log(`⚠️  Monitor already exists for trade ${tradeId}`);
      return this.monitors.get(tradeId);
    }

    // Create and start new monitor
    const monitor = new TradeMonitor(tradeData);
    this.monitors.set(tradeId, monitor);
    monitor.start();

    console.log(`✅ Added monitor for trade ${tradeId}. Total monitors: ${this.monitors.size}`);
    return monitor;
  }

  /**
   * Remove a monitor
   */
  static removeMonitor(tradeId) {
    const monitor = this.monitors.get(tradeId);
    if (monitor) {
      monitor.stop();
      this.monitors.delete(tradeId);
      console.log(`🗑️  Removed monitor for trade ${tradeId}. Total monitors: ${this.monitors.size}`);
      return true;
    }
    return false;
  }

  /**
   * Get a specific monitor
   */
  static getMonitor(tradeId) {
    return this.monitors.get(tradeId);
  }

  /**
   * Update a monitor (for trade modifications)
   */
  static updateMonitor(tradeId, updates) {
    const monitor = this.monitors.get(tradeId);
    if (monitor) {
      monitor.update(updates);
      return true;
    }
    console.log(`⚠️  Monitor not found for trade ${tradeId}`);
    return false;
  }

  /**
   * Get all monitors status
   */
  static getAllMonitorsStatus() {
    const statuses = [];
    this.monitors.forEach((monitor) => {
      statuses.push(monitor.getStatus());
    });
    return statuses;
  }

  /**
   * Stop all monitors (for graceful shutdown)
   */
  static stopAll() {
    console.log(`🛑 Stopping all monitors (${this.monitors.size})...`);
    this.monitors.forEach((monitor) => {
      monitor.stop();
    });
    this.monitors.clear();
    console.log("✅ All monitors stopped");
  }

  /**
   * Restart monitoring for all active and pending trades
   * (useful for server restart)
   */
  static async restartAllMonitors() {
    try {
      console.log("🔄 Restarting monitors for all active and pending trades...");

      const trades = await Trade.find({
        status: { $in: ["active", "pending"] }
      });

      for (const trade of trades) {
        this.addMonitor(trade);
      }

      console.log(`✅ Restarted ${trades.length} monitors`);
      return trades.length;
    } catch (error) {
      console.error("Error restarting monitors:", error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  static getStats() {
    const statuses = this.getAllMonitorsStatus();
    const activeCount = statuses.filter(s => s.status === "active").length;
    const pendingCount = statuses.filter(s => s.status === "pending").length;
    const runningCount = statuses.filter(s => s.isRunning).length;

    return {
      totalMonitors: this.monitors.size,
      activeMonitors: activeCount,
      pendingMonitors: pendingCount,
      runningMonitors: runningCount,
      monitors: statuses,
    };
  }
}

// Graceful shutdown handler
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Stopping all monitors...");
  MonitorManager.stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Stopping all monitors...");
  MonitorManager.stopAll();
  process.exit(0);
});

export { TradeMonitor, MonitorManager };
export default MonitorManager;

