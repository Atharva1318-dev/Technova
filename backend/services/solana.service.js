// Re-export all functions from the Anchor service
// This maintains backward compatibility with existing imports
export {
  generateAdvisorWallet,
  getWalletBalance,
  deriveEscrowPDA,
  createEscrowAccount,
  releaseEscrow,
  writeTradeToBlockchain,
  fetchAdvisorTradesFromBlockchain,
  verifyTradeOnChain,
  getAdvisorStatsFromBlockchain,
  checkEscrowExists,
} from "./solana.anchor.service.js";
