import Trade from "../models/trade.models.js";
import User from "../models/user.models.js";
import { 
  fetchAdvisorTradesFromBlockchain, 
  verifyTradeOnChain 
} from "../services/solana.service.js";

// Get advisor's blockchain trades
export const getAdvisorBlockchainTrades = async (req, res) => {
  try {
    const { advisorId } = req.params;

    const advisor = await User.findById(advisorId);

    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    if (!advisor.solanaWallet) {
      return res.status(400).json({ 
        message: "Advisor does not have a Solana wallet" 
      });
    }

    // Fetch trades from blockchain
    const blockchainTrades = await fetchAdvisorTradesFromBlockchain(
      advisor.solanaWallet
    );

    return res.status(200).json({ 
      advisorId,
      solanaWallet: advisor.solanaWallet,
      trades: blockchainTrades,
    });
  } catch (error) {
    console.error("Error in getAdvisorBlockchainTrades:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Verify a specific trade on blockchain
export const verifyTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;

    const trade = await Trade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (!trade.isOnChain) {
      return res.status(400).json({ 
        message: "Trade has not been written to blockchain yet" 
      });
    }

    // Prepare off-chain data
    const offChainData = {
      symbol: trade.symbol,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      profitLoss: trade.profitLoss,
      timestamp: trade.closedAt,
    };

    // Verify on blockchain
    const verification = await verifyTradeOnChain(
      trade.solanaTransactionId,
      offChainData
    );

    return res.status(200).json({
      tradeId,
      verification,
      explorerUrl: `https://explorer.solana.com/tx/${trade.solanaTransactionId}?cluster=devnet`,
    });
  } catch (error) {
    console.error("Error in verifyTrade:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Compare app data vs blockchain data for an advisor
export const compareAdvisorData = async (req, res) => {
  try {
    const { advisorId } = req.params;

    const advisor = await User.findById(advisorId);

    if (!advisor || advisor.role !== "advisor") {
      return res.status(404).json({ message: "Advisor not found" });
    }

    if (!advisor.solanaWallet) {
      return res.status(400).json({ 
        message: "Advisor does not have a Solana wallet" 
      });
    }

    // Get app data (closed trades)
    const appTrades = await Trade.find({
      advisorId,
      status: "closed",
      isOnChain: true,
    }).select("symbol entryPrice exitPrice profitLoss closedAt solanaTransactionId");

    // Get blockchain data
    const blockchainTrades = await fetchAdvisorTradesFromBlockchain(
      advisor.solanaWallet
    );

    // Compare
    const comparison = {
      appTradesCount: appTrades.length,
      blockchainTradesCount: blockchainTrades.length,
      match: appTrades.length === blockchainTrades.length,
      appTrades: appTrades.map(t => ({
        id: t._id,
        symbol: t.symbol,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        profitLoss: t.profitLoss,
        timestamp: t.closedAt,
        txId: t.solanaTransactionId,
      })),
      blockchainTrades,
    };

    return res.status(200).json({ comparison });
  } catch (error) {
    console.error("Error in compareAdvisorData:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get blockchain explorer link
export const getExplorerLink = async (req, res) => {
  try {
    const { tradeId } = req.params;

    const trade = await Trade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (!trade.solanaTransactionId) {
      return res.status(400).json({ 
        message: "Trade does not have a blockchain transaction" 
      });
    }

    const explorerUrl = `https://explorer.solana.com/tx/${trade.solanaTransactionId}?cluster=devnet`;

    return res.status(200).json({
      tradeId,
      transactionId: trade.solanaTransactionId,
      explorerUrl,
    });
  } catch (error) {
    console.error("Error in getExplorerLink:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  getAdvisorBlockchainTrades,
  verifyTrade,
  compareAdvisorData,
  getExplorerLink,
};
