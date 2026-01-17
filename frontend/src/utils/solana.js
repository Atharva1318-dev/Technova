import { Connection, PublicKey } from "@solana/web3.js";

const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || "devnet";
const RPC_URL = 
  SOLANA_NETWORK === "mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

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

// Get transaction details
export const getTransaction = async (signature) => {
  try {
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    return transaction;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

// Get explorer URL
export const getExplorerUrl = (signature, type = "tx") => {
  const cluster = SOLANA_NETWORK === "mainnet" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/${type}/${signature}${cluster}`;
};

// Verify wallet address
export const isValidPublicKey = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  connection,
  getWalletBalance,
  getTransaction,
  getExplorerUrl,
  isValidPublicKey,
};
