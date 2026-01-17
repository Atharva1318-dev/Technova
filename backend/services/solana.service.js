import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// Generate a new Solana wallet (PDA) for an advisor
export const generateAdvisorWallet = async () => {
  try {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toString(),
      secretKey: Array.from(keypair.secretKey), // Store securely or use PDA
    };
  } catch (error) {
    console.error("Error generating Solana wallet:", error);
    throw error;
  }
};

// Get wallet balance
export const getWalletBalance = async (publicKeyString) => {
  try {
    const publicKey = new PublicKey(publicKeyString);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    throw error;
  }
};

// Write trade data to Solana blockchain
export const writeTradeToBlockchain = async (tradeData) => {
  try {
    // This is a simplified version. In production, you'd use a Solana program (smart contract)
    // to store structured trade data on-chain
    
    const { advisorPublicKey, tradeDetails } = tradeData;
    
    // For now, we'll create a memo transaction as a placeholder
    // In production, replace this with actual program interaction
    
    const advisorPubKey = new PublicKey(advisorPublicKey);
    
    // Create a memo instruction (placeholder for actual program call)
    const tradeDataString = JSON.stringify({
      symbol: tradeDetails.symbol,
      entryPrice: tradeDetails.entryPrice,
      exitPrice: tradeDetails.exitPrice,
      profitLoss: tradeDetails.profitLoss,
      timestamp: new Date().toISOString(),
    });
    
    // In production, you would:
    // 1. Call your Solana program with the trade data
    // 2. Sign the transaction with the advisor's keypair
    // 3. Send and confirm the transaction
    
    // For now, return a mock transaction ID
    const mockTxId = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log("Trade written to blockchain (mock):", mockTxId);
    
    return {
      transactionId: mockTxId,
      success: true,
      explorerUrl: `https://explorer.solana.com/tx/${mockTxId}?cluster=devnet`,
    };
  } catch (error) {
    console.error("Error writing trade to blockchain:", error);
    throw error;
  }
};

// Fetch trade history from blockchain for an advisor
export const fetchAdvisorTradesFromBlockchain = async (advisorPublicKey) => {
  try {
    const publicKey = new PublicKey(advisorPublicKey);
    
    // In production, you would:
    // 1. Query your Solana program's accounts
    // 2. Filter by advisor public key
    // 3. Parse and return trade data
    
    // For now, return mock data
    const mockTrades = [
      {
        symbol: "NIFTY 25JAN 18000 CE",
        entryPrice: 150,
        exitPrice: 180,
        profitLoss: 30,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        transactionId: "mock_tx_1",
      },
      {
        symbol: "BANKNIFTY 25JAN 45000 PE",
        entryPrice: 200,
        exitPrice: 170,
        profitLoss: -30,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        transactionId: "mock_tx_2",
      },
    ];
    
    return mockTrades;
  } catch (error) {
    console.error("Error fetching trades from blockchain:", error);
    throw error;
  }
};

// Verify trade authenticity by comparing on-chain and off-chain data
export const verifyTradeOnChain = async (tradeId, offChainData) => {
  try {
    // In production, you would:
    // 1. Fetch the trade data from your Solana program using tradeId
    // 2. Compare it with offChainData
    // 3. Return verification result
    
    // For now, return mock verification
    return {
      isValid: true,
      onChainData: offChainData, // In production, this would be fetched from blockchain
      offChainData: offChainData,
      discrepancies: [],
    };
  } catch (error) {
    console.error("Error verifying trade on-chain:", error);
    throw error;
  }
};

export default {
  generateAdvisorWallet,
  getWalletBalance,
  writeTradeToBlockchain,
  fetchAdvisorTradesFromBlockchain,
  verifyTradeOnChain,
};
