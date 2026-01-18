import { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import AnchorPkg from "@coral-xyz/anchor";
const { Program, AnchorProvider, web3, BN } = AnchorPkg;
import crypto from "crypto";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

// Load IDL using fs instead of import assertion
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const escrowIdl = JSON.parse(
  readFileSync(join(__dirname, "../idl/technova_escrow.json"), "utf-8")
);

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const ESCROW_PROGRAM_ID = process.env.ESCROW_PROGRAM_ID || "EisKdCuTXweGNbtaYbe1pAiCda2Xh2ouroVTcTyhFupA";
const TRADE_PROGRAM_ID = process.env.TRADE_PROGRAM_ID || "TradeProgram111111111111111111111111111111";

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// Platform authority keypair (should be securely stored)
let platformKeypair = null;
let useRealBlockchain = false;

try {
  if (process.env.PLATFORM_SECRET_KEY) {
    const secretKey = JSON.parse(process.env.PLATFORM_SECRET_KEY);
    platformKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    useRealBlockchain = true;
    console.log("✅ Platform keypair loaded, real blockchain enabled");
    console.log(`   Platform Authority: ${platformKeypair.publicKey.toString()}`);
  } else {
    console.warn("⚠️  PLATFORM_SECRET_KEY not set, using mock mode for blockchain");
  }
} catch (error) {
  console.error("❌ Error loading platform keypair:", error);
  console.warn("⚠️  Falling back to mock mode");
}

// Create Anchor provider
const getProvider = (wallet = platformKeypair) => {
  if (!wallet) {
    throw new Error("Wallet keypair required for Anchor provider");
  }
  
  return new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(wallet);
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map(tx => {
          tx.partialSign(wallet);
          return tx;
        });
      },
    },
    { commitment: "confirmed" }
  );
};

// Get Anchor program instance
const getEscrowProgram = (wallet = platformKeypair) => {
  const provider = getProvider(wallet);
  return new Program(escrowIdl, new PublicKey(ESCROW_PROGRAM_ID), provider);
};

// ============================================================================
// WALLET FUNCTIONS
// ============================================================================

export const generateAdvisorWallet = async () => {
  try {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toString(),
      secretKey: Array.from(keypair.secretKey), // Store securely - for demo only
    };
  } catch (error) {
    console.error("Error generating Solana wallet:", error);
    throw error;
  }
};

export const getWalletBalance = async (publicKeyString) => {
  try {
    const publicKey = new PublicKey(publicKeyString);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    throw error;
  }
};

// ============================================================================
// ESCROW FUNCTIONS
// ============================================================================

export const deriveEscrowPDA = async (advisorPublicKey) => {
  try {
    const advisor = new PublicKey(advisorPublicKey);
    const programId = new PublicKey(ESCROW_PROGRAM_ID);
    
    const [escrowPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), advisor.toBuffer()],
      programId
    );
    
    return {
      escrowPDA: escrowPDA.toString(),
      bump,
    };
  } catch (error) {
    console.error("Error deriving escrow PDA:", error);
    throw error;
  }
};

export const createEscrowAccount = async (advisorPublicKey, amount = 0.01, escrowType = "SignupFee") => {
  try {
    // If not using real blockchain, return mock data
    if (!useRealBlockchain) {
      const mockTxId = `mock_escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { escrowPDA } = await deriveEscrowPDA(advisorPublicKey);
      
      console.log(`📝 Mock: Escrow created for ${advisorPublicKey}`);
      
      return {
        success: true,
        transactionId: mockTxId,
        escrowPDA,
        explorerUrl: `https://explorer.solana.com/tx/${mockTxId}?cluster=devnet`,
        mock: true,
      };
    }
    
    // Real blockchain implementation
    const advisor = new PublicKey(advisorPublicKey);
    const program = getEscrowProgram();
    
    const [escrowPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), advisor.toBuffer()],
      program.programId
    );
    
    // Convert amount to lamports
    const amountLamports = new BN(amount * LAMPORTS_PER_SOL);
    
    // Map escrow type to enum
    const escrowTypeEnum = { [escrowType.toLowerCase()]: {} };
    
    console.log(`🔗 Creating escrow on blockchain...`);
    console.log(`   Advisor: ${advisor.toString()}`);
    console.log(`   Escrow PDA: ${escrowPDA.toString()}`);
    console.log(`   Amount: ${amount} SOL`);
    
    const tx = await program.methods
      .initializeEscrow(amountLamports, escrowTypeEnum, null)
      .accounts({
        escrowAccount: escrowPDA,
        advisor: advisor,
        platformAuthority: platformKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log(`✅ Escrow created! TX: ${tx}`);
    
    return {
      success: true,
      transactionId: tx,
      escrowPDA: escrowPDA.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
      mock: false,
    };
  } catch (error) {
    console.error("❌ Error creating escrow account:", error);
    throw error;
  }
};

export const releaseEscrow = async (advisorPublicKey) => {
  try {
    if (!useRealBlockchain) {
      const mockTxId = `mock_release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`📝 Mock: Escrow released for ${advisorPublicKey}`);
      
      return {
        success: true,
        transactionId: mockTxId,
        explorerUrl: `https://explorer.solana.com/tx/${mockTxId}?cluster=devnet`,
        mock: true,
      };
    }
    
    const advisor = new PublicKey(advisorPublicKey);
    const program = getEscrowProgram();
    
    const [escrowPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), advisor.toBuffer()],
      program.programId
    );
    
    console.log(`🔗 Releasing escrow...`);
    console.log(`   Advisor: ${advisor.toString()}`);
    console.log(`   Escrow PDA: ${escrowPDA.toString()}`);
    
    const tx = await program.methods
      .releaseEscrow()
      .accounts({
        escrowAccount: escrowPDA,
        advisor: advisor,
        platformAuthority: platformKeypair.publicKey,
      })
      .rpc();
    
    console.log(`✅ Escrow released! TX: ${tx}`);
    
    return {
      success: true,
      transactionId: tx,
      explorerUrl: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
      mock: false,
    };
  } catch (error) {
    console.error("❌ Error releasing escrow:", error);
    throw error;
  }
};

export const checkEscrowExists = async (advisorPublicKey) => {
  try {
    const { escrowPDA } = await deriveEscrowPDA(advisorPublicKey);
    const escrowAccount = await connection.getAccountInfo(new PublicKey(escrowPDA));
    
    if (!escrowAccount) {
      return {
        exists: false,
        escrowPDA,
        balance: 0,
      };
    }
    
    // If using real blockchain, try to fetch account data
    if (useRealBlockchain) {
      try {
        const program = getEscrowProgram();
        const escrowData = await program.account.escrowAccount.fetch(new PublicKey(escrowPDA));
        
        return {
          exists: true,
          escrowPDA,
          balance: escrowAccount.lamports / LAMPORTS_PER_SOL,
          status: Object.keys(escrowData.status)[0],
          amount: escrowData.amount.toNumber() / LAMPORTS_PER_SOL,
          createdAt: new Date(escrowData.createdAt.toNumber() * 1000),
        };
      } catch (fetchError) {
        console.warn("Could not fetch escrow data:", fetchError.message);
      }
    }
    
    return {
      exists: true,
      escrowPDA,
      balance: escrowAccount.lamports / LAMPORTS_PER_SOL,
    };
  } catch (error) {
    console.error("Error checking escrow:", error);
    return {
      exists: false,
      escrowPDA: null,
      balance: 0,
    };
  }
};

// ============================================================================
// TRADE RECORDING FUNCTIONS (Future - for now mock)
// ============================================================================

export const writeTradeToBlockchain = async (tradeData) => {
  try {
    const { advisorPublicKey, tradeDetails } = tradeData;
    
    const mockTxId = `mock_trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const advisor = new PublicKey(advisorPublicKey);
    const tradeIdHash = crypto
      .createHash('sha256')
      .update(tradeDetails.tradeId || Date.now().toString())
      .digest();
    
    const programId = new PublicKey(TRADE_PROGRAM_ID);
    const [tradePDA] = await PublicKey.findProgramAddress(
      [Buffer.from("trade"), advisor.toBuffer(), tradeIdHash],
      programId
    );
    
    console.log(`📝 Trade recorded (mock): ${tradePDA.toString()}`);
    
    return {
      transactionId: mockTxId,
      tradePDA: tradePDA.toString(),
      success: true,
      explorerUrl: `https://explorer.solana.com/tx/${mockTxId}?cluster=devnet`,
      mock: true,
    };
  } catch (error) {
    console.error("Error writing trade to blockchain:", error);
    throw error;
  }
};

export const fetchAdvisorTradesFromBlockchain = async (advisorPublicKey) => {
  try {
    // TODO: Implement when trade recording program is deployed
    return [];
  } catch (error) {
    console.error("Error fetching trades from blockchain:", error);
    throw error;
  }
};

export const verifyTradeOnChain = async (transactionId, offChainData) => {
  try {
    // TODO: Implement when trade recording program is deployed
    return {
      isValid: true,
      onChainData: offChainData,
      offChainData: offChainData,
      discrepancies: [],
      verified: false,
      mock: true,
    };
  } catch (error) {
    console.error("Error verifying trade on-chain:", error);
    throw error;
  }
};

export const getAdvisorStatsFromBlockchain = async (advisorPublicKey) => {
  try {
    // TODO: Implement when trade recording program is deployed
    const advisor = new PublicKey(advisorPublicKey);
    const programId = new PublicKey(TRADE_PROGRAM_ID);
    
    const [statsPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("stats"), advisor.toBuffer()],
      programId
    );
    
    return {
      statsPDA: statsPDA.toString(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfitLoss: 0,
      trustScore: 0,
      mock: true,
    };
  } catch (error) {
    console.error("Error fetching advisor stats from blockchain:", error);
    throw error;
  }
};

export default {
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
};

