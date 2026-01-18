import dotenv from "dotenv";
dotenv.config();

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const testBlockchainConfig = async () => {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 TESTING BLOCKCHAIN CONFIGURATION");
  console.log("=".repeat(70) + "\n");
  
  let allGood = true;
  
  // Check RPC URL
  console.log("1️⃣  Solana RPC Connection");
  console.log("   URL:", process.env.SOLANA_RPC_URL || "Not set (using default)");
  
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
  );
  
  try {
    const version = await connection.getVersion();
    console.log("   ✅ Connection successful");
    console.log("   📦 Solana Core Version:", version["solana-core"]);
  } catch (error) {
    console.log("   ❌ Connection failed:", error.message);
    allGood = false;
  }
  
  // Check Program IDs
  console.log("\n2️⃣  Escrow Program");
  console.log("   Program ID:", process.env.ESCROW_PROGRAM_ID || "Not set");
  
  if (!process.env.ESCROW_PROGRAM_ID) {
    console.log("   ⚠️  ESCROW_PROGRAM_ID not set in .env");
    allGood = false;
  } else {
    try {
      const programId = new PublicKey(process.env.ESCROW_PROGRAM_ID);
      const programAccount = await connection.getAccountInfo(programId);
      
      if (programAccount) {
        console.log("   ✅ Program found on-chain");
        console.log("   📊 Program is executable:", programAccount.executable);
      } else {
        console.log("   ⚠️  Program not found on-chain");
        allGood = false;
      }
    } catch (error) {
      console.log("   ❌ Invalid Program ID:", error.message);
      allGood = false;
    }
  }
  
  // Check Platform Authority
  console.log("\n3️⃣  Platform Authority");
  
  if (!process.env.PLATFORM_SECRET_KEY) {
    console.log("   ⚠️  PLATFORM_SECRET_KEY not set");
    console.log("   ℹ️  Running in MOCK MODE (no real blockchain transactions)");
    console.log("   💡 To enable real blockchain:");
    console.log("      1. Run: node scripts/generate-platform-keypair.js");
    console.log("      2. Add PLATFORM_SECRET_KEY to .env");
    console.log("      3. Fund the address with devnet SOL");
  } else {
    try {
      const secretKey = JSON.parse(process.env.PLATFORM_SECRET_KEY);
      
      if (!Array.isArray(secretKey) || secretKey.length !== 64) {
        console.log("   ❌ Invalid secret key format (must be array of 64 numbers)");
        allGood = false;
      } else {
        const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
        console.log("   📍 Public Key:", keypair.publicKey.toString());
        
        const balance = await connection.getBalance(keypair.publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        
        console.log("   💰 Balance:", solBalance, "SOL");
        
        if (balance === 0) {
          console.log("   ⚠️  No SOL balance! Platform authority needs funding.");
          console.log("   💡 Request devnet airdrop:");
          console.log(`      solana airdrop 2 ${keypair.publicKey.toString()} --url devnet`);
          allGood = false;
        } else {
          console.log("   ✅ Platform authority configured and funded");
        }
      }
    } catch (error) {
      console.log("   ❌ Error loading PLATFORM_SECRET_KEY:", error.message);
      allGood = false;
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(70));
  if (allGood) {
    console.log("✅ ALL CHECKS PASSED - Blockchain integration ready!");
  } else {
    console.log("⚠️  SOME ISSUES FOUND - Review the messages above");
  }
  console.log("=".repeat(70) + "\n");
  
  // Mode indicator
  if (!process.env.PLATFORM_SECRET_KEY) {
    console.log("🔧 CURRENT MODE: Mock (Development)");
    console.log("   - All blockchain functions return mock data");
    console.log("   - No real transactions");
    console.log("   - Perfect for development and testing");
  } else {
    console.log("🚀 CURRENT MODE: Real Blockchain");
    console.log("   - Real transactions on Solana devnet");
    console.log("   - Costs ~0.000005 SOL per transaction");
    console.log("   - Transactions visible on Solana Explorer");
  }
  
  console.log("\n📚 Documentation:");
  console.log("   - Setup Guide: BLOCKCHAIN_ENV_SETUP.md");
  console.log("   - Integration Guide: BLOCKCHAIN_INTEGRATION_GUIDE.md");
  console.log("\n");
};

testBlockchainConfig().catch(console.error);

